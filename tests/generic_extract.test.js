import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { extractFromAnyUrl, checkPublicUrl, BLOCKED_MSG } from "../lib/extract_generic.js";
import { handleOf, requestHandle } from "../lib/live_facts.js";
import { specFromBrief, adFromBrief } from "../lib/brief_check.js";
import { renderAdSvg } from "../public/render.js";
import { verbatimCopy, allFormats } from "../lib/generate.js";

const fx = (n) => fs.readFileSync(`tests/fixtures/${n}`, "utf8");
const fake = (map) => async (url) => { const k = Object.keys(map).find((x) => url.startsWith(x)); const r = map[k] || { status: 404, body: "" }; return { ok: (r.status || 200) < 400, status: r.status || 200, text: async () => r.body }; };

test("generic Shopify page: page + product .js JSON, brand from vendor, price, image, actives from title", async () => {
  const s = await extractFromAnyUrl("https://acmeskin.example/products/glow-serum", { day: "2026-10-05", fetchImpl: fake({ "https://acmeskin.example/products/glow-serum.js": { body: fx("shopify.js.json") }, "https://acmeskin.example/products/glow-serum": { body: fx("shopify.html") } }) });
  assert.equal(s.extracted_via, "shopify");
  assert.equal(s.title, "Glow Serum 10% Vitamin C");
  assert.equal(s.brand, "Acme Skin");
  assert.equal(s.price, 599);
  assert.deepEqual(s.actives[0], { name: "Glow Serum", pct: "10%" });
  assert.match(s.images[0], /^https:\/\/cdn\.shopify\.com\//);
  assert.ok(s.facts.filter((f) => f.kind === "usage").length >= 1 && s.facts.some((f) => f.kind === "suitability"));
  assert.equal(handleOf(s), "", "no Minimalist data keyed for another brand");
  assert.match(s.slug, /^acmeskin-/);
});

test("JSON-LD Product page: name, description facts, brand, price, rating and review", async () => {
  const s = await extractFromAnyUrl("https://calmco.example/p/barrier-cream", { day: "2026-10-05", fetchImpl: fake({ "https://calmco.example/": { body: fx("jsonld.html") } }) });
  assert.equal(s.extracted_via, "jsonld");
  assert.equal(s.brand, "Calm Co");
  assert.equal(s.price, 449);
  assert.ok(s.facts.some((f) => f.kind === "rating" && /4\.4 out of 5.*212/.test(f.text)));
  assert.ok(s.facts.some((f) => f.kind === "review" && /Feels soft/.test(f.text)));
  assert.ok(s.facts.some((f) => f.kind === "usage" && /twice a day/i.test(f.text)));
  assert.equal(s.images[0], "https://img.calmco.example/barrier.jpg");
});

test("OpenGraph-only page: meta + visible text, boilerplate dropped", async () => {
  const s = await extractFromAnyUrl("https://sunnylabs.example/sun-gel", { day: "2026-10-05", fetchImpl: fake({ "https://sunnylabs.example/": { body: fx("og.html") } }) });
  assert.equal(s.extracted_via, "opengraph");
  assert.equal(s.title, "Pure Sun Gel SPF 50");
  assert.equal(s.brand, "Sunny Labs");
  assert.equal(s.images[0], "https://sunnylabs.example/img/sun.jpg");
  const txt = s.facts.map((f) => f.text).join("|");
  assert.match(txt, /No white cast/);
  assert.ok(!/Add to cart|Copyright|Skip to content/.test(txt));
});

test("too few facts, bot-blocked sites and non-public addresses give clear messages", async () => {
  await assert.rejects(extractFromAnyUrl("https://thin.example/products/x", { fetchImpl: fake({ "https://thin.example/": { body: "<html><head><title>X</title></head><body><h1>X</h1></body></html>" } }) }), /Enter manually/);
  await assert.rejects(extractFromAnyUrl("https://www.amazon.in/dp/B000", { fetchImpl: fake({}) }), (e) => e.message === BLOCKED_MSG);
  await assert.rejects(extractFromAnyUrl("https://shop.example/p/1", { fetchImpl: fake({ "https://shop.example/": { status: 403, body: "" } }) }), (e) => e.message === BLOCKED_MSG);
  assert.throws(() => checkPublicUrl("http://127.0.0.1:5173/x"));
  assert.throws(() => checkPublicUrl("file:///etc/passwd"));
});

test("another brand's ads carry its name, no Minimalist sign-off, and formats still build", async () => {
  const s = await extractFromAnyUrl("https://calmco.example/p/barrier-cream", { day: "2026-10-05", fetchImpl: fake({ "https://calmco.example/": { body: fx("jsonld.html") } }) });
  const copy = verbatimCopy(s);
  const out = await allFormats(copy, s, { fresh: true, requests: {} });
  const hero = out.items.hero;
  assert.equal(hero.spec.brand, "Calm Co");
  const svg = renderAdSvg({ ...hero.spec, imageHref: "" });
  assert.ok(svg.includes("Calm Co") && !svg.includes("Hide Nothing.") && !svg.includes(">Minimalist<"));
  assert.ok(out.formats.length >= 5);
  assert.equal(requestHandle(s), s.slug);
});
