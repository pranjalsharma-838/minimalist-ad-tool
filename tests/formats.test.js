// The app's formats (2026-10-05: "I don't see all the formats, many are not even clickable"): every format that fits the
// product is offered, ranked by the library's archetype scoring, and drawn + scored through the library's own brief code
// (specFromBrief / adFromBrief). A format missing an input opens as a draft that says what's missing; nothing is invented.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { verbatimCopy, formatOptions, specFromCopy, adFromCopy, pickQuote, pickStat, allFormats, formatItem } from "../lib/generate.js";
import { FORMATS, buildFormat, listFormats, packVisual, textureScene } from "../lib/app_formats.js";
import { imageFile } from "../lib/images.js";
import { addLiveFacts } from "../lib/live_facts.js";
import { libraryFor, imageRequests } from "../lib/library.js";
import { layoutProblems, renderAdSvg } from "../public/render.js";

const sheet = (h) => addLiveFacts(JSON.parse(fs.readFileSync(`eval/gen/${h}.sheet.json`, "utf8")));
const HANDLES = ["light-fluid-spf-50-sunscreen", "niacinamide-10-with-matmarine", "salicylic-acid-2"];

test("every format that fits is offered, ranked, and fits the layout; the rest say why", () => {
  for (const h of HANDLES) {
    const s = sheet(h), copy = verbatimCopy(s);
    const { built, notShown } = listFormats(copy, s);
    assert.equal(built.length + notShown.filter((n) => FORMATS.some((f) => f.id === n.id)).length, FORMATS.length, h);
    assert.ok(built.length >= 15, `${h}: only ${built.length} formats offered`);
    // Ranked by the library's archetype score, best first.
    for (let i = 1; i < built.length; i++) assert.ok(built[i - 1].meta.score >= built[i].meta.score, `${h} ranking`);
    for (const b of built) {
      assert.equal(b.spec.layout, FORMATS.find((f) => f.id === b.id).layout, `${h} ${b.id}`);
      assert.deepEqual(b.layout, [], `${h} ${b.id} layout: ${b.layout}`);
      assert.ok(b.ad.on_image_text.includes("Hide Nothing."), `${h} ${b.id}: sign-off scored`);
      assert.ok(b.meta.template && b.meta.risk_label, `${h} ${b.id}: catalog template + risk`);
      assert.ok(["ready", "needs_input"].includes(b.meta.status));
      if (b.meta.status === "needs_input") assert.ok(b.meta.missing.length && (b.meta.fields.length || b.meta.photos.length), `${h} ${b.id}: a draft says what's missing and how to add it`);
      // Every format renders without throwing.
      assert.ok(renderAdSvg(b.spec).startsWith("<svg"));
    }
    for (const n of notShown) assert.ok(n.why.length > 10, `${h} ${n.label} needs a reason`);
    assert.ok(built.find((b) => b.id === "hero").meta.status === "ready");
  }
});

test("existing app formats keep drawing exactly what's scored", () => {
  for (const h of HANDLES) {
    const s = sheet(h), copy = verbatimCopy(s);
    for (const f of formatOptions(copy, s).filter((x) => x.available)) {
      const spec = specFromCopy(copy, s, f.id), ad = adFromCopy(copy, s, f.id);
      assert.deepEqual(layoutProblems(spec), [], `${h} ${f.id}`);
      if (f.id === "stat") assert.ok(ad.on_image_text.includes(spec.stat.value) && ad.on_image_text.includes(spec.stat.label));
      if (f.id === "review") assert.ok(ad.on_image_text.includes(spec.review.quote) && ad.footnote.includes("Results vary"));
      if (f.id === "question") assert.equal(ad.headline, spec.question);
      if (f.id === "offer") assert.ok(ad.on_image_text.includes(spec.offer.line) && /T&C/.test(ad.footnote + spec.offer.condition));
    }
  }
});

