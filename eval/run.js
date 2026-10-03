// Eval: compare the scorer against the independent reviewer's labels (eval/labels.json).
//   node eval/run.js            -> rules-only, plus rules+model wherever eval/sim_model/<id>.json exists
// Writes eval/results/summary.md and eval/results/details.json.
//
// What is measured (in order of cost to the business):
//   1. missed risk   — reviewer says block, tool says pass or only fix   (publishing something wrong)
//   2. phrase recall — share of reviewer-flagged phrases (block/fix level) the tool also flagged
//   3. over-block    — reviewer says pass, tool blocks                    (crying wolf -> people stop trusting it)
//   4. extra flags   — tool block/fix findings the reviewer didn't list    (reviewed by hand: FP or reviewer miss?)
import fs from "node:fs";
import { scoreAd } from "../lib/score.js";

// The out-of-distribution set (unseen brands, Amazon.in listing copy; scripts/build_ood_eval.js) is kept in its
// own files so rebuilding the original cases never drops it. Its labels were committed before it was scored.
const readIf = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : []);
const cases = [...readIf("eval/cases.json"), ...readIf("eval/cases_ood.json")];
const labels = new Map([...readIf("eval/labels.json"), ...readIf("eval/labels_ood.json")].map((l) => [l.id, l]));
const toLevel = (code) => ({ BLOCKED: "block", NEEDS_CHANGES: "fix" })[code] || "pass";
const RANK = { pass: 0, fix: 1, block: 2, advisory: 0 };
const FIELDS = ["headline", "primary_text", "on_image_text", "footnote", "cta"];

function phraseCaught(phrase, ad, findings) {
  const p = phrase.toLowerCase().trim();
  for (const field of FIELDS) {
    const text = (ad[field] || "").toLowerCase();
    const at = text.indexOf(p);
    if (at < 0) continue;
    const end = at + p.length;
    if (findings.some((f) => f.field === field && RANK[f.severity] >= 1 && f.start < end && at < f.end)) return true;
  }
  return false;
}

function overlapsAnyLabel(f, ad, issues) {
  const text = (ad[f.field] || "").toLowerCase();
  return issues.some((i) => {
    const at = text.indexOf(i.phrase.toLowerCase().trim());
    return at >= 0 && f.start < at + i.phrase.length && at < f.end;
  });
}

async function evaluate(mode) {
  const rows = [];
  for (const c of cases) {
    const label = labels.get(c.id);
    if (!label) continue;
    const ad = { ad_type: c.ad_type, advertiser: c.advertiser === "synthetic" ? "" : c.advertiser, headline: c.headline, primary_text: c.primary_text, on_image_text: c.on_image_text, footnote: c.footnote, cta: c.cta };
    let ctx = { rulesOnly: true };
    if (mode === "rules+model") {
      const f = `eval/sim_model/${c.id}.json`;
      if (!fs.existsSync(f)) continue;
      ctx = { injectModelData: JSON.parse(fs.readFileSync(f, "utf8")), injectModelName: "stand-in (Claude Code subagent, same prompt)" };
    }
    const r = await scoreAd(ad, ctx);
    const tool = toLevel(r.verdict.code);
    const serious = label.issues.filter((i) => RANK[i.level] >= 1);
    const caught = serious.filter((i) => phraseCaught(i.phrase, ad, r.findings));
    const extra = r.findings.filter((f) => RANK[f.severity] >= 1 && !overlapsAnyLabel(f, ad, label.issues));
    rows.push({
      id: c.id, split: c.split, advertiser: c.advertiser, label: label.label, tool,
      phrases_total: serious.length, phrases_caught: caught.length,
      missed_phrases: serious.filter((i) => !caught.includes(i)).map((i) => `[${i.level}] ${i.phrase} — ${i.concern}`),
      extra_flags: extra.map((f) => `[${f.severity}] ${f.rule_id} "${f.span}" (${f.layer})`),
      dropped_model_findings: r.dropped_model_findings.length,
    });
  }
  return rows;
}

function summarize(rows, title) {
  const splits = ["tuning", "holdout", "synthetic", "ood"];
  const out = [`### ${title}`, "", "| split | n | agree | missed risk (block→pass/fix) | under (fix→pass) | over-block (pass→block) | over-severity (fix→block) | over (pass→fix) | phrase recall | extra flags | model findings dropped |", "|---|---|---|---|---|---|---|---|---|---|---|"];
  for (const s of [...splits, "ALL"]) {
    const R = s === "ALL" ? rows : rows.filter((r) => r.split === s);
    if (!R.length) continue;
    const n = (pred) => R.filter(pred).length;
    const pt = R.reduce((a, r) => a + r.phrases_total, 0), pc = R.reduce((a, r) => a + r.phrases_caught, 0);
    out.push(`| ${s} | ${R.length} | ${n((r) => r.label === r.tool)} | ${n((r) => r.label === "block" && r.tool !== "block")} | ${n((r) => r.label === "fix" && r.tool === "pass")} | ${n((r) => r.label === "pass" && r.tool === "block")} | ${n((r) => r.label === "fix" && r.tool === "block")} | ${n((r) => r.label === "pass" && r.tool === "fix")} | ${pt ? `${pc}/${pt} (${Math.round((100 * pc) / pt)}%)` : "—"} | ${R.reduce((a, r) => a + r.extra_flags.length, 0)} | ${R.reduce((a, r) => a + r.dropped_model_findings, 0)} |`);
  }
  return out.join("\n");
}

const rulesOnly = await evaluate("rules");
const withModel = await evaluate("rules+model");
fs.mkdirSync("eval/results", { recursive: true });
fs.writeFileSync("eval/results/details.json", JSON.stringify({ rules_only: rulesOnly, rules_plus_model: withModel }, null, 2));
const md = [
  "# Eval results",
  "",
  `Generated ${new Date().toISOString()}. Labels: eval/labels.json (independent reviewer agent; saw research files and ads only, not rules/code).`,
  "Model layer: outputs in eval/sim_model/ were produced by Claude Code subagents given the exact rendered prompt (eval/rendered/), because no API key was available. They pass through the app's real validation code. This approximates, but is not, the production API path.",
  "How far each split generalises (see eval/README.md): tuning = read while writing the rules (optimistic); holdout = same Meta capture, hash-split and sealed until the rules were frozen (held out, but in-distribution); synthetic = adversarial edge cases written during the build (not independent of the builder); ood = brands never seen in the build + a different channel (Amazon.in listings), labelled blind and committed before scoring (the closest to 'ads you have not seen').",
  "",
  summarize(rulesOnly, "Rules only"),
  "",
  summarize(withModel, "Rules + model (stand-in)"),
  "",
  "## Per-case disagreements (rules + model)",
  ...withModel.filter((r) => r.label !== r.tool || r.missed_phrases.length).map((r) => `- **${r.id}** (${r.split}, ${r.advertiser}): reviewer **${r.label}**, tool **${r.tool}**${r.missed_phrases.length ? `; missed: ${r.missed_phrases.join(" | ")}` : ""}`),
].join("\n");
fs.writeFileSync("eval/results/summary.md", md + "\n");
console.log(md);
