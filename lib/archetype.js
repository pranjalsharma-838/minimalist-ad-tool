// Archetype selection (layer 4). Ranks ALL 48 templates for a request and returns a shortlist.
// Nothing is removed: a template that needs assets we lack still ranks on merit, and carries a risk
// level + suggestion instead (user decision 2026-10-03).
//
// Score (each part 0..1, weights below; every part is explained in the output "why"):
//   winners   — competitor ads running 30+ days in this template's format, more weight if same category
//   trends    — trend file signal for the format (0 until the trend agent exists; said so in "why")
//   facts     — share of the template's needed fact kinds the product page actually has
//   objective — fit between the request's objective and the template family
// Diversity: at most 2 picks per family in the shortlist.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SOURCE_RISK, LABEL } from "./risk.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const readJson = (p, d = null) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : d);
const TEMPLATES = readJson(path.join(root, "config", "templates.json")).templates;
const W = { winners: 0.45, trends: 0.15, facts: 0.25, objective: 0.15 };
const WINNER_DAYS = 30;

const OBJECTIVE_FIT = {
  sales: { Commercial: 1, Proof: 0.9, Product: 0.8, "Human + Product": 0.7, Transformation: 0.7, Education: 0.5, Comparison: 0.6, Problem: 0.6, Result: 0.6, "Native social": 0.5 },
  awareness: { Product: 0.9, "Native social": 1, Result: 0.8, "Human + Product": 0.8, Education: 0.7, Problem: 0.6, Transformation: 0.6, Proof: 0.6, Comparison: 0.5, Commercial: 0.3 },
  education: { Education: 1, Comparison: 0.9, Problem: 0.8, Proof: 0.8, Product: 0.6, Transformation: 0.6, "Native social": 0.6, "Human + Product": 0.5, Result: 0.4, Commercial: 0.2 },
};

function loadWinners() {
  const ads = [];
  for (const dir of ["research/competitor_ads_deep", "research/competitor_ads"]) {
    const d = path.join(root, dir);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((f) => f.endsWith(".json"))) {
      for (const a of readJson(path.join(d, f), [])) if (!a.duplicate_of) ads.push({ ...a, _src: dir });
    }
  }
  const seen = new Set();
  return ads.filter((a) => a.ad_type && (a.days_running || 0) >= WINNER_DAYS && !seen.has(a.id) && seen.add(a.id));
}

// Generic words would make every skincare ad "same category" (first test: 12 of 14 offer ads matched
// niacinamide via "skin"/"face"). Only concern/ingredient words count.
const GENERIC = new Set("skin face serum cream care with your that this from more less glow glowing best type types oily dry normal all sensitive acne prone suitable years combination daily skincare product products formula".split(" "));
const words = (s) => new Set((String(s || "").toLowerCase().match(/[a-z]{4,}/g) || []).filter((w) => !GENERIC.has(w)));

