import test from "node:test";
import assert from "node:assert/strict";
import { useCase, audiences, noResultImages, aiImagePrompt, buildFormat } from "../lib/app_formats.js";
import { verbatimCopy } from "../lib/generate.js";

const sheet = (url, title, facts) => ({ url, title, facts: facts.map((text, i) => ({ id: `F${i + 1}`, text, kind: "claim" })), images: [], actives: [] });
const baby = sheet("https://beminimalist.co/products/pediatrics-ceramide-vitamin-b5-delicate-cleanser", "Ceramide & Vitamin B5 Delicate Cleanser",
  ["Tear-free baby wash for delicate skin.", "Skin type: All Skin Types (Normal, Eczema-Prone, Sensitive Skin)", "Suitable for: Newborns & Up (0+ Years)", "Rub into a light lather and gently massage over the body."]);

test("a baby product: parent-and-baby scenes, a second audience from the page, and no result images", () => {
  assert.equal(useCase(baby), "baby");
  const a = audiences(baby).map((x) => x.key);
  assert.deepEqual(a, ["baby", "sensitive"], "newborns and up + sensitive skin on the page = a grown-up sensitive-skin angle");
  assert.ok(audiences(baby)[1].cites.length, "every audience cites the page");
  assert.ok(noResultImages(baby));
  assert.ok(buildFormat("before_after", verbatimCopy(baby), baby, { fresh: true }).notFit);
  assert.ok(buildFormat("timeline", verbatimCopy(baby), baby, { fresh: true }).notFit);
  const p0 = aiImagePrompt("person", baby, 0).prompt, c0 = aiImagePrompt("creator", baby, 0).prompt;
  assert.match(p0, /parent with their baby/);
  assert.match(c0, /sensitive skin/, "person and creator speak to different audiences in one build");
  assert.doesNotMatch(p0, /adult woman/);
});

test("scenes follow how the product is used", () => {
  assert.match(aiImagePrompt("person", sheet("https://beminimalist.co/products/hair-growth-actives-18", "Hair Growth Actives 18%", ["A few drops on the scalp."]), 1).prompt, /scalp/);
  assert.match(aiImagePrompt("person", sheet("https://beminimalist.co/products/x-underarm-roll-on", "Underarm Roll-On", ["Roll on clean underarms."]), 1).prompt, /underarm/);
  assert.match(aiImagePrompt("in_hand", baby, 1).prompt, /holding the attached product pack/);
  assert.equal(aiImagePrompt("in_hand", baby, 1).base, "pack", "the real, label-checked pack is attached");
});

test("the week-by-week journey runs 4 to 12 weeks, from the page's own study period", () => {
  const eight = sheet("https://beminimalist.co/products/a", "Serum A", ["Apply 2-3 drops AM & PM.", "90% saw an even tone in 8 weeks."]);
  const none = sheet("https://beminimalist.co/products/b", "Serum B", ["Apply 2-3 drops AM & PM."]);
  const long = sheet("https://beminimalist.co/products/c", "Serum C", ["Apply daily.", "Results after 16 weeks and 12 weeks."]);
  const last = (s) => buildFormat("weeks", verbatimCopy(s), s, {}).spec.specs.at(-1);
  assert.equal(last(eight).label, "Week 8"); assert.deepEqual(last(eight).cites, ["F2"]);
  assert.equal(last(none).label, "Week 4"); assert.deepEqual(last(none).cites, []);
  assert.equal(last(long).label, "Week 12", "capped at 12 weeks");
});
