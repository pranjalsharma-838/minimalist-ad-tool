import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { extractFromAnyUrl as extractRaw, checkPublicUrl, BLOCKED_MSG, NOT_MINIMALIST } from "../lib/extract_generic.js";
import { handleOf, requestHandle } from "../lib/live_facts.js";
import { specFromBrief, adFromBrief } from "../lib/brief_check.js";
import { renderAdSvg } from "../public/render.js";
import { verbatimCopy, allFormats } from "../lib/generate.js";

const extractFromAnyUrl = (u, o = {}) => extractRaw(u, { anyHost: true, ...o });
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

test("other sites are refused (Minimalist only); a beminimalist.co page the dedicated parser can't read falls back to the generic reader", async () => {
  await assert.rejects(extractRaw("https://foxtale.in/products/x", { fetchImpl: fake({}) }), (e) => e.message === NOT_MINIMALIST);
  const html = '<html><head><meta property="og:title" content="Rose Water Toner 2% | Minimalist"></head><body><main><h1>Rose Water Toner 2%</h1><ul><li>Gentle toner that refreshes the skin.</li><li>Suitable for all skin types.</li><li>Get 12 coins on this order</li><li>Apply with a cotton pad after cleansing.</li></ul></main></body></html>';
  const s = await extractRaw("https://beminimalist.co/products/rose-water-toner-2", { dedicated: false, fetchImpl: fake({ "https://beminimalist.co/": { body: html } }) });
  assert.equal(s.brand_site, "minimalist");
  assert.equal(handleOf(s), "rose-water-toner-2");
  assert.ok(!s.facts.some((f) => ["claim", "suitability", "usage"].includes(f.kind) && /coins/.test(f.text)));
});

