// Stage 8 — Compose finals in the brief's FORMAT (hero, actives, journey, stat, callouts, spec, range,
// offer, before_after): generated background + REAL pack shot(s) + compliance-checked copy, then re-check.
// Usage: node pipeline/08_compose.js <YYYY-MM-DD>
// Reads briefs_final.json + backgrounds/<id>.(png|jpg|webp) + products/. Writes finals/<id>.svg.
// Before/after briefs are composed with empty "REAL STUDY PHOTO REQUIRED" frames and marked not exportable.
import fs from "node:fs";
import path from "node:path";
import { specFromBrief, adFromBrief } from "../lib/brief_check.js";
import { renderAdSvg, layoutProblems } from "../public/render.js";
import { scoreAd } from "../lib/score.js";

const date = process.argv[2];
const runDir = path.join("pipeline", "runs", date);
const briefs = JSON.parse(fs.readFileSync(path.join(runDir, "briefs_final.json"), "utf8"));
const sheets = Object.fromEntries(fs.readdirSync(path.join(runDir, "products")).map((f) => [f.replace(/\.json$/, ""), JSON.parse(fs.readFileSync(path.join(runDir, "products", f), "utf8"))]));
fs.mkdirSync(path.join(runDir, "finals"), { recursive: true });

const ASSETS = JSON.parse(fs.readFileSync("brand_packs/minimalist/assets/index.json", "utf8")).assets;
const dataUrl =(buf, type) => `data:${type};base64,${buf.toString("base64")}`;
const cache = new Map();
async function packShot(src) {
  if (!src) return "";
  if (!cache.has(src)) {
    const r = await fetch(src, { headers: { "user-agent": "Mozilla/5.0" } });
    cache.set(src, r.ok ? dataUrl(Buffer.from(await r.arrayBuffer()), r.headers.get("content-type") || "image/png") : "");
  }
  return cache.get(src);
}

