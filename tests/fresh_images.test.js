// "Creating from scratch should not be showing old images": a Build queues a fresh image request per AI-image format and never
// returns a library background for it; pack-only formats still render at once.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { addLiveFacts } from "../lib/live_facts.js";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fresh-test-"));
process.env.STUDIO_QUEUE_DIR = dir;
delete process.env.OPENAI_API_KEY;
const { generateAd } = await import("../lib/generate.js");
const { listFormats } = await import("../lib/app_formats.js");
const { verbatimCopy } = await import("../lib/generate.js");
after(() => fs.rmSync(dir, { recursive: true, force: true }));

const h = "niacinamide-10-with-matmarine";
const sheet = addLiveFacts(JSON.parse(fs.readFileSync(`eval/gen/${h}.sheet.json`, "utf8")));
const reqs = () => fs.readdirSync(dir).filter((f) => /^\d.*\.json$/.test(f) && !f.endsWith(".result.json")).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));

test("a Build queues one request per AI-image format and shows no library image for them", async () => {
  const out = await generateAd(sheet, { mode: "verbatim", variant: 2 });
  const queued = reqs();
  const ids = Object.keys(out.requests);
  assert.ok(ids.includes("person") && ids.includes("creator") && ids.includes("before_after"), `queued: ${ids}`);
  assert.equal(queued.length, ids.length, "one request per format, no duplicates");
  assert.equal(new Set(queued.map((r) => r.format)).size, queued.length);
  for (const r of queued) {
    assert.equal(r.status, "queued");
    assert.ok(r.prompt.length > 40);
    if (r.format === "texture") assert.ok(r.base_image, "the pack must appear: verified render as base");
    else { assert.equal(r.text_only, true); assert.equal(r.base_image, ""); }
  }
  for (const id of ids) {
    const m = out.formats.find((f) => f.id === id);
    assert.ok(m.pending, `${id} is a loading card`);
    assert.equal(m.status, "generating");
    const json = JSON.stringify(out.items[id].spec);
    assert.ok(!/backgrounds|pipeline\/runs|ai_renders\/[^"]*texture/.test(json), `${id}: no library image`);
    assert.equal(out.items[id].spec.personSrc, undefined);
    assert.equal(out.items[id].spec.photoSrcs, undefined);
  }
  assert.equal(out.formats.find((f) => f.id === "person").pending.state, "no_studio");
  assert.match(out.formats.find((f) => f.id === "person").pending.text, /npm run studio/);
  // Pack-only formats are unaffected.
  for (const id of ["hero", "badges"]) {
    const m = out.formats.find((f) => f.id === id);
    assert.ok(!m.pending && m.status !== "generating", id);
    assert.ok(out.items[id].spec.imageSrc, `${id} has the pack visual`);
  }
});

test("with a studio heartbeat the card says making; a finished result swaps in the ad, needs_review is flagged", async () => {
  fs.writeFileSync(path.join(dir, "worker.heartbeat"), new Date().toISOString());
  const copy = verbatimCopy(sheet, 3);
  const requests = { person: "20261005T000000000Z_person_x" };
  fs.writeFileSync(path.join(dir, `${requests.person}.json`), JSON.stringify({ id: requests.person, handle: h, status: "queued", requested_at: new Date().toISOString() }));
  let { built } = listFormats(copy, sheet, { fresh: true, variant: 3, requests });
  assert.equal(built.find((b) => b.id === "person").meta.pending.state, "making");
  // finished
  fs.writeFileSync(path.join(dir, `${requests.person}.png`), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
  fs.writeFileSync(path.join(dir, `${requests.person}.result.json`), JSON.stringify({ status: "done", image: path.join(dir, `${requests.person}.png`), notes: "scene only" }));
  ({ built } = listFormats(copy, sheet, { fresh: true, variant: 3, requests }));
  let p = built.find((b) => b.id === "person");
  assert.equal(p.meta.pending, null);
  assert.match(p.spec.personSrc, /^\/api\/request-image\?id=/);
  assert.equal(p.spec.aiLabel, true);
  assert.equal(p.meta.image_review, false);
  fs.writeFileSync(path.join(dir, `${requests.person}.result.json`), JSON.stringify({ status: "needs_review", image: path.join(dir, `${requests.person}.png`), notes: "label failed" }));
  ({ built } = listFormats(copy, sheet, { fresh: true, variant: 3, requests }));
  p = built.find((b) => b.id === "person");
  assert.equal(p.meta.image_review, true);
});

test("without fresh (direct library use) nothing changes", () => {
  const { built } = listFormats(verbatimCopy(sheet), sheet);
  assert.ok(built.every((b) => !b.meta.pending));
});
