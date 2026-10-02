// CLI for the archetype skill: node scripts/select_archetypes.js <product-url> [objective=sales] [audience] [top=4]
// Writes runs/archetypes/<handle>_<date>.json (full ranking + shortlist) so a human can override.
import fs from "node:fs";
import path from "node:path";
import { extractFromUrl } from "../lib/extract.js";
import { rankArchetypes } from "../lib/archetype.js";

const [url, objective = "sales", audience = "", top = "4"] = process.argv.slice(2);
if (!url) {
  console.error("Usage: node scripts/select_archetypes.js <product-url> [sales|awareness|education] [audience] [top]");
  process.exit(1);
}
const sheet = await extractFromUrl(url);
const handle = url.split("/products/")[1].split(/[?#]/)[0];
const out = rankArchetypes({ product_handle: handle, sheet, objective, audience, top: Number(top) });
fs.mkdirSync("runs/archetypes", { recursive: true });
const file = path.join("runs/archetypes", `${handle}_${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`${out.request.product} · objective ${out.request.objective} · inputs: ${out.inputs.winners_30d} winner ads (30d+), trend file ${out.inputs.trend_file ? "yes" : "no"}, ${out.inputs.assets} assets`);
out.shortlist.forEach((r, i) => console.log(`${i + 1}. #${r.id} ${r.name} [${r.layout}] score ${r.score} · risk ${r.risk_label}\n   why: ${r.why}\n   ${r.suggestions.join(" | ")}`));
console.log(`full ranking (48) saved: ${file}`);
