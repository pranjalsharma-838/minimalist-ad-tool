// Product-led run: for each product, the archetype skill picks the formats, and one brief input is written
// per (product, format). Downstream stages (05 gate, 05b retry, 06b director, 08 compose) are unchanged.
// Usage: node pipeline/00_product_run.js <run-id> <formats-per-product> <handle> [handle...]
import fs from "node:fs";
import path from "node:path";
import { extractFromUrl } from "../lib/extract.js";
import { rankArchetypes } from "../lib/archetype.js";

const [runId, per, ...handles] = process.argv.slice(2);
const runDir = path.join("pipeline", "runs", runId);
for (const d of ["products", "brief_inputs", "briefs_draft"]) fs.mkdirSync(path.join(runDir, d), { recursive: true });
const TEMPLATES = JSON.parse(fs.readFileSync("config/templates.json", "utf8")).templates;
const COMPANIONS = ["salicylic-lha-2-cleanser", "niacinamide-10-with-matmarine", "multi-vitamin-spf-50"];
const loadAds = () => fs.readdirSync("research/competitor_ads").filter((f) => f.endsWith(".json")).flatMap((f) => JSON.parse(fs.readFileSync(`research/competitor_ads/${f}`, "utf8")));
const ads = loadAds();

async function sheetFor(h) {
  const f = path.join(runDir, "products", `${h}.json`);
  if (!fs.existsSync(f)) {
    fs.writeFileSync(f, JSON.stringify(await extractFromUrl(`https://beminimalist.co/products/${h}`), null, 2));
    await new Promise((r) => setTimeout(r, 1000));
  }
  const s = JSON.parse(fs.readFileSync(f, "utf8"));
  // Audit fix (pilot 2026-10-03): prices and live offers become citable facts (the gate checks citations
  // against sheet.facts). Source = latest scripts/collect_offers.js capture. sheet.price alone was the
  // smallest size's SALE price, not the MRP, so it is no longer used.
  s.facts = s.facts.filter((x) => !["price", "offer"].includes(x.kind));
  const of = fs.readdirSync("brand_packs/minimalist/raw").filter((x) => /^offers_.*\.json$/.test(x)).sort().pop();
  if (of) {
    const o = JSON.parse(fs.readFileSync(`brand_packs/minimalist/raw/${of}`, "utf8"));
    const day = o.captured_at.slice(0, 10), p = o.products[h];
    (p?.website?.variants || []).forEach((v, i) => s.facts.push({ id: `PRICE${i + 1}`, kind: "price", section: "price (website)", text: `${v.name}: Rs. ${v.price}${v.mrp ? ` (MRP Rs. ${v.mrp}; ${v.pct_off_computed}% below MRP, both prices shown on the page)` : " (no MRP shown)"} — beminimalist.co, captured ${day}` }));
    if (p?.amazon_in?.price) s.facts.push({ id: "PRICE_AMZ", kind: "price", section: "price (Amazon.in)", text: `Amazon.in: Rs. ${p.amazon_in.price}${p.amazon_in.pct_off_shown ? ` (${p.amazon_in.pct_off_shown}% off as shown)` : ""}${p.amazon_in.coupon ? `; ${p.amazon_in.coupon}` : ""} — search result, captured ${day} (verify it is the brand's own listing)` });
    o.sitewide.forEach((x, i) => s.facts.push({ id: `OFFER${i + 1}`, kind: "offer", section: "sitewide offer (website banner)", text: `"${x.text}" — beminimalist.co homepage, captured ${day}${x.expiry ? `, ${x.expiry}` : ", no end date shown"}; terms: ${x.terms_page || "site"}` }));
  }
  // Real reviews (user decision 2026-10-03), verbatim + attributed. Extra screen here: star rating alone is not
  // enough (a 5-star "it got worse, can't see any difference" passed the capture filter) — negative/mixed
  // wording, very short reviews and price complaints are not offered.
  s.facts = s.facts.filter((x) => !["review", "rating"].includes(x.kind));
  const rf = fs.readdirSync("brand_packs/minimalist/raw").filter((x) => /^reviews_.*\.json$/.test(x)).sort().pop();
  const rp = rf && JSON.parse(fs.readFileSync(`brand_packs/minimalist/raw/${rf}`, "utf8")).products[h];
  if (rp?.reviews) {
    const day = rf.slice(8, 18);
    if (rp.average) s.facts.push({ id: "RATING", kind: "rating", section: "reviews (Yotpo, website)", text: `${rp.average} out of 5 stars from ${rp.total_reviews.toLocaleString("en-IN")} reviews on beminimalist.co, captured ${day}` });
    const NEG = /\b(complain|worst|worse|bad|waste|disappoint|no (difference|result|change)|can'?t see|not (working|work|good|effective|see|satisf|happy|suit)|didn'?t|doesn'?t|breakout|broke out|irritat|allerg|rash|burn|itch|sting|pimples? (are )?coming|expensive|costly|affordable|refund|fake|duplicate|but\b|problem|issue|lekin|lykin|par\b|nahi|nhi)/i;
    rp.reviews.filter((r) => r.usable && r.verified && !NEG.test(r.text) && r.text.split(/\s+/).length >= 8).slice(0, 6)
      .forEach((r, i) => s.facts.push({ id: `REV${i + 1}`, kind: "review", section: "customer review (verbatim; quote exactly, no edits beyond trimming with …)", text: `"${r.text}" — ${r.name}, verified buyer, ${r.stars}★, ${r.date} (beminimalist.co, captured ${day})` }));
  }
  fs.writeFileSync(f, JSON.stringify(s, null, 2));
  return s;
}
const factLines = (s, prefix = "") => s.facts.filter((f) => !["inci", "faq", "testimonial"].includes(f.kind) || f.kind === "faq").map((f) => `${prefix}${f.id} [${f.kind}] (${f.section}) ${f.text}`).join("\n");

const match = [];
const used = {};
for (const h of handles) {
  const sheet = await sheetFor(h);
  const pick = rankArchetypes({ product_handle: h, sheet, objective: "sales", top: Number(per), used });
  for (const r of pick.shortlist) used[r.id] = (used[r.id] || 0) + 1;
  for (const r of pick.shortlist) {
    const t = TEMPLATES.find((x) => x.id === r.id);
    const id = `${h}__t${r.id}`;
    const example = ads.filter((a) => t.competitor_types.includes(a.ad_type)).sort((a, b) => b.days_running - a.days_running)[0];
    const comps = [];
    for (const c of COMPANIONS.filter((c) => c !== h)) comps.push([c, await sheetFor(c)]);
    const md = [
      `# Brief input — ${id}`,
      `source_ad_id: ${id}`,
      `Format (from the archetype skill): #${t.id} ${t.name} · family ${t.family} · layout "${t.layout}" (if "new", use the closest built layout and describe the intended design in layout_description) · image source ${t.source}`,
      `Why chosen: ${r.why}`,
      `Risk: ${r.risk_label} — ${r.risk_note}${r.suggestions.length ? " · " + r.suggestions.join(" ") : ""}`,
      "",
      "## Reference competitor ad for this format (structure only, never its wording)",
      example ? `${example.brand} · ${example.days_running} days · ${example.ad_type}\nHeadline: ${example.headline || ""}\nText: ${(example.primary_text || "").slice(0, 400)}\nOn image: ${example.on_image_text || ""}\nVisual: ${example.visual_notes || ""}` : "(none)",
      "",
      `## Product facts: ${sheet.title} (main product, handle "${h}")`,
      `Hero shown by the layout: ${sheet.actives.map((a) => (a.name === "SPF" ? `SPF ${a.pct}` : `${a.pct} ${a.name}`)).join(", ") || "(none)"}`,
      factLines(sheet),
      ...comps.flatMap(([c, s]) => ["", `## Companion product: ${s.title} (handle "${c}"; cite as "${c}:F<n>"; journey/range layouts only)`, factLines(s, `${c}:`).split("\n").slice(0, 12).join("\n")]),
    ].join("\n");
    fs.writeFileSync(path.join(runDir, "brief_inputs", `${id}.md`), md);
    match.push({ id, brand: example?.brand || "", ad_type: t.competitor_types[0], product_handle: h, product_title: sheet.title, template_id: t.id, template_name: t.name, risk: r.risk, match_method: "archetype skill" });
    console.log(`${id}: #${t.id} ${t.name} [${t.layout}] risk ${r.risk_label}`);
  }
}
fs.writeFileSync(path.join(runDir, "match.json"), JSON.stringify(match, null, 2));
fs.writeFileSync(path.join(runDir, "pool.json"), JSON.stringify(match.map((m) => ({ id: m.id, brand: m.brand, days_running: "", format: "", image_file: "" })), null, 2));
console.log(`${match.length} brief inputs`);
