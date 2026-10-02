// Stage 4 (prep) — one input file per ad for the brief-writer agent: the competitor ad's tags + text,
// and the matched product's fact sheet with citable ids. The agent reads prompts/pipeline_brief_writer.md
// plus one of these and writes briefs_draft/<id>.json.
// Usage: node pipeline/04_prepare_briefs.js <YYYY-MM-DD>
import fs from "node:fs";
import path from "node:path";
import { extractFromUrl } from "../lib/extract.js";
import { matchProduct } from "../lib/similarity.js";

// Companion products for multi-product formats (journey / range): the closest cleanser, serum and
// sunscreen for the ad's concern, excluding the main product. Facts are fetched live and saved.
async function companions(comp, mainHandle, runDir) {
  const out = [];
  for (const format of ["cleanser", "serum", "sunscreen"]) {
    const m = matchProduct({ ...comp, format, name: `${comp.name || ""} ${format}` });
    const cand = m.candidates.map((c) => c.handle).find((h) => h !== mainHandle && !out.includes(h));
    if (cand) out.push(cand);
  }
  for (const h of out) {
    const f = path.join(runDir, "products", `${h}.json`);
    if (!fs.existsSync(f)) {
      fs.writeFileSync(f, JSON.stringify(await extractFromUrl(`https://beminimalist.co/products/${h}`), null, 2));
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return out;
}

const date = process.argv[2];
const runDir = path.join("pipeline", "runs", date);
const pool = new Map(JSON.parse(fs.readFileSync(path.join(runDir, "pool.json"), "utf8")).map((a) => [a.id, a]));
const matches = JSON.parse(fs.readFileSync(path.join(runDir, "match.json"), "utf8"));
fs.mkdirSync(path.join(runDir, "brief_inputs"), { recursive: true });
fs.mkdirSync(path.join(runDir, "briefs_draft"), { recursive: true });

for (const m of matches) {
  const ad = pool.get(m.id);
  const tags = JSON.parse(fs.readFileSync(path.join(runDir, "tags", `${m.id}.json`), "utf8"));
  const sheet = JSON.parse(fs.readFileSync(path.join(runDir, "products", `${m.product_handle}.json`), "utf8"));
  const facts = sheet.facts.filter((f) => f.kind !== "inci").map((f) => `${f.id} [${f.kind}] (${f.section}) ${f.text}`).join("\n");
  const md = [
    `# Brief input — source ad ${m.id}`,
    "",
    `source_ad_id: ${m.id}`,
    `Competitor: ${ad.brand} · ${ad.days_running} days running · ${ad.format}`,
    `Matched product: ${sheet.title} (${sheet.url}) — match ${m.match_confidence}: ${m.candidates[0].why.join(", ")}`,
    "",
    "## Competitor ad tags (structure to keep)",
    "```json",
    JSON.stringify(tags, null, 2),
    "```",
    "",
    "## Competitor ad text (reference only — never reuse its wording)",
    `Headline: ${ad.headline || ""}`,
    `Primary text: ${ad.primary_text || ""}`,
    `On-image text: ${ad.on_image_text || ""}`,
    `CTA: ${ad.cta || ""}`,
    "",
    `## Product facts: ${sheet.title} (main product, handle "${m.product_handle}"; cite by id; [testimonial], [faq], [inci] are not citable for claims)`,
    `Hero shown by the layout (from the pack title, not written by you): ${sheet.actives.map((a) => a.name === "SPF" ? `SPF ${a.pct}` : `${a.pct} ${a.name}`).join(", ") || "(none)"}`,
    facts,
  ];
  // Companion products, for journey / range layouts only (cite as "<handle>:F<n>").
  const comps = await companions(m.competitor_product || {}, m.product_handle, runDir);
  for (const h of comps) {
    const cs = JSON.parse(fs.readFileSync(path.join(runDir, "products", `${h}.json`), "utf8"));
    md.push("", `## Companion product: ${cs.title} (handle "${h}"; cite as "${h}:F<n>"; use only in journey or range layouts)`);
    md.push(...cs.facts.filter((f) => !["inci", "faq", "testimonial"].includes(f.kind)).slice(0, 14).map((f) => `${h}:${f.id} [${f.kind}] (${f.section}) ${f.text}`));
  }
  const text = md.join("\n");
  fs.writeFileSync(path.join(runDir, "brief_inputs", `${m.id}.md`), text);
}
console.log(`wrote ${matches.length} brief inputs to ${path.join(runDir, "brief_inputs")}`);
