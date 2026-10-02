// Stage 5 — Compliance gate. Every draft brief passes four checks; nothing reaches the image model
// unless all four pass (or only advisory issues remain).
//   1. citations + numbers (lib/generate.js checkCopy)   2. layout fit (public/render.js)
//   3. image prompt (lib/image_prompt_check.js)          4. scorer on the copy (rules + model)
// Usage: node pipeline/05_compliance.js <YYYY-MM-DD>
// Model layer: uses ANTHROPIC_API_KEY if set; otherwise injects judge/<id>.json if a stand-in wrote one;
// otherwise rules-only (and the status says so).
// Reads briefs_draft/<id>.json + products/. Writes briefs_final.json. Never rewrites a brief.
import fs from "node:fs";
import path from "node:path";
import { checkBrief, adFromBrief, specFromBrief } from "../lib/brief_check.js";
import { layoutProblems } from "../public/render.js";
import { checkImagePrompt } from "../lib/image_prompt_check.js";
import { scoreAd } from "../lib/score.js";
import { judgeAvailable, buildJudgePrompt } from "../lib/judge.js";
import { runRules } from "../lib/rules.js";

const date = process.argv[2];
const runDir = path.join("pipeline", "runs", date);
const draftDir = path.join(runDir, "briefs_draft");
const match = new Map(JSON.parse(fs.readFileSync(path.join(runDir, "match.json"), "utf8")).map((m) => [m.id, m]));
fs.mkdirSync(path.join(runDir, "judge_prompts"), { recursive: true });

const out = [];
for (const f of fs.readdirSync(draftDir).filter((f) => f.endsWith(".json"))) {
  const brief = JSON.parse(fs.readFileSync(path.join(draftDir, f), "utf8"));
  const m = match.get(brief.source_ad_id);
  // All product sheets in the run (main + companions), keyed by handle, for cross-product citations.
  const sheets = Object.fromEntries(fs.readdirSync(path.join(runDir, "products")).map((f) => [f.replace(/\.json$/, ""), JSON.parse(fs.readFileSync(path.join(runDir, "products", f), "utf8"))]));
  const sheet = sheets[m.product_handle];
  const ad = adFromBrief(brief, sheets, m.product_handle);

  const copyProblems = checkBrief(brief, sheets, m.product_handle);
  // Missing real photos is expected at this stage for before/after: it blocks EXPORT (stage 8), not the brief.
  const layout = layoutProblems({ ...specFromBrief(brief, sheets, m.product_handle), imageHref: "x" }).filter((p) => !/no real study photos/i.test(p));
  const img = checkImagePrompt(brief.image_prompt);

  // Save the exact judge prompt so a stand-in can produce judge/<id>.json when there's no API key.
  const shownForJudge = [...(brief.steps || []), ...(brief.range || [])].map((x) => sheets[x.product_handle]).filter((s) => s && s !== sheet);
  const jp = buildJudgePrompt(ad, runRules(ad, { sheet, extraSheets: shownForJudge }), { sheet });
  fs.writeFileSync(path.join(runDir, "judge_prompts", `${brief.source_ad_id}.user.md`), jp.user);
  if (!fs.existsSync(path.join(runDir, "judge_prompts", "system.md"))) fs.writeFileSync(path.join(runDir, "judge_prompts", "system.md"), jp.system);
  const injected = path.join(runDir, "judge", `${brief.source_ad_id}.json`);
  const shownHandles = [...(brief.steps || []), ...(brief.range || [])].map((x) => x.product_handle).filter((h) => h && h !== m.product_handle && sheets[h]);
  const ctx = { sheet, extraSheets: [...new Set(shownHandles)].map((h) => sheets[h]) };
  if (!judgeAvailable() && fs.existsSync(injected)) Object.assign(ctx, { injectModelData: JSON.parse(fs.readFileSync(injected, "utf8")), injectModelName: "stand-in (same prompt)" });
  const report = await scoreAd(ad, ctx);

  const hard = [
    ...copyProblems.map((p) => `copy: ${p}`),
    ...layout.map((p) => `layout: ${p}`),
    ...img.findings.map((x) => `image prompt [${x.id}]: "${x.span}" — ${x.why}`),
    ...img.missing.map((x) => `image prompt incomplete: ${x}`),
  ];
  const v = report.verdict.code;
  const status = hard.length || v === "BLOCKED" ? "blocked" : v === "NEEDS_CHANGES" ? "flagged" : "approved_for_image_step";
  out.push({
    ...brief,
    product_handle: m.product_handle,
    product_url: sheet.url,
    source_brand: m.brand,
    status,
    hard_failures: hard,
    verdict: report.verdict,
    coverage: report.coverage,
    findings: report.findings.map((x) => ({ severity: x.severity, rule_id: x.rule_id, span: x.span, message: x.message, fix: x.fix, layer: x.layer, note: x.note })),
  });
  console.log(`${brief.source_ad_id.padEnd(22)} ${(brief.layout || "hero").padEnd(12)} ${status.padEnd(24)} ${report.coverage.model ? "rules+model" : "rules only"}  ${hard.length ? hard[0] : report.findings.filter((x) => x.severity !== "advisory").map((x) => x.rule_id).join(",")}`);
}
fs.writeFileSync(path.join(runDir, "briefs_final.json"), JSON.stringify(out, null, 2));
const n = (s) => out.filter((b) => b.status === s).length;
console.log(`\n${out.length} briefs: ${n("approved_for_image_step")} to image step, ${n("flagged")} flagged (fix first), ${n("blocked")} blocked`);
