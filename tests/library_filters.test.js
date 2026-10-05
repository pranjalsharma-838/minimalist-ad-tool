// The filter, sort, count and URL-hash logic behind the existing-ads library and the image library (public/filters.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  adDefaults, cleanAdState, filterAds, sortAds, adFacetCounts, adOptions, activeAdFilters, countText, verdictKey, sizeKeys, defaultAdSort,
  imgDefaults, cleanImgState, filterImages, sortImages, imgFacetCounts, imgProductOptions, usableInAds, imgGroupOf, activeImgFilters,
  parseHash, buildHash, IMG_GROUPS,
} from "../public/filters.js";
import { libraryAll } from "../lib/library.js";
import { listImages, TYPES } from "../lib/images.js";

const ad = (o) => ({ id: "x", handle: "p1", product: "Product One", fmt: "hero", fmt_title: "Clean product hero", template: "#1 Clean product hero", title: "Clean product hero", run: "2026-10-01-a", risk: "low", ai: false, exportable: true, verdict: "Ready for human review (rules + AI judge)", caption: "", on_image: [], placements: [{ label: "4:5" }, { label: "9:16" }], scores: { alignment: 80, win: 70, verdict: "READY_FOR_REVIEW" }, ...o });
const SAMPLE = [
  ad({ id: "a", handle: "niacinamide", product: "Niacinamide 10% Serum", fmt: "texture", fmt_title: "Texture shot", risk: "low", scores: { alignment: 90, win: 60, verdict: "READY_FOR_REVIEW" }, on_image: ["Headline: Smooth, even skin"], caption: "Apply twice a day" }),
  ad({ id: "b", handle: "niacinamide", product: "Niacinamide 10% Serum", fmt: "before-after", fmt_title: "Before / after", risk: "severe", ai: true, exportable: false, run: "2026-10-03-b", scores: { alignment: 60, win: 85, verdict: "BLOCKED" }, placements: [{ label: "4:5" }, { label: "9:16" }, { label: "hi" }] }),
  ad({ id: "c", handle: "arbutin", product: "Alpha Arbutin 2%", fmt: "texture", fmt_title: "Texture shot", risk: "medium", run: "2026-10-02-c", scores: { alignment: 75, win: 40, verdict: "NEEDS_CHANGES" }, placements: [{ label: "4:5" }, { label: "hi" }, { label: "ta" }] }),
  ad({ id: "d", handle: "arbutin", product: "Alpha Arbutin 2%", fmt: "hero", risk: "high", scores: null, verdict: "Fix before review (rules only)", placements: [] }),
];
const ids = (l) => l.map((a) => a.id).join("");

test("each ad filter narrows the list the way its label says", () => {
  const f = (o) => ids(filterAds(SAMPLE, { ...adDefaults(), ...o }));
  assert.equal(f({}), "abcd");
  assert.equal(f({ product: "arbutin" }), "cd");
  assert.equal(f({ fmt: "texture" }), "ac");
  assert.equal(f({ verdict: ["blocked"] }), "b");
  assert.equal(f({ verdict: ["ready", "fix"] }), "acd"); // d has no scores: its description line says "Fix before review"
  assert.equal(f({ exp: "no" }), "b");
  assert.equal(f({ exp: "yes" }), "acd");
  assert.equal(f({ risk: ["low", "severe"] }), "ab");
  assert.equal(f({ ai: "yes" }), "b");
  assert.equal(f({ ai: "no" }), "acd");
  assert.equal(f({ size: ["hi"] }), "bc");
  assert.equal(f({ size: ["hi", "ta"] }), "c"); // has to have every ticked size
  assert.equal(f({ size: ["9x16"] }), "ab");
  assert.equal(f({ align: 70 }), "ac"); // 90 and 75; b is 60; d is unscored so it cannot meet a minimum
  assert.equal(f({ win: 60 }), "ab");
  assert.equal(f({ align: 70, win: 50 }), "a");
  assert.equal(f({ q: "smooth" }), "a"); // headline
  assert.equal(f({ q: "twice a day" }), "a"); // caption, every word
  assert.equal(f({ q: "arbutin" }), "cd"); // product
  assert.equal(f({ q: "before" }), "b"); // format
  assert.equal(f({ q: "zzz" }), "");
  assert.equal(f({ risk: ["low"], exp: "yes", q: "texture" }), "a"); // filters combine (AND)
});

