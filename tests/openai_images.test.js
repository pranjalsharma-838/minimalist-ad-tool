// OpenAI Images engine (lib/image_api.js) with a mocked fetch: no real key, no network.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildEditRequest, createApiStudio, validateOpenAiKey, OPENAI_IMAGE_SIZE } from "../lib/image_api.js";
import { SUFFIX, fullPrompt } from "../scripts/image_studio_worker.mjs";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oai-"));
const base = path.join(dir, "pack.png");
fs.writeFileSync(base, Buffer.from("fakepng"));
const PNG = Buffer.from("OUTIMG").toString("base64");

test("edit request: model, size, base image attached, key only in the header", async () => {
  const { url, init } = buildEditRequest({ prompt: fullPrompt("a bottle on a shelf"), baseFile: base, key: "sk-test-123456789012345678901" });
  assert.equal(url, "https://api.openai.com/v1/images/edits");
  assert.equal(init.headers.authorization, "Bearer sk-test-123456789012345678901");
  assert.equal(init.body.get("model"), "gpt-image-1");
  assert.equal(init.body.get("size"), "1024x1536");
  assert.equal(OPENAI_IMAGE_SIZE, "1024x1536");
  assert.ok(init.body.get("prompt").endsWith(SUFFIX), "pack-identical suffix kept");
  const img = init.body.get("image");
  assert.equal(img.name, "pack.png");
  assert.equal(img.type, "image/png");
  assert.equal(img.size, 7);
  assert.ok(![...init.body.values()].some((v) => typeof v === "string" && v.includes("sk-test")), "key not in the body");
});

test("studio: generate then correct (same base, correction appended), writes the image; errors never echo the key", async () => {
  const calls = [];
  const studio = createApiStudio({ getKey: () => "sk-test-123456789012345678901", fetchImpl: async (u, i) => { calls.push(i.body.get("prompt")); return { ok: true, status: 200, json: async () => ({ data: [{ b64_json: PNG }] }) }; } });
  assert.equal(await studio.ready(), true);
  const out = path.join(dir, "o.png");
  await studio.generate({ prompt: "P1", baseFile: base, outFile: out });
  assert.equal(fs.readFileSync(out, "utf8"), "OUTIMG");
  await studio.correct({ text: "fix the pack", outFile: out });
  assert.deepEqual(calls, ["P1", "P1 fix the pack"]);
  const bad = createApiStudio({ getKey: () => "sk-secret-123456789012345678901", fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: { message: "rate limited" } }) }) });
  await assert.rejects(() => bad.generate({ prompt: "x", baseFile: base, outFile: out }), (e) => /429: rate limited/.test(e.message) && !/sk-secret/.test(e.message));
  assert.equal(await createApiStudio({ getKey: () => "" }).ready(), false);
});

test("key check lists models and reports a rejected key", async () => {
  let seen;
  assert.deepEqual(await validateOpenAiKey("sk-x", async (u, i) => { seen = [u, i.headers.authorization]; return { status: 200 }; }), { ok: true });
  assert.deepEqual(seen, ["https://api.openai.com/v1/models", "Bearer sk-x"]);
  assert.equal((await validateOpenAiKey("sk-x", async () => ({ status: 401 }))).ok, false);
  assert.equal((await validateOpenAiKey("sk-x", async () => { throw new Error("net"); })).ok, false);
});
