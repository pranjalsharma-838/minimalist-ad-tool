// Regression tests for the rule layer. Each case is a real line (Meta Ad Library / beminimalist.co,
// collected 2026-10-02) that the rules once got wrong, or a line that pins down a rule's intent.
import { test } from "node:test";
import assert from "node:assert/strict";
import { runRules } from "../lib/rules.js";

const ids = (ad, ctx) => runRules({ ad_type: "brand", headline: "", primary_text: "", on_image_text: "", footnote: "", cta: "", ...ad }, ctx).map((f) => f.rule_id);
const has = (text, id) => ids({ primary_text: text }).includes(id);

test("misses found on the tuning set are now caught", () => {
  assert.ok(has("The Derma Co. Sali-Cinamide Anti-Acne Face Wash kills 4X more acne-causing bacteria than neem", "CLM-01"));
  assert.ok(has("Struggling with dark spots, acne marks, or uneven skin tone?", "CLM-14"));
  assert.ok(has("Tackles hairfall right at the roots", "CLM-02"));
});

test("false positives found on the tuning set stay fixed", () => {
  assert.ok(!has("Step 2: Treat – Vitamin C 10% Serum", "CLM-20"), "'10% Serum' is not an ingredient");
  assert.ok(!has("Vitamin C 10% Face Serum", "CLM-20"));
  assert.ok(!has("Helps prevent free radical damage for healthy, glowing skin", "CLM-16"), "free radical is not an offer");
});

test("brand's own risky ad lines are flagged (rules follow stated philosophy, not current copy)", () => {
  assert.ok(has("In-vivo tested for guaranteed UV safety", "CLM-03"));
  assert.ok(has("Absolutely zero white cast", "CLM-03"));
  assert.ok(has("Discover the clinically proven Glow Boosting Routine", "CLM-09"));
});

test("product names don't trip drug-claim rules", () => {
  assert.ok(!has("Try the L-Ascorbic Acid 8% Lip Treatment Balm", "CLM-01"));
  assert.ok(!has("Zinc Oxide + B5 Healing Ointment", "CLM-01"));
  assert.ok(has("This ointment helps heal diaper rash", "CLM-01"));
});

test("brand-safe lines pass the policy rules", () => {
  for (const line of [
    "A daily serum formulated with pure Vitamin B3 (Niacinamide) and Matmarine.",
    "Fragrance free. Non-comedogenic. pH: 5.5 - 6.5",
    "Buy any 2 products and get a freebie of your choice",
    "Use sunscreen during the day for best results",
    "The product has been evaluated for safety through patch testing under the supervision of a Dermatologist.",
  ]) {
    const policy = runRules({ ad_type: "brand", primary_text: line, headline: "", on_image_text: "", footnote: "", cta: "" }).filter((f) => f.dimension === "policy");
    assert.deepEqual(policy.map((f) => f.rule_id), [], line);
  }
});

test("concentration checked against the catalog and the attached product", () => {
  assert.ok(has("Niacinamide 12% for oily skin", "CLM-20"));
  assert.ok(!has("Niacinamide 10% for oily skin", "CLM-20"));
  const sheet = { actives: [{ name: "Niacinamide", pct: "10%" }], facts: [] };
  const f = runRules({ ad_type: "brand", headline: "Niacinamide 5% for oily skin", primary_text: "", on_image_text: "", footnote: "", cta: "" }, { sheet });
  const hit = f.find((x) => x.rule_id === "CLM-20");
  assert.ok(hit, "5% exists in catalog but this product is 10%");
  assert.equal(hit.severity, "block");
});

test("false positives found by the stand-in judges stay fixed", () => {
  assert.ok(!has("Suitable for all skin types, especially those dealing with dark spots", "CLM-14"));
  assert.ok(has("Struggling with dark spots, acne marks, or uneven skin tone?", "CLM-14"));
  assert.ok(!has("Comment FREE for the offer", "CLM-16"));
  const brand = runRules({ ad_type: "brand", advertiser: "Heaven Magic Beauty", primary_text: "Heaven Magic's Bridal Cream", headline: "", on_image_text: "", footnote: "", cta: "" });
  assert.ok(!brand.some((f) => f.rule_id === "TON-02"), "brand name is not hype");
});

