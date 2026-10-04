// The app's format picker (2026-10-04: "there's only one layout, the standard product ad"): each format draws only page
// facts or cited copy, the scorer reads exactly what's drawn, and a format the page can't fill is offered with a reason.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { verbatimCopy, formatOptions, specFromCopy, adFromCopy, pickQuote, pickStat } from "../lib/generate.js";
import { layoutProblems } from "../public/render.js";

const sheet = (h) => JSON.parse(fs.readFileSync(`eval/gen/${h}.sheet.json`, "utf8"));

test("every available format fits the layout and is scored on what it draws", () => {
  for (const h of ["light-fluid-spf-50-sunscreen", "niacinamide-10-with-matmarine", "salicylic-acid-2"]) {
    const s = sheet(h), copy = verbatimCopy(s);
    const opts = formatOptions(copy, s);
    assert.equal(opts.length, 7);
    assert.ok(opts.find((f) => f.id === "hero").available);
    for (const f of opts.filter((x) => x.available)) {
      const spec = specFromCopy(copy, s, f.id);
      assert.equal(spec.layout, f.id, `${h} ${f.id}`);
      assert.deepEqual(layoutProblems(spec), [], `${h} ${f.id}`);
      const ad = adFromCopy(copy, s, f.id);
      assert.ok(ad.on_image_text.includes("Hide Nothing."));
      if (f.id === "stat") assert.ok(ad.on_image_text.includes(spec.stat.value) && ad.on_image_text.includes(spec.stat.label));
      if (f.id === "review") assert.ok(ad.on_image_text.includes(spec.review.quote) && ad.footnote.includes("Results vary"));
      if (f.id === "question") assert.equal(ad.headline, spec.question);
    }
    for (const f of opts.filter((x) => !x.available)) {
      assert.ok(f.why.length > 10, `${h} ${f.id} needs a reason`);
      assert.equal(specFromCopy(copy, s, f.id).layout, "hero", "an unavailable format falls back to the product hero");
    }
  }
});

test("study numbers and quotes are taken whole from the page, never cut", () => {
  const sal = sheet("salicylic-acid-2");
  const st = pickStat(sal);
  assert.equal(`${st.value} ${st.label}`, sal.facts.find((f) => f.id === st.id).text);
  // A best seller uses a captured verified review (stars, name, date); a product without one falls back to a
  // quote printed on its own page.
  const nia = sheet("niacinamide-10-with-matmarine");
  const q = pickQuote(nia);
  assert.ok(q.verified && q.stars >= 4 && q.name && q.date, JSON.stringify(q));
  const pageOnly = { ...nia, url: "https://beminimalist.co/products/not-captured" };
  const pq = pickQuote(pageOnly);
  assert.ok(nia.facts.find((f) => f.id === pq.id).text.includes(pq.quote));
  assert.equal(pq.name, "Charu S.");
  // A quote too long for the card isn't offered.
  assert.equal(pickQuote({ facts: [{ id: "F1", kind: "testimonial", text: `"${"Lovely serum, ".repeat(30)}" -Asha K.` }] }), null);
});

test("badges never use page label lines", () => {
  const s = sheet("niacinamide-10-with-matmarine");
  const copy = { ...verbatimCopy(s), proof_points: ["Pregnancy/Lactation: Safe", "Lightweight, no sticky residue"] };
  assert.deepEqual(specFromCopy(copy, s, "badges").badges, [{ text: "Lightweight, no sticky residue" }]);
});
