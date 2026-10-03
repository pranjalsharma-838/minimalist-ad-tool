// Stage 10 — save finished ads into the ad library, each PNG with a description file.
// Usage: node pipeline/09_library.js <run>
// Reads finals/<id>.png (+ .svg), briefs_final.json, match.json, director/<id>.json.
// Writes ad_library/<product_handle>/<template-slug>/<id>.png + <id>.md and appends ad_library/INDEX.md.
import fs from "node:fs";
import path from "node:path";

const run = process.argv[2];
const runDir = path.join("pipeline", "runs", run);
const briefs = JSON.parse(fs.readFileSync(path.join(runDir, "briefs_final.json"), "utf8"));
const match = new Map(JSON.parse(fs.readFileSync(path.join(runDir, "match.json"), "utf8")).map((m) => [m.id, m]));
const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const rows = [];
for (const b of briefs) {
  // One description per creative; the 4:5 / 9:16 PNGs are copied alongside and listed under "Placements".
  const all = fs.existsSync(path.join(runDir, "finals")) ? fs.readdirSync(path.join(runDir, "finals")).filter((f) => f.startsWith(b.source_ad_id + ".") || f.startsWith(b.source_ad_id + "_v")) : [];
  const pngs = all.filter((f) => /\.png$/.test(f) && !/\.(4x5|9x16|[a-z]{2})\.png$/.test(f));
  const extra = all.filter((f) => /\.(4x5|9x16|[a-z]{2})\.png$/.test(f)); // placements + language versions
  if (!pngs.length) continue;
  const m = match.get(b.source_ad_id) || {};
  const dest = path.join("ad_library", b.product_handle, slug(m.template_name || b.layout));
  fs.mkdirSync(dest, { recursive: true });
  const dirJson = path.join(runDir, "director", `${b.source_ad_id}.json`);
  const director = fs.existsSync(dirJson) ? JSON.parse(fs.readFileSync(dirJson, "utf8")) : null;
  for (const e of extra) fs.copyFileSync(path.join(runDir, "finals", e), path.join(dest, e));
  for (const png of pngs) {
    const id = png.replace(/\.png$/, "");
    fs.copyFileSync(path.join(runDir, "finals", png), path.join(dest, png));
    const v = Number((id.match(/_v(\d+)$/) || [, 1])[1]);
    const lines = [
      `# ${b.product_title} — ${m.template_name || b.layout}${pngs.length > 1 ? ` (variant ${v})` : ""}`,
      "",
      "**INTERNAL TEST — not for publication** (Minimalist is a the test brand for this pipeline).",
      "",
      `| | |`, `|---|---|`,
      `| Product | ${b.product_title} (${b.product_url}) |`,
      `| Format | #${m.template_id ?? "?"} ${m.template_name || ""} · layout \`${b.layout || "hero"}\` |`,
      `| Why this format | ${b.archetype_reason || m.match_method || ""} |`,
      `| Angle / hook | ${b.angle || m.angle || "—"} · hook: ${b.hook_type || "—"} |`,
      `| Blended from | ${(b.blend_sources || []).map((x) => `${x.brand} (${x.id}): ${x.took}`).join("; ") || (m.blend_refs || []).join("; ") || "—"} |`,
      `| Social proof | ${Object.keys(b.citations || {}).length && JSON.stringify(b.citations).match(/RATING|REV\d/g) ? [...new Set(JSON.stringify(b.citations).match(/RATING|REV\d/g))].join(", ") + " (real, verbatim)" : "none"} |`,
      `| Placements | 1:1 ${id}.png${fs.existsSync(path.join(runDir, "finals", `${id}.4x5.png`)) ? ` · 4:5 ${id}.4x5.png · 9:16 ${id}.9x16.png` : ""} |`,
      `| Language versions | ${fs.existsSync(path.join(runDir, "translations")) ? fs.readdirSync(path.join(runDir, "translations")).filter((f) => f.startsWith(b.source_ad_id + ".") && /\.[a-z]{2}\.json$/.test(f)).map((f) => f.slice(-7, -5)).join(", ") || "none" : "none"} |`,
      `| Risk level | **${b.risk_level}**${b.ai_label_required ? " · carries the AI-GENERATED — ILLUSTRATIVE mark" : ""} |`,
      `| Compliance verdict | ${b.verdict?.label || ""} (${b.coverage?.model ? "rules + AI judge" : "rules only"}) |`,
      `| Retry rounds | ${b.rounds_tried || 1} |`,
      `| Run | ${run} |`,
      "",
      "## Copy on the creative",
      `- Headline: ${b.headline || ""}`,
      b.subhead ? `- Subhead: ${b.subhead}` : "",
      ...(b.proof_points || []).map((p) => `- ${p}`),
      `- Footnote: ${b.footnote || ""}`,
      `- CTA: ${b.cta || ""}`,
      "",
      "## Facts cited (from the product page)",
      "```json", JSON.stringify(b.citations || {}, null, 0), "```",
      "",
      "## Remaining findings / warnings",
      ...([...(b.warnings || []), ...(b.findings || []).filter((f) => f.severity !== "advisory").map((f) => `[${f.severity}] ${f.rule_id} "${f.span}": ${f.fix}`)].map((x) => `- ${x}`)),
      (b.warnings || []).length || (b.findings || []).some((f) => f.severity !== "advisory") ? "" : "- none above advisory",
      "",
      "## Image",
      `- Background prompt: ${director?.variants?.[v - 1]?.image_prompt || b.image_prompt || ""}`,
      `- Director rationale: ${director?.rationale || ""}`,
      "- Product: real pack shot from beminimalist.co, composited (never generated).",
      b.needs_real_photography ? `- Real photography needed: ${b.photography_needed}` : "",
      "",
      "## Adaptation notes",
      b.adaptation_notes || "",
    ];
    fs.writeFileSync(path.join(dest, `${id}.md`), lines.join("\n") + "\n");
    rows.push(`| ${b.product_title} | ${m.template_name || b.layout} | ${b.risk_level} | [${png}](${path.join(b.product_handle, slug(m.template_name || b.layout), png).replace(/\\/g, "/")}) |`);
  }
}
// INDEX.md is rebuilt from the whole library on every run (appending duplicated rows on re-runs).
const idx = "ad_library/INDEX.md";
const prev = fs.existsSync(idx) ? fs.readFileSync(idx, "utf8").split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| Product")) : [];
const byFile = new Map([...prev, ...rows].map((r) => [r.match(/\[([^\]]+)\]/)?.[1], r]));
fs.writeFileSync(idx, "# Ad library (internal test — Minimalist stand-in)\n\nEach ad has a description file (`<id>.md`) next to it: product, format, angle, blend sources, copy, cited facts, risk, AI label, image prompt. 4:5 / 9:16 and language versions sit alongside.\n\n| Product | Format | Risk | File |\n|---|---|---|---|\n" + [...byFile.values()].sort().join("\n") + "\n");
console.log(`${rows.length} ads saved to ad_library/`);
