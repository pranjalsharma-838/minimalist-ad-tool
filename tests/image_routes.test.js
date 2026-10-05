import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// OpenAI is the main image route; the ChatGPT window is the backup (user, 2026-10-05).
test("OpenAI route first; after two failed attempts the request is handed to the ChatGPT window, which then takes it", async () => {
  const W = await import("../scripts/image_studio_worker.mjs"), L = await import("../lib/library.js"), { createApiStudio } = await import("../lib/image_api.js");
  const q = W.queuePath(); fs.mkdirSync(q, { recursive: true });
  for (const f of fs.readdirSync(q)) fs.rmSync(path.join(q, f), { force: true, recursive: true });
  process.env.OPENAI_API_KEY = "sk-test-not-real";
  const sheet = { title: "Serum", url: "https://beminimalist.co/products/alpha-arbutin-2", facts: [], images: [] };
  const req = L.queueImageRequest("alpha-arbutin-2", "Create an image: a calm bathroom scene, no product.", sheet, { format: "person", textOnly: true });
  // the app server is making images through OpenAI, and a ChatGPT window is running
  fs.writeFileSync(path.join(q, "api.heartbeat"), "now"); fs.writeFileSync(path.join(q, "worker.heartbeat"), "now");
  assert.deepEqual(W.listQueued({ forChatGPT: true }).map((r) => r.id), [], "ChatGPT stays idle while OpenAI is live");
  assert.deepEqual(W.listQueued().map((r) => r.id), [req.id], "the OpenAI route takes it");
  let calls = 0;
  const failing = createApiStudio({ fetchImpl: async () => { calls++; return new Response(JSON.stringify({ error: { message: "server busy" } }), { status: 500 }); } });
  assert.equal(await W.handleRequest(W.listQueued()[0], failing), "failed");
  assert.ok(calls >= 2, "two attempts on the OpenAI route");
  assert.ok(W.handToChatGPT(req));
  assert.deepEqual(W.listQueued().map((r) => r.id), [], "the OpenAI route never takes a hand-over back");
  assert.deepEqual(W.listQueued({ forChatGPT: true }).map((r) => r.id), [req.id], "the ChatGPT window takes it");
  delete process.env.OPENAI_API_KEY;
});
