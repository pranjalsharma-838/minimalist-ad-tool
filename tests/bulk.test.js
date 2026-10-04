// Bulk scoring helpers (public/bulk.js): CSV and XLSX reading, report -> table row, sort / filter, CSV export, the work pool.
import { test } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import {
  TEMPLATE_CSV, COPY_COLUMNS, parseCsv, parseXlsx, adsFromTable, adTypeOf, summarise, verdictKeyOf, topFindings, sortRows, filterRows, resultsToCsv, csvCell, runPool, statusText, MAX_ROWS,
} from "../public/bulk.js";

// ---- a tiny zip writer so the test can build real .xlsx files (stored and deflated entries) ----
function zip(entries) {
  const out = [], central = [];
  let off = 0;
  for (const [name, text, deflate] of entries) {
    const raw = Buffer.from(text, "utf8"), data = deflate ? zlib.deflateRawSync(raw) : raw, nm = Buffer.from(name), crc = zlib.crc32(raw);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(deflate ? 8 : 0, 8); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nm.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(deflate ? 8 : 0, 10); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nm.length, 28); ch.writeUInt32LE(off, 42);
    out.push(lh, nm, data); central.push(ch, nm); off += 30 + nm.length + data.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  const all = Buffer.concat([...out, cd, end]);
  return new Uint8Array(all.buffer, all.byteOffset, all.length);
}
const cell = (ref, v, shared) => (typeof v === "number" ? `<c r="${ref}"><v>${v}</v></c>` : v === "" ? "" : shared ? `<c r="${ref}" t="s"><v>${shared.indexOf(v)}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t>${v}</t></is></c>`);
function xlsx(rows, { inline = false } = {}) {
  const shared = inline ? null : [...new Set(rows.flat().filter((v) => typeof v === "string" && v !== ""))];
  const sheet = `<?xml version="1.0"?><worksheet><sheetData>${rows.map((r, i) => `<row r="${i + 1}">${r.map((v, j) => cell(String.fromCharCode(65 + j) + (i + 1), v, shared)).join("")}</row>`).join("")}</sheetData></worksheet>`;
  return zip([
    ["[Content_Types].xml", `<Types/>`, false],
    ["xl/workbook.xml", `<workbook><sheets><sheet name="Ads" sheetId="1" r:id="rId7"/></sheets></workbook>`, false],
    ["xl/_rels/workbook.xml.rels", `<Relationships><Relationship Id="rId7" Type="x" Target="worksheets/sheet1.xml"/></Relationships>`, false],
    ["xl/worksheets/sheet1.xml", sheet, true],
    ...(shared ? [["xl/sharedStrings.xml", `<sst>${shared.map((s) => `<si><t>${s.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</t></si>`).join("")}</sst>`, true]] : []),
  ]);
}

test("CSV: quotes, doubled quotes, line breaks inside a field, BOM, semicolons and tabs", () => {
  assert.deepEqual(parseCsv('a,b\r\n"x, y","say ""hi"""\r\n'), [["a", "b"], ["x, y", 'say "hi"']]);
  assert.deepEqual(parseCsv("﻿a,b\n1,\"two\nlines\"\n\n3,4"), [["a", "b"], ["1", "two\nlines"], ["3", "4"]]);
  assert.deepEqual(parseCsv("a;b\n1;2"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseCsv("a\tb\n1\t2"), [["a", "b"], ["1", "2"]]);
  assert.deepEqual(parseCsv(""), []);
});

test("the template CSV is itself a valid upload", () => {
  const t = adsFromTable(parseCsv(TEMPLATE_CSV));
  assert.deepEqual(t.problems, []);
  assert.equal(t.ads.length, 2);
  assert.deepEqual(t.columns.sort(), [...COPY_COLUMNS].sort());
  assert.equal(t.ads[0].ad.ad_type, "brand");
  assert.equal(t.ads[1].ad.ad_type, "creator");
  assert.match(t.ads[0].product_url, /^https:\/\/beminimalist\.co\/products\//);
  assert.equal(t.ads[1].product_url, "");
  assert.equal(t.ads[1].row, 3);
});

test("column names are matched loosely; unknown columns are reported; empty lines are skipped", () => {
  const t = adsFromTable([["Headline", "Primary Text", "On-image text", "Call to action", "Notes", "Ad type"], ["H1", "P1", "O1", "Buy", "x", "Creator / paid partnership"], ["", "", "", "", "ignored", ""], ["H2", "", "", "", "", ""]]);
  assert.equal(t.ads.length, 2);
  assert.deepEqual(t.ads[0].ad, { ad_type: "creator", headline: "H1", primary_text: "P1", on_image_text: "O1", footnote: "", cta: "Buy" });
  assert.equal(t.ads[1].ad.ad_type, "brand");
  assert.deepEqual(t.ignored, ["Notes"]);
  const none = adsFromTable([["foo", "bar"], ["1", "2"]]);
  assert.equal(none.ads.length, 0);
  assert.match(none.problems[0], /No ad text columns/);
  assert.match(adsFromTable([]).problems[0], /empty/);
  assert.equal(adTypeOf("UGC"), "creator");
  assert.equal(adTypeOf(""), "brand");
  assert.match(adsFromTable([["headline", "product_url"], ["H", "not a url"]]).problems[0], /product_url/);
  const many = adsFromTable([["headline"], ...Array.from({ length: MAX_ROWS + 20 }, (_, i) => [`h${i}`])]);
  assert.equal(many.ads.length, MAX_ROWS);
  assert.ok(many.problems.some((p) => /first 300/.test(p)));
});

test("XLSX is read with no packages: shared strings, inline strings, numbers, gaps, deflated and stored entries", async () => {
  const rows = [["headline", "primary_text", "cta"], ["Smooth skin & more", "Use <daily>", "Shop now"], ["Only headline", "", "Learn more"]];
  for (const inline of [false, true]) {
    const got = await parseXlsx(xlsx(rows, { inline }));
    assert.deepEqual(got, [["headline", "primary_text", "cta"], ["Smooth skin & more", "Use <daily>", "Shop now"], ["Only headline", "", "Learn more"]], `inline=${inline}`);
    const ads = adsFromTable(got).ads;
    assert.equal(ads.length, 2);
    assert.equal(ads[0].ad.headline, "Smooth skin & more");
  }
  const withNumber = await parseXlsx(xlsx([["headline", "cta"], ["H", 5]]));
  assert.deepEqual(withNumber[1], ["H", "5"]);
  await assert.rejects(() => parseXlsx(new Uint8Array([1, 2, 3, 4])), /not a valid .xlsx/);
});

// ---- results ----
const report = (o = {}) => ({
  verdict: { code: "NEEDS_CHANGES", label: "Fix before review" },
  scores: { alignment: { score: 82, band: "high" }, win: { score: 0.64, band: "medium" }, compliance: { code: "NEEDS_CHANGES", label: "Fix first" } },
  findings: [{ severity: "advisory", rule_id: "LNG-01", title: "Tone", span: "" }, { severity: "block", rule_id: "CLM-01", title: "Cure claim", span: "cures acne" }, { severity: "fix", rule_id: "CLM-07", title: "Time frame", span: "in 4 weeks" }, { severity: "fix", rule_id: "X-2", title: "t", span: "" }],
  ad: { headline: "Clear skin" }, ...o,
});

test("a report becomes one row: verdict key, scores as percentages, worst findings first", () => {
  const s = summarise(report());
  assert.equal(s.verdict, "fix");
  assert.equal(s.alignment, 82);
  assert.equal(s.win, 64, "a 0-1 score is shown as a percentage");
  assert.equal(s.compliance, "Fix first");
  assert.equal(s.findings.length, 3);
  assert.match(s.findings[0], /^Block: CLM-01 Cure claim \("cures acne"\)/);
  assert.match(s.findings[1], /^Must fix: CLM-07/);
  assert.equal(s.findingCount, 4);
  assert.equal(verdictKeyOf(report({ scores: { compliance: { code: "BLOCKED" } } })), "blocked", "a blocked compliance score wins over the verdict");
  assert.equal(verdictKeyOf({ verdict: { code: "LIMITED_CHECK" } }), "rules");
  assert.equal(verdictKeyOf({ verdict: { code: "READY_FOR_REVIEW" } }), "ready");
  const bare = summarise({ verdict: { code: "READY_FOR_REVIEW", label: "Ready" }, findings: [], ad: {} });
  assert.equal(bare.alignment, null);
  assert.equal(bare.win, null);
  assert.deepEqual(topFindings({ findings: [] }), []);
});

const R = (order, o) => ({ order, name: `ad${order}`, status: "done", findingCount: 0, findings: [], ...o });
const ROWS = [
  R(1, { verdict: "ready", alignment: 70, win: 50, findingCount: 1 }),
  R(2, { verdict: "blocked", alignment: 95, win: 30, findingCount: 5, findings: ["Block: AI-01"] }),
  R(3, { status: "needs_key", verdict: "", alignment: null, win: null, error: "" }),
  R(4, { verdict: "fix", alignment: 80, win: null, findingCount: 2 }),
  R(5, { status: "error", verdict: "", error: "HTTP 500" }),
];
const ord = (rows) => rows.map((r) => r.order).join("");

test("results sort by any column, either way; unscored rows always last", () => {
  assert.equal(ord(sortRows(ROWS)), "12345");
  assert.equal(ord(sortRows(ROWS, "alignment", "desc")), "24135");
  assert.equal(ord(sortRows(ROWS, "alignment", "asc")), "14235");
  assert.equal(ord(sortRows(ROWS, "win", "desc")), "12345", "row 4 has no win score, so it joins the unscored rows");
  assert.equal(ord(sortRows(ROWS, "win", "asc")), "21345");
  assert.equal(ord(sortRows(ROWS, "verdict", "desc")), "24135", "blocked, fix, ready (worst first when descending)");
  assert.equal(ord(sortRows(ROWS, "findings", "desc")), "24135");
  assert.equal(ord(sortRows(ROWS, "name", "desc")), "54321");
  assert.equal(ord(ROWS), "12345", "the input is untouched");
});

test("results filter by verdict, by 'not scored', and by words", () => {
  assert.equal(ord(filterRows(ROWS, { verdict: "blocked" })), "2");
  assert.equal(ord(filterRows(ROWS, { verdict: "pending" })), "35");
  assert.equal(ord(filterRows(ROWS, { q: "ai-01" })), "2");
  assert.equal(ord(filterRows(ROWS, { q: "http 500" })), "5");
  assert.equal(ord(filterRows(ROWS, { verdict: "ready", q: "ai-01" })), "");
  assert.equal(ord(filterRows(ROWS, {})), "12345");
  assert.match(statusText(ROWS[2]), /needs the API key to read the image text/i);
  assert.equal(statusText(ROWS[4]), "Failed: HTTP 500");
});

test("the results CSV is complete, defuses formulas and opens cleanly in a spreadsheet", () => {
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  assert.equal(csvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  assert.equal(csvCell("+1"), "'+1");
  const csv = resultsToCsv([R(2, { name: "=bad.png", headline: 'He said "hi"', verdict: "blocked", verdictLabel: "Do not publish", alignment: 95, win: 30, findings: ["Block: AI-01"], findingCount: 1, compliance: "Do not publish" }), ROWS[2], ROWS[4]]);
  assert.ok(csv.startsWith("﻿"));
  const rows = parseCsv(csv);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows[0].slice(0, 5), ["row", "source", "headline", "status", "verdict"]);
  assert.equal(rows[1][1], "'=bad.png");
  assert.equal(rows[1][2], 'He said "hi"');
  assert.equal(rows[1][5], "95");
  assert.match(rows[2][12], /needs the API key/i);
  assert.equal(rows[3][12], "HTTP 500");
  assert.ok(rows.every((r) => r.length === rows[0].length));
});

test("the work pool runs a few at a time and can be stopped", async () => {
  let live = 0, peak = 0, done = [];
  await runPool([1, 2, 3, 4, 5, 6, 7, 8], 3, async (x) => { live++; peak = Math.max(peak, live); await new Promise((r) => setTimeout(r, 5)); live--; done.push(x); });
  assert.equal(done.length, 8);
  assert.equal(peak, 3);
  let n = 0;
  const started = [];
  await runPool([1, 2, 3, 4, 5, 6], 2, async (x) => { started.push(x); n++; await new Promise((r) => setTimeout(r, 5)); }, () => n >= 3);
  assert.ok(started.length >= 3 && started.length <= 4, `stopped soon after the stop request, started ${started.length}`);
  await runPool([], 3, async () => assert.fail("nothing to run"));
});