test("verdict comes from the scorer, else from the description line", () => {
  assert.equal(verdictKey(SAMPLE[1]), "blocked");
  assert.equal(verdictKey(SAMPLE[3]), "fix");
  assert.equal(verdictKey({ verdict: "Ready for human review (limited check) (rules only)" }), "ready");
  assert.equal(verdictKey({ verdict: "Do not publish (rules + AI judge)" }), "blocked");
  assert.equal(verdictKey({}), "");
  assert.deepEqual(sizeKeys(SAMPLE[2]), ["4x5", "hi", "ta"]);
});

test("sorting: best alignment, best win, newest, product; unscored last; input untouched", () => {
  const before = ids(SAMPLE);
  assert.equal(ids(sortAds(SAMPLE, "align", "all")), "acbd");
  assert.equal(ids(sortAds(SAMPLE, "win", "all")), "bacd");
  assert.equal(ids(sortAds(SAMPLE, "new", "all")), "bcda"); // runs 10-03, 10-02, then a and d share 10-01 (tie: product A to Z)
  assert.equal(ids(sortAds(SAMPLE, "product", "all")), "dcba"); // Alpha Arbutin, then Niacinamide; within a product by format name
  assert.equal(ids(SAMPLE), before);
  // "fmt" (grouped by format) is the default for one product's library only
  assert.equal(defaultAdSort("p"), "fmt");
  assert.equal(defaultAdSort("all"), "align");
  assert.equal(ids(sortAds(SAMPLE, "fmt", "p")), "bdca");
  assert.equal(ids(sortAds(SAMPLE, "", "p")), "bdca");
  assert.equal(ids(sortAds(SAMPLE, "fmt", "all")), ids(sortAds(SAMPLE, "align", "all")));
});

test("option counts ignore the filter they belong to, so every option shows what ticking it would give", () => {
  const st = { ...adDefaults(), risk: ["low"], product: "arbutin" };
  assert.deepEqual(adFacetCounts(SAMPLE, st, "risk"), { medium: 1, high: 1 }); // product filter applies, risk does not
  assert.deepEqual(adFacetCounts(SAMPLE, st, "product"), { niacinamide: 1 }); // risk=low applies (only a), product does not
  assert.deepEqual(adFacetCounts(SAMPLE, adDefaults(), "size"), { "4x5": 3, "9x16": 2, hi: 2, ta: 1 });
  const o = adOptions(SAMPLE);
  assert.deepEqual(o.products.map((p) => p.label), ["Alpha Arbutin 2%", "Niacinamide 10% Serum"]);
  assert.deepEqual(o.formats.map((p) => p.key), ["before-after", "hero", "texture"]);
});

test("live count text and the number of switched-on filters", () => {
  assert.equal(countText(37, 153), "37 of 153 ads");
  assert.equal(countText(153, 153), "153 ads");
  assert.equal(countText(1, 1), "1 ad");
  assert.equal(countText(0, 153), "0 of 153 ads");
  assert.equal(countText(5, 40, "image"), "5 of 40 images");
  assert.equal(activeAdFilters(adDefaults()), 0);
  assert.equal(activeAdFilters({ ...adDefaults(), risk: ["low"], q: "x", align: 50, sort: "win" }), 3); // sort is not a filter
  assert.equal(activeAdFilters({ ...adDefaults(), product: "x" }, "p"), 0); // the product filter does not exist in one product's view
});

test("bad state is cleaned: unknown values dropped, sliders kept to 0-100", () => {
  const c = cleanAdState({ verdict: ["ready", "bogus", "ready"], risk: ["severe", "x"], size: ["hi", "zz"], exp: "maybe", ai: "yes", align: 250, win: -4, sort: "nope", q: "a".repeat(500) });
  assert.deepEqual(c.verdict, ["ready"]); assert.deepEqual(c.risk, ["severe"]); assert.deepEqual(c.size, ["hi"]);
  assert.equal(c.exp, ""); assert.equal(c.ai, "yes"); assert.equal(c.align, 100); assert.equal(c.win, 0); assert.equal(c.sort, ""); assert.equal(c.q.length, 200);
  assert.deepEqual(cleanAdState(), adDefaults());
});

