// Reuse a product's existing studio backgrounds for new ads in a run (saves image-generation capacity; user
// decision 2026-10-03). For each approved brief without backgrounds/<id>.png, copy one of the SAME product's plain
// backgrounds from other runs, rotating by ad id so neighbouring ads don't all share one scene.
// Never reuses person or frame images. Usage: node scripts/reuse_backgrounds.js <run>
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const run = process.argv[2];
const dir = path.join("pipeline", "runs", run);
const briefs = JSON.parse(fs.readFileSync(path.join(dir, "briefs_final.json"), "utf8"));
fs.mkdirSync(path.join(dir, "backgrounds"), { recursive: true });
const pool = {};
for (const r of fs.readdirSync("pipeline/runs")) {
  const bd = path.join("pipeline/runs", r, "backgrounds");
  if (r === run || !fs.existsSync(bd)) continue;
  for (const f of fs.readdirSync(bd).filter((f) => /^[a-z0-9-]+__t\d+\.png$/.test(f))) {
    const handle = f.split("__")[0];
    (pool[handle] ||= []).push(path.join(bd, f));
  }
}
let n = 0;
for (const b of briefs.filter((x) => ["approved_for_image_step", "kept_with_warnings"].includes(x.status))) {
  const out = path.join(dir, "backgrounds", `${b.source_ad_id}.png`);
  if (fs.existsSync(out)) continue;
  const cands = (pool[b.product_handle] || []).sort();
  if (!cands.length) { console.log(`${b.source_ad_id}: no background to reuse`); continue; }
  const pick = cands[parseInt(crypto.createHash("md5").update(b.source_ad_id).digest("hex").slice(0, 8), 16) % cands.length];
  fs.copyFileSync(pick, out);
  n++;
}
console.log(`${n} backgrounds reused into ${dir}/backgrounds`);
