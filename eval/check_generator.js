// Runs stand-in generator copy (eval/gen/<handle>.copy.json) through the app's real generator checks
// (citations + number check + layout fit) and the self-score, exactly as lib/generate.js would.
import fs from "node:fs";
import { checkCopy, adFromCopy, specFromCopy } from "../lib/generate.js";
import { layoutProblems } from "../public/render.js";
import { scoreAd } from "../lib/score.js";

for (const f of fs.readdirSync("eval/gen").filter((f) => f.endsWith(".copy.json"))) {
  const handle = f.replace(".copy.json", "");
  const sheet = JSON.parse(fs.readFileSync(`eval/gen/${handle}.sheet.json`, "utf8"));
  const copy = JSON.parse(fs.readFileSync(`eval/gen/${f}`, "utf8"));
  const problems = [...checkCopy(copy, sheet), ...layoutProblems(specFromCopy(copy, sheet))];
  const report = await scoreAd(adFromCopy(copy, sheet), { sheet, rulesOnly: true });
  console.log(`\n## ${sheet.title}`);
  console.log(`headline: ${copy.headline}\nsubhead: ${copy.subhead}\nproofs: ${copy.proof_points.join(" | ")}\nfootnote: ${copy.footnote}`);
  console.log(`code checks: ${problems.length ? problems.join("; ") : "pass"}`);
  console.log(`self-score (rules): ${report.verdict.code}`);
  for (const x of report.findings) console.log(`  ${x.severity} ${x.rule_id} "${x.span}"${x.note ? " — " + x.note : ""}`);
}
