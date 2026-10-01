// Builds research/sku_dictionary.json: one entry per single (non-kit) product, with the fields the
// product matcher needs — actives + %, format, concerns, skin type — plus two demand signals:
//   best_seller_rank: position in the brand's own "Best Sellers" collection (curated by Minimalist;
//                     the store's generic sort_by=best-selling is ignored by the JSON feed, checked 2026-10-02)
//   review_count / rating: from the product page's structured data (Yotpo)
// Usage: node scripts/build_sku_dictionary.js        (fetches live pages, ~1.2s apart)
import fs from "node:fs";
import { activesFromTitle, parseProductHtml } from "../lib/extract.js";

const ORIGIN = "https://beminimalist.co";
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Order matters: hair/body first, so "Hair Growth Actives 18% Hair Serum" isn't filed as a face serum.
const FORMATS = [
  ["hair", /hair|shampoo|scalp|dandruff/i],
  ["body", /body|underarm|roll-on/i],
  ["sunscreen", /sunscreen|spf\s?\d+\s*$/i],
  ["cleanser", /cleanser|face wash|cleansing|body wash/i],
  ["serum", /serum|face oil|squalane/i],
  ["moisturizer", /moisturi[sz]er|cream|lotion|gel(?!.*cleanser)/i],
  ["toner", /toner|exfoliating liquid|mist|spray/i],
  ["exfoliant", /peel|exfoliat/i],
  ["lip", /lip/i],
  ["eye", /eye/i],
];
export const formatOf = (title) => (FORMATS.find(([, re]) => re.test(title)) || ["other"])[0];

const isSingle = (p) =>
  !/kit|set|duo|trio|combo|bundle|tote|pouch|gift|surprise|freebie/i.test(p.title) &&
  !/^🎁/.test(p.title) && !/\b\d+\s?(ml|g)\b\s*$/i.test(p.title) && Number(p.variants?.[0]?.price) > 0;

const snapshot = JSON.parse(fs.readFileSync("research/products_snapshot_2026-10-02.json", "utf8")).products;
const best = (await (await fetch(`${ORIGIN}/collections/best-sellers/products.json?limit=250`, { headers: UA })).json()).products.map((p) => p.handle);

const out = [];
for (const p of snapshot.filter(isSingle)) {
  const html = await (await fetch(`${ORIGIN}/products/${encodeURIComponent(p.handle)}`, { headers: UA })).text();
  const parsed = parseProductHtml(html);
  const line = (label) => parsed.sections.flatMap((s) => s.lines).find((l) => new RegExp(`^${label}:`, "i").test(l));
  const rc = html.match(/"ratingCount":\s*"?(\d+)"?/) || html.match(/"reviewCount":\s*"?(\d+)"?/);
  const rv = html.match(/"ratingValue":\s*"?([\d.]+)"?/);
  const title = parsed.title || p.title;
  out.push({
    handle: p.handle,
    url: `${ORIGIN}/products/${p.handle}`,
    title,
    actives: activesFromTitle(title),
    format: formatOf(title),
    product_type: p.product_type,
    concerns: (line("Concerns?") || line("Ideal for") || "").replace(/^(Concerns?|Ideal for):\s*/i, "").split(/,|&|\//).map((s) => s.trim().toLowerCase()).filter(Boolean),
    skin_type: (line("Skin type") || "").replace(/^Skin type:\s*/i, ""),
    tagline: parsed.subtitles[0] || "",
    price_inr: Number(p.variants[0].price),
    review_count: rc ? Number(rc[1]) : null,
    rating: rv ? Number(rv[1]) : null,
    best_seller_rank: best.includes(p.handle) ? best.indexOf(p.handle) + 1 : null,
    pediatric: /pediatric/i.test(p.handle),
  });
  process.stdout.write(".");
  await sleep(1200);
}
out.sort((a, b) => (a.best_seller_rank ?? 999) - (b.best_seller_rank ?? 999) || (b.review_count ?? 0) - (a.review_count ?? 0));
fs.writeFileSync("research/sku_dictionary.json", JSON.stringify({
  built: new Date().toISOString().slice(0, 10),
  source: "beminimalist.co product pages + Best Sellers collection",
  caveat: "best_seller_rank = position in the brand's Best Sellers collection. 55 of 56 singles are in it, so membership is not a signal; the ORDER is assumed sales-ranked but this is unverified (it may be curated by hand). Use with review_count.",
  top_sellers: out.filter((s) => !s.pediatric && s.best_seller_rank && s.best_seller_rank <= 20).map((s) => s.handle),
  count: out.length,
  skus: out,
}, null, 2));
console.log(`\n${out.length} single SKUs; ${out.filter((s) => s.best_seller_rank).length} in Best Sellers`);
for (const s of out.slice(0, 15)) console.log(`${String(s.best_seller_rank ?? "-").padStart(3)}  ${s.title.padEnd(48)} ${s.format.padEnd(11)} reviews ${s.review_count ?? "?"}  [${s.concerns.join(", ")}]`);
