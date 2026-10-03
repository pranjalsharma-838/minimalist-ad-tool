// Stage 8 prep — list every image a run still needs, for the browser (ChatGPT) or the API:
//   bg      backgrounds/<id>.png         from director/<id>.json (background only)
//   person  backgrounds/<id>.person.png  from the brief's person_prompt (AI person; no product — the pack is composited)
//   frames  backgrounds/<id>.frames.png  from the brief's frames_prompt (N panels in ONE image, split later by
//           scripts/split_frames.py: timeline 3, splitscreen / before_after 2)
// Writes <run>/image_jobs.json (skips images that already exist). Every person/frames prompt gets the same
// exclusions appended, so no job can ask for the product, text or logos.
// Usage: node pipeline/07b_image_jobs.js <run>
import fs from "node:fs";
import path from "node:path";

const run = process.argv[2];
const dir = path.join("pipeline", "runs", run);
const briefs = JSON.parse(fs.readFileSync(path.join(dir, "briefs_final.json"), "utf8"));
const has = (f) => fs.existsSync(path.join(dir, "backgrounds", f));
const EXCL = "Do not include: any product, bottle, tube, jar, dropper or packaging, any text, letters, labels, logos or brand names.";
const PANELS = { timeline: 3, splitscreen: 2, before_after: 2 };
// Casting overrides (user review 2026-10-03: cast Indian men and women): <run>/casting_overrides.json maps
// id → { person?: "...", frames?: "..." } and replaces the brief's person_prompt / frames_prompt.
const castFile = path.join(dir, "casting_overrides.json");
const CAST = fs.existsSync(castFile) ? JSON.parse(fs.readFileSync(castFile, "utf8")) : {};
const jobs = [];
for (const b0 of briefs.filter((x) => ["approved_for_image_step", "kept_with_warnings"].includes(x.status))) {
  const ov = CAST[b0.source_ad_id] || {};
  const b = { ...b0, person_prompt: ov.person || b0.person_prompt, frames_prompt: ov.frames || b0.frames_prompt };
  const id = b.source_ad_id;
  const dj = path.join(dir, "director", `${id}.json`);
  if (!has(`${id}.png`) && fs.existsSync(dj)) {
    const d = JSON.parse(fs.readFileSync(dj, "utf8"));
    if (!d.refused && d.variants?.[0]?.image_prompt) jobs.push({ id, kind: "bg", out: `${id}.png`, prompt: d.variants[0].image_prompt });
  }
  if (b.person_prompt && !has(`${id}.person.png`)) jobs.push({ id, kind: "person", out: `${id}.person.png`, prompt: `Create a photorealistic photo: ${b.person_prompt.replace(/^create (a )?(photorealistic )?(photo|image)[:,]?\s*/i, "")} Natural, unretouched skin texture. ${EXCL} Square 1:1.` });
  const n = PANELS[b.layout];
  if (b.frames_prompt && n && !has(`${id}.frames.png`)) jobs.push({ id, kind: "frames", out: `${id}.frames.png`, prompt: `Create a photorealistic wide image made of ${n === 3 ? "three" : "two"} equal side-by-side panels separated by thin white gaps, the SAME adult with identical framing, angle and soft daylight from the upper left in every panel. ${b.frames_prompt} Natural skin texture with visible pores, not airbrushed. ${EXCL} No eyes or lips if the panels are skin close-ups. Wide 3:2 image.` });
}
fs.writeFileSync(path.join(dir, "image_jobs.json"), JSON.stringify(jobs, null, 1));
const count = (k) => jobs.filter((j) => j.kind === k).length;
console.log(`${jobs.length} image jobs → ${dir}/image_jobs.json (bg ${count("bg")}, person ${count("person")}, frames ${count("frames")})`);
