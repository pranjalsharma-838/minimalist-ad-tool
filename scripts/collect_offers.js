// Live offers capture (script, no browser, no model tokens).
//   Website (Shopify): /products/<handle>.js gives price + compare_at_price (MRP) per variant;
//   homepage HTML gives the announcement bar / banners / coupon codes (exact text, regex-extracted).
//   Amazon.in: plain fetch of the search page; usually bot-blocked — recorded as "blocked" rather than guessed.
// Records only what the page shows. Never computes an offer that isn't displayed (pct_off_computed is
// labelled as computed from the two shown prices, for the scorer to check the ad's "% off").
// Usage: node scripts/collect_offers.js [handle ...]   (default: top 8 from raw/top20.json)
import fs from "node:fs";

const SITE = "https://beminimalist.co";
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36", "accept-language": "en-IN" };
const top = JSON.parse(fs.readFileSync("brand_packs/minimalist/raw/top20.json", "utf8")).map((x) => x.handle || x);
const handles = process.argv.slice(2).length ? process.argv.slice(2) : top.slice(0, 8);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (url, tries = 2) => {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, { headers: UA }); if (r.ok) return await r.text(); if (i === tries - 1) return { status: r.status }; } catch (e) { if (i === tries - 1) return { error: e.message }; }
    await sleep(2000);
  }
};
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&").replace(/&#8377;|&#x20B9;/gi, "₹").replace(/\s+/g, " ").trim();
const OFFER_RX = /[^.|•\n]{0,80}\b(\d{1,2}\s?% off|flat \d+%|use code|coupon|code[:\s]+[A-Z0-9]{3,}|buy \d+ get \d+|b\d+g\d+|free gift|free shipping|free delivery|sale|extra \d+%|save ₹?\s?\d+|combo|bundle offer|off on orders)[^.|•\n]{0,80}/gi;
const typeOf = (t) => /code|coupon/i.test(t) ? "coupon" : /buy \d+ get|b\dg\d/i.test(t) ? "bogo" : /free gift/i.test(t) ? "free_gift" : /free (shipping|delivery)/i.test(t) ? "free_shipping" : /sale|% off/i.test(t) ? "sale_banner" : "other";
const codeOf = (t) => (t.match(/code[:\s]+([A-Z0-9]{3,})/) || [])[1] || null;
const expiryOf = (t) => (t.match(/(till|until|ends?|valid (till|upto|up to))\s+([0-9]{1,2}(st|nd|rd|th)?\s+\w+|\w+\s+[0-9]{1,2})/i) || [])[0] || null;
// Split a banner run into single offer phrases; drop product-grid "On Sale from ₹" noise (that is per-product price, captured from JSON).
const SPLIT = /(?=Build Your Own|Up ?to \d+\s?%|Buy \d+,? Get|Get Additional|Free (?:Gift|Shipping|Delivery)|Use code|Flat \d+\s?%|Extra \d+\s?%)/i;
const OFFER_TEST = new RegExp(OFFER_RX.source, "i");
const phrases = (texts) => [...new Set(texts.filter((t) => !/On Sale from|liquid -->|Select Size/i.test(t)).flatMap((t) => t.split(SPLIT)).map((s) => s.replace(/^.*?(Skip to content|🎁)\s*/u, "").replace(/\s*[—-]\s*$/, "").trim()).filter((s) => OFFER_TEST.test(s) && s.length <= 140))];
const offersIn = (html, url) => phrases(strip(html).match(OFFER_RX) || []).slice(0, 25).map((text) => ({ source_url: url, text, type: typeOf(text), code: codeOf(text), expiry: expiryOf(text) }));

