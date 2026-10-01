import { test } from "node:test";
import assert from "node:assert/strict";
import { matchProduct } from "../lib/similarity.js";

const pick = (comp) => matchProduct(comp).best.title;

test("obvious competitor -> Minimalist pairs", () => {
  assert.equal(pick({ name: "Salicylic Acid 2% Face Wash", actives: [{ name: "Salicylic Acid", pct: "2%" }], format: "cleanser", concerns: ["acne"] }), "Salicylic Acid + LHA 2% Cleanser");
  assert.equal(pick({ name: "2% Salicylic Acid Serum", actives: [{ name: "Salicylic Acid", pct: "2%" }], format: "serum", concerns: ["acne"] }), "Salicylic Acid 2% Face Serum");
  assert.match(pick({ name: "Vitamin C Serum", actives: [{ name: "Vitamin C", pct: "10%" }], format: "serum", concerns: ["dullness"] }), /^Vitamin C 10%/);
  assert.equal(pick({ name: "5% Niacinamide Serum", actives: [{ name: "Niacinamide", pct: "5%" }], format: "serum", concerns: [] }), "Niacinamide 5% Face Serum");
  assert.match(pick({ name: "Sunscreen SPF 50 PA++++", actives: [{ name: "SPF", pct: "50" }], format: "sunscreen", concerns: ["sun protection"] }), /SPF 50/);
});

test("never matches Pediatrics, and hair only for hair", () => {
  const r = matchProduct({ name: "Gentle baby lotion", actives: [{ name: "Ceramide", pct: "" }], format: "moisturizer", concerns: ["dry skin"] });
  assert.ok(!/pediatric/i.test(r.best.handle));
  const face = matchProduct({ name: "Face serum", actives: [], format: "serum", concerns: [] });
  assert.notEqual(face.best.format, "hair");
});

test("stage 3 review mismatches stay fixed", () => {
  const body = matchProduct({ name: "Daily Exfoliating Body Wash", actives: [{ name: "Salicylic Acid", pct: "" }, { name: "Lactic Acid", pct: "4%" }], format: "body", concerns: ["dullness"] });
  assert.equal(body.best.format, "body", `got ${body.best.title}`);
  const night = matchProduct({ name: "Retinol 0.1% Night Cream", actives: [{ name: "Retinol", pct: "0.1%" }], format: "moisturizer", concerns: ["fine lines"] });
  assert.notEqual(night.best.format, "eye", `got ${night.best.title}`);
});

test("texture-led sunscreen ads go to the texture-matched SKU", () => {
  assert.match(pick({ name: "Oil-Free Aquagel Sunscreen", actives: [{ name: "SPF", pct: "SPF 50" }], format: "sunscreen", concerns: ["sun protection"] }), /Light Fluid SPF 50/);
  assert.match(pick({ name: "Sunscreen SPF 50 PA++++", actives: [{ name: "SPF", pct: "50" }], format: "sunscreen", concerns: ["sun protection"] }), /^SPF 50 Sunscreen$/);
});

test("weak matches are labelled low confidence", () => {
  assert.equal(matchProduct({ name: "Glow cream", actives: [], format: "", concerns: [] }).confidence, "low");
});
