// Stage 8 — Compose finals: generated background + REAL pack shot + compliance-checked copy.
// Usage: node pipeline/08_compose.js <YYYY-MM-DD>
// Reads briefs_final.json + backgrounds/<id>.(png|jpg|webp). Writes finals/<id>.svg (served for PNG export)
// and re-scores the final copy so the shipped creative is the one that was checked.
import fs from "node:fs";
import path from "node:path";
import { specFromCopy, adFromCopy } from "../lib/generate.js";
import { renderAdSvg } from "../public/render.js";
import { scoreAd } from "../lib/score.js";

const date = process.argv[2];
const runDir = path.join("pipeline", "runs", date);
const briefs = JSON.parse(fs.readFileSync(path.join(runDir, "briefs_final.json"), "utf8"));
fs.mkdirSync(path.join(runDir, "finals"), { recursive: true });

const dataUrl = (buf, type) => `data:${type};base64,${buf.toString("base64")}`;
for (const b of briefs.filter((b) => b.status === "approved_for_image_step")) {
  const bg = ["png", "jpg", "jpeg", "webp"].map((e) => path.join(runDir, "backgrounds", `${b.source_ad_id}.${e}`)).find((p) => fs.existsSync(p));
  if (!bg) {
    console.log(`${b.source_ad_id}: no background yet (image step not done) — skipped`);
    continue;
  }
  const sheet = JSON.parse(fs.readFileSync(path.join(runDir, "products", `${b.product_handle}.json`), "utf8"));
  const copy = { headline: b.headline, subhead: b.subhead, proof_points: b.proof_points || [], footnote: b.footnote || "", cta: b.cta, citations: b.citations };
  const spec = specFromCopy(copy, sheet);
  const r = await fetch(spec.imageSrc, { headers: { "user-agent": "Mozilla/5.0" } });
  const pack = r.ok ? dataUrl(Buffer.from(await r.arrayBuffer()), r.headers.get("content-type") || "image/png") : "";
  const ext = path.extname(bg).slice(1).replace("jpg", "jpeg");
  const svg = renderAdSvg({ ...spec, imageHref: pack, backgroundHref: dataUrl(fs.readFileSync(bg), `image/${ext}`) });
  fs.writeFileSync(path.join(runDir, "finals", `${b.source_ad_id}.svg`), svg);
  const report = await scoreAd(adFromCopy(copy, sheet), { sheet, rulesOnly: true });
  console.log(`${b.source_ad_id}: composed${pack ? "" : " (PACK SHOT MISSING)"} · re-check ${report.verdict.code}`);
}