test("study numbers and quotes are taken whole from the page, never cut", () => {
  const sal = sheet("salicylic-acid-2");
  const st = pickStat(sal);
  assert.equal(`${st.value} ${st.label}`, sal.facts.find((f) => f.id === st.id).text);
  const nia = sheet("niacinamide-10-with-matmarine");
  const q = pickQuote(nia);
  assert.ok(q.verified && q.stars >= 4 && q.name && q.date, JSON.stringify(q));
  const pageOnly = { ...nia, url: "https://beminimalist.co/products/not-captured" };
  const pq = pickQuote(pageOnly);
  assert.ok(nia.facts.find((f) => f.id === pq.id).text.includes(pq.quote));
  assert.equal(pq.name, "Charu S.");
  assert.equal(pickQuote({ facts: [{ id: "F1", kind: "testimonial", text: `"${"Lovely serum, ".repeat(30)}" -Asha K.` }] }), null);
});

test("badges never use page label lines", () => {
  const s = sheet("niacinamide-10-with-matmarine");
  const copy = { ...verbatimCopy(s), proof_points: ["Pregnancy/Lactation: Safe", "Lightweight, no sticky residue"] };
  assert.deepEqual(specFromCopy(copy, s, "badges").badges.map((b) => b.text), ["Lightweight, no sticky residue"]);
});

test("offer, price and rating quote the captured data exactly, with its date", () => {
  const s = sheet("salicylic-acid-2"), copy = verbatimCopy(s);
  const offer = buildFormat("offer", copy, s);
  assert.equal(offer.meta.status, "ready");
  assert.equal(offer.spec.offer.line, "Buy 2, Get 3rd Free");
  assert.match(offer.ad.primary_text, /captured 2026-10-02/); // the capture date goes with the caption (leanBrief)
  assert.match(offer.spec.offer.condition, /T&C apply/);
  const price = buildFormat("pricecompare", copy, s);
  assert.ok(price.spec.prices.every((p) => /^₹\d/.test(p.value)) && /captured/.test(price.spec.prices[1].note));
  const rating = buildFormat("socialproof", copy, s);
  assert.match(`${rating.spec.proof.value} ${rating.spec.proof.label}`, /^4\/5 stars, from 1,969 reviews$/);
  // A typed offer is flagged as unsourced, never passed off as captured.
  const typed = buildFormat("offer", copy, s, { offer: { values: { offer_id: "own", line: "Flat 50% off", condition: "On orders above Rs. 999. T&C apply." } } });
  assert.equal(typed.meta.typed.length, 2);
  assert.ok(["medium", "high", "severe"].includes(typed.meta.risk));
});

