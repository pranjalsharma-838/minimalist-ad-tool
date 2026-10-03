// One-off (2026-10-03): relabel the angle of offer-layout briefs in a run as "offer_value" (labels only; the ad
// copy was already offer-led). Fixes the pickAngle bug in pipeline/00_product_run.js for runs made before the fix.
// Usage: node scripts/fix_offer_angle_labels.js <run>
import fs from "node:fs";
const dir = `pipeline/runs/${process.argv[2]}`;
let n = 0;
for (const f of [`${dir}/briefs_final.json`, `${dir}/match.json`]) {
  const xs = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const x of xs) if ((x.layout === "offer" || x.template_id === 36) && x.angle !== "offer_value") { x.angle = "offer_value"; if ("hook_type" in x) x.hook_type = "offer"; n++; }
  fs.writeFileSync(f, JSON.stringify(xs, null, 2));
}
for (const f of fs.readdirSync(`${dir}/briefs_draft`)) {
  const p = `${dir}/briefs_draft/${f}`, b = JSON.parse(fs.readFileSync(p, "utf8"));
  if (b.layout === "offer" && b.angle !== "offer_value") { b.angle = "offer_value"; b.hook_type = "offer"; fs.writeFileSync(p, JSON.stringify(b, null, 2)); }
}
console.log(`${n} labels corrected`);
