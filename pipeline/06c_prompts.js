// Stage 7 check — re-checks every director prompt (code, not self-assessment) and writes chatgpt_prompts.md.
// Usage: node pipeline/06c_prompts.js <run>
import fs from "node:fs";
import path from "node:path";
import { checkImagePrompt } from "../lib/image_prompt_check.js";

const run = process.argv[2];
const dir = path.join("pipeline", "runs", run, "director");
const out = ["# Image prompts — " + run, ""];
let refused = 0;
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const id = f.replace(".json", "");
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  if (d.refused) { console.log(`${id}: director refused — ${d.refused}`); refused++; continue; }
  d.variants.forEach((v, i) => {
    const c = checkImagePrompt(v.image_prompt);
    const tag = c.refused ? "REFUSED (draws product)" : `risk ${c.risk}${c.missing.length ? ", missing: " + c.missing.join("; ") : ""}`;
    console.log(`${id} v${i + 1}: ${tag}`);
    if (!c.refused) out.push(`## ${id} · v${i + 1} (${v.axis_value}) · ${tag}`, "", v.image_prompt, "");
    else refused++;
  });
}
fs.writeFileSync(path.join("pipeline", "runs", run, "chatgpt_prompts.md"), out.join("\n"));
console.log(refused ? `${refused} refused` : "all prompts usable");
