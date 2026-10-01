// Stage 3 — Match each pooled ad to our most similar product, then fetch that product's facts.
// Usage: node pipeline/03_match.js <YYYY-MM-DD>
// Primary: product-to-product similarity (lib/similarity.js) between the competitor's advertised
// product (from tags/<id>.json) and our SKU dictionary (research/sku_dictionary.json, top sellers boosted).
// Fallback (only when similarity confidence is low): concern keyword routes in config/product_map.json.
// Writes match.json (with the scoring trail) and products/<handle>.json.
import fs from "node:fs";
import path from "node:path";
import { extractFromUrl, refusalReason } from "../lib/extract.js";
import { matchProduct } from "../lib/similarity.js";

const date = process.argv[2];
const runDir = path.join("pipeline", "runs", date);
const pool = JSON.parse(fs.readFileSync(path.join(runDir, "pool.json"), "utf8"));
const map = JSON.parse(fs.readFileSync("config/product_map.json", "utf8"));
fs.mkdirSync(path.join(runDir, "products"), { recursive: true });

const matches = [];
const sheets = new Map();
for (const ad of pool) {
  const tagFile = path.join(runDir, "tags", `${ad.id}.json`);
  if (!fs.existsSync(tagFile)) throw new Error(`Missing ${tagFile}: run the tagging step (stage 2) first.`);
  const tags = JSON.parse(fs.readFileSync(tagFile, "utf8"));
  const comp = tags.advertised_product || { name: "", actives: [], format: "other", concerns: [] };

  let { best, confidence, candidates } = matchProduct(comp);
  let url = best.url, how = "similarity";
  if (confidence === "low") {
    const hay = [ad.headline, ad.primary_text, ad.on_image_text, comp.name, ...(comp.concerns || [])].join(" ").toLowerCase();
    const route = map.routes.find((r) => r.keywords.some((k) => new RegExp(`\\b${k}`, "i").test(hay)));
    url = route.product_url;
    how = `fallback: concern route "${route.concern}" (similarity too weak)`;
  }
  const handle = url.split("/products/")[1];
  if (!sheets.has(handle)) {
    const sheet = await extractFromUrl(url);
    sheets.set(handle, sheet);
    fs.writeFileSync(path.join(runDir, "products", `${handle}.json`), JSON.stringify(sheet, null, 2));
    await new Promise((r) => setTimeout(r, 1000));
  }
  matches.push({
    id: ad.id, brand: ad.brand, ad_type: tags.ad_type || ad.ad_type,
    competitor_product: comp, product_handle: handle, product_title: sheets.get(handle).title,
    match_method: how, match_confidence: confidence, candidates,
    refusal: refusalReason(sheets.get(handle)),
  });
}
fs.writeFileSync(path.join(runDir, "match.json"), JSON.stringify(matches, null, 2));
for (const m of matches) {
  console.log(`${m.id} ${m.brand} [${m.ad_type}] "${m.competitor_product.name}" -> ${m.product_title} (${m.match_confidence}; ${m.match_method}) | ${m.candidates[0].why.join(", ")}`);
}
