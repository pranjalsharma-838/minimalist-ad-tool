// Image library: the list (/api/images), its search, and that the /img/ route serves only image files in the allowed folders.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { listImages, imageFile, TYPES } from "../lib/images.js";
import { libraryFor } from "../lib/library.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const decode = (u) => u.replace(/^\/img\//, "");

test("lists every kind of image with the fields the app needs", () => {
  const all = listImages();
  assert.ok(all.length > 100, `expected the full library, got ${all.length}`);
  const types = new Set(all.map((e) => e.type));
  for (const t of ["real_pack", "cutout", "verified_render", "ai_texture", "ai_scene", "review_photo"]) assert.ok(types.has(t), `missing type ${t}`);
  for (const t of types) assert.ok(TYPES[t], `unknown type ${t}`);
  for (const e of all) {
    for (const k of ["url", "type", "label", "usage"]) assert.ok(typeof e[k] === "string" && e[k], `${k} missing on ${e.url}`);
    assert.equal(typeof e.ai, "boolean");
    assert.ok(imageFile(decode(e.url)), `listed file is not servable: ${e.url}`);
  }
});

test("marks AI scenes Severe and review photos reference-only", () => {
  const scene = listImages({ type: "ai_scene" })[0];
  assert.match(scene.label, /AI — Severe/);
  assert.equal(scene.ai, true);
  const review = listImages({ type: "review_photo" })[0];
  assert.match(review.usage, /permission/i);
  assert.equal(review.ai, false);
});

test("verified renders and textures come from the accepted file only", () => {
  for (const e of listImages({ type: "verified_render" })) assert.match(e.url, /\/ai_renders\/[^/]+\/round\d\.png$/);
  for (const e of listImages({ type: "ai_texture" })) assert.match(e.url, /\/ai_renders\/[^/]+\/texture\d\.png$/);
  assert.equal(listImages().filter((e) => /_check\.png$/.test(e.url)).length, 0);
});

test("search filters by product, type and words", () => {
  const all = listImages();
  const one = listImages({ handle: "alpha-arbutin-2" });
  assert.ok(one.length > 3 && one.length < all.length);
  assert.ok(one.every((e) => e.handle === "alpha-arbutin-2"));
  const tex = listImages({ q: "texture" });
  assert.ok(tex.length >= 1 && tex.length < all.length);
  const both = listImages({ q: "alpha arbutin cut-out" });
  assert.ok(both.some((e) => e.type === "cutout") && both.every((e) => e.handle === "alpha-arbutin-2") && both.length < one.length);
  assert.equal(listImages({ q: "zzzz-no-such-image-xyz" }).length, 0);
  // words from the notes are searchable too (every word has to match)
  const note = one.find((e) => e.notes);
  const word = note.notes.split(/\s+/).find((w) => /^[a-z]{6,}$/i.test(w));
  assert.ok(listImages({ q: word, handle: "alpha-arbutin-2" }).some((e) => e.url === note.url), `searching "${word}" should find ${note.url}`);
});

test("file route refuses traversal, absolute paths, other folders and non-images", () => {
  const ok = decode(listImages({ type: "cutout" })[0].url);
  assert.ok(imageFile(ok));
  const bad = [
    "../server.js", "..%2fserver.js", "%2e%2e/server.js", "brand_packs/minimalist/assets/raw/../../../../server.js",
    "brand_packs/minimalist/assets/raw/..%2f..%2f..%2f..%2fserver.js", "brand_packs\\minimalist\\assets\\raw\\x.png",
    "/etc/passwd", "C:/Windows/win.ini", "C:\\Windows\\win.ini", "server.js", "package.json", "lib/library.js", ".env",
    "brand_packs/minimalist/assets/raw/manifest.json", "brand_packs/minimalist/assets/index.json",
    "ad_library/alpha-arbutin-2/x.png", "cache/x.png", "pipeline/runs/2026-10-02/finals/x.png", "pipeline/runs/x/backgrounds/sub/..%2f..%2fbad.png",
    "", "%", "brand_packs/minimalist/assets/raw/alpha-arbutin-2/01.jpg\0.png", "image_requests/README.md",
  ];
  for (const b of bad) assert.equal(imageFile(b), null, `should refuse: ${JSON.stringify(b)}`);
});

test("library ads carry scores (or null) so the cards can say 'not scored yet'", () => {
  const lib = libraryFor("alpha-arbutin-2");
  assert.ok(lib.count > 0);
  for (const g of lib.groups) for (const a of g.ads) {
    assert.ok("scores" in a);
    if (a.scores) for (const k of ["alignment", "win", "compliance", "verdict", "reviewed_by"]) assert.ok(k in a.scores);
  }
});

// ---- over HTTP, with a real server on a spare port ----
const PORT = 5300 + Math.floor(Math.random() * 600);
let server;
const up = new Promise((resolve, reject) => {
  server = spawn(process.execPath, ["server.js"], { cwd: path.join(here, ".."), env: { ...process.env, PORT: String(PORT) }, stdio: ["ignore", "pipe", "ignore"] });
  server.stdout.on("data", (d) => /running at/.test(String(d)) && resolve());
  server.on("error", reject);
  setTimeout(() => reject(new Error("server did not start")), 15000).unref();
});
after(() => { try { server?.kill(); } catch { /* gone */ } });

// http.get with the path exactly as written (fetch would tidy "../" away before sending).
const get = (p) => new Promise((resolve, reject) => {
  http.get({ host: "127.0.0.1", port: PORT, path: p }, (res) => {
    const chunks = [];
    res.on("data", (c) => chunks.push(c));
    res.on("end", () => resolve({ status: res.statusCode, type: res.headers["content-type"], body: Buffer.concat(chunks) }));
  }).on("error", reject);
});

test("GET /api/images and /img/ work over HTTP", async () => {
  await up;
  const r = await get("/api/images?handle=alpha-arbutin-2&q=cut-out");
  assert.equal(r.status, 200);
  const list = JSON.parse(r.body);
  assert.ok(Array.isArray(list) && list.length >= 1);
  const img = await get(list[0].url);
  assert.equal(img.status, 200);
  assert.match(img.type, /^image\//);
  assert.ok(img.body.length > 1000);
});

test("GET /img/ will not serve anything outside the image folders", async () => {
  await up;
  const attempts = ["/img/../server.js", "/img/%2e%2e/server.js", "/img/..%2fserver.js", "/img/..%5cserver.js",
    "/img/brand_packs/minimalist/assets/raw/..%2f..%2f..%2f..%2fserver.js", "/img/server.js", "/img/package.json",
    "/img/brand_packs/minimalist/assets/index.json", "/img/image_requests/README.md", "/img/C:/Windows/win.ini", "/img//etc/passwd"];
  for (const p of attempts) {
    const r = await get(p);
    assert.notEqual(r.status, 200, `served ${p}`);
    assert.ok(!/http\.createServer/.test(r.body.toString()), `leaked server.js via ${p}`);
  }
});
