// Prints the compliance-gate result per brief (non-advisory findings), for review.
// Usage: node pipeline/show_gate.js <YYYY-MM-DD> [all]
import fs from "node:fs";
const [date, all] = process.argv.slice(2);
const briefs = JSON.parse(fs.readFileSync(`pipeline/runs/${date}/briefs_final.json`, "utf8"));
for (const b of briefs.filter((b) => all || b.status !== "approved_for_image_step")) {
  console.log(`\n${b.source_ad_id} ${b.status} | ${b.ad_type} | ${b.product_title}\n  headline: ${b.headline}`);
  for (const h of b.hard_failures) console.log(`  HARD ${h}`);
  for (const f of b.findings.filter((f) => all || f.severity !== "advisory")) console.log(`  ${f.severity} ${f.rule_id} "${f.span}" :: ${f.message.slice(0, 160)}`);
}
