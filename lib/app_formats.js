// The app's formats (user, 2026-10-05: "when ads are rendered for a product I don't see all the formats, many are not even
// clickable"). One entry per renderer layout the app can fill, each tied to the templates of the same 48-format catalog
// (config/templates.json) and ranked by the same archetype scoring the library uses (lib/archetype.js).
//
// Every format is built as a library-shaped BRIEF and drawn / scored through lib/brief_check.js specFromBrief +
// adFromBrief and public/render.js LAYOUTS, exactly like pipeline/08_compose.js, so the app and the library can't drift.
//
// Three outcomes per format:
//  - ready        every line comes from the product page, the captured offers / prices / reviews, or the cited copy;
//  - needs input  the format fits, but a line or a photo is missing. It still opens: the draft shows [placeholders] and
//                 says exactly what to supply (typed lines, an AI draft with citations when a key is set, a real photo);
//  - not shown    the product can't fill it honestly (no study number, no review, no FAQ ...): listed with the reason.
// Nothing is invented: placeholders are never scored, typed lines are flagged as unsourced, people / skin photos carry
// the AI mark and Severe risk exactly like the library (08_compose.js, lib/risk.js).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rankArchetypes } from "./archetype.js";
import { specFromBrief, adFromBrief, checkBrief } from "./brief_check.js";
import { goodReviews } from "./reviews.js";
import { LABEL, worst, SOURCE_RISK } from "./risk.js";
import { wrap, measure, layoutProblems } from "../public/render.js";
import { handleOf, sitewideOffers, pricesOf } from "./live_facts.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(path.join(root, p), "utf8")); } catch { return d; } };
const ACCENT = readJson("brand_packs/minimalist/assets/accent_colours.json", {});
const TOP = readJson("brand_packs/minimalist/raw/top20.json", []);
const WEBSITE = readJson("brand_packs/minimalist/raw/website.json", { products: [] }).products || [];

// The asset index changes while the app runs (verified AI renders are being added), so it is re-read when it changes.
let assetCache = { mtime: 0, assets: [] };
export function assets() {
  const f = path.join(root, "brand_packs/minimalist/assets/index.json");
  try {
    const m = fs.statSync(f).mtimeMs;
    if (m !== assetCache.mtime) assetCache = { mtime: m, assets: JSON.parse(fs.readFileSync(f, "utf8")).assets || [] };
  } catch { /* keep the last good copy */ }
  return assetCache.assets;
}
const exists = (rel) => Boolean(rel) && fs.existsSync(path.join(root, rel));

// The product visual, from disk when the asset library has one (user, 2026-10-05: "pick if the asset for that product
// exists, like the cutout, to cut user query time"), in this order: the cut-out of a verified AI master render of the
// real pack (asset index "preferred": true + "cutout"); else any clean cut-out (same rule as 08_compose.js); else the
// accepted master render itself (assets/ai_renders/<handle>/verification.json, approved); else the page photo.
// Returns { file (local, relative) | url (page image), cutout, source }.
export function packVisual(handle, sheet) {
  if (handle) {
    const pref = assets().find((a) => a.product_handle === handle && a.preferred && a.cutout && exists(a.cutout) && !/unusable/i.test(`${a.cutout_status || ""}`));
    if (pref) return { file: pref.cutout, cutout: true, source: "verified master render (cut-out)" };
    const cut = assets().find((a) => a.product_handle === handle && a.cutout && exists(a.cutout) && !/unusable/i.test(`${a.cutout_status || ""} ${a.notes || ""}`));
    if (cut) return { file: cut.cutout, cutout: true, source: "brand pack shot (cut-out)" };
    const ver = readJson(`brand_packs/minimalist/assets/ai_renders/${handle}/verification.json`, null);
    if (ver?.accepted && /approved/i.test(ver.status || "") && exists(`brand_packs/minimalist/assets/ai_renders/${handle}/${ver.accepted}`)) return { file: `brand_packs/minimalist/assets/ai_renders/${handle}/${ver.accepted}`, cutout: false, source: "verified master render" };
  }
  const url = sheet?.images?.[0] || "";
  return url ? { url, cutout: false, source: "product page photo" } : null;
}
// Where the browser loads it from (same origin, so PNG export works).
export const visualSrc = (handle, v) => (!v ? "" : v.file ? `/api/pack?handle=${encodeURIComponent(handle)}` : v.url);

// A real texture / close-up photo in the asset library (never generated).
export const textureOf = (sheet) => assets().find((a) => ["texture", "macro"].includes(a.type) && a.product_handle === handleOf(sheet) && exists(a.file)) || null;

