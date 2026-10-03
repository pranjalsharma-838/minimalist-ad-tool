// Add-on (f) — customer-language source, by script (no browser, no model tokens).
// Amazon.in, the user's competitor method: for each Minimalist SKU type, search Amazon.in sorted by Best Sellers
// (s=exact-aware-popularity-rank), take the first 5 NON-Minimalist products = competitors, plus Minimalist's own
// listing; read the reviews shown on each product page (data-hook="review"). Writes
// research/marketplace_reviews_<date>.json and research/competitor_map.md (the competitor set).
// Flipkart: attempted per SKU type (search → first product → its review page); recorded as blocked if a bot wall.
// Nykaa: returns 403 to scripts (checked 2026-10-03) — not attempted; needs a browser session if required later.
// Usage: node scripts/collect_marketplace_reviews.js
import fs from "node:fs";

const TYPES = [
  { type: "sunscreen", q: "sunscreen spf 50 face", own: "multi-vitamin-spf-50" },
  { type: "niacinamide serum", q: "niacinamide serum face", own: "niacinamide-10-with-matmarine" },
  { type: "salicylic acid serum", q: "salicylic acid serum face", own: "salicylic-acid-2" },
  { type: "vitamin c serum", q: "vitamin c serum face", own: "vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1" },
  { type: "moisturizer", q: "face moisturizer oily skin", own: "vitamin-b5-10-moisturizer" },
  { type: "face wash / cleanser", q: "salicylic acid face wash", own: "salicylic-lha-2-cleanser" },
  { type: "pigmentation serum", q: "alpha arbutin serum", own: "alpha-arbutin-2" },
];
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36", "accept-language": "en-IN,en;q=0.9" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h) => String(h || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const blocked = (h) => /api-services-support@amazon|Type the characters you see|Robot Check|validateCaptcha/i.test(h);
// Minimal cookie jar + Amazon's interstitial (a meta-refresh "bm-verify" page that sets a cookie, then
// redirects after ~5s) — what a normal browser does automatically.
const jar = new Map();
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
async function get(url) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: { ...UA, cookie: cookieHeader() } }).catch(() => null);
    for (const c of r?.headers?.getSetCookie?.() || []) { const [kv] = c.split(";"); const j = kv.indexOf("="); jar.set(kv.slice(0, j).trim(), kv.slice(j + 1)); }
    if (r?.ok) {
      const t = await r.text();
      const refresh = t.match(/http-equiv="refresh" content="(\d+); URL='([^']+)'/i);
      if (refresh && t.length < 20000) { await sleep((Number(refresh[1]) + 1) * 1000); url = new URL(refresh[2].replace(/&amp;/g, "&"), url).href; continue; }
      if (!blocked(t)) return t;
    }
    await sleep(8000 * (i + 1));
  }
  return null;
}
// Review markup as of 2026-10: data-hook="review" blocks with reviewTitle / reviewRichContentContainer.
function amazonReviews(html) {
  return html.split('data-hook="review" ').slice(1).map((b) => ({
    stars: Number((b.match(/(\d(?:\.\d)?) out of 5 stars/) || [])[1]) || null,
    title: strip((b.match(/data-hook="reviewTitle"[^>]*>([\s\S]*?)<\/h5>/) || b.match(/data-hook="review-title"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/) || [])[1]),
    text: strip((b.match(/data-hook="reviewRichContentContainer"[^>]*>([\s\S]*?)<\/div>/) || b.match(/data-hook="review-body"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/) || [])[1]),
    verified: /Verified Purchase/i.test(b),
  })).filter((r) => r.text.length > 15);
}
const meta = (html) => ({ title: strip((html.match(/id="productTitle"[^>]*>([\s\S]*?)<\/span>/) || [])[1]), brand: strip((html.match(/id="bylineInfo"[^>]*>([\s\S]*?)<\/a>/) || [])[1]).replace(/^(Visit the|Brand:)\s*/i, "").replace(/\s*Store$/i, ""), rating: (html.match(/([\d.]+) out of 5 stars/) || [])[1] || null, ratings_count: strip((html.match(/id="acrCustomerReviewText"[^>]*>([\s\S]*?)<\/span>/) || [])[1]) });

