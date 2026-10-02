// Real customer reviews (script, no browser, no model tokens) — user decision 2026-10-03: real website
// reviews/testimonials may be used in ads, VERBATIM and attributed.
//   Source: the Yotpo widget on beminimalist.co (public widget feed). App key read once from a product page.
//   Per product: star average + total review count (bottomline) and the most-upvoted reviews.
//   Safety: every review text runs through the same rule layer as ad copy (lib/rules.js). Only reviews with
//   no fix/block finding are marked usable; the rest are kept with the reason, never offered to the writer.
// Usage: node scripts/collect_reviews.js [handle ...]   (default: top 8)  → brand_packs/minimalist/raw/reviews_<date>.json
import fs from "node:fs";
import { runRules } from "../lib/rules.js";

const SITE = "https://beminimalist.co";
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129 Safari/537.36" };
const top = JSON.parse(fs.readFileSync("brand_packs/minimalist/raw/top20.json", "utf8")).map((x) => x.handle || x);
const handles = process.argv.slice(2).length ? process.argv.slice(2) : top.slice(0, 8);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url) => { for (let i = 0; i < 3; i++) { const r = await fetch(url, { headers: UA }).catch(() => null); if (r?.ok) return r.text(); await sleep(4000 * (i + 1)); } return null; };
const clean = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const cacheKey = "brand_packs/minimalist/raw/yotpo_app_key.txt";
let appKey = fs.existsSync(cacheKey) ? fs.readFileSync(cacheKey, "utf8").trim() : null;
if (!appKey) {
  const html = await get(`${SITE}/products/${handles[0]}`);
  appKey = html && ((html.match(/yotpo\.com\/(?:v1\/loader\/)?([A-Za-z0-9]{20,})/) || [])[1] || (html.match(/data-appkey="([A-Za-z0-9]+)"/i) || [])[1] || (html.match(/"appKey"\s*:\s*"([A-Za-z0-9]+)"/) || [])[1]);
  if (!appKey) { console.log("Yotpo app key not found on the product page (site may be rate-limiting; retry later)."); process.exit(1); }
  fs.writeFileSync(cacheKey, appKey);
}

const out = { captured_at: new Date().toISOString(), source: `Yotpo widget feed for beminimalist.co (app ${appKey.slice(0, 6)}…)`, rule: "verbatim only; usable = no fix/block finding from lib/rules.js", products: {} };
for (const h of handles) {
  const pj = await get(`${SITE}/products/${h}.js`);
  if (!pj) { out.products[h] = { status: "product JSON failed" }; continue; }
  const { id, title } = JSON.parse(pj);
  const raw = await get(`https://api-cdn.yotpo.com/v1/widget/${appKey}/products/${id}/reviews.json?per_page=50&page=1&sort=votes_up`);
  if (!raw) { out.products[h] = { status: "review feed failed" }; continue; }
  const r = JSON.parse(raw).response;
  const reviews = (r.reviews || []).map((x) => {
    const text = clean(`${x.title ? x.title + ". " : ""}${x.content}`);
    const f = runRules({ ad_type: "brand", headline: "", primary_text: text, on_image_text: "", footnote: "", cta: "" }).filter((y) => y.severity !== "advisory");
    return { id: x.id, name: clean(x.user?.display_name), stars: x.score, verified: !!x.verified_buyer, date: (x.created_at || "").slice(0, 10), votes_up: x.votes_up, text,
      usable: f.length === 0 && x.score >= 4, reason: f.length ? f.map((y) => `${y.rule_id} "${y.span}"`).join("; ") : x.score < 4 ? "under 4 stars" : "" };
  });
  out.products[h] = { title, product_id: id, average: r.bottomline?.average_score ? +r.bottomline.average_score.toFixed(1) : null, total_reviews: r.bottomline?.total_review ?? null, reviews };
  console.log(`${h}: ${out.products[h].average}★ from ${out.products[h].total_reviews} reviews · ${reviews.filter((x) => x.usable).length}/${reviews.length} usable`);
  await sleep(2500);
}
const f = `brand_packs/minimalist/raw/reviews_${out.captured_at.slice(0, 10)}.json`;
fs.writeFileSync(f, JSON.stringify(out, null, 2));
console.log("saved", f);
