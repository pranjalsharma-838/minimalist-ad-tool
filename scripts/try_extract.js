// Dev helper: node scripts/try_extract.js <product-url> [...more]
// Prints the fact sheet the generator would see, so extraction can be eyeballed.
import { extractFromUrl } from "../lib/extract.js";

for (const url of process.argv.slice(2)) {
  try {
    const s = await extractFromUrl(url);
    console.log(`\n### ${s.title}  | actives=${JSON.stringify(s.actives)} | price=${s.price} | images=${s.images.length}`);
    for (const f of s.facts) console.log(`${f.id} [${f.kind}] (${f.section}) ${f.text.slice(0, 160)}`);
  } catch (e) {
    console.log(`\n### ${url}\nERROR: ${e.message}`);
  }
}
