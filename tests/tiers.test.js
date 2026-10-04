// Three-tier scores (lib/tiers.js): alignment, win, compliance on every report from scoreAd.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { scoreAd, verdictFor } from "../lib/score.js";
import { loadReference, winScore, imageText } from "../lib/tiers.js";
import { measure, hookType } from "../lib/voice_features.js";

const CLEAN = { headline: "Niacinamide 10% Face Serum", on_image_text: "Helps reduce the look of excess oil", primary_text: "Niacinamide 10% + Zinc 1%. A lightweight serum formulated for oily, acne-prone skin. Helps control excess oil and the look of pores with daily use. Fragrance free.", cta: "Shop Now" };
const HYPEY = { headline: "The ULTIMATE glow-up serum!!", on_image_text: "Tired of dull skin? Say goodbye to dullness! ✨✨ Get flawless glass skin. Amazing results you'll love! Shop now", primary_text: "Tired of dull skin?? 😩 This magic serum is a total game changer!! ✨✨ Unlock your dream skin today! 💖", cta: "Shop Now" };
// Calm, short, brand-shaped wording, but with blocking claims: the scores must never soften the gate.
const BLOCKED = { headline: "Niacinamide 10% Serum", on_image_text: "Cures acne. Guaranteed.", primary_text: "Niacinamide 10% serum. Cures acne for good.", cta: "Shop Now" };
const rules = { rulesOnly: true };

test("every report carries scores with the agreed shape", async () => {
  const r = await scoreAd(CLEAN, rules);
  const { alignment, win, compliance } = r.scores;
  for (const t of [alignment, win]) {
    assert.ok(t.score === null || (t.score >= 0 && t.score <= 100));
    assert.ok(["low", "medium", "high"].includes(t.band));
    assert.ok(Array.isArray(t.parts) && t.parts.length);
    for (const p of t.parts) assert.ok(typeof p.name === "string" && typeof p.why === "string" && "score" in p);
  }
  assert.ok(Number.isInteger(win.n) && win.n > 50, "win score states its sample size");
  assert.match(win.basis, /30\+ days/);
  assert.match(win.basis, /proxy/);
  assert.deepEqual(Object.keys(compliance).slice(0, 3), ["code", "label", "score"]);
  // Existing fields are untouched.
  for (const k of ["verdict", "dimensions", "findings", "tone_read", "language_read", "coverage", "dropped_model_findings", "ad", "scored_at"]) assert.ok(k in r);
});

test("BLOCKED is a hard gate: compliance 0–20, export off, verdict unchanged by the other scores", async () => {
  const r = await scoreAd(BLOCKED, { ...rules, template_id: 1, has_person: false });
  assert.equal(r.verdict.code, "BLOCKED");
  assert.ok(r.scores.compliance.score <= 20 && r.scores.compliance.score >= 0);
  assert.equal(r.scores.compliance.export_allowed, false);
  assert.equal(r.scores.compliance.gate, "hard");
  assert.equal(r.verdict.code, verdictFor(r.findings, r.coverage).code, "verdict is still computed from findings alone");
  assert.ok(r.scores.win.score > 20, "a decent win score exists but cannot lift the gate");
  assert.match(r.scores.win.note, /blocked/);
});

test("compliance scores keep the verdict order", async () => {
  const blocked = (await scoreAd(BLOCKED, rules)).scores.compliance.score;
  const fix = (await scoreAd(HYPEY, rules)).scores.compliance.score;
  const limited = (await scoreAd(CLEAN, rules)).scores.compliance.score;
  const ready = (await scoreAd(CLEAN, { injectModelData: { findings: [], rule_hit_review: [], tone_read: "Calm, ingredient-led.", language_read: "Concentration stated exactly." } })).scores.compliance;
  assert.equal(ready.code, "READY_FOR_REVIEW");
  assert.ok(ready.score > limited && limited > fix && fix > blocked, `${ready.score} > ${limited} > ${fix} > ${blocked}`);
  assert.ok(limited <= 80, "rules alone never reach the top band");
});

test("alignment: brand-style copy beats hype + fear copy", async () => {
  const clean = (await scoreAd(CLEAN, rules)).scores.alignment;
  const hype = (await scoreAd(HYPEY, rules)).scores.alignment;
  assert.equal(clean.band, "high");
  assert.equal(hype.band, "low");
  const voice = hype.parts.find((p) => p.name === "Meta voice match");
  assert.match(voice.why, /exclamation/);
  assert.ok(voice.score < 60);
});

test("works without an API key and says what wasn't assessed", async () => {
  const r = await scoreAd(CLEAN, rules);
  const judgePart = r.scores.alignment.parts.find((p) => p.name === "AI judge tone read");
  assert.equal(judgePart.score, null);
  assert.match(judgePart.why, /Not assessed/);
  assert.equal(r.scores.assessed_with, "rules only (no AI judge)");
  const withJudge = await scoreAd(CLEAN, { injectModelData: { findings: [], rule_hit_review: [], tone_read: "Calm and ingredient-led.", language_read: "ok" } });
  const jp = withJudge.scores.alignment.parts.find((p) => p.name === "AI judge tone read");
  assert.equal(jp.score, 100);
  assert.match(jp.why, /Calm and ingredient-led/);
});

