import { test } from "node:test";
import assert from "node:assert/strict";
import { checkImagePrompt } from "../lib/image_prompt_check.js";

const GOOD = "Square 1080x1080 photo of a pale off-white stone surface with soft morning window light and a single sprig of green leaves at the far left. Keep the right 45% as clear empty space, evenly lit. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.";

test("a background-only prompt with explicit exclusions passes", () => {
  const r = checkImagePrompt(GOOD);
  assert.equal(r.blocked, false, JSON.stringify(r.findings));
  assert.deepEqual(r.missing, []);
  assert.equal(r.ok, true);
});

test("drawing the product is refused; text, skin, results, endorsements carry high/severe risk", () => {
  for (const bad of [
    "A minimalist serum bottle with a dropper on a marble surface. Empty space on the left. No text.",
    "No text, but show the serum bottle in the centre with empty space around it.",
  ]) assert.equal(checkImagePrompt(bad).refused, true, bad);
  for (const [bad, level] of [
    ["Clean background with the headline 'Niacinamide 10%' in bold. No product.", "high"],
    ["A woman with glowing skin smiling in soft light. No text, no product. Empty space right.", "severe"],
    ["Before/after split layout with two faces. No text, no product, empty space.", "severe"],
    ["A dermatologist in a lab coat holding a clipboard. No text, no product, empty space.", "high"],
  ]) {
    const r = checkImagePrompt(bad);
    assert.equal(r.refused, false, bad);
    assert.equal(r.risk, level, bad);
  }
});

test("reserving space for the real pack shot is not an ask to draw one (first gate run)", () => {
  const p = "Off-white backdrop. On the right, a low matte plinth with empty space reserved for a product photo to be placed later. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.";
  assert.equal(checkImagePrompt(p).blocked, false, JSON.stringify(checkImagePrompt(p).findings));
  assert.equal(checkImagePrompt("A plinth with a product on it, empty space left. No text.").blocked, true);
});

test("reserving space for the headline is not an ask for text (format run)", () => {
  const p = "Plain off-white wall; keep the top band calm and low-detail for the headline. Empty space in the middle. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.";
  assert.equal(checkImagePrompt(p).blocked, false, JSON.stringify(checkImagePrompt(p).findings));
  assert.equal(checkImagePrompt("A wall with the headline 'Glow' painted on it. Empty space. No product.").risk, "high");
});

test("negation directly before the noun is respected", () => {
  assert.equal(checkImagePrompt("A marble surface without a bottle, soft light. Empty space on the right. No text, no product.").blocked, false);
});

test("risk levels: only the product is refused; people/results get a level and the AI label", () => {
  const person = checkImagePrompt("A woman's hands holding nothing over a stone basin, soft light. Empty space right. No text, no product.");
  assert.equal(person.refused, false);
  assert.equal(person.risk, "high");
  assert.equal(person.ai_label_required, true);
  const ba = checkImagePrompt("Before/after split of a cheek area, studio light. Empty space right. No text, no product.");
  assert.equal(ba.refused, false);
  assert.equal(ba.risk, "severe");
  const prod = checkImagePrompt("A serum bottle with a dropper on marble. Empty space left. No text.");
  assert.equal(prod.refused, true);
});

test("prompts missing the exclusions are not ok even if nothing is asked for", () => {
  const r = checkImagePrompt("Soft beige gradient background with gentle shadows.");
  assert.equal(r.blocked, false);
  assert.equal(r.ok, false);
  assert.equal(r.missing.length, 3);
});
