// Retries only the products that errored in brand_packs/minimalist/raw/website.json (e.g. HTTP 503).
import fs from "node:fs";
import { extractFromUrl } from "../lib/extract.js";

const file = "brand_packs/minimalist/raw/website.json";
const data = JSON.parse(fs.readFileSync(file, "utf8"));
for (const p of data.products.filter((p) => p.error)) {
  await new Promise((r) => setTimeout(r, 8000));
  try {
    const s = await extractFromUrl(p.url);
    Object.assign(p, { url: s.url, title: s.title, actives: s.actives, price_inr: s.price, facts: s.facts });
    delete p.error;
    console.log("ok", p.handle, s.facts.length, "facts");
  } catch (e) {
    p.error = e.message;
    console.log("still failing", p.handle, e.message);
  }
}
fs.writeFileSync(file, JSON.stringify(data, null, 1));
