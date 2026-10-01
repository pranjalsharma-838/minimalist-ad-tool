// Dev helper: run the RULE layer over a corpus file and print hits per ad, for eyeballing
// false positives / misses while writing rules. Usage: node scripts/score_corpus.js eval/corpus_tuning.json
import fs from "node:fs";
import { runRules } from "../lib/rules.js";

const file = process.argv[2] || "eval/corpus_tuning.json";
const ads = JSON.parse(fs.readFileSync(file, "utf8"));
for (const a of ads) {
  const ad = {
    ad_type: /\swith\s/i.test(a.advertiser) ? "creator" : "brand",
    headline: a.headline,
    primary_text: a.primary_text,
    on_image_text: a.on_image_text,
    cta: a.cta,
    footnote: "",
  };
  const fs_ = runRules(ad);
  console.log(`\n## ${a.id} | ${a.advertiser} | ${ad.ad_type}`);
  for (const f of fs_) console.log(`  ${f.severity.padEnd(8)} ${f.rule_id.padEnd(7)} ${f.field.padEnd(13)} "${f.span}"`);
  if (!fs_.length) console.log("  (no rule hits)");
}
