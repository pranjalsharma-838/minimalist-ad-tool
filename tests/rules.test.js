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

test("creator ads: tone relaxed, disclosure required", () => {
  const noTag = runRules({ ad_type: "creator", primary_text: "Obsessed with this serum!! 😍✨", headline: "", on_image_text: "", footnote: "", cta: "" });
  assert.ok(noTag.some((f) => f.rule_id === "CRE-01"));
  assert.ok(!noTag.some((f) => f.rule_id === "TON-02" || f.rule_id === "TON-03"));
  const tagged = runRules({ ad_type: "creator", primary_text: "#ad Obsessed with this serum", headline: "", on_image_text: "", footnote: "", cta: "" });
  assert.ok(!tagged.some((f) => f.rule_id === "CRE-01"));
});
