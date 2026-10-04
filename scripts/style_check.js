// Brand STYLE check (user request 2026-10-03: "make sure brand tone and style is followed").
// Tone is enforced by the rules (TON-*, LNG-*) and the AI judge. This measures STYLE against the house standard
// from Minimalist's own top-running ads (brand_packs/minimalist/ad_style_top_runners.md): how much text sits on
// the image (after the caption split in lib/brief_check.js leanBrief), headline length, tags and footnote length.
// Budget: top runners carry ~5–15 words on the image. Allowed here: ≤ 20 words (≤ 30 for list/step layouts that
// need labels), headline ≤ 8 words, ≤ 1 tag, footnote ≤ 120 characters (2 lines). Counts only what the layout
// draws; the pack, the wordmark + sign-off, the big % line, the CTA label and the footnote are not counted as words.
// Usage: node scripts/style_check.js [run ...]   → research/style_check.json + summary on screen (exit 1 if any fail)
import fs from "node:fs";
import path from "node:path";
import { leanBrief, lockupFor, lockupText, itemLockup } from "../lib/brief_check.js";
import { wrap } from "../public/render.js";

const RUNS = /^2026-10-0[34]-(pilot|scale|transformation|angles|people|usvsthem|trending)$/;
const runs = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync("pipeline/runs").filter((r) => RUNS.test(r));
// A word = a run of letters/digits; "1,491", "2-3" and "40-50%" count once, a lone "+" or "&" not at all.
export const words = (s) => (String(s || "").match(/[\p{L}\p{N}][\p{L}\p{N}%₹+'’.,-]*/gu) || []).length;
const LIST_LAYOUTS = new Set(["actives", "journey", "range", "timeline", "splitscreen", "callouts", "badges", "spec", "faq", "oldnew", "thisvsthat", "usvsthem", "before_after"]);

export function styleIssues(b0, sheets = {}) {
  const b = leanBrief(b0);
  const offerTitle = ["offer"].includes(b.layout) && b.offer?.line;
  // Count only what each layout draws: the subhead appears on these layouts alone (render.js).
  const drawsSub = ["hero", "offer", "stat", "native", "usvsthem", "question"].includes(b.layout || "hero");
  const parts = [offerTitle ? b.offer.line : b.headline, drawsSub ? b.subhead : "", b.tag, offerTitle ? b.offer.condition : "", b.stat ? `${b.stat.value} ${b.stat.label}` : "", b.review?.quote,
    b.faq ? `${b.faq.question} ${b.faq.answer}` : "", b.layout === "question" ? `${b.question || ""} ${b.answer || ""}` : "",
    ...(b.actives || []).map((a) => `${a.name} ${a.line}`), ...(b.steps || []).map((s) => `${s.label || ""} ${s.line || ""}`), ...(b.callouts || []).map((c) => c.text),
    ...(b.badges || []).map((x) => x.text), ...(b.specs || []).map((x) => `${x.label} ${x.value}`), ...(b.frames || []).map((x) => x.label), ...(b.range || []).map((x) => x.label),
    ...(b.compare ? [b.compare.us, b.compare.them, ...(b.compare.rows || []).map((r) => `${r.label} ${r.us} ${r.them}`)] : []),
    // The ingredient lockup (active + %) counts too: on the main layout and under each pack in routines and ranges.
    lockupText(lockupFor(b, sheets[b0.product_handle])), ...[...(b.steps || []), ...(b.range || [])].map((x) => { const a = sheets[x.product_handle]?.actives?.[0]; return lockupText(itemLockup(x.label, a?.pct ? { name: a.name, pct: a.pct } : null)); })];
  const onImage = parts.reduce((n, p) => n + words(p), 0);
  const limit = LIST_LAYOUTS.has(b.layout) ? 30 : 20;
  const head = offerTitle ? b.offer.line : b.headline;
  const issues = [];
  if (onImage > limit) issues.push(`${onImage} words on image (limit ${limit})`);
  // A headline that quotes a study stat keeps the study's exact wording (CLM-08), so it is exempt from the word limit.
  const studyQuote = /\b\d{1,3}\s?%\s+(of\s+)?(subjects\s+)?(said|agreed|noticed|felt|saw|reported)\b/i.test(head || "");
  if (words(head) > 8 && !studyQuote) issues.push(`headline ${words(head)} words (limit 8)`);
  // Footnote: the creative draws two lines (render.js FOOT_PX); more would be cut, so that is the limit.
  const footLines = wrap(b.footnote || "", 22, 1080 - 144, 0.5).length;
  if (footLines > 2) issues.push(`footnote ${footLines} lines (limit 2)`);
  return { layout: b.layout, on_image_words: onImage, headline_words: words(head), footnote_chars: String(b.footnote || "").length, caption_words: words(b.caption), within: !issues.length, issues };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve("scripts/style_check.js")) {
  const rows = [];
  for (const run of runs) {
    const f = path.join("pipeline/runs", run, "briefs_final.json");
    if (!fs.existsSync(f)) continue;
    const pdir = path.join("pipeline/runs", run, "products");
    const sheets = fs.existsSync(pdir) ? Object.fromEntries(fs.readdirSync(pdir).map((x) => [x.replace(/\.json$/, ""), JSON.parse(fs.readFileSync(path.join(pdir, x), "utf8"))])) : {};
    for (const b of JSON.parse(fs.readFileSync(f, "utf8")).filter((x) => ["approved_for_image_step", "kept_with_warnings"].includes(x.status))) rows.push({ run, id: b.source_ad_id, ...styleIssues(b, sheets) });
  }
  fs.writeFileSync("research/style_check.json", JSON.stringify(rows, null, 1));
  const ok = rows.filter((r) => r.within).length, med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
  console.log(`${ok}/${rows.length} ads within the top-runner text budget · median on-image words ${med(rows.map((r) => r.on_image_words))} · median headline ${med(rows.map((r) => r.headline_words))} words`);
  for (const r of rows.filter((x) => !x.within)) console.log(`  ${r.run.replace(/^2026-10-0\d-/, "")} ${r.id} [${r.layout}]: ${r.issues.join("; ")}`);
  if (ok < rows.length) process.exitCode = 1;
}
