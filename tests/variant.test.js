import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { verbatimCopy, checkCopy, existingHeadlines, generateAd } from "../lib/generate.js";
import { aiPerson } from "../lib/app_formats.js";
import { addLiveFacts } from "../lib/live_facts.js";

const sheet = (h) => addLiveFacts(JSON.parse(fs.readFileSync(`eval/gen/${h}.sheet.json`, "utf8")));
const HANDLES = ["light-fluid-spf-50-sunscreen", "niacinamide-10-with-matmarine", "salicylic-acid-2"];

test("variant 1 and variant 2 write different copy, and both still pass the citation checks", () => {
  for (const h of HANDLES) {
    const s = sheet(h), a = verbatimCopy(s, 1), b = verbatimCopy(s, 2);
    assert.notDeepEqual(a, b, h);
    assert.notEqual(a.headline, b.headline, `${h}: headline repeats`);
    for (const c of [a, b, verbatimCopy(s, 5)]) assert.deepEqual(checkCopy(c, s), [], h);
    assert.deepEqual(verbatimCopy(s), verbatimCopy(s, 1), "no variant = first pick");
  }
});

test("a headline already in the library is skipped while an alternative exists", () => {
  for (const h of HANDLES) {
    const s = sheet(h), first = verbatimCopy(s, 1).headline;
    assert.notEqual(verbatimCopy(s, 1, [first]).headline, first, h);
  }
});

test("Build never returns a headline equal to an existing library headline of the product", async () => {
  for (const h of HANDLES) {
    const lib = existingHeadlines(h);
    if (!lib.length) continue;
    const s = sheet(h), seen = new Set(lib.map((e) => e.headline.toLowerCase()));
    for (const v of [1, 2, 3]) {
      const out = await generateAd(s, { mode: "verbatim", variant: v });
      assert.ok(!seen.has(out.copy.headline.toLowerCase()), `${h} v${v}: ${out.copy.headline}`);
      assert.equal(out.variant, v);
    }
  }
});

test("AI person images rotate by variant", () => {
  const order = [8, 9, 7, 6, 10, 41, 11, 31, 30];
  for (const h of HANDLES) {
    const picks = new Set([1, 2, 3, 4].map((v) => aiPerson(h, order, v)?.rel));
    const n = order.filter((t) => aiPerson(h, [t])).length;
    assert.equal(picks.size, Math.min(4, Math.max(n, 1)) , `${h}: ${n} images`);
  }
});