test("win: deterministic, uses the given format, flags small groups", async () => {
  const a = winScore(CLEAN, { template_id: 1, has_person: false });
  const b = winScore(CLEAN, { template_id: 1, has_person: false });
  assert.deepEqual(a, b);
  const ref = loadReference();
  const fmt = a.parts.find((p) => p.name === "format / template");
  assert.equal(fmt.n, ref.filter((r) => r.template_id === 1).length);
  assert.match(fmt.why, /Clean product hero/);
  // A rare format: small group -> small_sample + a range, and the score is pulled towards the base rate.
  const counts = {};
  for (const r of ref) if (r.template_id) counts[r.template_id] = (counts[r.template_id] || 0) + 1;
  const rare = Number(Object.keys(counts).find((k) => counts[k] <= 2));
  const w = winScore(CLEAN, { template_id: rare });
  const rp = w.parts.find((p) => p.name === "format / template");
  assert.equal(rp.small_sample, true);
  assert.ok(Array.isArray(rp.range));
  assert.ok(Math.abs(rp.score - rp.base_rate) <= 30, "shrunk towards the base rate");
  assert.equal(w.small_sample, true);
});

test("win: parts it can't see are listed as not assessed", () => {
  const w = winScore({ primary_text: "Niacinamide 10% for oily skin." }, {});
  const na = w.parts.filter((p) => p.score === null);
  assert.ok(na.length >= 2);
  for (const p of na) assert.match(p.why, /Not assessed/);
});

test("offer detection: 'free from' and '-free' are not offers", () => {
  const offer = (t) => winScore({ on_image_text: t }, {}).parts.find((p) => p.name === "offer on the image").why;
  assert.match(offer("Buy any 2, get 1 free"), /^Shows an offer/);
  assert.match(offer("Fragrance-free. Free from essential oils."), /^No offer/);
  assert.match(offer("Chemical-free formula"), /^No offer/);
});

test("image text = headline + on-image text, without double counting", () => {
  assert.equal(imageText({ headline: "Niacinamide 10%", on_image_text: "Niacinamide 10%\nHelps control oil" }), "Niacinamide 10%\nHelps control oil");
  assert.equal(imageText({ headline: "Niacinamide 10%", on_image_text: "" }), "Niacinamide 10%");
});

test("meta voice profile: measured from the brand's own long-running ads, with real lines", () => {
  const p = JSON.parse(fs.readFileSync(new URL("../brand_packs/minimalist/meta_voice_profile.json", import.meta.url), "utf8"));
  assert.ok(p.on_image.ads >= 8 && p.ad_copy.used.distinct_copies >= 5);
  assert.ok(p.ad_copy.excluded.creator_partnership > 0, "creator ads are kept out of the brand voice");
  assert.ok(p.ad_copy.copies.every((c) => c.days >= 30), "long runners only");
  assert.ok(p.on_image.title_words.examples.includes("Glow Boosting Routine"));
  for (const k of ["image_words_single_max", "sentence_words", "exclamation_per_100w", "emoji_per_100w", "hype_per_100w", "fear_per_100w", "opener_names_active_share", "hook_shares"]) assert.ok(k in p.targets, k);
});

test("voice features read hooks the way a person would", () => {
  assert.equal(hookType("Tired of dull, uneven skin? Try this."), "fear_problem");
  assert.equal(hookType("Meet the new B12 + Oat Extract 6.5% Gentle Cleanser."), "product_intro");
  assert.equal(hookType("Buy any 2 products and get a freebie of your choice"), "offer");
  assert.equal(hookType("Vitamin C 10% Face Serum"), "ingredient_led");
  const m = measure("Amazing!! Magic serum ✨✨");
  assert.equal(m.exclamations, 2);
  assert.equal(m.emoji, 2);
  assert.ok(m.hype.length >= 2);
});

test("creator ads: voice compared for reference only", async () => {
  const r = await scoreAd({ ad_type: "creator", primary_text: "#ad Been using this Niacinamide 10% serum for a month, my skin feels less oily.", headline: "" }, rules);
  assert.match(r.scores.alignment.parts.find((p) => p.name === "Meta voice match").why, /Creator ad/);
});

test("transparency & no exaggeration: hype and unbacked numbers cost, the brand's own style doesn't", async () => {
  const { scoreAd } = await import("../lib/score.js");
  const part = async (ad) => (await scoreAd({ primary_text: "", footnote: "", cta: "Shop now", ...ad }, { rulesOnly: true })).scores.alignment.parts.find((p) => p.name === "transparency & no exaggeration");
  const clean = await part({ headline: "Clears pores, gently", on_image_text: "Salicylic Acid 2%" });
  const hype = await part({ headline: "The ultimate miracle serum", on_image_text: "Flawless skin overnight" });
  const unbacked = await part({ headline: "93% saw clearer skin", on_image_text: "Salicylic Acid 2%" });
  const backed = await part({ headline: "93% saw clearer skin", on_image_text: "Salicylic Acid 2%", footnote: "Consumer study, 4 weeks, as published on the product page." });
  assert.equal(clean.score, 100);
  assert.ok(hype.score <= 60, hype.why);
  assert.ok(unbacked.score < backed.score, `${unbacked.why} | ${backed.why}`);
});
