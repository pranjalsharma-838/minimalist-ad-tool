// Stage 3 — Match each pooled ad to the brand's own product (config/product_map.json) and fetch that
// product's fact sheet from its live page (brand-authored sections only; reviews excluded).
// Usage: node pipeline/03_match.js <YYYY-MM-DD>
// Reads pool.json + tags/<id>.json. Writes match.json and products/<handle>.json.
import fs from "node:fs";
import path from "node:path";
import { extractFromUrl, refusalReason } from "../lib/extract.js";

const date = process.argv[2];
const runDir = path.join("pipeline", "runs", date);
const pool = JSON.parse(fs.readFileSync(path.join(runDir, "pool.json"), "utf8"));
const map = JSON.parse(fs.readFileSync("config/product_map.json", "utf8"));
fs.mkdirSync(path.join(runDir, "products"), { recursive: true });

const matches = [];
const sheets = new Map();
for (const ad of pool) {
  const tagFile = path.join(runDir, "tags", `${ad.id}.json`);
  const tags = fs.existsSync(tagFile) ? JSON.parse(fs.readFileSync(tagFile, "utf8")) : {};
  const hay = [ad.headline, ad.primary_text, ad.on_image_text, ad.link_description, tags.headline_text, tags.claim_type].join(" ").toLowerCase();
  const route = map.routes.find((r) => r.keywords.some((k) => new RegExp(`\\b${k}`, "i").test(hay)));
  const handle = route.product_url.split("/products/")[1];
  if (!sheets.has(handle)) {
    const sheet = await extractFromUrl(route.product_url);
    sheets.set(handle, sheet);
    fs.writeFileSync(path.join(runDir, "products", `${handle}.json`), JSON.stringify(sheet, null, 2));
  }
  const refusal = refusalReason(sheets.get(handle));
  matches.push({ id: ad.id, brand: ad.brand, ad_type: tags.ad_type || ad.ad_type, concern: route.concern, product_handle: handle, product_title: sheets.get(handle).title, refusal });
}
fs.writeFileSync(path.join(runDir, "match.json"), JSON.stringify(matches, null, 2));
for (const m of matches) console.log(`${m.id} (${m.brand}, ${m.ad_type}) -> ${m.product_title} [${m.concern}]${m.refusal ? " REFUSED" : ""}`);
