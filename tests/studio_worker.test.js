// Image Studio worker, pieces that don't need a ChatGPT login: queue pickup, rounds, status updates and result files.
// STUDIO_DRY=1: no browser, the base image stands in for ChatGPT's image; STUDIO_DRY_VERDICT fakes the label check per round.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "studio-test-"));
process.env.STUDIO_QUEUE_DIR = dir;
process.env.STUDIO_DRY = "1";
const W = await import("../scripts/image_studio_worker.mjs");
const BASE = path.join(here, "..", "brand_packs/minimalist/assets/hires/alpha-arbutin-2.png");

const make = (id, extra = {}) => {
  const r = { id, handle: "alpha-arbutin-2", product: "Alpha Arbutin", prompt: "The bottle on a bathroom shelf", base_image: BASE, requested_at: new Date(Date.now() + (parseInt(id, 10) || 0)).toISOString(), status: "queued", ...extra };
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(r));
  return r;
};
const req = (id) => JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), "utf8"));
const result = (id) => JSON.parse(fs.readFileSync(path.join(dir, `${id}.result.json`), "utf8"));
after(() => fs.rmSync(dir, { recursive: true, force: true }));

test("the prompt gets the fixed pack-protection suffix and a draw instruction", () => {
  assert.match(W.fullPrompt("The bottle on a shelf"), /^Create an image: The bottle on a shelf Use the attached photo as the exact product: the pack must stay identical/);
  assert.ok(W.fullPrompt("Make a picture of it").startsWith("Make a picture of it "));
  assert.ok(W.fullPrompt("x y z").endsWith("Do not add, remove or change any text or logo on the pack."));
  assert.match(W.CORRECTION, /^The pack changed — keep the pack exactly as in the photo: Use the attached photo/);
});

test("picks up the newest queued request first, skips finished and non-queued ones", () => {
  make("1_a"); make("2_b"); make("3_c", { status: "working" }); make("4_d");
  fs.writeFileSync(path.join(dir, "4_d.result.json"), JSON.stringify({ status: "done" }));
  assert.deepEqual(W.listQueued().map((r) => r.id), ["2_b", "1_a"]);
});

test("a passing check: working -> done, image and result file written", async () => {
  process.env.STUDIO_DRY_VERDICT = "PASS candidate (fake)";
  const r = make("5_pass");
  const seen = [];
  const studio = W.createDryStudio();
  const orig = studio.generate;
  studio.generate = async (o) => { seen.push(req("5_pass").status); return orig(o); };
  assert.equal(await W.handleRequest(r, studio), "done");
  assert.deepEqual(seen, ["working"]);
  const res = result("5_pass");
  assert.equal(res.status, "done");
  assert.equal(res.rounds, 1);
  assert.ok(fs.existsSync(path.join(dir, "5_pass.png")));
  assert.equal(req("5_pass").status, "done");
  assert.equal(req("5_pass").progress, undefined);
  assert.match(res.notes, /similarity/);
});

test("a failing check is retried in the same chat and can pass on round 2", async () => {
  process.env.STUDIO_DRY_VERDICT = "REVIEW: label differs,PASS candidate";
  const studio = W.createDryStudio();
  let corrections = 0;
  const c = studio.correct;
  studio.correct = async (o) => { corrections++; assert.match(o.text, /^The pack changed/); return c(o); };
  assert.equal(await W.handleRequest(make("6_retry"), studio), "done");
  assert.equal(corrections, 1);
  assert.equal(result("6_retry").rounds, 2);
});

test("still failing after 3 rounds -> needs_review, not offered for ads", async () => {
  process.env.STUDIO_DRY_VERDICT = "FAIL: the AI pack doesn't match";
  assert.equal(await W.handleRequest(make("7_fail"), W.createDryStudio()), "needs_review");
  const res = result("7_fail");
  assert.equal(res.status, "needs_review");
  assert.equal(res.rounds, 3);
  assert.match(res.notes, /NOT pass|did NOT/);
  assert.ok(fs.existsSync(path.join(dir, "7_fail.png")), "the best attempt is kept so a person can look at it");
  assert.ok(!fs.readdirSync(dir).some((f) => /_r\d/.test(f)), "per-round temp files are cleaned up");
});

test("a request that cannot start is marked failed with a plain reason, and never throws", async () => {
  process.env.STUDIO_DRY_VERDICT = "PASS candidate";
  assert.equal(await W.handleRequest(make("8_nobase", { base_image: "nowhere/none.png" }), W.createDryStudio()), "failed");
  assert.equal(result("8_nobase").status, "failed");
  assert.match(result("8_nobase").notes, /Base image not found/);
  assert.equal(req("8_nobase").status, "failed");
});

test("a studio error restarts the browser once, then fails the request", async () => {
  let restarts = 0, tries = 0;
  const studio = { generate: async () => { tries++; throw new Error("stuck"); }, correct: async () => {}, restart: async () => { restarts++; } };
  assert.equal(await W.handleRequest(make("9_stuck"), studio), "failed");
  assert.equal(tries, 2);
  assert.equal(restarts, 2);
  assert.match(result("9_stuck").notes, /stuck/);
});

test("a request left 'working' by this worker goes back to the queue on restart", () => {
  make("10_left", { status: "working", worker: "studio" });
  make("11_other", { status: "working" }); // marked by the older operator script: left alone
  assert.equal(W.resetStale(), 1);
  assert.equal(req("10_left").status, "queued");
  assert.equal(req("11_other").status, "working");
});

test("tick() processes one request per call", async () => {
  process.env.STUDIO_DRY_VERDICT = "PASS candidate";
  for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f));
  make("1_x"); make("2_y");
  assert.equal(await W.tick(W.createDryStudio()), "done");
  assert.deepEqual(W.listQueued().map((r) => r.id), ["1_x"]);
});