// ---------- page-fact pickers (unchanged rules from the 2026-10-04 app) ----------
const NOT_CITABLE = new Set(["testimonial", "faq", "inci"]);
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
const isLabelLine = (t) => /^[^:]{2,30}:\s/.test(t);
const nameFact = (sheet) => sheet.facts.find((f) => f.kind === "name")?.id || sheet.facts[0]?.id;
export const lockedActives = (sheet) => (sheet.actives || []).filter((a) => a.pct).slice(0, 3);
// Badges are proof points short enough for a pill (≤ 6 words); page label lines read as specs, never badges.
export const badgesOf = (copy) => (copy.proof_points || []).filter((p) => words(p) <= 6 && p.length <= 44 && !isLabelLine(p)).slice(0, 2);
export function pickStat(sheet) {
  for (const f of sheet.facts) {
    if (f.kind !== "study") continue;
    const m = f.text.match(/^(\d{1,3}(?:\.\d+)?%)\s+(.{8,110})$/);
    if (m) return { value: m[1], label: m[2].replace(/\.$/, ""), id: f.id, section: f.section };
  }
  return null;
}
const fitsCard = (q) => wrap(`“${q}”`, Math.round(32 * 0.7), 440, 0.52).length <= 6;
const cardFits = (sheet, quote, stars, source) => fitsCard(quote) && measure({ layout: "review", headline: sheet.title, review: { stars, quote, source }, footnote: "Results vary: one customer's experience.", cta: "Shop now" }).fits;
export function pickQuote(sheet) {
  const rv = goodReviews(handleOf(sheet));
  const r = rv.reviews.find((x) => cardFits(sheet, x.text.trim(), x.stars, `${x.name}, verified buyer, ${x.stars}★, ${x.date} (beminimalist.co, captured ${rv.day})`));
  if (r) return { quote: r.text.trim(), name: r.name, stars: r.stars, date: r.date, id: `REV:${r.name}:${r.date}`, verified: true, day: rv.day };
  for (const f of sheet.facts) {
    if (f.kind !== "testimonial") continue;
    const sig = f.text.trim().match(/^([\s\S]*?)["”]?\s+[-–—]\s*([A-Z][a-z]+(?:\s[A-Z]\.?)?)\.?["”]?\s*$/);
    const quote = (sig ? sig[1] : f.text).trim().replace(/^["“]\s*/, "").replace(/["”]\s*$/, "").trim();
    if (quote && cardFits(sheet, quote, 0, "customer quote on the product page")) return { quote, name: sig ? sig[2] : "", id: f.id };
  }
  return null;
}
const strengthOf = (a) => (a.name === "SPF" ? `SPF ${a.pct.replace(/%$/, "")}` : `${a.pct} ${a.name}`);
export const questionOf = (sheet) => { const a = lockedActives(sheet)[0]; return a ? `What does ${strengthOf(a)} do?` : ""; };

// "Label: value" page lines (Skin type, Concerns, Suitable for, When to use ...), verbatim.
const labelRows = (sheet, max = 70) => sheet.facts.filter((f) => ["suitability", "usage"].includes(f.kind)).map((f) => ({ m: f.text.match(/^([^:]{2,30}):\s*(.+)$/), f })).filter((x) => x.m && x.m[2].length <= max).map(({ m, f }) => ({ label: m[1].trim(), value: m[2].trim(), cites: [f.id] }));
// Short brand-written claims, word for word (no cutting: a cut sentence can change its meaning).
const shortClaims = (sheet, max) => sheet.facts.filter((f) => f.kind === "claim" && f.text.length <= max && !isLabelLine(f.text));

// Product category (routine slot, range siblings): the top-20 list, else the product name.
const CAT_WORD = { cleanser: "cleanser", serum: "serum", moisturizer: "moisturiser", sunscreen: "sunscreen", toner: "toner", exfoliant: "exfoliant", eye: "eye cream", hair: "hair serum" };
export function categoryOf(handle, title = "") {
  const t = TOP.find((x) => x.handle === handle);
  if (t) return t.format;
  const s = String(title).toLowerCase();
  return /hair/.test(s) ? "hair" : /cleanser|face wash|body wash/.test(s) ? "cleanser" : /spf|sunscreen/.test(s) ? "sunscreen" : /toner/.test(s) ? "toner" : /eye/.test(s) ? "eye" : /moisturi[sz]er|cream/.test(s) ? "moisturizer" : /serum/.test(s) ? "serum" : "";
}
// Another of our products, from the captured website pages (read-only), with its pack visual.
function companion(h) {
  const p = WEBSITE.find((x) => x.handle === h);
  if (!p) return null;
  return { url: p.url, title: p.title, actives: p.actives || [], facts: p.facts || [], images: [] };
}
// A short label for a product in a range: its own tagline (≤ 40 characters), else its "Concerns:" / "Skin type:" line.
function shortLabel(sh) {
  const tag = sh.facts.find((f) => f.kind === "claim" && /tagline/i.test(f.section) && f.text.length <= 40);
  if (tag) return { label: tag.text, id: tag.id };
  const row = labelRows(sh, 40).find((r) => /concern|skin type/i.test(r.label));
  return row ? { label: `${row.label}: ${row.value}`.length <= 40 ? `${row.label}: ${row.value}` : row.value, id: row.cites[0] } : null;
}

