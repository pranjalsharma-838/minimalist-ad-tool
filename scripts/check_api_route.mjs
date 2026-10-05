// End-to-end check of the OpenAI-key route without a real key (run: node scripts/check_api_route.mjs).
// A stand-in OpenAI is injected through createApiStudio's fetchImpl; it returns the real pack photo as the "image",
// so the real label check (scripts/verify_pack.py) runs on every round. Uses a throwaway queue folder.
// Checks: the product render goes first, the other images wait for it ("after"), then run in parallel and use the
// passed render as their product photo. Writes logs/api_route_check.json.
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "api-route-")); process.env.STUDIO_QUEUE_DIR = dir; process.env.OPENAI_API_KEY = "sk-test-not-real";
const L = await import("../lib/library.js"), W = await import("./image_studio_worker.mjs"), { createApiStudio } = await import("../lib/image_api.js");
const handle = "alpha-arbutin-2", pack = fs.readFileSync("brand_packs/minimalist/assets/ai_renders/alpha-arbutin-2/round1.png");
const calls = [];
const fakeFetch = async (url, init) => { calls.push({ url, at: Date.now(), attached: init?.body instanceof FormData && [...init.body.keys()].includes("image[]") || init?.body instanceof FormData && [...init.body.keys()].some((k) => k.startsWith("image")) }); await new Promise((r) => setTimeout(r, 300)); return new Response(JSON.stringify({ data: [{ b64_json: pack.toString("base64") }] }), { status: 200, headers: { "content-type": "application/json" } }); };
const sheet = { title: "Alpha Arbutin 2% Face Serum", url: `https://beminimalist.co/products/${handle}`, facts: [], images: [] };
const render = L.queueImageRequest(handle, "Create an image: a clean studio product shot of the attached pack on white.", sheet, { format: "render" });
const others = ["person", "texture", "creator"].map((f) => L.queueImageRequest(handle, `Create an image: test ${f}.`, sheet, { format: f, textOnly: f !== "texture", after: render.id }));
const log = { started: new Date().toISOString(), steps: [] };
log.steps.push({ step: "queued before the render ran", visible: W.listQueued().map((r) => r.format) });
await W.handleRequest(W.listQueued()[0], createApiStudio({ fetchImpl: fakeFetch }));
log.steps.push({ step: "render result", status: L.requestState(render.id)?.status });
const t0 = Date.now(), batch = W.listQueued();
log.steps.push({ step: "queued after the render", visible: batch.map((r) => r.format) });
await Promise.all(batch.map((r) => W.handleRequest(r, createApiStudio({ fetchImpl: fakeFetch }))));
log.steps.push({ step: "other images", ms: Date.now() - t0, results: others.map((o) => ({ format: o.format, status: L.requestState(o.id)?.status })) });
log.api_calls = calls.length;
fs.writeFileSync("logs/api_route_check.json", JSON.stringify(log, null, 2));
console.log(JSON.stringify(log, null, 2));
fs.rmSync(dir, { recursive: true, force: true });