// request: { product_handle, sheet, audience, placement, objective, top }
export function rankArchetypes(request) {
  const winners = loadWinners();
  const trends = readJson(path.join(root, "research", "trends.json"));
  const assets = readJson(path.join(root, "brand_packs", "minimalist", "assets", "index.json"), { assets: [] }).assets;
  const sheet = request.sheet;
  const kinds = new Set(sheet.facts.map((f) => f.kind));
  if (sheet.facts.some((f) => /rating|reviews?\b/i.test(f.text)) || sheet.rating) kinds.add("rating");
  const productWords = words(`${sheet.title} ${sheet.facts.filter((f) => f.kind === "suitability").map((f) => f.text).join(" ")}`);
  const objective = OBJECTIVE_FIT[request.objective] ? request.objective : "sales";

  const maxW = Math.max(1, ...TEMPLATES.map((t) => winners.filter((a) => t.competitor_types.includes(a.ad_type)).length));
  const rows = TEMPLATES.map((t) => {
    const matching = winners.filter((a) => t.competitor_types.includes(a.ad_type));
    const sameCat = matching.filter((a) => [...words(`${a.headline} ${a.primary_text} ${a.on_image_text}`)].some((w) => productWords.has(w)));
    const winnersScore = Math.min(1, (matching.length + 2 * sameCat.length) / (maxW * 1.5));
    const trend = trends?.formats?.[t.id] ?? trends?.ad_types?.[t.competitor_types[0]];
    const trendScore = typeof trend === "number" ? trend : 0;
    const factsScore = t.needs.length ? t.needs.filter((k) => kinds.has(k)).length / t.needs.length : 1;
    const objScore = OBJECTIVE_FIT[objective][t.family] ?? 0.5;
    const score = W.winners * winnersScore + W.trends * trendScore + W.facts * factsScore + W.objective * objScore;

    const ownAsset = assets.find((a) => a.type === t.asset_type && (a.product_handle === request.product_handle || a.product_handle === "*"));
    let risk;
    if (ownAsset) risk = { level: t.source.startsWith("REAL PHOTO:result") ? "medium" : "low", note: `Real asset available in the library (${ownAsset.file}). ${t.source.startsWith("REAL PHOTO:result") ? "Result imagery still needs the study it comes from on file." : ""}`.trim() };
    else risk = SOURCE_RISK[t.source] || { level: "medium", note: "Unknown source type." };
    const aiLabel = !ownAsset && t.source.startsWith("REAL PHOTO:") && ["REAL PHOTO:people", "REAL PHOTO:result", "REAL PHOTO:endorser"].includes(t.source);
    const missingFacts = t.needs.filter((k) => !kinds.has(k));

    const why = [
      `${matching.length} competitor ads 30+ days in this format${sameCat.length ? ` (${sameCat.length} in this category)` : ""}`,
      trends ? `trend signal ${trendScore.toFixed(2)}` : "no trend file yet",
      missingFacts.length ? `product page lacks: ${missingFacts.join(", ")}` : "product page has the facts it needs",
      `${t.family} fits a ${objective} objective ${objScore >= 0.8 ? "well" : objScore >= 0.6 ? "moderately" : "weakly"}`,
    ];
    const suggestions = [];
    if (!ownAsset && t.source.startsWith("REAL PHOTO")) suggestions.push(`Real ${t.asset_type.replace(/_/g, " ")} photos would lower the risk (none in the asset library for this SKU).`);
    if (aiLabel) suggestions.push('Any AI-generated person/skin/result must carry the visible "AI-GENERATED — ILLUSTRATIVE" mark.');
    if (t.layout === "new") suggestions.push("Renderer layout not built yet: the brief will describe the layout for a designer.");
    if (missingFacts.length) suggestions.push(`Missing facts (${missingFacts.join(", ")}): the brief must leave those slots as [placeholders] — no invention.`);
    if (t.source === "MARKETER") suggestions.push("Offer terms / numbers must come from the marketer with a source and date.");

    return {
      id: t.id, name: t.name, family: t.family, layout: t.layout, source: t.source,
      score: +score.toFixed(3), parts: { winners: +winnersScore.toFixed(2), trends: +trendScore.toFixed(2), facts: +factsScore.toFixed(2), objective: objScore },
      risk: risk.level, risk_label: LABEL[risk.level], risk_note: risk.note, ai_label_required: aiLabel,
      why: why.join("; "), suggestions,
      example_winners: matching.sort((a, b) => b.days_running - a.days_running).slice(0, 3).map((a) => `${a.brand} · ${a.days_running}d · ${a.id}`),
    };
  }).sort((a, b) => b.score - a.score);

  const top = request.top || 4;
  const perFamily = {};
  const shortlist = [];
  for (const r of rows) {
    if (shortlist.length >= top) break;
    if ((perFamily[r.family] || 0) >= 2) continue;
    perFamily[r.family] = (perFamily[r.family] || 0) + 1;
    shortlist.push(r);
  }
  return {
    request: { product_handle: request.product_handle, product: sheet.title, audience: request.audience || "", placement: request.placement || "feed 1:1", objective },
    inputs: { winners_30d: winners.length, winner_sources: [...new Set(winners.map((a) => a._src))], trend_file: Boolean(trends), assets: assets.length },
    shortlist,
    full_ranking: rows,
  };
}