const out = { captured_at: new Date().toISOString(), method: "script (fetch; Shopify product JSON + homepage HTML; Amazon search HTML)", sitewide: [], products: {}, notes: [] };
const home = await get(SITE + "/");
// The theme's announcement bar holds one offer per <span class="announcement"><a href=…>TEXT</a>; read those
// exactly (with the offer's own landing page = where its terms live). Fallback: the text-pattern scan.
const announcements = (html) => [...html.matchAll(/<span class="announcement"[^>]*>\s*<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => {
  const text = strip(m[2]).replace(/^🎁\s*/u, "");
  return { source_url: SITE + "/", terms_page: m[1].startsWith("http") ? m[1].split("?")[0] : SITE + m[1].split("?")[0], text, type: typeOf(text), code: codeOf(text), expiry: expiryOf(text) };
});
if (typeof home === "string") { out.sitewide = announcements(home); if (!out.sitewide.length) out.sitewide = offersIn(home, SITE + "/"); fs.writeFileSync(`brand_packs/minimalist/raw/home_${out.captured_at.slice(0, 10)}.html`, home); }
else out.notes.push(`homepage fetch failed: ${JSON.stringify(home)}`);

for (const h of handles) {
  const p = { website: null, amazon_in: null };
  const js = await get(`${SITE}/products/${h}.js`);
  if (typeof js === "string") {
    const d = JSON.parse(js);
    p.website = {
      url: `${SITE}/products/${h}`, title: d.title,
      variants: d.variants.map((v) => ({ name: v.title, price: v.price / 100, mrp: v.compare_at_price ? v.compare_at_price / 100 : null, available: v.available, pct_off_computed: v.compare_at_price > v.price ? Math.round((1 - v.price / v.compare_at_price) * 100) : 0 })),
      tags_offer: (d.tags || []).filter((t) => /offer|sale|deal|combo|bogo|gift/i.test(t)),
    };
    const page = await get(`${SITE}/products/${h}`);
    p.website.offer_texts = typeof page === "string" ? offersIn(page, p.website.url).map((o) => o.text).filter((t) => !out.sitewide.some((s) => s.text === t)) : [];
  } else out.notes.push(`${h}: product JSON failed ${JSON.stringify(js)}`);
  const az = await get(`https://www.amazon.in/s?k=${encodeURIComponent("Minimalist " + (p.website?.title || h))}`, 1);
  if (typeof az === "string" && !/captcha|api-services-support/i.test(az)) {
    const first = az.split('data-component-type="s-search-result"').slice(1).find((c) => /minimalist/i.test(c));
    if (first) {
      const num = (rx) => { const m = first.match(rx); return m ? Number(m[1].replace(/,/g, "")) : null; };
      p.amazon_in = {
        asin: (first.match(/data-asin="([A-Z0-9]{10})"/) || [])[1] || null,
        price: num(/a-price-whole">([\d,]+)/), mrp: num(/a-text-price"[^>]*><span class="a-offscreen">₹([\d,]+)/),
        pct_off_shown: (first.match(/\((\d{1,2})% off\)/) || [])[1] ? Number(first.match(/\((\d{1,2})% off\)/)[1]) : null,
        coupon: (strip(first).match(/Save (\d+%|₹\s?\d+) with coupon|Apply \S+ coupon/i) || [])[0] || null,
        deal_badge: /Limited time deal/i.test(first) ? "Limited time deal" : null,
        note: "first search result containing 'Minimalist' — verify it is the brand's own listing",
      };
    } else p.amazon_in = { status: "no Minimalist result parsed" };
  } else p.amazon_in = { status: "blocked or failed", detail: typeof az === "string" ? "captcha page" : az };
  out.products[h] = p;
  console.log(`${h}: site ${p.website ? p.website.variants.map((v) => `₹${v.price}${v.mrp ? "/MRP ₹" + v.mrp : ""}`).join(", ") : "—"} | amazon ${p.amazon_in.price ? "₹" + p.amazon_in.price + (p.amazon_in.pct_off_shown ? ` (${p.amazon_in.pct_off_shown}% off)` : "") : p.amazon_in.status}`);
  await sleep(1500);
}
const f = `brand_packs/minimalist/raw/offers_${out.captured_at.slice(0, 10)}.json`;
fs.writeFileSync(f, JSON.stringify(out, null, 2));
console.log(`sitewide offers: ${out.sitewide.length}\n${out.sitewide.map((s) => " - [" + s.type + "] " + s.text).join("\n")}\nsaved ${f}`);
