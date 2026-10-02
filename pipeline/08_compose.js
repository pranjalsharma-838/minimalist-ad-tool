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

const dataUrl = (buf, type) => `data:${type};base64,${buf.toString("base64")}`;
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
  spec.imageHref = await packShot(spec.imageSrc);
  for (const s of [...spec.steps, ...spec.range]) s.imageHref = await packShot(s.imageSrc);
  const ext = path.extname(bg).slice(1).replace("jpg", "jpeg");
  spec.backgroundHref = dataUrl(fs.readFileSync(bg), `image/${ext}`);
  fs.writeFileSync(path.join(runDir, "finals", `${b.source_ad_id}.svg`), renderAdSvg(spec));
  const layoutIssues = layoutProblems(spec);
  const extraSheets = [...(b.steps || []), ...(b.range || [])].map((x) => sheets[x.product_handle]).filter((s) => s && s !== sheets[main]);
  const report = await scoreAd(adFromBrief(b, sheets, main), { sheet: sheets[main], extraSheets, rulesOnly: true });
  const exportable = !layoutIssues.length && report.verdict.code !== "BLOCKED";
  summary.push({ id: b.source_ad_id, layout: spec.layout, exportable, layoutIssues, recheck: report.verdict.code });
  console.log(`${b.source_ad_id} [${spec.layout}]: composed · re-check ${report.verdict.code}${layoutIssues.length ? " · NOT EXPORTABLE: " + layoutIssues.join("; ") : ""}`);
}
fs.writeFileSync(path.join(runDir, "finals", "summary.json"), JSON.stringify(summary, null, 2));