test("drafts show placeholders on the image but never score them", () => {
  const s = sheet("salicylic-acid-2"), copy = verbatimCopy(s);
  const d = buildFormat("usvsthem", copy, s);
  assert.equal(d.meta.status, "needs_input");
  assert.ok(renderAdSvg(d.spec).includes("[Benchmark]"));
  assert.ok(!/\[/.test(Object.values(d.ad).join(" ")), "no [placeholder] reaches the scorer");
  // Filled in, it becomes ready (typed lines stay flagged).
  const v = { them: "Other salicylic acid serums", r1_label: "Salicylic acid strength", r1_us: "2%", r1_them: "0.5-2%", basis: "Per the brand's product page." };
  const f = buildFormat("usvsthem", copy, s, { usvsthem: { values: v } });
  assert.equal(f.meta.status, "ready");
  assert.equal(f.meta.risk, "high");
  assert.ok(f.meta.typed.length >= 4);
});

test("people and before/after photos carry the AI mark and Severe risk, like the library", () => {
  // Since 2026-10-05 every best seller has a library AI person image, so the format is ready with the AI mark; a
  // product with none (here: an unknown handle) still asks for a photo.
  const s = sheet("light-fluid-spf-50-sunscreen"), copy = verbatimCopy(s);
  const lib = buildFormat("person", copy, s);
  assert.equal(lib.meta.risk, "severe");
  if (lib.meta.status === "ready") assert.equal(lib.spec.aiLabel, true);
  const empty = buildFormat("person", copy, { ...s, url: "https://beminimalist.co/products/no-such-product" });
  assert.equal(empty.meta.status, "needs_input");
  assert.equal(empty.spec.aiLabel, false);
  const withPhoto = buildFormat("person", copy, s, { person: { photos: { person: true } } });
  assert.equal(withPhoto.meta.status, "ready");
  assert.equal(withPhoto.spec.aiLabel, true);
  assert.equal(withPhoto.meta.risk, "severe");
  const ba = buildFormat("before_after", copy, s, { before_after: { photos: { before: true, after: true } } });
  assert.equal(ba.spec.aiLabel, true);
  assert.deepEqual(ba.layout, []);
  assert.equal(buildFormat("before_after", copy, { ...s, url: "https://beminimalist.co/products/no-such-product" }).meta.status, "needs_input", "no AI frames and no upload: still asks for the photos");
  assert.equal(buildFormat("timeline", copy, { ...s, url: "https://beminimalist.co/products/no-such-product" }).notFit.length > 10, true, "no AI progress frames for this product: not offered, with a reason");
});

// User, 2026-10-05: ads made in the app use our AI images, without asking for uploads.
const servable = (u) => { assert.ok(u.startsWith("/img/"), u); assert.ok(imageFile(decodeURIComponent(u.slice(5))), `not servable: ${u}`); };

test("texture format uses the approved ChatGPT texture shot, Low risk, with the AI mark (DEC-04)", () => {
  for (const h of HANDLES) {
    const s = sheet(h), copy = verbatimCopy(s);
    const t = buildFormat("texture", copy, s);
    assert.equal(t.meta.status, "ready", h);
    assert.equal(t.spec.textureScene, true);
    assert.equal(t.spec.aiLabel, true);
    assert.equal(t.spec.cutout, false);
    assert.match(t.spec.imageSrc, /\/ai_renders\/[^/]+\/texture\d\.png$/);
    servable(t.spec.imageSrc);
    assert.equal(t.meta.risk, "low");
    assert.match(t.meta.risk_note, /DEC-04/);
    assert.deepEqual(t.layout, []);
    assert.equal(t.meta.photos.length, 0, "no upload asked for");
    assert.ok(renderAdSvg({ ...t.spec, imageHref: "data:image/png;base64,AAAA" }).includes("AI-GENERATED"), "the AI mark is drawn");
    assert.match(t.ad.footnote, /AI illustration/);
  }
  // not an approved shot (or no shot): falls back to the real texture photo / an upload, never an unapproved image
  assert.equal(textureScene("not-a-product"), null);
  assert.equal(textureScene("../x"), null);
});

test("person, creator, before/after and timeline reuse the product's AI images (AI mark, Severe), no upload needed", () => {
  const s = sheet("niacinamide-10-with-matmarine"), copy = verbatimCopy(s);
  for (const id of ["person", "creator"]) {
    const b = buildFormat(id, copy, s);
    assert.equal(b.meta.status, "ready", id);
    assert.equal(b.meta.risk, "severe");
    assert.equal(b.spec.aiLabel, true);
    assert.match(b.spec.personSrc, /\/pipeline\/runs\/[^/]+\/backgrounds\/niacinamide-10-with-matmarine__t\d+\.person\.png$/);
    servable(b.spec.personSrc);
    assert.ok(b.meta.photos.every((p) => /^Optional/.test(p.label)), "an upload is only an optional replacement");
    // an uploaded photo takes over from the AI image
    const own = buildFormat(id, copy, s, { [id]: { photos: { person: true } } });
    assert.equal(own.spec.personSrc, undefined);
    assert.equal(own.spec.aiLabel, true);
  }
  assert.match(buildFormat("creator", copy, s).spec.personSrc, /__t31\.person\.png$/, "creator posts prefer the selfie-style image");
  const ba = buildFormat("before_after", copy, s);
  assert.equal(ba.meta.status, "ready");
  assert.equal(ba.spec.photoSrcs.length, 2);
  ba.spec.photoSrcs.forEach(servable);
  assert.deepEqual(ba.layout, []);
  assert.equal(ba.meta.risk, "severe");
  const tl = buildFormat("timeline", copy, s);
  assert.equal(tl.spec.layout, "timeline");
  assert.equal(tl.meta.status, "ready");
  assert.equal(tl.meta.risk, "severe");
  assert.equal(tl.spec.aiLabel, true);
  assert.equal(tl.spec.packInFrames, true);
  assert.ok(tl.spec.frames.length >= 2 && tl.spec.frames.every((f) => f.label && f.imageSrc));
  tl.spec.frames.forEach((f) => servable(f.imageSrc));
  assert.deepEqual(tl.layout, []);
  assert.match(tl.ad.footnote, /not real results/);
  // frames always come from one run
  assert.equal(new Set(tl.spec.frames.map((f) => f.imageSrc.match(/runs\/([^/]+)\//)[1])).size, 1);
  // the one-call listing offers them without asking for anything
  const { built } = listFormats(copy, s);
  for (const id of ["person", "creator", "before_after", "timeline", "texture"]) assert.equal(built.find((b) => b.id === id)?.meta.status, "ready", id);
});

test("AI-drafted lines keep citations only while they check out against the page", () => {
  const s = sheet("salicylic-acid-2"), copy = verbatimCopy(s);
  const good = buildFormat("badges", copy, s, { badges: { values: { b1: "For combination & oily skin" }, cites: { b1: ["F9"] } } });
  assert.equal(good.meta.typed.length, 0);
  const bad = buildFormat("badges", copy, s, { badges: { values: { b1: "Clears acne in 3 days" }, cites: { b1: ["F9"] } } });
  assert.equal(bad.meta.typed.length, 1, "a number the cited fact doesn't have loses its citation");
});

test("routine and range use other real products from the catalogue, each with its own pack", () => {
  const s = sheet("salicylic-acid-2"), copy = verbatimCopy(s);
  const j = buildFormat("journey", copy, s);
  assert.equal(j.spec.steps.length, 3);
  assert.ok(j.spec.steps.every((x) => x.imageSrc));
  // Night-only serum: the routine ends with a moisturiser, not sunscreen.
  assert.match(j.spec.headline, /moisturiser$/);
  const r = buildFormat("range", copy, s);
  assert.ok(r.spec.range.length >= 2 && r.spec.range.every((x) => x.imageSrc && x.label.length <= 40));
});

test("the product visual comes from the asset library on disk when there is one", () => {
  // The verified render is used whole (its cut left a ragged base, user review 2026-10-05).
  assert.ok(/ai_renders\/salicylic-lha-2-cleanser\/round\d\.png$/.test(packVisual("salicylic-lha-2-cleanser").file), "verified render first");
  assert.equal(packVisual("salicylic-lha-2-cleanser").cutout, false);
  assert.ok(packVisual("not-a-product", { images: ["https://cdn.shopify.com/x.png"] }).url);
});

test("all formats are checked in one quick call; the judge runs per format later", async () => {
  const s = sheet("salicylic-acid-2"), copy = verbatimCopy(s);
  const t = Date.now();
  const out = await allFormats(copy, s);
  assert.ok(Date.now() - t < 3000, "rules-only for every format stays fast");
  assert.equal(Object.keys(out.items).length, out.formats.length);
  const one = await formatItem(copy, s, "offer", {}, { rulesOnly: true });
  assert.equal(one.meta.id, "offer");
});

test("the existing library is read for the product, grouped by format", () => {
  const lib = libraryFor("salicylic-acid-2");
  assert.ok(lib.count > 0 && lib.groups.length > 0);
  const ad = lib.groups[0].ads[0];
  assert.ok(ad.png.startsWith("/library/salicylic-acid-2/") && ["low", "medium", "high", "severe"].includes(ad.risk));
  for (const g of lib.groups) for (const a of g.ads) if (a.risk === "severe") assert.equal(a.exportable, false);
  assert.deepEqual(libraryFor("../secrets").groups, []);
  assert.ok(Array.isArray(imageRequests("salicylic-acid-2")));
});
