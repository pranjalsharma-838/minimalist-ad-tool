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
// Statics only (user rule 2026-10-04): video ads are never a reference or a blend source; carousels are static cards.
const ads = loadAds().filter((a) => a.format !== "video");

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

// Add-on (a) 2026-10-03: blend, don't copy — each concept gets 3 proven competitor winners (30+ days, different
// brands) for this format, and the writer takes one element from each (hook / layout / proof device).
const rawById = new Map(ads.map((a) => [String(a.id), a]));
const WIN = JSON.parse(fs.readFileSync("research/winners.json", "utf8")).ads.filter((w) => w.winner && rawById.has(String(w.id)));
function blendRefs(t) {
  const prim = WIN.filter((w) => w.template_id === t.id), sec = WIN.filter((w) => (w.secondary_template_ids || []).includes(t.id));
  const fam = WIN.filter((w) => TEMPLATES.find((x) => x.id === w.template_id)?.family === t.family);
  const out = [], brands = new Set();
  for (const w of [...prim, ...sec, ...fam].sort((a, b) => (prim.includes(b) - prim.includes(a)) || b.days_running - a.days_running)) {
    if (out.length >= 3) break;
    if (brands.has(w.brand) || out.includes(w)) continue;
    brands.add(w.brand); out.push(w);
  }
  return out;
}
// Add-ons (a) balancing + (d) situation-first: angles are spread evenly across the run (least-used first,
// among the angles this product's facts can support). Offer formats are always "offer_value".
const ANGLES = {
  situation: "Situation-first: open on a real moment where the product fits (e.g. morning rush before work, commute in sun, humid day, before makeup, night routine, gym/sweat). The situation must match the page's usage facts and must not imply a result the page doesn't state.",
  concern_solved: "Concern solved: name a common cosmetic concern customers voice (sticky feel, heavy texture, white cast, greasiness, complicated routines) and answer it ONLY with a page fact that addresses it. Never name a competitor; no medical conditions.",
  ingredient_science: "Ingredient science: lead with the active and its strength as stated on the page; explain what it is, not what it cures.",
  social_proof: "Social proof: lead with the real rating (RATING, verbatim, never rounded) and/or one verbatim verified review (REV*).",
  routine: "Routine: where the product sits in a simple AM/PM routine (companion products allowed in journey/range layouts).",
  sensorial: "Texture / sensorial: how it feels and absorbs, from the page's texture/usage facts only.",
};
const CL = fs.existsSync("research/customer_language.json") ? JSON.parse(fs.readFileSync("research/customer_language.json", "utf8")) : null;
const angleUsed = Object.fromEntries(Object.keys(ANGLES).map((k) => [k, 0]));
// Angle-matrix fill (user request 2026-10-03: one ad per angle per product). The transformation journey is an
// angle of its own (progress frames), used only when requested via PAIRS (never auto-balanced). Formats that show
// people use AI-generated people: the brief describes the person scene (no product, no text), sets
// ai_label_required, and the real pack shot is composited beside the person.
ANGLES.transformation = "Transformation journey (Progress / timeline): 3 progress frames of the same AI-illustrated skin area. Frame labels may ONLY use timeframes and outcomes stated in the page's own study lines (cite them); if the page has no timed study, label frames by routine stage (e.g. 'Day 1 · first use', 'Week 2 · daily habit', 'Week 4 · still in the routine') with NO result wording. Set ai_label_required: true; risk is Severe (AI-illustrated results; not exportable until real study photos replace the frames). Put a one-paragraph description of the 3 frames in frames_prompt (same person, same framing; no product, no text).";
// People pack (user review 2026-10-03: too few lifestyle / human-usage / journey images; cast Indian men and women).
ANGLES.lifestyle = "Lifestyle: an Indian person in a real, everyday Indian setting where the product fits their day (getting ready for work, a commute, after a run, an evening at home). The headline speaks to that moment; claims stay strictly to page facts. Nothing implies a skin result.";
ANGLES.human_usage = "Human usage: show the product being used — fingertips applying it, holding it, mid-routine — by an Indian person. The copy explains how it's used, from the page's usage facts only.";
ANGLES.routine_journey = "Routine journey: 3 frames of the SAME Indian person going through their routine in order (e.g. 'Step 1 · Cleanse', 'Step 2 · 2-3 drops', 'Step 3 · SPF in the morning'). Use layout \"timeline\" with those 3 frame labels from the page's usage facts. This shows a routine, NOT a result: no before/after, no time-to-result labels, no visible skin change. Set ai_label_required: true and put a one-paragraph description of the 3 frames in frames_prompt (same person, same light, the routine actions only; no product, bottle or packaging; no text).";
// Us vs Them (user review 2026-10-04: "us vs them is missing"; Minimalist's own Amazon gallery has a "vs Other
// Vitamin C Serums" table). Requested via PAIRS only.
ANGLES.comparison = "Us vs Them (layout \"usvsthem\"): compare THIS product with a 'them' that the product page itself names — a benchmark product in a published test, another form of the ingredient, or the ingredient used alone. Every row cites the page fact behind both sides; the footnote states the basis (what was compared, how, source). If the page names no comparison, compare TRANSPARENCY instead: what this pack states (the active's strength, a published lab result) vs a label type that doesn't state it — 'them' is then a label type, never a brand, and the footnote says so. Never name or picture another brand, never say others hide, fake or harm, never use 'other brands' or 'competitors'. Lean: 1–3 rows, values of 1–3 words.";
const PERSON_FORMAT = (t) => /REAL PHOTO:(people|endorser)/.test(t.source);
const PERSON_NOTE = "This format shows a PERSON. The person image will be AI-generated and carry the visible AI-GENERATED — ILLUSTRATIVE mark: set ai_label_required: true. Describe the person scene in person_prompt (an adult in the moment the angle names — e.g. morning bathroom counter, commute in sun, fingertips applying a few drops — with NO product, bottle or packaging in their hands or in frame, no text, no brand names, no visible skin-result claims). The real pack shot is composited beside the person by code.";
const PAIRS = process.env.PAIRS ? JSON.parse(fs.readFileSync(process.env.PAIRS, "utf8")) : null;
function pickAngle(t, sheet) {
  // Bug fix (2026-10-03): families are named "Commercial" etc., so `family === "offer"` never matched and offer
  // formats were given (and counted as) a non-offer angle. Offer = the offer / price-comparison layouts.
  if (["offer", "pricecompare"].includes(t.layout)) return "offer_value";
  const has = (k) => sheet.facts.some((f) => f.kind === k);
  const ok = Object.keys(ANGLES).filter((a) => !["transformation", "lifestyle", "human_usage", "routine_journey", "comparison"].includes(a) && (a !== "social_proof" || has("rating") || has("review")));
  const a = ok.sort((x, y) => angleUsed[x] - angleUsed[y])[0];
  angleUsed[a]++;
  return a;
}

