// Policy pack re-check of 2026-10-05 (research/regulatory_sources.md §H, research/policy_check_2026-10-05.json):
// every legal/platform rule carries the date its sources were re-opened, and each source-driven change has a test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runRules, RULES } from "../lib/rules.js";
import { scoreAd } from "../lib/score.js";

const blank = { ad_type: "brand", headline: "", primary_text: "", on_image_text: "", footnote: "", cta: "" };
const hits = (ad, ctx) => runRules({ ...blank, ...ad }, ctx);
const ids = (ad, ctx) => hits(ad, ctx).map((f) => f.rule_id);

test("every rule with a legal or platform source records when and where it was checked", () => {
  for (const r of RULES.rules) {
    const reg = r.sources.filter((s) => !/^(BRAND|AD-CORPUS|OPEN)/.test(s));
    if (!reg.length) { assert.equal(r.policy_checked, null, r.id); continue; }
    assert.match(r.policy_checked, /^\d{4}-\d{2}-\d{2}$/, r.id);
    assert.ok(Array.isArray(r.source_urls) && r.source_urls.length && r.source_urls.every((u) => /^https?:\/\//.test(u)), r.id);
    assert.ok(r.policy_note, r.id);
  }
});

test("CLM-14: Meta's own 'look younger' example is caught (META-PA, re-read 2026-10-05)", () => {
  assert.ok(ids({ primary_text: "Ready to upgrade your skin to look younger?" }).includes("CLM-14"));
  assert.ok(!ids({ primary_text: "A retinol serum for the look of fine lines." }).includes("CLM-14"));
});

test("CLM-11: uniqueness claims ('only serum in India with…') need a basis (ASCI annual report 2025-26)", () => {
  assert.ok(ids({ headline: "The only serum in India with 10% Niacinamide and Zinc" }).includes("CLM-11"));
  assert.ok(ids({ headline: "India's only 2-in-1 sunscreen" }).includes("CLM-11"));
  assert.ok(!ids({ primary_text: "Use only a pea-sized amount at night." }).includes("CLM-11"));
});

test("AI-01: synthetic content needs a label; AI results and AI testimonials are blocked (ASCI SGC guideline)", () => {
  const ad = { on_image_text: "Niacinamide 10%", primary_text: "A daily serum for oily skin." };
  assert.ok(!ids(ad).includes("AI-01"), "silent when the caller doesn't say anything is AI-made");
  const unlabelled = hits(ad, { synthetic: { people: true } }).find((f) => f.rule_id === "AI-01");
  assert.equal(unlabelled.severity, "fix");
  assert.ok(!ids({ ...ad, footnote: "AI-generated — illustrative" }, { synthetic: { people: true } }).includes("AI-01"));
  assert.ok(!ids(ad, { synthetic: { people: true, label_drawn: true } }).includes("AI-01"));
  const result = hits(ad, { synthetic: { result: true, label_drawn: true } }).find((f) => f.rule_id === "AI-01");
  assert.equal(result.severity, "advisory", "DEC-07: an AI result image is a warning (Severe risk), not a block");
  assert.equal(result.decision, "DEC-07");
  const testimonial = hits({ ...ad, on_image_text: "I've used it for 4 weeks and my skin feels calmer" }, { synthetic: { people: true, label_drawn: true } }).find((f) => f.rule_id === "AI-01");
  assert.equal(testimonial.severity, "advisory");
});

test("AI-01 is a warning on the report, never a block (DEC-07); an unlabelled AI image still needs its label", async () => {
  const r = await scoreAd({ on_image_text: "Niacinamide 10%", primary_text: "A daily serum for oily skin." }, { rulesOnly: true, synthetic: { result: true } });
  assert.notEqual(r.verdict.code, "BLOCKED");
  assert.ok(r.findings.some((f) => f.rule_id === "AI-01" && f.severity === "advisory"));
  const u = await scoreAd({ on_image_text: "Niacinamide 10%", primary_text: "A daily serum for oily skin." }, { rulesOnly: true, synthetic: { people: true } });
  assert.equal(u.verdict.code, "NEEDS_CHANGES", "no AI label on the creative: fix before review");
});
