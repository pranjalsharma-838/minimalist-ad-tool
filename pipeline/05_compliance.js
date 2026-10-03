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
import { briefRisk, worst as worstRisk } from "../lib/risk.js";

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
  // The API path sends the schema separately (output_config); a stand-in only sees files, so append it (pilot audit).
  if (!fs.existsSync(path.join(runDir, "judge_prompts", "system.md"))) fs.writeFileSync(path.join(runDir, "judge_prompts", "system.md"), `${jp.system}\n\n## Output format (JSON, exactly this schema)\n\n\`\`\`json\n${JSON.stringify(jp.schema, null, 2)}\n\`\`\`\n`);
  const injected = path.join(runDir, "judge", `${brief.source_ad_id}.json`);
  const shownHandles = [...(brief.steps || []), ...(brief.range || [])].map((x) => x.product_handle).filter((h) => h && h !== m.product_handle && sheets[h]);
  // Lab results as the main theme: brief says so, or a spec layout whose headline is about testing.
  const labTheme = brief.main_theme === "lab_results" || ((brief.layout === "spec" || brief.layout === "stat") && /\b(lab|test(ed|ing)?|in-?vivo|ISO|clinical results)\b/i.test(`${brief.headline} ${brief.subhead || ""}`));
  const ctx = { sheet, extraSheets: [...new Set(shownHandles)].map((h) => sheets[h]), labTheme, fullText: [ad.headline, ad.primary_text, ad.on_image_text, ad.footnote].join("\n") };
  if (!judgeAvailable() && fs.existsSync(injected)) Object.assign(ctx, { injectModelData: JSON.parse(fs.readFileSync(injected, "utf8")), injectModelName: "stand-in (same prompt)" });
  const report = await scoreAd(ad, ctx);

  // Risk-level model (user decision 2026-10-03): briefs are never dropped. Fixable problems (copy
  // citations, layout fit) go back through the retry loop (pipeline/05b_retry.js); everything else is a
  // risk level shown to the marketer. Only an image prompt asking to DRAW the product is refused.
  const fixable = [...copyProblems.map((p) => `copy: ${p}`), ...layout.map((p) => `layout: ${p}`), ...img.missing.map((x) => `image prompt incomplete: ${x}`)];
  const warnings = img.findings.filter((x) => x.id !== "product").map((x) => `image prompt [${x.id}, ${x.level}]: "${x.span}" — ${x.why}`);
  const refused = img.findings.filter((x) => x.id === "product").map((x) => `image prompt REFUSED: "${x.span}" — ${x.why}`);
  const hard = [...refused, ...fixable];
  const v = report.verdict.code;
  const copyRisk = briefRisk(v, report.findings);
  const risk = worstRisk(copyRisk, img.risk, brief.needs_real_photography ? "severe" : "low");
  const status = refused.length ? "refused_image_prompt" : fixable.length || v !== "READY_FOR_REVIEW" && v !== "LIMITED_CHECK" ? "needs_retry" : "approved_for_image_step";
  out.push({
    ...brief,
    product_handle: m.product_handle,
    product_url: sheet.url,
    source_brand: m.brand,
    status,
    risk_level: risk,
    ai_label_required: img.ai_label_required || Boolean(brief.needs_real_photography),
    warnings,
    hard_failures: hard,
    verdict: report.verdict,
    coverage: report.coverage,
    findings: report.findings.map((x) => ({ severity: x.severity, rule_id: x.rule_id, span: x.span, message: x.message, fix: x.fix, layer: x.layer, note: x.note })),
  });
  console.log(`${brief.source_ad_id.padEnd(22)} ${(brief.layout || "hero").padEnd(12)} ${status.padEnd(24)} risk ${risk.padEnd(7)} ${report.coverage.model ? "rules+model" : "rules only"}  ${hard.length ? hard[0] : report.findings.filter((x) => x.severity !== "advisory").map((x) => x.rule_id).join(",")}`);
}
fs.writeFileSync(path.join(runDir, "briefs_final.json"), JSON.stringify(out, null, 2));
const n = (s) => out.filter((b) => b.status === s).length;
console.log(`\n${out.length} briefs: ${n("approved_for_image_step")} to image step, ${n("needs_retry")} need a retry round, ${n("refused_image_prompt")} image prompt refused (asks to draw the product)`);