const offers = JSON.parse(fs.readFileSync(fs.readdirSync("brand_packs/minimalist/raw").filter((f) => /^offers_/.test(f)).sort().pop().replace(/^/, "brand_packs/minimalist/raw/"), "utf8"));
const out = { captured_at: new Date().toISOString(), method: "Amazon.in search sorted by Best Sellers, first 5 non-Minimalist results + Minimalist's own listing; reviews shown on the product page", types: [] };
for (const T of TYPES) {
  const entry = { type: T.type, query: T.q, competitors: [], own: null, flipkart: null };
  const s = await get(`https://www.amazon.in/s?k=${encodeURIComponent(T.q)}&s=exact-aware-popularity-rank`);
  if (!s) { entry.error = "search blocked"; out.types.push(entry); console.log(T.type, "search blocked"); continue; }
  const results = s.split('data-component-type="s-search-result"').slice(1).map((c) => ({ asin: (c.match(/data-asin="([A-Z0-9]{10})"/) || [])[1], sponsored: /Sponsored/i.test(c.slice(0, 4000)), title: strip((c.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1]) })).filter((r) => r.asin && !r.sponsored);
  const comps = results.filter((r) => !/minimalist/i.test(r.title)).slice(0, 5);
  const ownAsin = offers.products[T.own]?.amazon_in?.asin;
  for (const [role, asin] of [...comps.map((c) => ["competitor", c.asin]), ...(ownAsin ? [["own", ownAsin]] : [])]) {
    await sleep(3500);
    const h = await get(`https://www.amazon.in/dp/${asin}`);
    if (!h) { console.log(`  ${asin} blocked`); continue; }
    const rec = { asin, url: `https://www.amazon.in/dp/${asin}`, ...meta(h), reviews: amazonReviews(h) };
    if (role === "own") entry.own = rec; else entry.competitors.push(rec);
    console.log(`  ${T.type} · ${role} · ${rec.brand || "?"} · ${rec.rating || "?"}★ (${rec.ratings_count}) · ${rec.reviews.length} reviews`);
  }
  // Flipkart attempt: search → first product page link → its review page.
  await sleep(3000);
  const fs1 = await get(`https://www.flipkart.com/search?q=${encodeURIComponent("minimalist " + T.q)}`);
  const plink = fs1 && (fs1.match(/href="(\/[^"]+\/p\/itm[a-z0-9]+\?pid=[A-Z0-9]+)/i) || [])[1];
  if (plink) {
    const rlink = "https://www.flipkart.com" + plink.replace("/p/", "/product-reviews/").split("&")[0];
    await sleep(3000);
    const fr = await get(rlink);
    const texts = fr ? [...fr.matchAll(/<div class="[^"]*"><div class="">([\s\S]{20,1200}?)<\/div><\/div><span/g)].map((m) => strip(m[1])).filter((t) => t.length > 20) : [];
    entry.flipkart = { url: rlink, reviews: texts.slice(0, 20).map((text) => ({ text })), status: fr ? (texts.length ? "ok" : "page fetched, review markup not recognised") : "blocked" };
  } else entry.flipkart = { status: fs1 ? "no product link found" : "blocked" };
  console.log(`  ${T.type} · flipkart: ${entry.flipkart.status}${entry.flipkart.reviews ? " · " + entry.flipkart.reviews.length : ""}`);
  out.types.push(entry);
}
const day = out.captured_at.slice(0, 10);
fs.writeFileSync(`research/marketplace_reviews_${day}.json`, JSON.stringify(out, null, 2));
fs.writeFileSync("research/competitor_map.md", ["# Competitor map (Amazon.in best sellers method)", "", `Captured ${day}. For each Minimalist SKU type: Amazon.in search sorted by Best Sellers, first 5 non-Minimalist, non-sponsored results.`, "", ...out.types.flatMap((t) => [`## ${t.type} (query "${t.query}")`, ...(t.competitors.length ? t.competitors.map((c, i) => `${i + 1}. ${c.brand || "?"} — ${c.title.slice(0, 90)} · ${c.rating || "?"}★ ${c.ratings_count || ""} · ${c.url}`) : [`- ${t.error || "none captured"}`]), t.own ? `- Minimalist own listing: ${t.own.rating || "?"}★ ${t.own.ratings_count || ""} · ${t.own.url}` : "", ""])].join("\n"));
console.log("saved", `research/marketplace_reviews_${day}.json`, "+ research/competitor_map.md");
