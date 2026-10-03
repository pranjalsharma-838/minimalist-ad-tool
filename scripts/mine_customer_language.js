// Add-on (f) + concern angle — mine customer language from reviews (script, no model tokens).
// Inputs: brand_packs/minimalist/raw/reviews_*.json (Minimalist website, Yotpo) and
//         research/marketplace_reviews_*.json (Amazon.in competitors + own listing; Flipkart where captured).
// For each SKU type: which cosmetic concerns customers raise (lexicon below, English + common Hinglish), how often
// for competitors vs Minimalist, verbatim customer phrases (the sentence around the match), and — the concern
// angle — which Minimalist page fact answers each concern (only if the page states it; no fact = no ad angle).
// Output: research/customer_language.json + research/customer_language.md. The pipeline reads concern_map per
// product for the "concern_solved" angle.
// Usage: node scripts/mine_customer_language.js
import fs from "node:fs";

const CONCERNS = {
  white_cast: { rx: /white ?cast|white ?layer|white ?patch|chalky|ashy|safed/i, fix: /no white cast|without (a |any )?white cast|zero white cast|leaves no (white )?cast/i },
  sticky_greasy: { rx: /sticky|greasy|oily (feel|finish|after)|chipchip|chip chip|heavy on (the )?skin|tacky/i, fix: /non[- ]?sticky|non[- ]?greasy|lightweight|light ?weight|light texture|absorbs (quickly|fast|easily)|quick[- ]absorb|matte finish|weightless/i },
  breakouts: { rx: /break ?outs?|broke out|pimples? (came|increased|more)|clogg|comedog|daane/i, fix: /non[- ]?comedogenic|won'?t clog|does not clog|doesn'?t clog/i },
  irritation: { rx: /burn(ing|s)?|sting(ing|s)?|itch(y|ing)?|irritat|redness|rash|jalan|khujli/i, fix: /fragrance[- ]free|gentle|for sensitive skin|suitable for sensitive|patch tested|dermatologically tested|soothing/i },
  fragrance: { rx: /smell|fragrance|odou?r|perfume|scent|badboo/i, fix: /fragrance[- ]free|unscented|no (added )?fragrance/i },
  pilling: { rx: /pill(ing|s)|balls? up|flak(e|ing)|rolls? off/i, fix: /layers well|under makeup|makeup[- ]friendly|works under/i },
  dryness: { rx: /dry(ness)?|tight(ness)?|flaky|stretch(y|es)/i, fix: /hydrat|moisturi[sz]|ceramide|hyaluronic|barrier|humectant/i },
  eye_sting_sweat: { rx: /eyes? (water|burn|sting)|sweat(ing|y)?|melts?|runs? (into|in) (the )?eyes/i, fix: /sweat[- ]resistant|water[- ]resistant|does not run|non[- ]greasy/i },
  slow_results: { rx: /no (results?|difference|change)|didn'?t (see|notice|work)|not working|no effect|waste/i, fix: null },
  price_value: { rx: /expensive|costly|overpriced|price is high|mehenga|value for money|worth (the|it)/i, fix: /affordable|value|honest pricing|price/i },
  packaging: { rx: /leak|broken|dropper|pump (not|doesn'?t)|spill|packag(ing|e) (was |is )?(bad|poor|damaged)|seal/i, fix: /dropper|pump|airless|seal/i },
  texture: { rx: /texture|consistency|runny|watery|thick|spreads?/i, fix: /texture|spreads (easily|well)|light|gel|fluid|cream/i },
};
const sentenceAround = (t, i) => { const s = t.lastIndexOf(".", i) + 1, e = t.indexOf(".", i); return t.slice(s, e < 0 ? undefined : e + 1).trim().slice(0, 200); };
const latest = (dir, rx) => { const f = fs.existsSync(dir) ? fs.readdirSync(dir).filter((x) => rx.test(x)).sort().pop() : null; return f ? JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8")) : null; };
const yotpo = latest("brand_packs/minimalist/raw", /^reviews_.*\.json$/);
const market = latest("research", /^marketplace_reviews_.*\.json$/);
const facts = {};
for (const run of fs.readdirSync("pipeline/runs")) {
  const d = `pipeline/runs/${run}/products`;
  if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) facts[f.replace(/\.json$/, "")] = JSON.parse(fs.readFileSync(`${d}/${f}`, "utf8"));
}
const byType = {};
function add(type, side, r, src) {
  const T = (byType[type] ||= { competitor: { n: 0, neg: 0, concerns: {} }, own: { n: 0, neg: 0, concerns: {} } })[side];
  T.n++;
  const neg = r.stars != null && r.stars <= 3;
  if (neg) T.neg++;
  const text = `${r.title ? r.title + ". " : ""}${r.text}`;
  for (const [k, c] of Object.entries(CONCERNS)) {
    const m = text.match(c.rx);
    if (!m) continue;
    const g = (T.concerns[k] ||= { mentions: 0, in_negative: 0, phrases: [] });
    g.mentions++;
    if (neg) g.in_negative++;
    if (g.phrases.length < 6) g.phrases.push(`"${sentenceAround(text, m.index)}" (${src}${r.stars ? `, ${r.stars}★` : ""})`);
  }
}
for (const t of market?.types || []) {
  for (const c of t.competitors) for (const r of c.reviews) add(t.type, "competitor", r, `Amazon.in · ${c.brand || c.asin}`);
  if (t.own) for (const r of t.own.reviews) add(t.type, "own", r, "Amazon.in · Minimalist");
  for (const r of t.flipkart?.reviews || []) add(t.type, "own", r, "Flipkart · Minimalist");
}
const TYPES = [["multi-vitamin-spf-50", "sunscreen"], ["niacinamide-10-with-matmarine", "niacinamide serum"], ["salicylic-acid-2", "salicylic acid serum"], ["vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1", "vitamin c serum"], ["vitamin-b5-10-moisturizer", "moisturizer"], ["salicylic-lha-2-cleanser", "face wash / cleanser"], ["alpha-arbutin-2", "pigmentation serum"]];
for (const [h, type] of TYPES) for (const r of yotpo?.products?.[h]?.reviews || []) add(type, "own", r, "beminimalist.co");

// Concern map: concern → the product-page fact that answers it (exact page wording), per product.
const concernMap = {};
for (const [h, type] of TYPES) {
  const sheet = facts[h];
  const T = byType[type];
  if (!sheet || !T) continue;
  concernMap[h] = Object.entries(CONCERNS).map(([k, c]) => {
    const comp = T.competitor.concerns[k], own = T.own.concerns[k];
    const fact = c.fix ? sheet.facts.find((f) => !["review", "rating", "price", "offer", "testimonial"].includes(f.kind) && c.fix.test(f.text)) : null;
    return { concern: k, competitor_mentions: comp?.mentions || 0, competitor_in_negative: comp?.in_negative || 0, own_mentions: own?.mentions || 0, own_in_negative: own?.in_negative || 0, answered_by: fact ? { id: fact.id, text: fact.text.slice(0, 200) } : null, customer_phrases: [...(comp?.phrases || []).slice(0, 3), ...(own?.phrases || []).slice(0, 2)] };
  }).filter((x) => x.competitor_mentions + x.own_mentions > 0).sort((a, b) => (b.answered_by ? 1 : 0) - (a.answered_by ? 1 : 0) || b.competitor_in_negative - a.competitor_in_negative);
}
fs.writeFileSync("research/customer_language.json", JSON.stringify({ built: new Date().toISOString().slice(0, 10), sources: { yotpo: yotpo?.captured_at || null, marketplace: market?.captured_at || null }, by_type: byType, concern_map: concernMap }, null, 2));
const md = ["# Customer language & concern map", "", "Built from real reviews: Minimalist website (Yotpo), Amazon.in (best-seller competitors + Minimalist's own listing), Flipkart where captured. Nykaa blocks scripts (not included).", "A concern becomes an ad angle ONLY where the Minimalist product page states a fact that answers it (\"answered by\"). Competitors are never named in ads; concerns stay cosmetic.", ""];
for (const [h, rows] of Object.entries(concernMap)) {
  md.push(`## ${facts[h]?.title || h}`, "", "| Concern | Competitor mentions (in ≤3★) | Our mentions (in ≤3★) | Answered by our page | Customer words |", "|---|---|---|---|---|");
  for (const r of rows.slice(0, 8)) md.push(`| ${r.concern.replace(/_/g, " ")} | ${r.competitor_mentions} (${r.competitor_in_negative}) | ${r.own_mentions} (${r.own_in_negative}) | ${r.answered_by ? `${r.answered_by.id}: ${r.answered_by.text.slice(0, 70).replace(/\|/g, "/")}` : "—"} | ${(r.customer_phrases[0] || "").slice(0, 110).replace(/\|/g, "/")} |`);
  md.push("");
}
fs.writeFileSync("research/customer_language.md", md.join("\n"));
console.log(Object.entries(concernMap).map(([h, r]) => `${h}: ${r.length} concerns, ${r.filter((x) => x.answered_by).length} answered by a page fact`).join("\n"));