test("a Minimalist product with no verified render queues a studio render request, and its result swaps in as the pack image", async () => {
  const fs2 = await import("node:fs"), os = await import("node:os"), pth = await import("node:path");
  const dir = fs2.mkdtempSync(pth.join(os.tmpdir(), "render-test-")); process.env.STUDIO_QUEUE_DIR = dir; delete process.env.OPENAI_API_KEY;
  const html = '<html><head><meta property="og:title" content="Rose Water Toner 2% | Minimalist"><meta property="og:image" content="https://cdn.shopify.com/s/files/x.jpg"></head><body><main><h1>Rose Water Toner 2%</h1><ul><li>Gentle toner that refreshes the skin.</li><li>Suitable for all skin types.</li><li>Apply with a cotton pad after cleansing.</li></ul></main></body></html>';
  const s = await extractRaw("https://beminimalist.co/products/rose-water-toner-2", { dedicated: false, fetchImpl: fake({ "https://beminimalist.co/": { body: html } }) });
  const { generateAd } = await import("../lib/generate.js");
  const out = await generateAd(s, { mode: "verbatim" });
  assert.ok(out.requests.render && out.requests.texture, "render + texture requested");
  assert.equal(out.items.hero.spec.imageSrc, s.images[0], "page image shows at once");
  const id = out.requests.render;
  fs2.writeFileSync(pth.join(dir, id + ".png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
  fs2.writeFileSync(pth.join(dir, id + ".result.json"), JSON.stringify({ status: "done", image: pth.join(dir, id + ".png"), notes: "label verified" }));
  const out2 = await allFormats(verbatimCopy(s), s, { fresh: true, requests: out.requests });
  assert.match(out2.items.hero.spec.imageSrc, /^\/api\/request-image\?id=/);
  fs2.rmSync(dir, { recursive: true, force: true });
});

test("another brand never gets Minimalist's captured offers; only its own page's offers, else no Offer format", async () => {
  const { buildFormat } = await import("../lib/app_formats.js");
  const none = await extractFromAnyUrl("https://calmco.example/p/barrier-cream", { day: "2026-10-05", fetchImpl: fake({ "https://calmco.example/": { body: fx("jsonld.html") } }) });
  assert.ok(buildFormat("offer", verbatimCopy(none), none).notFit);
  const html = '<html><head><meta property="og:title" content="Serum X | B"></head><body><main><h1>Serum X</h1><p>Buy 1 Get 1 free on all serums today.</p><p>Brightening serum for even looking skin.</p><p>Suitable for all skin types and tones.</p><p>Apply two drops every morning on clean skin.</p></main></body></html>';
  const s = await extractFromAnyUrl("https://b.example/p/x", { day: "2026-10-05", fetchImpl: fake({ "https://b.example/": { body: html } }) });
  const b = buildFormat("offer", verbatimCopy(s), s);
  assert.ok(!b.notFit && /Buy 1 Get 1/.test(b.brief.offer.line) && !/3rd|Get 3/i.test(JSON.stringify(b.brief)));
});

test("formats with empty slots are not in the grid; they are listed as not offered with a fill-in draft", async () => {
  const s = await extractFromAnyUrl("https://calmco.example/p/barrier-cream", { day: "2026-10-05", fetchImpl: fake({ "https://calmco.example/": { body: fx("jsonld.html") } }) });
  const out = await allFormats(verbatimCopy(s), s, { fresh: true, requests: {} });
  assert.ok(out.formats.every((f) => f.status !== "needs_input"));
  const d = out.notShown.filter((n) => n.draft);
  assert.ok(d.length >= 1 && d.every((n) => out.items[n.id] && n.why.startsWith("needs ")));
  assert.ok(out.drafts.length === d.length);
});

test("promo / loyalty / cart lines never become product claims; they are offers from the page, dated", async () => {
  const html = '<html><head><meta property="og:title" content="Ceramide Moisturizer | Minimalist"></head><body><main><h1>Ceramide Moisturizer</h1><ul><li>Get 24 foxcoins on this order</li><li>Free shipping above Rs. 499</li><li>Add to cart for fast delivery</li><li>Deeply hydrates dry skin for the whole day.</li><li>Lightweight cream that absorbs quickly.</li><li>Suitable for all skin types and concerns.</li></ul></main></body></html>';
  const s = await extractFromAnyUrl("https://foxtale.example/products/cm", { day: "2026-10-05", fetchImpl: fake({ "https://foxtale.example/": { body: html } }) });
  const claims = s.facts.filter((f) => ["claim", "suitability", "usage"].includes(f.kind)).map((f) => f.text).join("|");
  assert.ok(!/foxcoins|shipping|cart/i.test(claims));
  assert.equal(verbatimCopy(s).headline.includes("foxcoins"), false);
  const o = s.facts.find((f) => f.kind === "offer");
  assert.ok(o && /foxcoins/.test(o.text) && /as shown on foxtale\.example, 2026-10-05/.test(o.text));
});

test("verbatim copy never picks a line the rules flag at fix or block (hair-fall claim)", async () => {
  const { runRules } = await import("../lib/rules.js");
  const s = { url: "https://beminimalist.co/products/hair-x", title: "Hair Serum 15%", actives: [], images: [], source: "page", facts: [
    { id: "F1", section: "Product name", kind: "name", text: "Hair Serum 15%" },
    { id: "F2", section: "Tagline", kind: "claim", text: "Reduces Hair Fall & grey hair, Promotes Hair Growth" },
    { id: "F3", section: "Tagline", kind: "claim", text: "Lightweight serum for scalp and hair." },
    { id: "F4", section: "Usage", kind: "usage", text: "Apply 4 drops on the scalp daily." }] };
  const bad = runRules({ ad_type: "brand", headline: s.facts[1].text, primary_text: "", on_image_text: "", footnote: "", cta: "" }, {});
  assert.ok(bad.some((x) => ["block", "fix"].includes(x.severity)), "fixture line is flagged");
  for (const v of [0, 1, 2, 3, 4]) {
    const c = verbatimCopy(s, v);
    for (const t of [c.headline, c.subhead, ...c.proof_points]) assert.ok(!/hair fall|hair growth/i.test(t), `variant ${v}: ${t}`);
  }
});

