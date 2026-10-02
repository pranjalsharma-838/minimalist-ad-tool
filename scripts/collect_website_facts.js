// Brand pack input: full website fact sheets for the top-20 sellers (brand-authored sections only,
// reviews/testimonials tagged, not used as claims). Writes brand_packs/minimalist/raw/website.json.
// Usage: node scripts/collect_website_facts.js
import fs from "node:fs";
import { extractFromUrl } from "../lib/extract.js";

const top = JSON.parse(fs.readFileSync("brand_packs/minimalist/raw/top20.json", "utf8"));
const out = [];
for (const p of top) {
  try {
    const s = await extractFromUrl(p.url);
    out.push({ rank: p.rank, handle: p.handle, url: s.url, title: s.title, actives: s.actives, price_inr: s.price, facts: s.facts });
    process.stdout.write(".");
  } catch (e) {
    out.push({ rank: p.rank, handle: p.handle, url: p.url, error: e.message });
    process.stdout.write("x");
  }
  await new Promise((r) => setTimeout(r, 1200));
}
fs.writeFileSync("brand_packs/minimalist/raw/website.json", JSON.stringify({ collected: new Date().toISOString().slice(0, 10), products: out }, null, 1));
const kinds = out.flatMap((p) => p.facts || []).reduce((m, f) => ((m[f.kind] = (m[f.kind] || 0) + 1), m), {});
console.log(`\n${out.filter((p) => !p.error).length}/${out.length} pages read · facts by kind: ${JSON.stringify(kinds)}`);
for (const p of out.filter((p) => p.error)) console.log("ERROR", p.handle, p.error);
