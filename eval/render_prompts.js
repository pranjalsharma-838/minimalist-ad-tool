// Renders the exact judge prompt (system + user + output schema) the app would send to the API for
// each eval case, so the model layer can be evaluated by a stand-in when no API key is available.
// Output: eval/rendered/system.md (shared), eval/rendered/schema.json, eval/rendered/<id>.user.md
import fs from "node:fs";
import { runRules } from "../lib/rules.js";
import { buildJudgePrompt } from "../lib/judge.js";

const cases = [...JSON.parse(fs.readFileSync("eval/cases.json", "utf8")), ...(fs.existsSync("eval/cases_ood.json") ? JSON.parse(fs.readFileSync("eval/cases_ood.json", "utf8")) : [])];
fs.rmSync("eval/rendered", { recursive: true, force: true });
fs.mkdirSync("eval/rendered", { recursive: true });
let system = null;
for (const c of cases) {
  const ad = { ad_type: c.ad_type, headline: c.headline, primary_text: c.primary_text, on_image_text: c.on_image_text, footnote: c.footnote, cta: c.cta };
  const p = buildJudgePrompt(ad, runRules(ad), {});
  if (system === null) {
    system = p.system;
    fs.writeFileSync("eval/rendered/system.md", p.system);
    fs.writeFileSync("eval/rendered/schema.json", JSON.stringify(p.schema, null, 2));
  } else if (p.system !== system) throw new Error("system prompt must be identical across cases (cache prefix)");
  fs.writeFileSync(`eval/rendered/${c.id}.user.md`, p.user);
}
console.log(`rendered ${cases.length} user prompts; system prompt ${system.length} chars`);