test("creator disclosure: missing blocks, buried needs a fix, upfront is fine", () => {
  const run = (t) => runRules({ ad_type: "creator", primary_text: t, headline: "", on_image_text: "", footnote: "", cta: "" }).find((f) => f.rule_id === "CRE-01");
  assert.equal(run("Love this cleanser, link in bio").severity, "block");
  assert.equal(run("I love the Salicylic Acid Cleanser because it's perfect for combination and oily skin like mine, and I carry it every time I travel anywhere. #ad #cleanser").severity, "fix");
  assert.equal(run("#ad I love this cleanser"), undefined);
});

test("model can't raise code-only checks, and can't exceed rulebook severity", async () => {
  const { postProcessJudge } = await import("../lib/judge.js");
  const ad = { headline: "Lip Balm SPF 50", primary_text: "Guaranteed glow", on_image_text: "", footnote: "", cta: "" };
  const out = postProcessJudge({
    findings: [
      { rule_id: "CLM-19", dimension: "policy", field: "headline", span: "SPF 50", severity: "block", why: "guess", fix: "" },
      { rule_id: "CLM-03", dimension: "policy", field: "primary_text", span: "Guaranteed", severity: "fix", why: "x", fix: "" },
      { rule_id: "CLM-03", dimension: "policy", field: "primary_text", span: "not in ad", severity: "block", why: "x", fix: "" },
    ],
    rule_hit_review: [], tone_read: "", language_read: "",
  }, ad, []);
  assert.equal(out.findings.length, 1);
  assert.equal(out.findings[0].severity, "fix", "milder of model (fix) and rulebook (block)");
  assert.deepEqual(out.rejected.map((r) => r.reason.slice(0, 13)), ["deterministic", "quoted span n"]);
});

test("eval run 1 over-blocks: severity now matches the independent reviewer", () => {
  const sev = (text, id) => ids({ primary_text: text }).includes(id);
  assert.ok(!sev("Designed to brighten, treat, and protect", "CLM-01"), "bare 'treat' is not a block");
  assert.ok(sev("Designed to brighten, treat, and protect", "CLM-26"), "but it is a fix");
  assert.ok(sev("Treats acne and prevents breakouts", "CLM-01"), "treat + condition is still a block");
  assert.ok(!sev("Skincare with absolutely nothing to hide.", "CLM-03"));
  assert.ok(sev("Absolutely zero white cast", "CLM-03"));
  assert.ok(!sev("No Nasties", "CLM-05") && sev("No Nasties", "CLM-27"));
  const r = runRules({ ad_type: "brand", headline: "Retinol 1% for fine lines", primary_text: "", on_image_text: "", footnote: "", cta: "" });
  assert.equal(r.find((f) => f.rule_id === "CLM-20")?.severity, "block", "a strength Minimalist doesn't sell is a block");
});

