// Stage 6b — inputs for the image prompt director (prompts/image_prompt_director.md), one per approved brief.
// Usage: node pipeline/06b_director_inputs.js <date> [variants=1]
// Writes director_inputs/<id>.md; the director writes director/<id>.json; chatgpt_prompts.md is rebuilt from those.
import fs from "node:fs";
import path from "node:path";

const [date, variants = "1"] = process.argv.slice(2);
const runDir = path.join("pipeline", "runs", date);
const briefs = JSON.parse(fs.readFileSync(path.join(runDir, "briefs_final.json"), "utf8")).filter((b) => b.status !== "refused_image_prompt");
const zones = JSON.parse(fs.readFileSync("config/layout_zones.json", "utf8"));
const visual = JSON.parse(fs.readFileSync("config/brand_visual_minimalist.json", "utf8"));
const assets = fs.existsSync("brand_packs/minimalist/assets/index.json") ? JSON.parse(fs.readFileSync("brand_packs/minimalist/assets/index.json", "utf8")).assets : [];
fs.mkdirSync(path.join(runDir, "director_inputs"), { recursive: true });

for (const b of briefs) {
  const layout = b.layout || "hero";
  const pack = assets.find((a) => a.product_handle === b.product_handle && a.type === "pack_shot");
  const footprint = pack ? `${pack.notes || "studio pack shot"}; light: ${pack.light || "upper-left key, shadow lower-right"}` : "studio pack shot; light upper-left key, shadow lower-right";
  const md = [
    `# Director input — ${b.source_ad_id}`,
    `target_model: chatgpt_image · placement: 1:1, 1080x1080 · variants: ${variants} (axis: surface)`,
    `risk_level (format): ${b.risk_level}${b.needs_real_photography ? " · needs real photography: " + b.photography_needed : ""}`,
    "",
    `## layout_zones (${layout})`, JSON.stringify({ ...zones.common, ...(zones[layout] || zones.hero) }),
    "", `## product_footprint`, `${b.product_title}: ${footprint}`,
    "", `## brand_visual`, JSON.stringify(visual),
    "", `## brief`, `layout ${layout}; angle: ${b.angle || "—"}${b.angle === "situation" ? " (situation-first: the scene should evoke the moment named in the headline/copy — no people, no product)" : ""}; hook: ${b.hook_type || "—"}; headline: ${b.headline}; layout_description: ${b.layout_description || ""}`,
    `visual direction (writer's draft prompt, to be recompiled): ${b.image_prompt}`,
  ].join("\n");
  fs.writeFileSync(path.join(runDir, "director_inputs", `${b.source_ad_id}.md`), md);
}
console.log(`${briefs.length} director inputs written`);
