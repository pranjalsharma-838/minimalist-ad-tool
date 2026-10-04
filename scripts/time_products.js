// Timing test (user request 2026-10-04): runs the app's own flow, product URL → finished ad, for several products and
// logs how long each step takes. Same code the app calls (extract → generate → score → layout check → render), plus
// the PNG step (headless Edge, as in pipeline/08b_png.js) for every product.
// Usage: node scripts/time_products.js [N]   (N products from the top-20 list, default 10)
// Writes results/timing_<date>.csv (one row per product) and results/timing_<date>.md (summary). Says whether the
// Claude API key was on: without it, copy is taken word for word from the page and only the rules run.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import "../lib/env.js";
import { extractFromUrl } from "../lib/extract.js";
import { generateAd } from "../lib/generate.js";
import { renderAdSvg, layoutProblems } from "../public/render.js";
import { llmAvailable } from "../lib/llm.js";

const N = Number(process.argv[2] || 10);
const top = JSON.parse(fs.readFileSync("brand_packs/minimalist/raw/top20.json", "utf8"));
const handles = (Array.isArray(top) ? top : top.products || []).map((x) => x.handle).filter(Boolean).slice(0, N);
const browser = [process.env.BROWSER, `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`, `${process.env.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe`, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => p && fs.existsSync(p));
const day = new Date().toISOString().slice(0, 10), tmp = path.resolve("results", `timing_${day}_png`);
fs.mkdirSync(tmp, { recursive: true });
const ms = async (fn) => { const t = performance.now(); const v = await fn(); return [v, Math.round(performance.now() - t)]; };
const dataUrl = async (src) => { const r = await fetch(src, { headers: { "user-agent": "Mozilla/5.0" } }); return r.ok ? `data:${r.headers.get("content-type") || "image/png"};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}` : ""; };

const rows = [];
for (const h of handles) {
  const row = { product: h };
  const t0 = performance.now();
  try {
    const [sheet, tExtract] = await ms(() => extractFromUrl(`https://beminimalist.co/products/${h}`));
    row.extract_ms = tExtract;
    const [gen, tGen] = await ms(() => generateAd(sheet, { mode: llmAvailable() ? "model" : "verbatim" }));
    row.generate_and_score_ms = tGen;
    if (gen.refused) { row.result = `refused: ${gen.reason || "not a product page"}`; rows.push({ ...row, total_ms: Math.round(performance.now() - t0) }); continue; }
    // Same background rule as the app: the pack photo's studio colour (here from the asset library's sample).
    const studio = fs.existsSync("brand_packs/minimalist/assets/studio_bg.json") ? JSON.parse(fs.readFileSync("brand_packs/minimalist/assets/studio_bg.json", "utf8")) : {};
    const [svg, tRender] = await ms(async () => renderAdSvg({ ...gen.spec, imageHref: await dataUrl(gen.spec.imageSrc), canvas: studio[h] || "" }));
    row.render_ms = tRender;
    row.layout_ok = layoutProblems(gen.spec).length === 0;
    const svgFile = path.join(tmp, `${h}.svg`), html = path.join(tmp, `${h}.html`), png = path.join(tmp, `${h}.png`);
    fs.writeFileSync(svgFile, svg);
    fs.writeFileSync(html, `<!doctype html><body style="margin:0"><img src="${h}.svg" width="1080" height="1080" style="display:block"></body>`);
    const [, tPng] = await ms(async () => { if (browser) execFileSync(browser, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1080,1080", `--screenshot=${png}`, "file:///" + html.replace(/\\/g, "/")], { stdio: "ignore", timeout: 60000 }); });
    fs.rmSync(html, { force: true });
    row.png_ms = browser ? tPng : "";
    row.verdict = gen.report?.verdict?.label || gen.report?.verdict?.code || "";
    row.result = "ok";
  } catch (e) { row.result = `error: ${String(e.message || e).slice(0, 80)}`; }
  row.total_ms = Math.round(performance.now() - t0);
  rows.push(row);
  console.log(`${h}: ${row.result} · ${(row.total_ms / 1000).toFixed(1)}s (page ${row.extract_ms ?? "-"} ms, copy+check ${row.generate_and_score_ms ?? "-"} ms, render ${row.render_ms ?? "-"} ms, PNG ${row.png_ms ?? "-"} ms)`);
}
const cols = ["product", "result", "verdict", "layout_ok", "extract_ms", "generate_and_score_ms", "render_ms", "png_ms", "total_ms"];
fs.writeFileSync(`results/timing_${day}.csv`, [cols.join(","), ...rows.map((r) => cols.map((c) => `"${String(r[c] ?? "").replace(/"/g, "'")}"`).join(","))].join("\n") + "\n");
const ok = rows.filter((r) => r.result === "ok"), avg = (k) => Math.round(ok.reduce((s, r) => s + (Number(r[k]) || 0), 0) / Math.max(1, ok.length));
const sum = rows.reduce((s, r) => s + r.total_ms, 0);
fs.writeFileSync(`results/timing_${day}.md`, [
  `# Timing test: product URL → finished ad (${day})`,
  "",
  `${rows.length} products, one after another, using the app's own code. Claude API key: **${llmAvailable() ? "on (AI copywriting and AI judge ran)" : "off (copy word for word from the page, rules-only check)"}**. Machine: ${process.platform}, Node ${process.version}.`,
  "",
  `- **Total:** ${(sum / 1000).toFixed(1)} s for ${rows.length} products (${ok.length} finished ads, ${rows.length - ok.length} not made).`,
  `- **Average per finished ad:** ${(avg("total_ms") / 1000).toFixed(1)} s: reading the page ${avg("extract_ms")} ms, copy + compliance check ${avg("generate_and_score_ms")} ms, layout ${avg("render_ms")} ms, PNG ${avg("png_ms")} ms.`,
  llmAvailable() ? "" : "- With a Claude API key, the copywriting and the AI judge add model calls; expect roughly 20–60 s more per ad. Re-run this script with the key set to log the real figure.",
  "",
  "| Product | Result | Verdict | Fits layout | Page (ms) | Copy + check (ms) | Layout (ms) | PNG (ms) | Total (s) |",
  "|---|---|---|---|---|---|---|---|---|",
  ...rows.map((r) => `| ${r.product} | ${r.result} | ${r.verdict || ""} | ${r.layout_ok === undefined ? "" : r.layout_ok ? "yes" : "no"} | ${r.extract_ms ?? ""} | ${r.generate_and_score_ms ?? ""} | ${r.render_ms ?? ""} | ${r.png_ms ?? ""} | ${(r.total_ms / 1000).toFixed(1)} |`),
  "",
  `PNGs from this test: \`results/timing_${day}_png/\`.`,
].join("\n"));
console.log(`\n${ok.length}/${rows.length} ads in ${(sum / 1000).toFixed(1)} s → results/timing_${day}.md`);
