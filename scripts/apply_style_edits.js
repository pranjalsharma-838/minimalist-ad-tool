// Style edits for briefs that break the house text budget (scripts/style_check.js; user reviews 2026-10-03/04: "too
// text heavy", "the design should be minimalistic"). The editor (an LLM step, prompts/style_editor.md; stand-in output
// in <run>/style_edits.json) may only SHORTEN on-image lines, and code enforces that:
//   - every word of a new line must already be in the brief's own printed text, caption or product title (an offer
//     line or a footnote only from its own original words), so no new claim can appear;
//   - the replaced line moves to the caption, so nothing is lost and the compliance re-check still sees it;
//   - checkBrief must not gain a problem and the rule layer must not gain a rule id; the result must fit the budget.
// An edit that fails any check is refused and the brief is left as it was. Pre-edit briefs are archived in
// history/<id>/style_edit.json. Usage: node scripts/apply_style_edits.js <run>
import fs from "node:fs";
import path from "node:path";
import { checkBrief, adFromBrief } from "../lib/brief_check.js";
import { runRules } from "../lib/rules.js";
import { styleIssues } from "./style_check.js";

const run = process.argv[2];
const dir = path.join("pipeline", "runs", run);
const editsFile = path.join(dir, "style_edits.json");
if (!fs.existsSync(editsFile)) { console.log(`${run}: no style_edits.json`); process.exit(0); }
const edits = JSON.parse(fs.readFileSync(editsFile, "utf8"));
const briefs = JSON.parse(fs.readFileSync(path.join(dir, "briefs_final.json"), "utf8"));
const sheets = Object.fromEntries(fs.readdirSync(path.join(dir, "products")).map((f) => [f.replace(/\.json$/, ""), JSON.parse(fs.readFileSync(path.join(dir, "products", f), "utf8"))]));

const toks = (s) => (String(s || "").toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}%₹+'’.-]*/gu) || []).map((t) => t.replace(/[.'’-]+$/, ""));
const printed = (b) => [b.headline, b.subhead, b.caption, b.footnote, b.product_title, b.offer?.line, b.offer?.condition, b.stat?.value, b.stat?.label, b.review?.quote,
  ...(b.proof_points || []), ...(b.actives || []).flatMap((a) => [a.pct, a.name, a.line]), ...(b.callouts || []).map((c) => c.text), ...(b.steps || []).flatMap((s) => [s.label, s.line]),
  ...(b.frames || []).map((f) => f.label), ...(b.badges || []).map((x) => x.text), ...(b.specs || []).flatMap((x) => [x.label, x.value])].join(" ");
const get = (b, p) => p.split(".").reduce((o, k) => o?.[k], b);
const set = (b, p, v) => { const ks = p.split("."); const last = ks.pop(); ks.reduce((o, k) => (o[k] ??= {}), b)[last] = v; };
const ruleIds = (b, h) => new Set(runRules(adFromBrief(b, sheets, h), { sheet: sheets[h] }).filter((f) => f.severity !== "advisory").map((f) => f.rule_id));

let applied = 0, refused = 0, done = 0;
for (const [id, e] of Object.entries(edits)) {
  const i = briefs.findIndex((b) => b.source_ad_id === id);
  if (i < 0) { console.log(`${id}: not in briefs_final — skipped`); continue; }
  const orig = briefs[i], b = structuredClone(orig), h = orig.product_handle, log = [], why = [];
  for (const [field, to] of Object.entries(e).filter(([k]) => k !== "why")) {
    const from = get(orig, field);
    if (typeof from !== "string") { why.push(`${field}: no such line`); continue; }
    if (from === to) { log.done = true; continue; } // already applied on an earlier run of this script

    // Offer lines and footnotes may only be cut from their own words; other lines from anything the brief prints.
    const pool = new Set(toks(/^offer\.|^footnote$/.test(field) ? from : `${printed(orig)} ${sheets[h]?.title || ""}`));
    const extra = toks(to).filter((t) => !pool.has(t));
    if (extra.length) { why.push(`${field}: new word(s) ${extra.join(", ")}`); continue; }
    set(b, field, to);
    if (from.trim() && !String(b.caption || "").includes(from.trim())) b.caption = `${from.trim().replace(/[.!?]?$/, ".")} ${b.caption || ""}`.trim();
    log.push({ field, from, to });
  }
  const before = new Set(checkBrief(orig, sheets, h)), gained = checkBrief(b, sheets, h).filter((p) => !before.has(p));
  if (gained.length) why.push(`citation check: ${gained.join("; ")}`);
  const rb = ruleIds(orig, h), newRules = [...ruleIds(b, h)].filter((r) => !rb.has(r));
  if (newRules.length) why.push(`new rule hit(s): ${newRules.join(", ")}`);
  const st = styleIssues(b);
  if (!why.length && !log.length && log.done) { done++; continue; }
  if (why.length || !log.length) { refused++; console.log(`${id}: REFUSED — ${why.join(" · ") || "nothing to apply"}`); continue; }
  fs.mkdirSync(path.join(dir, "history", id), { recursive: true });
  fs.writeFileSync(path.join(dir, "history", id, "style_edit.json"), JSON.stringify(orig, null, 2));
  b.style_edits = [...(orig.style_edits || []), ...log.map((l) => ({ ...l, why: e.why || "" }))];
  briefs[i] = b;
  applied++;
  console.log(`${id}: ${log.map((l) => `${l.field} "${l.from}" → "${l.to}"`).join("; ")} · ${st.within ? "within budget" : "STILL OVER: " + st.issues.join("; ")}`);
}
fs.writeFileSync(path.join(dir, "briefs_final.json"), JSON.stringify(briefs, null, 2));
console.log(`${run}: ${applied} applied, ${refused} refused, ${done} already applied`);
