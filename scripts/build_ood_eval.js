// Out-of-distribution eval set (2026-10-03, after external review asked "is 92% a generalisation test or a
// self-consistency check?"). The original 49 cases are Indian skincare META ads from one capture (18 of 33 are
// Minimalist's own) plus synthetic cases written during the build — held out, but the same distribution.
// This set changes BOTH axes: brands that never appear in the eval corpus or the competitor-ad collection,
// and a different channel (Amazon.in listing title + "About this item" bullets).
// Protocol: cases + blind labels are committed BEFORE the scorer is run on them; rules are frozen; scored once.
// Usage: node scripts/build_ood_eval.js   → eval/cases_ood.json
import fs from "node:fs";

// Brands seen anywhere in the build (eval corpus advertisers + the 10-brand Meta collection) are excluded.
const SEEN = /minimalist|pilgrim|derma ?co|mamaearth|chemist at play|kozicare|deconstruct|heaven magic|dot ?& ?key|sanfe|dermatouch|cureskin|foxtale|sheth|re'? ?equil|plum|conscious chemist/i;
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36", "accept-language": "en-IN,en;q=0.9" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
const jar = new Map();
async function get(url) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { headers: { ...UA, cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") } }).catch(() => null);
    for (const c of r?.headers?.getSetCookie?.() || []) { const [kv] = c.split(";"); const j = kv.indexOf("="); jar.set(kv.slice(0, j).trim(), kv.slice(j + 1)); }
    if (r?.ok) {
      const t = await r.text();
      const refresh = t.match(/http-equiv="refresh" content="(\d+); URL='([^']+)'/i);
      if (refresh && t.length < 20000) { await sleep((Number(refresh[1]) + 1) * 1000); url = new URL(refresh[2].replace(/&amp;/g, "&"), url).href; continue; }
      if (!/validateCaptcha|Robot Check|api-services-support@amazon/i.test(t)) return t;
    }
    await sleep(8000 * (i + 1));
  }
  return null;
}
const mr = JSON.parse(fs.readFileSync(fs.readdirSync("research").filter((f) => /^marketplace_reviews_.*\.json$/.test(f)).sort().pop().replace(/^/, "research/"), "utf8"));
const pool = [];
for (const t of mr.types) for (const c of t.competitors) if (c.brand && !SEEN.test(`${c.brand} ${c.title}`) && !pool.some((p) => p.asin === c.asin)) pool.push({ ...c, type: t.type });
console.log(`${pool.length} unseen-brand products: ${[...new Set(pool.map((p) => p.brand))].join(", ")}`);
const cases = [];
for (const p of pool) {
  await sleep(3500);
  const h = await get(`https://www.amazon.in/dp/${p.asin}`);
  if (!h) { console.log(`  ${p.asin} blocked`); continue; }
  const fb = (h.match(/id="feature-bullets"[\s\S]*?<\/ul>/) || h.match(/About this item[\s\S]{0,6000}?<\/ul>/) || [""])[0];
  const bullets = [...fb.matchAll(/<span class="a-list-item[^"]*">([\s\S]*?)<\/span>/g)].map((m) => strip(m[1])).filter((b) => b.length > 15 && !/^(see more|›)/i.test(b));
  if (!bullets.length) { console.log(`  ${p.asin} ${p.brand}: no bullets parsed`); continue; }
  cases.push({ id: `ood_${p.asin}`, split: "ood", source: `https://www.amazon.in/dp/${p.asin}`, advertiser: p.brand, is_minimalist: false, ad_type: "brand", channel: "amazon_listing", product_type: p.type, headline: p.title.slice(0, 200), primary_text: bullets.join("\n"), on_image_text: "", footnote: "", cta: "" });
  console.log(`  ${p.brand} (${p.type}): ${bullets.length} bullets`);
}
fs.writeFileSync("eval/cases_ood.json", JSON.stringify(cases, null, 2));
// Labeler input: same ads, no source/brand metadata beyond what an ad shows.
fs.writeFileSync("eval/labeling_input_ood.json", JSON.stringify(cases.map(({ id, advertiser, headline, primary_text }) => ({ id, advertiser, headline, primary_text })), null, 2));
console.log(`${cases.length} OOD cases → eval/cases_ood.json (+ eval/labeling_input_ood.json)`);