test("URL hash round-trips and leaves out defaults", () => {
  assert.equal(buildHash({}), "");
  assert.equal(buildHash({ tab: "generate", lib: "all", ads: adDefaults() }), "#lib=all");
  const ads = { ...adDefaults(), product: "arbutin", fmt: "texture", verdict: ["ready", "fix"], exp: "yes", risk: ["low", "medium"], ai: "no", align: 70, win: 55, size: ["4x5", "hi"], q: "glow & shine", sort: "win" };
  const h = buildHash({ lib: "all", ads });
  assert.match(h, /^#lib=all&/);
  assert.ok(h.includes("verdict=ready,fix") && h.includes("risk=low,medium") && h.includes("size=4x5,hi"), h);
  const back = parseHash(h);
  assert.equal(back.lib, "all"); assert.equal(back.tab, "generate");
  assert.deepEqual(back.ads, ads);
  // one product's view: the handle is kept; the product filter and the grouped default sort are not written
  const p = buildHash({ lib: "p", h: "alpha-arbutin-2", ads: { ...adDefaults(), product: "ignored", sort: "fmt", risk: ["high"] } });
  assert.equal(p, "#lib=p&h=alpha-arbutin-2&risk=high");
  assert.equal(parseHash(p).h, "alpha-arbutin-2");
  // the image tab and its filters
  const img = { ...imgDefaults(), type: ["cutout", "scene"], product: "arbutin", use: "no", q: "bathroom shelf", sort: "product" };
  const hi = buildHash({ tab: "images", images: img });
  assert.deepEqual(parseHash(hi).images, img);
  assert.equal(parseHash(hi).tab, "images");
  // junk in the address bar is harmless
  const junk = parseHash("#t=evil&lib=p&h=../../x&verdict=zzz&align=abc&itype=nope");
  assert.equal(junk.tab, "generate"); assert.equal(junk.lib, ""); assert.deepEqual(junk.ads, adDefaults()); assert.deepEqual(junk.images, imgDefaults());
});

// ---- images ----
const IMG = [
  { url: "/img/1", type: "real_pack", handle: "niacinamide", product: "Niacinamide 10% Serum", label: "Real pack photo", file: "01.jpg", ai: false, notes: "front of pack", words: "real photo pack shot" },
  { url: "/img/2", type: "cutout", handle: "niacinamide", product: "Niacinamide 10% Serum", label: "Cut-out", file: "n_01.png", ai: false, notes: "", words: "cutout" },
  { url: "/img/3", type: "verified_render", handle: "arbutin", product: "Alpha Arbutin 2%", label: "Verified pack render", file: "round1.png", ai: true, status: "approved", use_in_ad: true, notes: "", words: "verified render" },
  { url: "/img/4", type: "verified_render", handle: "serum", product: "Other", label: "Verified pack render", file: "round2.png", ai: true, use_in_ad: false, notes: "", words: "verified render" },
  { url: "/img/5", type: "ai_texture", handle: "arbutin", product: "Alpha Arbutin 2%", label: "Texture shot", file: "texture1.png", ai: true, notes: "gel swatch", words: "texture" },
  { url: "/img/6", type: "real_texture", handle: "niacinamide", product: "Niacinamide 10% Serum", label: "Real texture photo", file: "n_tex.jpg", ai: false, notes: "", words: "real texture" },
  { url: "/img/7", type: "ai_scene", handle: "", product: "No specific product", label: "AI — Severe · AI scene", file: "s.png", ai: true, notes: "bathroom shelf", words: "scene severe" },
  { url: "/img/8", type: "review_photo", handle: "niacinamide", product: "Niacinamide 10% Serum", label: "Customer review photo", file: "r.jpg", ai: false, notes: "", words: "review" },
  { url: "/img/9", type: "requested", handle: "arbutin", product: "Alpha Arbutin 2%", label: "Image studio · done", file: "20261004.png", ai: true, status: "done", requested_at: "2026-10-04T10:00:00Z", prompt: "bottle on a marble sink", notes: "", words: "requested studio" },
  { url: "/img/10", type: "requested", handle: "arbutin", product: "Alpha Arbutin 2%", label: "Image studio · done", file: "20261005.png", ai: true, status: "done", requested_at: "2026-10-05T10:00:00Z", prompt: "morning light", notes: "", words: "requested studio" },
];
const iu = (l) => l.map((e) => e.url.slice(5)).join(",");
const fi = (o) => iu(filterImages(IMG, { ...imgDefaults(), ...o }));

test("image filters: type chips group the finer types, product, usable in ads, search", () => {
  assert.equal(fi({}), "1,2,3,4,5,6,7,8,9,10");
  assert.equal(fi({ type: ["real"] }), "1");
  assert.equal(fi({ type: ["cutout", "render"] }), "2,3,4"); // chips are OR-ed
  assert.equal(fi({ type: ["texture"] }), "5,6"); // verified AI texture and real texture
  assert.equal(fi({ type: ["scene"] }), "7");
  assert.equal(fi({ type: ["review"] }), "8");
  assert.equal(fi({ type: ["studio"] }), "9,10");
  assert.equal(fi({ product: "arbutin" }), "3,5,9,10");
  assert.equal(fi({ use: "yes" }), "1,2,3"); // real pack photo, cut-out, approved render; not the render marked use_in_ad false, studio images, scenes or review photos
  assert.equal(fi({ use: "no" }), "4,5,6,7,8,9,10");
  assert.equal(fi({ q: "bathroom shelf" }), "7"); // notes
  assert.equal(fi({ q: "marble sink" }), "9"); // prompt
  assert.equal(fi({ q: "cut-out" }), "2"); // label
  assert.equal(fi({ q: "real" }), "1,2,6,8"); // type names, search words and the real / AI flag
  assert.equal(fi({ type: ["texture"], product: "arbutin", use: "no" }), "5");
  assert.equal(usableInAds({ type: "real_pack", handle: "x" }), true);
  assert.equal(usableInAds({ type: "real_pack", handle: "" }), false);
  assert.equal(usableInAds({ type: "cutout", handle: "x", use_in_ad: false }), false);
  assert.ok(IMG_GROUPS.every((g) => g.types.every((t) => TYPES[t])), "every chip group maps to real image types");
});

test("image sort: default keeps the list order; product A-Z; newest studio images first; usable first", () => {
  assert.equal(iu(sortImages(IMG, "")), "1,2,3,4,5,6,7,8,9,10");
  assert.equal(iu(sortImages(IMG, "product")), "3,5,9,10,1,2,6,8,7,4"); // Alpha Arbutin, Niacinamide, No specific product, Other
  assert.equal(iu(sortImages(IMG, "new")).split(",").slice(0, 2).join(), "10,9");
  assert.equal(iu(sortImages(IMG, "usable")).split(",").slice(0, 3).join(), "1,2,3");
});

test("image option counts and cleaning", () => {
  assert.deepEqual(imgFacetCounts(IMG, { ...imgDefaults(), product: "arbutin" }, "type"), { render: 1, texture: 1, studio: 2 });
  assert.equal(imgProductOptions(IMG).length, 3);
  assert.equal(activeImgFilters(imgDefaults()), 0);
  assert.equal(activeImgFilters({ ...imgDefaults(), type: ["cutout"], sort: "new" }), 1);
  assert.deepEqual(cleanImgState({ type: ["cutout", "bogus"], use: "x", sort: "nope" }), { type: ["cutout"], product: "", use: "", q: "", sort: "" });
  assert.equal(imgGroupOf({ type: "ai_texture" }), "texture");
});

// ---- against the real library ----
test("filters work on the real ad library and the real image list", () => {
  const { ads, count } = libraryAll();
  assert.equal(ads.length, count);
  assert.ok(count > 100);
  for (const a of ads) for (const k of ["handle", "product", "fmt", "fmt_title", "png", "run"]) assert.ok(a[k], `${k} missing on ${a.id}`);
  assert.equal(new Set(ads.map((a) => a.id)).size, ads.length, "ad ids are unique across products");
  // every ad has a verdict the chips can match
  assert.ok(ads.every((a) => verdictKey(a)), "an ad has no verdict the chips can match");
  assert.equal(filterAds(ads, { ...adDefaults(), verdict: ["ready", "fix", "blocked"] }).length, count);
  const risk = adFacetCounts(ads, adDefaults(), "risk");
  assert.equal(Object.values(risk).reduce((a, b) => a + b, 0), count);
  // The curated library (scripts/curate_library.js) holds only good, exportable ads: nothing Severe, nothing blocked.
  assert.equal(filterAds(ads, { ...adDefaults(), risk: ["severe"] }).length, 0);
  assert.ok(ads.every((a) => a.exportable !== false), "a not-exportable ad is still in the library");
  assert.ok(filterAds(ads, { ...adDefaults(), exp: "yes", ai: "yes" }).every((a) => a.exportable && a.ai));
  const top = sortAds(filterAds(ads, { ...adDefaults(), align: 90 }), "align", "all");
  assert.ok(top.length > 0 && top.every((a) => a.scores.alignment >= 90));
  assert.ok(top.every((a, i) => !i || top[i - 1].scores.alignment >= a.scores.alignment));
  const list = listImages();
  assert.ok(list.every((e) => typeof e.words === "string"));
  // the chip groups partition the whole list: every image falls in exactly one
  assert.equal(IMG_GROUPS.reduce((n, g) => n + filterImages(list, { ...imgDefaults(), type: [g.key] }).length, 0), list.length);
  // same words, same answer as the server-side search
  for (const q of ["texture", "alpha arbutin cut-out", "review photo", "ai generated"]) assert.equal(filterImages(list, { ...imgDefaults(), q }).length, listImages({ q }).length, q);
});
