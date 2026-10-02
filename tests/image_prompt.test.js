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

test("asking for the product, text, skin, results or endorsements is blocked", () => {
  for (const bad of [
    "A minimalist serum bottle with a dropper on a marble surface. Empty space on the left. No text.",
    "Clean background with the headline 'Niacinamide 10%' in bold. No product.",
    "A woman with glowing skin smiling in soft light. No text, no product. Empty space right.",
    "Before/after split layout with two faces. No text, no product, empty space.",
    "A dermatologist in a lab coat holding a clipboard. No text, no product, empty space.",
    "No text, but show the serum bottle in the centre with empty space around it.",
  ]) assert.equal(checkImagePrompt(bad).blocked, true, bad);
});

test("reserving space for the real pack shot is not an ask to draw one (first gate run)", () => {
  const p = "Off-white backdrop. On the right, a low matte plinth with empty space reserved for a product photo to be placed later. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.";
  assert.equal(checkImagePrompt(p).blocked, false, JSON.stringify(checkImagePrompt(p).findings));
  assert.equal(checkImagePrompt("A plinth with a product on it, empty space left. No text.").blocked, true);
});

test("reserving space for the headline is not an ask for text (format run)", () => {
  const p = "Plain off-white wall; keep the top band calm and low-detail for the headline. Empty space in the middle. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.";
  assert.equal(checkImagePrompt(p).blocked, false, JSON.stringify(checkImagePrompt(p).findings));
  assert.equal(checkImagePrompt("A wall with the headline 'Glow' painted on it. Empty space. No product.").blocked, true);
});

test("negation directly before the noun is respected", () => {
  assert.equal(checkImagePrompt("A marble surface without a bottle, soft light. Empty space on the right. No text, no product.").blocked, false);
});

test("prompts missing the exclusions are not ok even if nothing is asked for", () => {
  const r = checkImagePrompt("Soft beige gradient background with gentle shadows.");
  assert.equal(r.blocked, false);
  assert.equal(r.ok, false);
  assert.equal(r.missing.length, 3);
});