const summary = [];
for (const b of briefs.filter((b) => b.status === "approved_for_image_step")) {
  const bg = ["png", "jpg", "jpeg", "webp"].map((e) => path.join(runDir, "backgrounds", `${b.source_ad_id}.${e}`)).find((p) => fs.existsSync(p));
  if (!bg) {
    console.log(`${b.source_ad_id}: no background yet (image step not done) — skipped`);
    continue;
  }
  const main = b.product_handle;
  const spec = specFromBrief(b, sheets, main);
  // Prefer a clean transparent cut-out from the asset library (real product, background removed) so the pack
  // can stand in the scene with a shadow; otherwise the page's studio pack shot in a white frame.
  spec.cutoutHrefs = [];
  const cut = (handle) => {
    const a = ASSETS.find((x) => x.product_handle === handle && x.cutout && !/unusable/i.test(`${x.cutout_status || ""} ${x.notes || ""}`) && fs.existsSync(x.cutout));
    if (!a) return "";
    const href = dataUrl(fs.readFileSync(a.cutout), "image/png");
    spec.cutoutHrefs.push(href);
    if (/key from (upper-)?right/i.test(a.light || "")) spec.shadowDx = -12;
    return href;
  };
  spec.imageHref = cut(main) || (await packShot(spec.imageSrc));
  for (const s of [...spec.steps, ...spec.range]) s.imageHref = cut(s.product_handle) || (await packShot(s.imageSrc));
  const ext = path.extname(bg).slice(1).replace("jpg", "jpeg");
  spec.backgroundHref = dataUrl(fs.readFileSync(bg), `image/${ext}`);
  const square = renderAdSvg(spec);
  fs.writeFileSync(path.join(runDir, "finals", `${b.source_ad_id}.svg`), square);
  // Extra placements (open problem, 2026-10-03): 4:5 feed and 9:16 Stories/Reels. The approved 1:1 creative is
  // centred unchanged; the same generated background fills the taller canvas (softly blurred so the creative
  // stays the focus). 9:16 leaves 420px (~22%) top and bottom — clear of Meta's Stories/Reels UI zones.
  const sq64 = Buffer.from(typeof square === "string" ? square : square.svg).toString("base64");
  for (const [tag, H] of [["4x5", 1350], ["9x16", 1920]]) {
    const top = (H - 1080) / 2;
    // Eye-check fix: a lightly blurred, differently scaled copy showed hard seams. Now: heavy blur + the square
    // inset as a card (1000px, rounded, soft shadow), so the edge reads as intentional, not as a seam.
    const S = 1000, x0 = 40, y0 = (H - S) / 2;
    fs.writeFileSync(path.join(runDir, "finals", `${b.source_ad_id}.${tag}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="${H}" viewBox="0 0 1080 ${H}"><defs><filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="40"/></filter><filter id="card" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#000" flood-opacity="0.22"/></filter><clipPath id="r"><rect x="${x0}" y="${y0}" width="${S}" height="${S}" rx="28"/></clipPath></defs><rect width="1080" height="${H}" fill="#EDEAE4"/><image href="${spec.backgroundHref}" x="-120" y="-120" width="1320" height="${H + 240}" preserveAspectRatio="xMidYMid slice" filter="url(#soft)"/><rect x="${x0}" y="${y0}" width="${S}" height="${S}" rx="28" fill="#fff" filter="url(#card)"/><image href="data:image/svg+xml;base64,${sq64}" x="${x0}" y="${y0}" width="${S}" height="${S}" clip-path="url(#r)"/></svg>`);
  }
  // Language versions (add-on g): compose only versions whose 05c check passed. Each English line on the ad is
  // swapped for its translated line wherever it appears in the brief (same order as adFromBrief); strings that
  // aren't a whole line (product names, computed hero line) stay as they are — Latin script by design.
  const checks = fs.existsSync(path.join(runDir, "translations", "check_summary.json")) ? JSON.parse(fs.readFileSync(path.join(runDir, "translations", "check_summary.json"), "utf8")) : [];
  for (const c of checks.filter((x) => x.id === b.source_ad_id && x.verdict === "pass")) {
    const tr = JSON.parse(fs.readFileSync(path.join(runDir, "translations", `${c.id}.${c.lang}.json`), "utf8")).lines;
    const enAd = adFromBrief(b, sheets, main), map = new Map();
    for (const f of ["headline", "footnote", "cta", "primary_text"]) if (enAd[f] && tr[f]?.text) map.set(enAd[f].trim(), tr[f].text.trim());
    const enLines = (enAd.on_image_text || "").split("\n"), trLines = (tr.on_image_text?.text || "").split("\n");
    if (enLines.length === trLines.length) enLines.forEach((l, i) => map.set(l.trim(), trLines[i].trim()));
    const swap = (v) => (typeof v === "string" ? map.get(v.trim()) ?? v : Array.isArray(v) ? v.map(swap) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)])) : v);
    const lspec = { ...swap({ ...spec, imageHref: undefined, backgroundHref: undefined, cutoutHrefs: undefined, steps: undefined, range: undefined }), imageHref: spec.imageHref, backgroundHref: spec.backgroundHref, cutoutHrefs: spec.cutoutHrefs, shadowDx: spec.shadowDx, steps: spec.steps.map((s) => ({ ...swap(s), imageHref: s.imageHref })), range: spec.range.map((s) => ({ ...swap(s), imageHref: s.imageHref })) };
    fs.writeFileSync(path.join(runDir, "finals", `${b.source_ad_id}.${c.lang}.svg`), renderAdSvg(lspec));
    console.log(`  + ${c.lang} version composed${enLines.length !== trLines.length ? " (WARNING: on-image line count differs; only whole-field swaps applied)" : ""}`);
  }
  const layoutIssues = layoutProblems(spec);
  const extraSheets = [...(b.steps || []), ...(b.range || [])].map((x) => sheets[x.product_handle]).filter((s) => s && s !== sheets[main]);
  const report = await scoreAd(adFromBrief(b, sheets, main), { sheet: sheets[main], extraSheets, rulesOnly: true });
  // Severe-risk creatives (AI frames standing in for real results) are composed for review but never exportable.
  if (b.risk_level === "severe") layoutIssues.push("Severe risk: AI-generated frames stand in for real study photos — not exportable until replaced");
  const exportable = !layoutIssues.length && report.verdict.code !== "BLOCKED";
  summary.push({ id: b.source_ad_id, layout: spec.layout, exportable, layoutIssues, recheck: report.verdict.code });
  console.log(`${b.source_ad_id} [${spec.layout}]: composed · re-check ${report.verdict.code}${layoutIssues.length ? " · NOT EXPORTABLE: " + layoutIssues.join("; ") : ""}`);
}
fs.writeFileSync(path.join(runDir, "finals", "summary.json"), JSON.stringify(summary, null, 2));
