// Local server. No framework: node:http + static files + JSON API.
//   GET  /                 -> public/index.html
//   POST /api/extract      {url} | {manual:{...}}        -> fact sheet
//   GET  /api/image?src=   (Shopify CDN only)              -> image bytes (same-origin, so PNG export isn't blocked)
//   POST /api/generate     {sheet}                         -> {ad, report}  (self-scored)
//   POST /api/score        {ad, sheet?} | {image}          -> report
//   GET  /api/status                                       -> which layers are active
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractFromUrl, factSheetFromManual } from "./lib/extract.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5173);
const IMAGE_HOSTS = new Set(["cdn.shopify.com", "beminimalist.co", "www.beminimalist.co"]);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };

// Loaded lazily so the server still starts (extract + render) while those modules are being built.
async function lazy(mod) {
  return import(mod);
}

function send(res, code, body, type = "application/json; charset=utf-8") {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
  res.end(type.startsWith("application/json") ? JSON.stringify(body) : body);
}

async function readJson(req, limit = 12 * 1024 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new Error("Request too large");
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/status") {
    const { judgeAvailable } = await lazy("./lib/judge.js");
    return send(res, 200, { llm: judgeAvailable(), rulesVersion: (await lazy("./lib/rules.js")).RULES.version });
  }
  if (url.pathname === "/api/image" && req.method === "GET") {
    const src = new URL(url.searchParams.get("src") || "");
    if (!IMAGE_HOSTS.has(src.hostname)) return send(res, 400, { error: "Image host not allowed" });
    const r = await fetch(src, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!r.ok) return send(res, 502, { error: `Image fetch failed: HTTP ${r.status}` });
    res.writeHead(200, { "content-type": r.headers.get("content-type") || "image/png", "cache-control": "max-age=3600" });
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  if (req.method !== "POST") return send(res, 405, { error: "POST only" });
  const body = await readJson(req);

  if (url.pathname === "/api/extract") {
    const sheet = body.manual ? factSheetFromManual(body.manual) : await extractFromUrl(body.url);
    const { refusalReason } = await lazy("./lib/extract.js");
    return send(res, 200, { sheet, refusal: refusalReason(sheet) });
  }
  if (url.pathname === "/api/generate") {
    const { generateAd } = await lazy("./lib/generate.js");
    return send(res, 200, await generateAd(body.sheet, { mode: body.mode }));
  }
  if (url.pathname === "/api/rescore") {
    // Marketer edited the copy: re-render spec, re-check layout, re-score against the same product page.
    const { adFromCopy, specFromCopy } = await lazy("./lib/generate.js");
    const { scoreAd } = await lazy("./lib/score.js");
    const { layoutProblems } = await lazy("./public/render.js");
    const spec = specFromCopy(body.copy, body.sheet);
    const report = await scoreAd(adFromCopy(body.copy, body.sheet), { sheet: body.sheet });
    const layout_problems = layoutProblems(spec);
    if (layout_problems.length) {
      report.findings.unshift({ rule_id: "LAYOUT", dimension: "language", severity: "block", title: "Copy doesn't fit the layout", field: "headline", start: 0, end: 0, span: "", message: layout_problems.join(" "), fix: "Shorten the copy.", sources: [], confidence: "layout check", layer: "rule" });
      const { verdictFor } = await lazy("./lib/score.js");
      report.verdict = verdictFor(report.findings, report.coverage);
    }
    return send(res, 200, { spec, report, layout_problems });
  }
  if (url.pathname === "/api/score") {
    const { scoreAd, scoreImageAd } = await lazy("./lib/score.js");
    const result = body.image ? await scoreImageAd(body.image, body.mediaType) : await scoreAd(body.ad, { sheet: body.sheet });
    return send(res, 200, result);
  }
  return send(res, 404, { error: "Unknown endpoint" });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) return await handleApi(req, res, url);
    const rel = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = path.normalize(path.join(here, "public", rel));
    if (!file.startsWith(path.join(here, "public"))) return send(res, 403, "Forbidden", "text/plain");
    const data = await fs.readFile(file);
    send(res, 200, data, TYPES[path.extname(file)] || "application/octet-stream");
  } catch (e) {
    const code = e.code === "ENOENT" ? 404 : 500;
    send(res, code, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`Minimalist ad tool running at http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("ANTHROPIC_API_KEY not set: copy is verbatim-from-page and the scorer runs its rule layer only (no model judgment).");
  }
});
