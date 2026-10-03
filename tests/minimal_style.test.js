// Minimal house style (user reviews 2026-10-03/04: "too text heavy", "hide nothing tg is missing", "us vs them is
// missing", "the design should be minimalistic").
import test from "node:test";
import assert from "node:assert/strict";
import { leanBrief, checkBrief } from "../lib/brief_check.js";
import { renderAdSvg, layoutProblems, SIGN_OFF } from "../public/render.js";

const base = { headline: "A daily face cleanser", subhead: "", productName: "Salicylic Acid + LHA 2% Cleanser", footnote: "", cta: "Learn more", imageHref: "", testMark: "" };

test("actives keep a % and a name on the image; what each does moves to the caption", () => {
  const b = leanBrief({ layout: "actives", headline: "Inside", actives: [{ pct: "10%", name: "Niacinamide", line: "Evens the look of tone" }, { pct: "", name: "Zinc", line: "Balances oil" }, { pct: "1%", name: "AG", line: "x" }] });
  assert.equal(b.actives.length, 2);
  assert.deepEqual(b.actives.map((a) => a.line), ["", ""]);
  assert.match(b.caption, /Niacinamide: Evens the look of tone/);
  assert.match(b.caption, /AG: x/);
});

test("offers show the offer line and its condition; headline and any subhead (even a price) go to the caption", () => {
  const b = leanBrief({ layout: "offer", headline: "Two to three drops", subhead: "30ml: Rs. 494 (MRP Rs. 549)", offer: { line: "Buy 2, Get 3rd Free", condition: "T&C apply." } });
  assert.equal(b.subhead, "");
  assert.match(b.caption, /Two to three drops/);
  assert.match(b.caption, /Rs\. 494/);
});

test("a subhead longer than 8 words leaves the image", () => {
  assert.equal(leanBrief({ layout: "hero", headline: "x", subhead: "one two three four five six seven eight nine" }).subhead, "");
  assert.equal(leanBrief({ layout: "hero", headline: "x", subhead: "one two three" }).subhead, "one two three");
});

test("Us vs Them needs 1-3 rows and the basis of the comparison in the footnote", () => {
  const sheets = { p: { title: "Vitamin C 10% Face Serum", facts: [{ id: "F5", kind: "claim", text: "86% pure Vitamin C content, higher than 40-50% in other derivatives" }], actives: [] } };
  const b = { layout: "usvsthem", headline: "Vitamin C content, compared", citations: { headline: ["F5"] }, compare: { us: "Ethyl Ascorbic Acid", them: "Other derivatives", cites: ["F5"], rows: [{ label: "Vitamin C in the ingredient", us: "86%", them: "40-50%", cites: ["F5"] }] }, footnote: "" };
  assert.ok(checkBrief(b, sheets, "p").some((p) => /basis of the comparison/.test(p)));
  assert.ok(!checkBrief({ ...b, footnote: "Per the product page.", citations: { ...b.citations, footnote: ["F5"] } }, sheets, "p").some((p) => /usvsthem|basis/.test(p)));
});

test("every layout draws the brand sign-off and no generated scene", () => {
  for (const layout of ["hero", "actives", "offer", "journey", "usvsthem", "review"]) {
    const svg = renderAdSvg({ ...base, layout, backgroundHref: "data:image/png;base64,SCENE", offer: { line: "Buy 2, Get 3rd Free", condition: "T&C apply." } });
    assert.ok(svg.includes(SIGN_OFF), `${layout}: sign-off`);
    assert.ok(!svg.includes("SCENE"), `${layout}: generated background must not be drawn`);
  }
});

test("a footnote that would need a third line is reported, never silently cut", () => {
  const long = "Consumer study: 97% subjects said skin felt less oily throughout the day after using this serum for 2 weeks. This is the subjects' own perception, measured on a small panel of volunteers.";
  assert.ok(layoutProblems({ ...base, layout: "hero", footnote: long }).some((p) => /2 lines/.test(p)));
});