// ---------- the formats ----------
// templates: catalog ids this app format draws (the best-ranked one names it). person: a people photo is part of it.
export const FORMATS = [
  { id: "hero", label: "Product hero", layout: "hero", templates: [1, 5, 34, 4, 6, 40, 42, 43, 48] },
  { id: "badges", label: "Benefit badges", layout: "badges", templates: [2], ai: true },
  { id: "actives", label: "Ingredient focus", layout: "actives", templates: [3, 23] },
  { id: "stat", label: "Study result", layout: "stat", templates: [25] },
  { id: "review", label: "Customer quote", layout: "review", templates: [26] },
  { id: "question", label: "Question and answer", layout: "question", templates: [35] },
  { id: "texture", label: "Texture or close-up photo", layout: "texture", templates: [21, 20] },
  { id: "offer", label: "Offer", layout: "offer", templates: [36] },
  { id: "pricecompare", label: "Price", layout: "pricecompare", templates: [37] },
  { id: "range", label: "Range or bundle", layout: "range", templates: [38, 39, 46] },
  { id: "journey", label: "Routine steps", layout: "journey", templates: [22] },
  { id: "spec", label: "Spec sheet", layout: "spec", templates: [24] },
  { id: "callouts", label: "Callouts", layout: "callouts", templates: [15], ai: true },
  { id: "socialproof", label: "Star rating", layout: "socialproof", templates: [28] },
  { id: "faq", label: "FAQ", layout: "faq", templates: [32], ai: true },
  { id: "native", label: "Native post", layout: "native", templates: [33] },
  { id: "thisvsthat", label: "This vs that", layout: "thisvsthat", templates: [19], ai: true },
  { id: "oldnew", label: "Old way / new way", layout: "oldnew", templates: [18], ai: true },
  { id: "usvsthem", label: "Us vs them", layout: "usvsthem", templates: [17], ai: true },
  { id: "person", label: "With a person", layout: "hero", templates: [7, 8, 9, 41, 11], person: true },
  { id: "creator", label: "Creator post", layout: "native", templates: [30, 31], person: true },
  { id: "before_after", label: "Before / after", layout: "before_after", templates: [12], person: true },
];
// Catalog formats the app doesn't draw, and why (the library pipeline covers some of them).
export const NOT_IN_APP = [
  { templates: [10, 13, 14, 16], why: "need AI-made skin or result frames (library pipeline only, Severe)" },
  { templates: [27, 29, 44, 47], why: "no layout built yet (a designer works from the library brief)" },
  { templates: [45], why: "needs a real unboxing photo without printed copy" },
];

const P = (s) => `[${s}]`;
const isPh = (s) => typeof s === "string" && /^\[[^\]]*\]$/.test(s.trim());
// Placeholders are drawn so the slot is visible, but never scored.
function stripPlaceholders(v) {
  if (typeof v === "string") return isPh(v) ? "" : v;
  if (Array.isArray(v)) return v.map(stripPlaceholders).filter((x) => !(x === "" || (x && typeof x === "object" && !Array.isArray(x) && Object.values(x).every((y) => y === "" || y == null || Array.isArray(y)))));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, stripPlaceholders(x)]));
  return v;
}

// A line the user typed, or an AI-drafted line whose citations still check out against the page.
function citesOk(text, cites, sheet) {
  if (!cites?.length) return false;
  const h = "_main";
  return checkBrief({ layout: "hero", headline: text, citations: { headline: cites } }, { [h]: sheet }, h).length === 0;
}

function base(copy, layout, keepSub) {
  return {
    layout, headline: copy.headline, subhead: keepSub ? copy.subhead : "", caption: keepSub ? "" : copy.subhead,
    proof_points: copy.proof_points || [], footnote: copy.footnote, cta: copy.cta, citations: copy.citations || {},
  };
}
const cap = (...xs) => xs.filter(Boolean).join(" ");

