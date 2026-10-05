// Writes fresh judge prompts (judge_prompts_fix/) for the given ads from the current briefs_final.json — no edits.
import fs from "node:fs"; import path from "node:path";
import { adFromBrief } from "../lib/brief_check.js";
import { buildJudgePrompt } from "../lib/judge.js";
import { runRules } from "../lib/rules.js";
const want = { "2026-10-05-formats": ["alpha-arbutin-2__t26", "alpha-arbutin-2__t3", "niacinamide-10-with-matmarine__t26", "salicylic-acid-2__t26", "salicylic-lha-2-cleanser__t26"], "2026-10-05-marula": ["marula-05-moisturizer__t26"] };
for (const [run, ids] of Object.entries(want)) {
  const dir = path.join("pipeline/runs", run);
  const briefs = JSON.parse(fs.readFileSync(path.join(dir, "briefs_final.json"), "utf8").replace(/^﻿/, ""));
  const sheets = Object.fromEntries(fs.readdirSync(path.join(dir, "products")).map((f) => [f.replace(/\.json$/, ""), JSON.parse(fs.readFileSync(path.join(dir, "products", f), "utf8"))]));
  for (const f of fs.readdirSync(path.join(dir, "judge_prompts_fix"))) if (f.endsWith(".user.md")) fs.rmSync(path.join(dir, "judge_prompts_fix", f));
  for (const b of briefs.filter((b) => ids.includes(b.source_ad_id))) {
    const sheet = sheets[b.product_handle], ad = adFromBrief(b, sheets, b.product_handle);
    fs.writeFileSync(path.join(dir, "judge_prompts_fix", `${b.source_ad_id}.user.md`), buildJudgePrompt(ad, runRules(ad, { sheet }), { sheet }).user);
    console.log(b.source_ad_id);
  }
}
