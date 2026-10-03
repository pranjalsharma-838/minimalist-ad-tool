// Retry loop between the scorer and the brief writer (user decision 2026-10-03).
//   node pipeline/05b_retry.js <date> prepare   -> writes retry_inputs/<id>.round<N>.md for every brief with status needs_retry
//                                                 (N <= 3); the brief writer rewrites briefs_draft/<id>.json from it
//   node pipeline/05b_retry.js <date> finalize  -> after the last round, keeps the BEST version of every brief
//                                                 (never drops one) and writes briefs_final.json from those
// Every round's brief + findings are archived in history/<id>/round<N>.json, so the loop is auditable.
import fs from "node:fs";
import path from "node:path";

const [date, mode] = process.argv.slice(2);
const runDir = path.join("pipeline", "runs", date);
const final = JSON.parse(fs.readFileSync(path.join(runDir, "briefs_final.json"), "utf8"));
const MAX_ROUNDS = 3;
const RANK = { low: 0, medium: 1, high: 2, severe: 3 };

// Lower is better: hard failures first, then policy blocks, then must-fixes, then risk.
const cost = (b) => (b.hard_failures?.length || 0) * 100 + b.findings.filter((f) => f.severity === "block").length * 10 + b.findings.filter((f) => f.severity === "fix").length + (RANK[b.risk_level] || 0) * 0.1;

function archive(b) {
  const dir = path.join(runDir, "history", b.source_ad_id);
  fs.mkdirSync(dir, { recursive: true });
  const n = fs.readdirSync(dir).filter((f) => /^round\d+\.json$/.test(f)).length + 1;
  fs.writeFileSync(path.join(dir, `round${n}.json`), JSON.stringify(b, null, 2));
  return n;
}

if (mode === "prepare") {
  fs.mkdirSync(path.join(runDir, "retry_inputs"), { recursive: true });
  let prepared = 0;
  for (const b of final) {
    const round = archive(b);
    if (b.status !== "needs_retry") continue;
    if (round > MAX_ROUNDS) { console.log(`${b.source_ad_id}: ${MAX_ROUNDS} rounds done — will keep best version at finalize`); continue; }
    const flags = [
      ...b.hard_failures.map((h) => `- [must fix] ${h}`),
      ...b.findings.filter((f) => f.severity !== "advisory").map((f) => `- [${f.severity}] ${f.rule_id} "${f.span}": ${f.message} Suggested: ${f.fix}`),
    ];
    const original = fs.readFileSync(path.join(runDir, "brief_inputs", `${b.source_ad_id}.md`), "utf8");
    const md = [
      `# Retry round ${round} of ${MAX_ROUNDS} — brief ${b.source_ad_id}`,
      "",
      "Rewrite the brief so that every flag below is resolved. These are HARD constraints:",
      "- A flagged claim must be REMOVED or REPLACED with a different cited fact. Never reword it to keep the same meaning (e.g. 'anti-bacterial' -> 'fights bacteria' is not a fix).",
      "- Keep the layout and everything that wasn't flagged unchanged.",
      "- Every line still cites its facts; numbers must be in the cited facts.",
      "",
      "## Flags from the scorer",
      ...flags,
      "",
      "## Current brief (JSON)",
      "```json",
      JSON.stringify(Object.fromEntries(Object.entries(b).filter(([k]) => !["findings", "verdict", "coverage", "warnings", "hard_failures", "status", "risk_level", "ai_label_required", "product_url", "source_brand"].includes(k))), null, 2),
      "```",
      "",
      "## Original input (facts you may cite)",
      original,
    ].join("\n");
    fs.writeFileSync(path.join(runDir, "retry_inputs", `${b.source_ad_id}.round${round}.md`), md);
    prepared++;
    console.log(`${b.source_ad_id}: round ${round} input written (${flags.length} flags)`);
  }
  console.log(`${prepared} briefs need a rewrite this round`);
} else if (mode === "finalize") {
  const best = [];
  for (const b of final) {
    const dir = path.join(runDir, "history", b.source_ad_id);
    const versions = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^round\d+\.json$/.test(f)).map((f) => ({ ...JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")), _round: Number(f.match(/\d+/)[0]) })) : [];
    versions.push({ ...b, _round: Infinity });
    // Pilot audit fix (2026-10-03): a version scored by rules only looked "cleaner" than one the AI judge had
    // read, so finalize brought back a line the judge had flagged ("Zinc balances sebum activity"). Versions
    // are now compared only at equal checking depth: judged versions first, then cost, then newest wins ties.
    const judged = (v) => (v.coverage?.model || v.findings?.some((f) => f.source === "model") ? 1 : 0);
    versions.sort((x, y) => judged(y) - judged(x) || cost(x) - cost(y) || y._round - x._round);
    for (const v of versions) delete v._round;
    const keep = versions[0];
    keep.rounds_tried = versions.length;
    keep.kept_because = keep.status === "approved_for_image_step" ? "passed" : "best of all rounds (kept with its warnings — best briefs are never dropped)";
    if (keep.status === "needs_retry") keep.status = "kept_with_warnings";
    best.push(keep);
    console.log(`${b.source_ad_id}: kept version with cost ${cost(keep).toFixed(1)} of ${versions.length} (${keep.status}, risk ${keep.risk_level})`);
  }
  fs.writeFileSync(path.join(runDir, "briefs_final.json"), JSON.stringify(best, null, 2));
} else {
  console.error("Usage: node pipeline/05b_retry.js <date> prepare|finalize");
  process.exit(1);
}