// Each builder returns { brief, sheets?, fields?, photos?, missing[], notes[], notFit? }.
// ctx: { copy, sheet, h, v (typed / drafted values), c (their citations), photos (flags), field(key, auto, label, extra) }
const BUILD = {
  hero: ({ copy }) => ({ brief: base(copy, "hero", true) }),
  native: ({ copy }) => ({ brief: base(copy, "native", true) }),
  person: ({ copy, photos }) => ({ brief: { ...base(copy, "hero", true), ai_label_required: Boolean(photos.person) }, photos: [{ key: "person", label: "Photo of a person with the product (the product itself is composited, never drawn)" }], missing: photos.person ? [] : ["a photo of a person (upload it below)"] }),
  creator: ({ copy, photos }) => ({ brief: { ...base(copy, "native", true), ai_label_required: Boolean(photos.person) }, photos: [{ key: "person", label: "Creator photo (portrait, no product in it)" }], missing: photos.person ? [] : ["a creator photo (upload it below)"] }),
  before_after: ({ copy, photos }) => ({
    brief: { ...base(copy, "before_after", false), ai_label_required: Boolean(photos.before && photos.after) },
    photos: [{ key: "before", label: "Before photo (real, unretouched study photo)" }, { key: "after", label: "After photo (same person, light and angle)" }],
    missing: [photos.before ? "" : "the before photo", photos.after ? "" : "the after photo"].filter(Boolean),
  }),

  badges: ({ copy, field, sheet }) => {
    const auto = badgesOf(copy);
    const cit = (t) => { const i = (copy.proof_points || []).indexOf(t); return i >= 0 ? (copy.citations?.proof_points || [])[i] : null; };
    const b = [field("b1", auto[0], "Badge 1 (up to 6 words)", { max: 44, cites: cit(auto[0]) }), field("b2", auto[1], "Badge 2 (optional)", { max: 44, cites: cit(auto[1]) })];
    const got = b.filter((x) => x.text);
    return { brief: { ...base(copy, "badges", false), badges: got.length ? got.map((x) => ({ text: x.text, cites: x.cites })) : [{ text: P("Badge: up to 6 words from the page") }] }, missing: got.length ? [] : ["at least one short badge line"] };
  },

  actives: ({ copy, sheet }) => {
    const nid = nameFact(sheet);
    const list = lockedActives(sheet).map((a) => ({ pct: a.pct, name: a.name, line: "", cites: [nid] }));
    for (const f of sheet.facts.filter((x) => x.kind === "ingredient_note")) {
      if (list.length >= 2) break;
      const n = f.section.trim();
      if (n.length <= 28 && !list.some((a) => a.name.toLowerCase().includes(n.toLowerCase()) || n.toLowerCase().includes(a.name.toLowerCase()))) list.push({ pct: "", name: n, line: "", cites: [f.id] });
    }
    if (!list.length) return { notFit: "the page names no active ingredient" };
    return { brief: { ...base(copy, "actives", false), actives: list } };
  },

  stat: ({ copy, sheet }) => {
    const st = pickStat(sheet);
    if (!st) return { notFit: "the page has no consumer-study percentage" };
    return { brief: { ...base(copy, "stat", false), stat: { value: st.value, label: st.label, cites: [st.id] }, footnote: "Consumer study result as published on the product page.", caption: cap(copy.subhead, copy.footnote) } };
  },

  review: ({ copy, sheet }) => {
    const q = pickQuote(sheet);
    if (!q) return { notFit: "no verified review or page quote short enough to show in full (a quote is never shortened)" };
    const source = q.verified ? `${q.name}, verified buyer, ${q.stars}★, ${q.date} (beminimalist.co, captured ${q.day})` : `${q.name ? `${q.name}, ` : ""}customer quote on the product page`;
    return { brief: { layout: "review", headline: sheet.title, review: { stars: q.verified ? q.stars : 0, quote: q.quote, source }, footnote: "Results vary: one customer's experience.", caption: cap(copy.headline, copy.subhead, copy.footnote), proof_points: copy.proof_points || [], cta: copy.cta, citations: {} } };
  },

  question: ({ copy, sheet }) => {
    const q = questionOf(sheet);
    if (!q) return { notFit: "no active with its strength in the product name to ask about" };
    return { brief: { ...base(copy, "question", false), headline: q, question: q, answer: copy.headline, question_cites: [nameFact(sheet), ...(copy.citations?.headline || [])] } };
  },

  texture: ({ copy, sheet, photos }) => {
    const lib = textureOf(sheet);
    return {
      brief: base(copy, "texture", false), textureSrc: lib ? `/api/texture?handle=${encodeURIComponent(handleOf(sheet))}` : "",
      photos: lib ? [] : [{ key: "texture", label: "Real photo of this product's texture or a close-up (never AI-made)" }],
      missing: lib || photos.texture ? [] : ["a real texture or close-up photo (none in the asset library for this product; upload one below)"],
      notes: lib ? [`Texture photo from the asset library: ${lib.file.split("/").pop()}.`] : [],
    };
  },

  offer: ({ copy, field, v }) => {
    const offers = sitewideOffers();
    const def = offers.find((o) => o.type === "bogo") || offers.find((o) => o.type === "free_gift") || offers[0];
    const chosen = offers.find((o) => o.id === v.offer_id) || def;
    const own = v.offer_id === "own";
    const line = field("line", own ? "" : chosen?.text, "Offer line (exactly as on the site)", { max: 60, cites: own ? null : chosen && [chosen.id] });
    const cond = field("condition", own ? "" : chosen && "T&C apply.", "Condition shown beside the offer (needed for 'free' / discounts)", { max: 120, cites: own ? null : chosen && [chosen.id] });
    const valid = field("valid_till", own ? "" : chosen?.expiry || "", "Valid till (only if the site states an end date)", { max: 30, cites: own ? null : chosen && [chosen.id] });
    const fields = [{ key: "offer_id", label: "Offer", value: own ? "own" : chosen?.id || "own", options: [...offers.map((o) => ({ value: o.id, label: `${o.text} (captured ${o.day})` })), { value: "own", label: "Type my own offer" }] }];
    const missing = [line.text ? "" : "the offer line", cond.text ? "" : "the offer's condition"].filter(Boolean);
    // The condition carries "T&C apply." on the creative; the capture date goes with the caption (leanBrief).
    const foot = own ? "" : `Offer as on beminimalist.co, captured ${chosen?.day}; ${chosen?.expiry ? chosen.expiry : "no end date shown"}.`;
    return {
      brief: { ...base(copy, "offer", false), offer: { line: line.text || P("Offer, exactly as on the site"), condition: cond.text || P("Condition"), valid_till: valid.text, cites: line.cites || [] }, footnote: foot, caption: cap(copy.subhead, copy.footnote) },
      fieldsBefore: fields, missing,
      notes: own ? ["Typed offers must match the live site; attach the terms page."] : [`Captured on ${chosen?.day} from the beminimalist.co banner (terms: ${chosen?.terms || "site"}). Check it's still live before use.`],
    };
  },

  pricecompare: ({ copy, h }) => {
    const p = pricesOf(h).find((x) => x.mrp && x.mrp > x.price);
    if (!p) return { notFit: "no captured website price below the MRP for this product" };
    const rs = (n) => `₹${n}`;
    return {
      brief: { ...base(copy, "pricecompare", false), prices: [{ label: `MRP, ${p.name}`, value: rs(p.mrp), note: "" }, { label: `On beminimalist.co, ${p.name}`, value: rs(p.price), note: `${p.pct_off_computed}% below MRP · captured ${p.day}` }], caption: cap(copy.subhead, copy.footnote), footnote: `Prices as shown on beminimalist.co on ${p.day}; they may have changed. T&C apply.` },
      notes: [`Prices captured on ${p.day} (${p.id}). Check them on the live page before use.`],
    };
  },

  range: ({ copy, sheet, h }) => {
    const cat = categoryOf(h, sheet.title);
    const sibs = TOP.filter((t) => t.format === cat && t.handle !== h).map((t) => t.handle).filter((x) => companion(x) && packVisual(x)).slice(0, 2);
    if (!cat || !sibs.length) return { notFit: "no other products in this category on file" };
    const sheets = { _main: sheet };
    const items = [];
    const main = shortLabel(sheet);
    if (main) items.push({ product_handle: "_main", handle: h, label: main.label, cites: [main.id] });
    for (const s of sibs) { const c = companion(s), l = shortLabel(c); if (!l) continue; sheets[s] = c; items.push({ product_handle: s, handle: s, label: l.label, cites: [`${s}:${l.id}`] }); }
    if (items.length < 2) return { notFit: "no short page line to label the products with" };
    return { brief: { layout: "range", headline: `Find your ${CAT_WORD[cat] || cat}`, range: items, caption: cap(copy.headline, copy.subhead, copy.footnote), proof_points: copy.proof_points || [], footnote: "", cta: copy.cta, citations: {} }, sheets };
  },

  journey: ({ copy, sheet, h }) => {
    const cat = categoryOf(h, sheet.title);
    if (!cat || cat === "hair") return { notFit: "not part of the face routine on file" };
    const pmOnly = sheet.facts.some((f) => f.kind === "usage" && /when to use:\s*PM\b/i.test(f.text)) && !sheet.facts.some((f) => f.kind === "usage" && /\bAM\b/.test(f.text));
    // The same three products as the library's routine ads (00_product_run.js COMPANIONS); a night-only product ends
    // with a moisturiser instead of sunscreen.
    const CL = "salicylic-lha-2-cleanser", SER = "niacinamide-10-with-matmarine", SPF = "multi-vitamin-spf-50", MOI = "vitamin-b5-10-moisturizer";
    const slots = cat === "cleanser" ? [h, SER, SPF] : cat === "sunscreen" ? [CL, SER, h] : [CL, h, pmOnly && cat !== "moisturizer" ? MOI : SPF];
    const sheets = { _main: sheet };
    const steps = [];
    for (const s of slots) {
      const isMain = s === h, sh = isMain ? sheet : companion(s);
      if (!sh) continue;
      const key = isMain ? "_main" : s;
      sheets[key] = sh;
      const c = categoryOf(isMain ? h : s, sh.title);
      // Each step is its pack, the step word and its active (no line: on the minimal look a step line goes to the caption,
      // and a companion product's tagline there would be a claim this ad never set out to make).
      const nf = nameFact(sh);
      steps.push({ label: `Step ${steps.length + 1} · ${(CAT_WORD[c] || c).replace(/^./, (x) => x.toUpperCase())}`, product_handle: key, handle: isMain ? h : s, cat: CAT_WORD[c] || c, line: "", cites: nf ? [isMain ? nf : `${s}:${nf}`] : [] });
    }
    if (steps.length < 2) return { notFit: "the routine products aren't on file" };
    const cats = steps.map((s) => s.cat);
    const head = `${cats.slice(0, -1).join(", ")}, then ${cats[cats.length - 1]}`.replace(/^./, (x) => x.toUpperCase());
    const when = sheet.facts.find((f) => f.kind === "usage" && /when to use/i.test(f.text));
    return {
      brief: { layout: "journey", headline: head, steps: steps.map(({ cat: _c, handle: _h, ...s }) => s), caption: cap(copy.headline, copy.subhead, when?.text, copy.footnote), proof_points: copy.proof_points || [], footnote: "", cta: copy.cta, citations: {} },
      sheets, stepHandles: steps.map((s) => s.handle),
      notes: pmOnly ? ["This product is for night use (page: \"When to use: PM\"), so the routine ends with a moisturiser, not sunscreen."] : [],
    };
  },

  spec: ({ copy, sheet }) => {
    const rows = [];
    const a = lockedActives(sheet)[0];
    if (a) rows.push({ label: "Active", value: strengthOf(a), cites: [nameFact(sheet)] });
    rows.push(...labelRows(sheet).filter((r) => !/^note$/i.test(r.label)));
    if (rows.length < 2) return { notFit: "the page has too few short label lines (skin type, concerns, when to use)" };
    return { brief: { ...base(copy, "spec", false), specs: rows.slice(0, 3) } };
  },

  callouts: ({ copy, sheet, field }) => {
    const auto = shortClaims(sheet, 60).filter((f) => f.text !== copy.headline).slice(0, 2);
    const c = [field("c1", auto[0]?.text, "Callout 1 (up to 60 characters)", { max: 60, cites: auto[0] && [auto[0].id] }), field("c2", auto[1]?.text, "Callout 2 (up to 60 characters)", { max: 60, cites: auto[1] && [auto[1].id] })];
    return { brief: { ...base(copy, "callouts", false), callouts: c.map((x, i) => ({ text: x.text || P(`Callout ${i + 1}: a short page fact`), cites: x.cites || [] })) }, missing: c.filter((x) => !x.text).map((_, i) => `callout line ${i + 1}`) };
  },

  socialproof: ({ copy, h }) => {
    const rv = goodReviews(h);
    if (!rv.average) return { notFit: "no star rating captured for this product" };
    return { brief: { ...base(copy, "socialproof", false), proof: { value: `${rv.average}/5`, label: `stars, from ${rv.total.toLocaleString("en-IN")} reviews`, source: `beminimalist.co reviews, captured ${rv.day}` }, citations: { ...(copy.citations || {}) } }, notes: [`Rating exactly as captured on ${rv.day} (never rounded). Check it on the live page before use.`] };
  },

  faq: ({ copy, sheet, field, v }) => {
    const seen = new Set();
    const qs = sheet.facts.filter((f) => f.kind === "faq" && /\?\s*$/.test(f.section) && f.section.length <= 90 && !seen.has(f.section) && seen.add(f.section)).map((f) => f.section);
    if (!qs.length) return { notFit: "the product page has no FAQ" };
    const STOP = new Set("what which when where does do is are can the for and with this that your you use using used good best recommended serum cream product skin face how why will should".split(" "));
    const toks = (s) => (String(s).toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !STOP.has(w));
    const activeWords = new Set(toks((sheet.actives || []).map((a) => a.name).join(" ")));
    const pool = sheet.facts.filter((f) => ["claim", "suitability", "usage"].includes(f.kind) && f.text.length <= 110);
    const answerFor = (q) => { const qt = toks(q).filter((w) => !activeWords.has(w)); let best = null; for (const f of pool) { const n = toks(f.text).filter((w) => qt.some((x) => x.slice(0, 5) === w.slice(0, 5))).length; if (n && (!best || n > best.n)) best = { n, f }; } return best?.f || null; };
    // The default question is one the page answers in a short fact and that doesn't read as a treatment claim (any FAQ
    // can still be picked).
    const calm = (x) => !/\b(treat|treatment|cure|heal|disease|prescri)/i.test(x);
    const q = qs.includes(v.question) ? v.question : qs.find((x) => calm(x) && answerFor(x)) || qs.find(calm) || qs[0];
    const auto = answerFor(q);
    const ans = field("answer", auto?.text, "Answer (from the product page, not the FAQ text)", { max: 110, cites: auto && [auto.id] });
    return {
      brief: { ...base(copy, "faq", false), headline: "", faq: { question: q, answer: ans.text || P("Answer from a product-page fact"), cites: ans.cites || [] }, caption: cap(copy.headline, copy.subhead, copy.footnote) },
      fieldsBefore: [{ key: "question", label: "Question (from the page's own FAQ)", value: q, options: qs.map((x) => ({ value: x, label: x })) }],
      missing: ans.text ? [] : ["an answer from a product-page fact (the page's FAQ answers can't be quoted as claims)"],
    };
  },

  thisvsthat: ({ copy, field }) => {
    const f = (k, l, m = 40) => field(k, "", l, { max: m });
    const a = [f("a_title", "Left column title (an approach, e.g. a habit — never a brand)", 24), f("a1", "Left point 1"), f("a2", "Left point 2 (optional)")];
    const b = [f("b_title", "Right column title (this product's approach)", 24), f("b1", "Right point 1"), f("b2", "Right point 2 (optional)")];
    const col = (x, ph) => ({ title: x[0].text || P(ph), items: [x[1], x[2]].filter((y) => y.text).map((y) => ({ text: y.text, cites: y.cites || [] })).concat(x[1].text ? [] : [{ text: P("Point"), cites: [] }]) });
    return { brief: { ...base(copy, "thisvsthat", false), columns: [col(a, "This"), col(b, "That")] }, missing: [a[0], a[1], b[0], b[1]].filter((x) => !x.text).map((x) => x.label.replace(/ \(.*/, "").toLowerCase()) };
  },

  oldnew: ({ copy, field }) => {
    const f = (k, auto, l, m = 40) => field(k, auto, l, { max: m });
    const o = [f("old_title", "Old way", "Old way title", 20), f("old1", "", "Old habit 1 (a habit or routine — never a brand)"), f("old2", "", "Old habit 2 (optional)")];
    const n = [f("new_title", "New way", "New way title", 20), f("new1", "", "New way 1 (from the product page)"), f("new2", "", "New way 2 (optional)")];
    const col = (x) => ({ title: x[0].text, items: [x[1], x[2]].filter((y) => y.text).map((y) => ({ text: y.text, cites: y.cites || [] })).concat(x[1].text ? [] : [{ text: P("Point"), cites: [] }]) });
    return { brief: { ...base(copy, "oldnew", false), old: col(o), new: col(n) }, missing: [o[1], n[1]].filter((x) => !x.text).map((x) => x.label.replace(/ \(.*/, "").toLowerCase()) };
  },

  usvsthem: ({ copy, sheet, field }) => {
    const f = (k, auto, l, m) => field(k, auto, l, { max: m });
    const us = field("us", sheet.title, "Our column", { max: 40, cites: [nameFact(sheet)] }), them = f("them", "", "Their column: an unnamed benchmark, ingredient or product type the page names (never a brand)", 40);
    const rows = [1, 2, 3].map((i) => [f(`r${i}_label`, "", `Row ${i}: what is compared${i > 1 ? " (optional)" : ""}`, 40), f(`r${i}_us`, "", `Row ${i}: ours`, 24), f(`r${i}_them`, "", `Row ${i}: theirs`, 24)]);
    const basis = f("basis", "", "Basis of the comparison (what was compared, how, source) — printed on the ad", 200);
    const got = rows.filter((r) => r[0].text && r[1].text && r[2].text);
    const missing = [them.text ? "" : "the 'them' column", got.length ? "" : "at least one full comparison row", basis.text ? "" : "the basis of the comparison"].filter(Boolean);
    return {
      brief: { ...base(copy, "usvsthem", true), compare: { us: us.text, them: them.text || P("Benchmark"), cites: [...(us.cites || []), ...(them.cites || [])], rows: got.length ? got.map((r) => ({ label: r[0].text, us: r[1].text, them: r[2].text, cites: [...new Set([...(r[0].cites || []), ...(r[1].cites || []), ...(r[2].cites || [])])] })) : [{ label: P("What is compared"), us: P("Ours"), them: P("Theirs"), cites: [] }] }, footnote: basis.text || P("Basis of the comparison") },
      missing,
    };
  },
};

// ---------- ranking (the library's) ----------
const rankCache = new Map();
function ranking(sheet) {
  const h = handleOf(sheet);
  const key = `${h}|${sheet.title}|${sheet.facts.map((f) => f.kind).join(",")}`;
  if (!rankCache.has(key)) {
    const r = rankArchetypes({ product_handle: h, sheet, objective: "sales" });
    rankCache.set(key, new Map(r.full_ranking.map((x) => [x.id, x])));
  }
  return rankCache.get(key);
}

// ---------- one format: brief → spec (drawn) + ad (scored) + what it still needs ----------
export function buildFormat(id, copy, sheet, inputs = {}) {
  const fmt = FORMATS.find((f) => f.id === id);
  if (!fmt) throw new Error(`Unknown format "${id}"`);
  const h = handleOf(sheet);
  const inp = inputs[id] || {};
  const v = inp.values || {}, c = inp.cites || {}, photos = inp.photos || {};
  const fields = [], typed = [];
  // A field: the user's value if given, else the automatic one. A value keeps its citations only while they still check
  // out against the page; anything else the user typed is flagged as unsourced.
  const field = (key, auto, label, extra = {}) => {
    const given = typeof v[key] === "string" ? v[key].trim() : null;
    const text = (given ?? auto ?? "").trim();
    let cites = given !== null && given !== (auto || "") ? c[key] : c[key] || extra.cites;
    if (cites && !citesOk(text, cites, sheet)) cites = null;
    if (given !== null && given !== (auto || "").trim() && given && !cites && !/_title$/.test(key)) typed.push({ key, label, text });
    fields.push({ key, label, value: text, max: extra.max, cited: Boolean(cites?.length), typed: typed.some((x) => x.key === key) });
    return { text, cites, label };
  };
  const out = BUILD[id]({ copy, sheet, h, v, c, photos, field });
  if (out.notFit) return { id, notFit: out.notFit };
  const brief = out.brief;
  const sheets = out.sheets || { _main: sheet };
  if (!sheets._main) sheets._main = sheet;

  // Drawn: the brief with its [placeholders], through the library's spec builder.
  const spec = specFromBrief(brief, sheets, "_main");
  const vis = packVisual(h, sheet);
  Object.assign(spec, { format: id, imageSrc: visualSrc(h, vis), cutout: Boolean(vis?.cutout), accent: ACCENT[h] || "" });
  if (out.textureSrc) spec.textureSrc = out.textureSrc;
  const hydrateItem = (item, handle) => { const iv = packVisual(handle, sheets[item.product_handle]); return { ...item, imageSrc: visualSrc(handle, iv), cutout: Boolean(iv?.cutout), accent: ACCENT[handle] || "" }; };
  spec.steps = (spec.steps || []).map((s, i) => hydrateItem(s, brief.steps[i].product_handle === "_main" ? h : brief.steps[i].product_handle));
  spec.range = (spec.range || []).map((s, i) => hydrateItem(s, brief.range[i].product_handle === "_main" ? h : brief.range[i].product_handle));

  // Scored: the same brief without placeholders (an empty slot is not a claim).
  const clean = stripPlaceholders(brief);
  const ad = adFromBrief(clean, sheets, "_main");
  const extraSheets = Object.entries(sheets).filter(([k]) => k !== "_main").map(([, s]) => s);

  // Layout check on what will be drawn once the photos are in.
  const ph = { ...spec, photos: photos.before && photos.after ? ["x", "x"] : spec.photos };
  const layout = layoutProblems(ph).filter((p) => !(/study photos/.test(p) && (out.missing || []).length));

  // Ranking and risk, from the library's archetype scoring of the same catalog.
  const rows = ranking(sheet);
  const best = fmt.templates.map((t) => rows.get(t)).filter(Boolean).sort((a, b) => b.score - a.score)[0];
  let risk = best?.risk || "low", riskNote = best?.risk_note || "";
  if (fmt.person) { risk = "severe"; riskNote = (fmt.id === "before_after" ? SOURCE_RISK["REAL PHOTO:result"] : SOURCE_RISK["REAL PHOTO:people"]).note; }
  if (id === "texture" && !textureOf(sheet) && photos.texture) { risk = worst(risk, "medium"); riskNote = "Uploaded photo: confirm it's a real, unretouched photo of this product (never AI-made)."; }
  if (typed.length) { risk = worst(risk, "medium"); riskNote = `${riskNote} Lines typed in the app have no page source yet: a reviewer must check them.`.trim(); }

  const missing = out.missing || [];
  const meta = {
    id, label: fmt.label, layout: fmt.layout, person: Boolean(fmt.person), ai_draft: Boolean(fmt.ai),
    template: best ? { id: best.id, name: best.name, why: best.why, score: best.score } : null, templates: fmt.templates,
    score: best?.score ?? 0, risk, risk_label: LABEL[risk], risk_note: riskNote,
    status: missing.length ? "needs_input" : "ready", missing,
    fields: [...(out.fieldsBefore || []), ...fields], photos: (out.photos || []).map((p) => ({ ...p, have: Boolean(photos[p.key]) })),
    typed, notes: out.notes || [], visual: vis?.source || "",
  };
  return { id, meta, spec, ad, extraSheets, layout, brief };
}

// Every format for this product: ranked list (ready and needs-input), plus what isn't offered and why.
export function listFormats(copy, sheet, inputs = {}) {
  const built = [], notShown = [];
  for (const f of FORMATS) {
    const b = buildFormat(f.id, copy, sheet, inputs);
    if (b.notFit) notShown.push({ id: f.id, label: f.label, why: b.notFit });
    else built.push(b);
  }
  built.sort((a, b) => b.meta.score - a.meta.score);
  built.forEach((b, i) => (b.meta.rank = i + 1));
  const rows = ranking(sheet);
  for (const n of NOT_IN_APP) notShown.push({ id: `t${n.templates.join("-")}`, label: n.templates.map((t) => rows.get(t)?.name).filter(Boolean).join(", "), why: n.why });
  return { built, notShown };
}
