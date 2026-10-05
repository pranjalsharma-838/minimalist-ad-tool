// Every part of the running app, checked once against the live server (run: npm start, then
// node scripts/smoke_check.mjs <product-handle>). Writes logs/smoke_check.json. Nothing is published or downloaded.
import fs from "node:fs";
const BASE = process.env.BASE || "http://localhost:5173", handle = process.argv[2] || "vitamin-b12-nmf-03-face-toner";
const results = [];
const check = async (name, fn) => { const t0 = Date.now(); try { const detail = await fn(); results.push({ name, ok: true, ms: Date.now() - t0, detail }); } catch (e) { results.push({ name, ok: false, ms: Date.now() - t0, error: e.message }); } };
const j = async (path, body) => { const r = await fetch(BASE + path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}); if (!r.ok) throw new Error(`${path}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`); return r.json(); };
const must = (c, msg) => { if (!c) throw new Error(msg); };

let sheet, gen;
await check("status", async () => { const s = await j("/api/status"); must("llm" in s && "openai" in s && "studio" in s, "status fields"); return s; });
await check("page loads", async () => { const r = await fetch(BASE + "/"); must(r.ok && (await r.text()).includes("Final ads"), "Final ads tab"); return "ok"; });
await check("extract a product page", async () => { const r = await j("/api/extract", { url: `https://beminimalist.co/products/${handle}` }); sheet = r.sheet; must(sheet.facts.length > 5, "facts"); return `${sheet.facts.length} facts`; });
await check("build new ads (generate)", async () => { gen = await j("/api/generate", { sheet, mode: "verbatim", variant: 1 }); must(gen.formats.length > 8, "formats"); return { formats: gen.formats.length, ready: gen.formats.filter((f) => f.status === "ready").length, waiting: gen.formats.filter((f) => f.pending).length, audiences: gen.audiences.map((a) => a.label), copy_log: gen.log }; });
await check("new formats present (journey, in hand)", async () => { const ids = gen.formats.map((f) => f.id); must(ids.includes("weeks"), "weeks"); must(ids.includes("in_hand") || gen.notShown.some((n) => n.id === "in_hand"), "in_hand"); return "ok"; });
await check("rebuild after an edit (formats)", async () => { const r = await j("/api/formats", { copy: gen.copy, sheet, inputs: {} }); must(r.formats.length, "formats"); return `${r.formats.length} formats`; });
await check("re-check one ad (rescore)", async () => { const f = gen.formats.find((x) => x.status === "ready"); const r = await j("/api/rescore", { copy: gen.copy, sheet, format: f.id, rulesOnly: false }); must(r.report?.verdict, "verdict"); return { format: f.id, verdict: r.report.verdict.code, judge: r.report.coverage.model ? "on (key or stand-in)" : "rules only", scores: Object.keys(r.report.scores || {}) }; });
await check("score any ad (checker)", async () => { const r = await j("/api/score", { ad: { headline: "Cures acne in 3 days, guaranteed!", primary_text: "Say goodbye to breakouts.", on_image_text: "", footnote: "" } }); must(r.verdict.code === "BLOCKED", `expected BLOCKED, got ${r.verdict.code}`); return { verdict: r.verdict.code, rules: [...new Set(r.findings.map((f) => f.rule_id))] }; });
await check("library: this product", async () => { const r = await j(`/api/library?handle=alpha-arbutin-2`); return `${JSON.stringify(r).length} bytes`; });
await check("library: all final ads", async () => { const r = await j("/api/library-all"); const ads = r.ads || r; must(ads.length >= 400, `ads ${ads.length}`); const blocked = ads.filter((a) => a.scores?.verdict === "BLOCKED"); return { ads: ads.length, blocked: blocked.length, ai: ads.filter((a) => a.ai).length }; });
await check("library image served", async () => { const r = await j("/api/library-all"); const a = (r.ads || r)[0]; const p = await fetch(BASE + a.png); must(p.ok && p.headers.get("content-type").startsWith("image/"), "png"); return a.png; });
await check("image library search", async () => { const r = await j(`/api/images?handle=${handle}`); return `${r.length} images`; });
await check("product image (pack)", async () => { const r = await fetch(`${BASE}/api/pack?handle=alpha-arbutin-2`); must(r.ok, "pack"); return r.headers.get("content-type"); });
await check("image requests for this product", async () => { const r = await j(`/api/image-requests?handle=${handle}`); return `${(r.requests || []).length} requests`; });
await check("gallery file", async () => { const h = fs.readFileSync("ad_library/index.html", "utf8"); must(h.includes("Blocked, do not use") && h.includes("mixed"), "warnings + random order"); return `${(h.match(/<article class="card"/g) || []).length} cards`; });
await check("path traversal refused", async () => { const r = await fetch(`${BASE}/img/..%2fserver.js`); must(r.status !== 200, "served server.js"); return r.status; });

fs.mkdirSync("logs", { recursive: true });
fs.writeFileSync("logs/smoke_check.json", JSON.stringify({ at: new Date().toISOString(), product: handle, results }, null, 2));
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}  (${r.ms} ms)${r.ok ? "" : "  " + r.error}`);
console.log(`${results.filter((r) => r.ok).length}/${results.length} passed`);
process.exitCode = results.every((r) => r.ok) ? 0 : 1;
