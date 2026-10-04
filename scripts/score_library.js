// Scores every ad in the library with the checker's three scores (user, 2026-10-05: "every ad also reviewed and
// scored on the scoring we decided"): Minimalist alignment, win probability, compliance gate (lib/tiers.js via
// lib/score.js). The AI judge's review is included wherever one is on file (pipeline/runs/<run>/judge/<id>.json,
// written by the live API or a stand-in on the same prompt); otherwise the scores say "rules only".
// Writes ad_library/<handle>/<format>/<id>.scores.json, a "Scores" section in each <id>.md, and ad_library/scores.json.
// Usage: node scripts/score_library.js
import fs from "node:fs";
import path from "node:path";
import { adFromBrief } from "../lib/brief_check.js";
import { scoreAd } from "../lib/score.js";

const LIB = "ad_library";
const where = new Map();
for (const h of fs.readdirSync(LIB)) {
  const hd = path.join(LIB, h);
  if (!fs.statSync(hd).isDirectory()) continue;
  for (const f of fs.readdirSync(hd)) {
    const fd = path.join(hd, f);
    if (!fs.statSync(fd).isDirectory()) continue;
    for (const x of fs.readdirSync(fd)) if (/^[^.]+\.png$/.test(x)) where.set(x.replace(/\.png$/, ""), fd);
  }
}
const index = {};
for (const run of fs.readdirSync("pipeline/runs")) {
  const dir = path.join("pipeline/runs", run);
  const bf = path.join(dir, "briefs_final.json");
  if (!fs.existsSync(bf) || !fs.existsSync(path.join(dir, "products"))) continue;
  const briefs = JSON.parse(fs.readFileSync(bf, "utf8"));
  const match = fs.existsSync(path.join(dir, "match.json")) ? new Map(JSON.parse(fs.readFileSync(path.join(dir, "match.json"), "utf8")).map((m) => [m.id, m])) : new Map();
  const sheets = Object.fromEntries(fs.readdirSync(path.join(dir, "products")).map((f) => [f.replace(/\.json$/, ""), JSON.parse(fs.readFileSync(path.join(dir, "products", f), "utf8"))]));
  for (const b of Array.isArray(briefs) ? briefs : Object.values(briefs)) {
    const id = b.source_ad_id || b.id;
    const fd = where.get(id);
    if (!fd || index[id]) continue; // only ads that are in the library, newest run first is fine
    const handle = b.product_handle || match.get(id)?.product_handle;
    const ad = adFromBrief(b, sheets, handle);
    const jf = path.join(dir, "judge", `${id}.json`);
    const person = Boolean(b.person_prompt || b.frames_prompt);
    const result = Boolean(b.frames_prompt) || ["before_after", "timeline", "splitscreen"].includes(b.layout);
    const ctx = {
      sheet: sheets[handle],
      layout: b.layout,
      template_id: match.get(id)?.template_id ?? b.template_id,
      has_person: person,
      synthetic: person || result || b.layout === "texture" ? { people: person && !result, result, setting: false, label_drawn: true } : undefined,
      rulesOnly: true,
    };
    if (fs.existsSync(jf)) Object.assign(ctx, { injectModelData: JSON.parse(fs.readFileSync(jf, "utf8")), injectModelName: "AI judge (stand-in, same prompt)", rulesOnly: false });
    const r = await scoreAd(ad, ctx);
    const s = r.scores || {};
    const rec = {
      id, run, handle, layout: b.layout,
      alignment: s.alignment?.score ?? null, alignment_band: s.alignment?.band ?? null,
      win: s.win?.score ?? null, win_band: s.win?.band ?? null,
      compliance: s.compliance?.score ?? null, verdict: r.verdict.code, verdict_label: r.verdict.label,
      findings: r.findings.filter((f) => f.severity !== "advisory").map((f) => `${f.severity}: ${f.rule_id} "${f.span}"`).slice(0, 8),
      reviewed_by: r.coverage.model ? r.coverage.model_name : "rules only (no AI judge review on file)",
      parts: { alignment: s.alignment?.parts, win: s.win?.parts },
      scored_at: r.scored_at,
    };
    index[id] = rec;
    fs.writeFileSync(path.join(fd, `${id}.scores.json`), JSON.stringify(rec, null, 2));
    const md = path.join(fd, `${id}.md`);
    if (fs.existsSync(md)) {
      const body = fs.readFileSync(md, "utf8").replace(/\n## Scores[\s\S]*$/, "");
      fs.writeFileSync(md, `${body.trimEnd()}\n\n## Scores\n\n- Minimalist alignment: **${rec.alignment ?? "—"}** (${rec.alignment_band ?? "—"})\n- Win probability: **${rec.win ?? "—"}** (${rec.win_band ?? "—"}; proxy: still running 30+ days)\n- Compliance: **${rec.compliance ?? "—"}**, ${rec.verdict_label}\n- Reviewed by: ${rec.reviewed_by}\n${rec.findings.length ? `- Open findings: ${rec.findings.join("; ")}\n` : ""}`);
    }
  }
}
fs.writeFileSync(path.join(LIB, "scores.json"), JSON.stringify(index, null, 2));
const all = Object.values(index);
console.log(`${all.length} ads scored (${all.filter((x) => !/rules only/.test(x.reviewed_by)).length} with an AI judge review); library has ${where.size}. Blocked: ${all.filter((x) => x.verdict === "BLOCKED").length}`);
