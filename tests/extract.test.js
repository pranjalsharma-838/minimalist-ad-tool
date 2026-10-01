import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikeTestimonial, activesFromTitle, parseProductUrl } from "../lib/extract.js";

test("testimonials are detected (real lines from beminimalist.co, 2026-10-02)", () => {
  assert.equal(looksLikeTestimonial('"I have seen a reduction in acne and oiliness ever since I started using this face cleanser" -Nikhil V.'), true);
  assert.equal(looksLikeTestimonial("\"I've been using it for past 3-4 months. It's an amazing product. -Charu S.\""), true);
});

test("brand lines with hyphens are not testimonials", () => {
  for (const line of [
    "Skin type: Oily/Combination, Acne-Prone",
    "Concerns: Acne Marks, Acne Prone & Oily Skin",
    "A lightweight, water-resistant SPF 50 Sunscreen",
    "Our Niacinamide comes from Lonza, Switzerland and Matmarine is sourced from Lipotec USA, USA",
  ]) assert.equal(looksLikeTestimonial(line), false, line);
});

test("concentration is kept exactly as printed on the pack", () => {
  assert.deepEqual(activesFromTitle("Niacinamide 10% Face Serum"), [{ name: "Niacinamide", pct: "10%" }]);
  assert.deepEqual(activesFromTitle("Salicylic + LHA 02% Cleanser 20ml"), [{ name: "Salicylic + LHA", pct: "02%" }]);
  assert.deepEqual(activesFromTitle("Light Fluid SPF 50 Sunscreen"), [{ name: "SPF", pct: "50" }]);
});

test("only beminimalist.co product URLs are accepted", () => {
  assert.equal(parseProductUrl("https://beminimalist.co/products/salicylic-acid-2?variant=1").handle, "salicylic-acid-2");
  assert.throws(() => parseProductUrl("https://evil.example/products/x"));
  assert.throws(() => parseProductUrl("https://beminimalist.co/collections/all"));
});
