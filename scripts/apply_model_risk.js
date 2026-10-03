// User rule (2026-10-04): "whenever models are used in concepts we will say the risk is severe, but we will keep those
// as well". New runs get this in pipeline/05_compliance.js; this script applies it to briefs already finalised.
// A brief uses a model when it asks for a person or frames (person_prompt / frames_prompt) or when an AI person /
// frame image exists for it (backgrounds/<id>.person.* / <id>.frame1.*). Risk only goes up; nothing is removed.
// Usage: node scripts/apply_model_risk.js [run ...]   (default: every run with a briefs_final.json)
import fs from "node:fs";
import path from "node:path";

const NOTE = "Model (AI person, hands or skin frames) used: Severe by default (user rule 2026-10-04). Kept for review; not exportable until real, consented photos replace the AI images.";
const runs = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync("pipeline/runs").filter((r) => fs.existsSync(path.join("pipeline/runs", r, "briefs_final.json")));
let total = 0;
for (const run of runs) {
  const f = path.join("pipeline/runs", run, "briefs_final.json");
  const briefs = JSON.parse(fs.readFileSync(f, "utf8"));
  const bgDir = path.join("pipeline/runs", run, "backgrounds");
  const has = (id, name) => fs.existsSync(bgDir) && fs.readdirSync(bgDir).some((x) => x.startsWith(`${id}.${name}.`));
  let n = 0;
  for (const b of briefs) {
    const usesModel = Boolean(String(b.person_prompt || "").trim() || String(b.frames_prompt || "").trim()) || has(b.source_ad_id, "person") || has(b.source_ad_id, "frame1");
    if (!usesModel) continue;
    if (b.risk_level !== "severe") { b.risk_level = "severe"; n++; }
    b.warnings = [...new Set([...(b.warnings || []), NOTE])];
  }
  fs.writeFileSync(f, JSON.stringify(briefs, null, 2));
  total += n;
  console.log(`${run}: ${n} brief(s) raised to Severe (${briefs.filter((b) => b.risk_level === "severe").length} Severe of ${briefs.length})`);
}
console.log(`${total} raised in total`);