const match = [];
const used = {};
for (const h of PAIRS ? [...new Set(PAIRS.map((p) => p.handle))] : handles) {
  const sheet = await sheetFor(h);
  const pick = rankArchetypes({ product_handle: h, sheet, objective: "sales", top: Number(per), used });
  // PAIRS mode: exactly the requested (product, format, angle) cells; otherwise the archetype shortlist.
  const myPairs = PAIRS ? PAIRS.filter((p) => p.handle === h) : null;
  const chosen = myPairs ? myPairs.map((p) => ({ ...pick.full_ranking.find((r) => r.id === p.template_id), forcedAngle: p.angle, forcePerson: Boolean(p.person), casting: p.casting || "" })) : pick.shortlist;
  for (const r of chosen) used[r.id] = (used[r.id] || 0) + 1;
  for (const r of chosen) {
    const t = TEMPLATES.find((x) => x.id === r.id);
    const id = `${h}__t${r.id}`;
    const refs = blendRefs(t);
    const example = refs.length ? rawById.get(String(refs[0].id)) : ads.filter((a) => t.competitor_types.includes(a.ad_type)).sort((a, b) => b.days_running - a.days_running)[0];
    const angle = r.forcedAngle || pickAngle(t, sheet);
    const refBlock = refs.map((w, i) => { const a = rawById.get(String(w.id)) || {}; return `${"ABC"[i]}. ${w.brand} · ${w.days_running} days · id ${w.id} · #${w.template_id} ${w.template_name}\n   What it is: ${w.one_line}\n   Headline: ${a.headline || ""} | On image: ${(a.on_image_text || "").slice(0, 160)}`; }).join("\n");
    const comps = [];
    for (const c of COMPANIONS.filter((c) => c !== h)) comps.push([c, await sheetFor(c)]);
    const md = [
      `# Brief input — ${id}`,
      `source_ad_id: ${id}`,
      `Format (from the archetype skill): #${t.id} ${t.name} · family ${t.family} · layout "${t.layout}" (if "new", use the closest built layout and describe the intended design in layout_description) · image source ${t.source}`,
      `Why chosen: ${r.why}`,
      `Risk: ${r.risk_label} — ${r.risk_note}${r.suggestions.length ? " · " + r.suggestions.join(" ") : ""}`,
      "",
      refs.length > 1 ? "## Blend these proven competitor winners (structure only, never their wording)" : "## Reference competitor ad for this format (structure only, never its wording)",
      refs.length > 1 ? `${refBlock}\nBlend rule: take ONE element from each — e.g. the hook device from one, the layout/visual arrangement from another, the proof device from the third. The concept must not match any single reference. Record it in "blend_sources": [{"id","brand","took"}].` : example ? `${example.brand} · ${example.days_running} days · ${example.ad_type}\nHeadline: ${example.headline || ""}\nText: ${(example.primary_text || "").slice(0, 400)}\nOn image: ${example.on_image_text || ""}\nVisual: ${example.visual_notes || ""}` : "(none)",
      "",
      `## Angle (balanced across the run): ${angle}`,
      ...(angle === "concern_solved" && CL?.concern_map?.[h] ? ["Concerns customers raise for this product type (real reviews; scripts/mine_customer_language.js). Use ONLY a concern that has an 'answered by' fact, cite that fact, and you may echo the customer's words (not quoted as a testimonial):", ...CL.concern_map[h].filter((c) => c.answered_by).slice(0, 4).map((c) => `- ${c.concern.replace(/_/g, " ")}: competitors ${c.competitor_mentions} mentions (${c.competitor_in_negative} in ≤3★) · answered by ${c.answered_by.id} "${c.answered_by.text.slice(0, 120)}" · customer words: ${c.customer_phrases.slice(0, 2).join(" / ").slice(0, 220)}`)] : []),
      angle === "offer_value" ? "Offer-led: quote the live offer (OFFER*) exactly with sale price + MRP (PRICE*); footnote with capture date, 'T&C apply' and any free item's condition; no urgency words unless an end date is captured." : ANGLES[angle],
      ...(PERSON_FORMAT(t) || r.forcePerson ? ["", PERSON_NOTE] : []),
      ...(r.casting ? [`Casting (use exactly this person in person_prompt / frames_prompt): ${r.casting}. Respectful, everyday styling; natural Indian skin tones and texture; no fairness or lightening cues.`] : []),
      `Record "angle": "${angle}" in the brief, and "hook_type": one of question | stat | situation | offer | social_proof | contrast | ingredient | statement (the device the headline opens with — used to score our own results by hook).`,
      "",
      "## Social proof (automatic where it fits)",
      sheet.facts.some((f) => f.kind === "rating") ? "If the layout has a badge, footnote or CTA-band slot, add the RATING fact verbatim (e.g. \"4.0★ from 1,491 reviews\") citing RATING — never round up, never 'top rated'. Quote a REV* review only in review/social-proof layouts or when the angle is social_proof; quote exactly (trim with … only), with name + 'verified buyer'." : "No rating captured for this product — no social proof.",
      "",
      `## Product facts: ${sheet.title} (main product, handle "${h}")`,
      `Hero shown by the layout: ${sheet.actives.map((a) => (a.name === "SPF" ? `SPF ${a.pct}` : `${a.pct} ${a.name}`)).join(", ") || "(none)"}`,
      factLines(sheet),
      ...comps.flatMap(([c, s]) => ["", `## Companion product: ${s.title} (handle "${c}"; cite as "${c}:F<n>"; journey/range layouts only)`, factLines(s, `${c}:`).split("\n").slice(0, 12).join("\n")]),
    ].join("\n");
    fs.writeFileSync(path.join(runDir, "brief_inputs", `${id}.md`), md);
    match.push({ id, brand: example?.brand || "", ad_type: t.competitor_types[0], product_handle: h, product_title: sheet.title, template_id: t.id, template_name: t.name, risk: r.risk, match_method: "archetype skill", angle, blend_refs: refs.map((w) => `${w.brand} ${w.id} (${w.days_running}d)`) });
    console.log(`${id}: #${t.id} ${t.name} [${t.layout}] risk ${r.risk_label}`);
  }
}
fs.writeFileSync(path.join(runDir, "match.json"), JSON.stringify(match, null, 2));
fs.writeFileSync(path.join(runDir, "pool.json"), JSON.stringify(match.map((m) => ({ id: m.id, brand: m.brand, days_running: "", format: "", image_file: "" })), null, 2));
console.log(`${match.length} brief inputs`);