test("generator stand-in test: measured SPF and '-free' attributes", () => {
  assert.ok(!has("Non-comedogenic, shine-free finish", "CLM-16"));
  assert.ok(!has("Fragrance-free and sulfate-free", "CLM-16"));
  assert.ok(has("Get a FREE sunscreen!", "CLM-16"));
  const sheet = { actives: [{ name: "SPF", pct: "50" }], facts: [{ id: "F14", kind: "study", text: "SPF value obtained : 56" }] };
  const run = (field) => runRules({ ad_type: "brand", headline: "", primary_text: "", on_image_text: "", footnote: "", cta: "", [field]: "SPF 56 obtained in vivo" }, { sheet }).find((f) => f.rule_id === "CLM-19");
  assert.equal(run("footnote").severity, "advisory");
  assert.equal(run("on_image_text").severity, "fix");
  const row = runRules({ ad_type: "brand", headline: "", primary_text: "", on_image_text: "SPF obtained: 56, in-vivo", footnote: "", cta: "" }, { sheet }).find((f) => f.rule_id === "CLM-19");
  assert.equal(row?.severity, "fix", "'SPF obtained: 56' outside the footnote is a fix (house rule: 56 only in footnote)");
  const lab = runRules({ ad_type: "brand", headline: "SPF 50: the lab sheet", primary_text: "", on_image_text: "SPF obtained: 56, in-vivo", footnote: "", cta: "" }, { sheet, labTheme: true, fullText: "SPF 50: the lab sheet\nSPF obtained: 56" }).filter((f) => f.rule_id === "CLM-19" && /56/.test(f.span));
  assert.ok(lab.every((f) => f.severity === "advisory"), "lab-themed brief may show the measured value when SPF 50 is also stated");
  const wrong = runRules({ ad_type: "brand", headline: "SPF 70 protection", primary_text: "", on_image_text: "", footnote: "", cta: "" }, { sheet }).find((f) => f.rule_id === "CLM-19");
  assert.equal(wrong.severity, "block", "an SPF that's neither labelled nor measured is still a block");
});

test("component strengths on the attached product page aren't mismatches (first gate run)", () => {
  const sheet = { actives: [{ name: "AHA PHA BHA", pct: "32%" }], facts: [{ id: "F3", kind: "claim", text: "A powerful peeling trio of 25% AHA, 5% PHA & 2% BHA" }] };
  const r = runRules({ ad_type: "brand", headline: "25% AHA, 5% PHA, 2% BHA", primary_text: "", on_image_text: "", footnote: "", cta: "" }, { sheet });
  assert.ok(!r.some((f) => f.rule_id === "CLM-20"), JSON.stringify(r.map((f) => f.span)));
  const wrong = runRules({ ad_type: "brand", headline: "30% AHA peel", primary_text: "", on_image_text: "", footnote: "", cta: "" }, { sheet });
  assert.ok(wrong.some((f) => f.rule_id === "CLM-20"), "a strength not on the page is still flagged");
});

test("second gate run false blocks stay fixed", () => {
  const peel = { actives: [{ name: "AHA PHA BHA", pct: "32%" }], facts: [] };
  const r1 = runRules({ ad_type: "brand", headline: "", primary_text: "", on_image_text: "32% AHA PHA BHA", footnote: "", cta: "" }, { sheet: peel });
  assert.ok(!r1.some((f) => f.rule_id === "CLM-20"), "product's own strength");
  const vc = { actives: [{ name: "Vitamin C", pct: "10%" }], facts: [] };
  const r2 = runRules({ ad_type: "brand", headline: "", primary_text: "", on_image_text: "10% Vitamin C", footnote: "", cta: "" }, { sheet: vc });
  assert.ok(!r2.some((f) => f.rule_id === "CLM-20"));
  const r3 = runRules({ ad_type: "brand", headline: "", primary_text: "", on_image_text: "With Salicylic Acid + LHA\n6% of users preferred it", footnote: "", cta: "" });
  assert.ok(!r3.some((f) => f.rule_id === "CLM-20" && /LHA/.test(f.span)), "no match across a line break");
});

test("creator ads: tone relaxed, disclosure required", () => {
  const noTag = runRules({ ad_type: "creator", primary_text: "Obsessed with this serum!! 😍✨", headline: "", on_image_text: "", footnote: "", cta: "" });
  assert.ok(noTag.some((f) => f.rule_id === "CRE-01"));
  assert.ok(!noTag.some((f) => f.rule_id === "TON-02" || f.rule_id === "TON-03"));
  const tagged = runRules({ ad_type: "creator", primary_text: "#ad Obsessed with this serum", headline: "", on_image_text: "", footnote: "", cta: "" });
  assert.ok(!tagged.some((f) => f.rule_id === "CRE-01"));
});
