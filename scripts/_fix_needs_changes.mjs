// One-off: wording fixes for the needs-fix library ads (user, 2026-10-05: "fix and bring back"), then fresh judge prompts.
import fs from "node:fs"; import path from "node:path";
import { adFromBrief } from "../lib/brief_check.js";
import { buildJudgePrompt } from "../lib/judge.js";
import { runRules } from "../lib/rules.js";
const VARY = " One customer's experience; results vary.";
const EDITS = {
  "2026-10-05-formats": {
    // the trimmed 4-star quote went on to say the reviewer saw little effect: show the rating only
    "alpha-arbutin-2__t26": (b) => { delete b.review; b.subhead = "Rated on beminimalist.co"; },
    "niacinamide-10-with-matmarine__t26": (b) => { b.footnote += VARY; },
    "salicylic-acid-2__t26": (b) => { b.footnote += VARY; },
    "salicylic-lha-2-cleanser__t26": (b) => { b.footnote += VARY; },
    "alpha-arbutin-2__t3": (b) => { b.actives = b.actives.filter((a) => a.name !== "Butylresorcinol"); },
    "niacinamide-10-with-matmarine__t10": (b) => { b.subhead = "For the look of oiliness & pores"; },
    "niacinamide-10-with-matmarine__t15": (b) => { b.callouts = [{ text: "With Matmarine", cites: ["F7"] }, { text: "With Zinc", cites: ["F8"] }]; },
  },
  "2026-10-05-marula": { "marula-05-moisturizer__t26": (b) => { b.footnote += VARY; } },
};
for (const [run, edits] of Object.entries(EDITS)) {
  const dir = path.join("pipeline/runs", run), file = path.join(dir, "briefs_final.json");
  const briefs = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  const sheets = Object.fromEntries(fs.readdirSync(path.join(dir, "products")).map((f) => [f.replace(/\.json$/, ""), JSON.parse(fs.readFileSync(path.join(dir, "products", f), "utf8"))]));
  fs.mkdirSync(path.join(dir, "judge_prompts_fix"), { recursive: true });
  for (const b of briefs) {
    const fix = edits[b.source_ad_id]; if (!fix) continue;
    fix(b);
    const sheet = sheets[b.product_handle];
    const ad = adFromBrief(b, sheets, b.product_handle);
    const jp = buildJudgePrompt(ad, runRules(ad, { sheet }), { sheet });
    fs.writeFileSync(path.join(dir, "judge_prompts_fix", `${b.source_ad_id}.user.md`), jp.user);
    fs.writeFileSync(path.join(dir, "judge_prompts_fix", "system.md"), `${jp.system}\n\n## Output format (JSON, exactly this schema)\n\n\`\`\`json\n${JSON.stringify(jp.schema, null, 2)}\n\`\`\`\n`);
    console.log("fixed", b.source_ad_id);
  }
  fs.writeFileSync(file, JSON.stringify(briefs, null, 2));
}
