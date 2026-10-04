// Image studio queue processor (app "Make a different image" → image_requests/*.json; see image_requests/README.md).
//   node scripts/image_queue.mjs prepare  → queued requests become jobs for scripts/gpt_render.js (the user's own web
//                                           ChatGPT, run by the operator through Playwright) and are marked "working"
//   node scripts/image_queue.mjs finish   → each finished image is checked against the real pack
//                                           (scripts/verify_pack.py) and <id>.result.json is written for the app
// Label rule (user decision 2026-10-05): the pack must come out unchanged; a failed check is "needs_review" and is
// re-prompted by the operator with exact fixes, at most 3 rounds.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const Q = path.join(ROOT, "image_requests");
const JOBS = path.join(ROOT, "brand_packs/minimalist/assets/ai_renders/jobs.json");
const mode = process.argv[2];
const reqs = fs.readdirSync(Q).filter((f) => /^\d.*\.json$/.test(f) && !f.endsWith(".result.json")).map((f) => ({ f, r: JSON.parse(fs.readFileSync(path.join(Q, f), "utf8")) }));
const abs = (p) => (/^[A-Za-z]:/.test(p) ? p : path.join(ROOT, p));

if (mode === "prepare") {
  const jobs = fs.existsSync(JOBS) ? JSON.parse(fs.readFileSync(JOBS, "utf8")) : [];
  let n = 0;
  for (const { f, r } of reqs.filter((x) => x.r.status === "queued")) {
    const out = path.join(Q, `${r.id}.png`);
    jobs.push({ h: r.id, image: /^https?:/.test(r.base_image) ? "" : abs(r.base_image), out, prompt: `${r.prompt}\n\nUse the attached photo as the exact product: the pack must stay identical (shape, cap, colours, label layout and every word on the label exactly as printed). Do not add, remove or change any text, logo or element on the pack.` });
    r.status = "working";
    fs.writeFileSync(path.join(Q, f), JSON.stringify(r, null, 2));
    n++;
  }
  fs.writeFileSync(JOBS, JSON.stringify(jobs, null, 1));
  console.log(`${n} request(s) added to the ChatGPT job list`);
} else if (mode === "finish") {
  for (const { r } of reqs.filter((x) => x.r.status === "working")) {
    const img = path.join(Q, `${r.id}.png`);
    if (!fs.existsSync(img)) continue;
    const cut = path.join(ROOT, `brand_packs/minimalist/assets/cutouts/${r.handle}_render.png`);
    const ref = fs.existsSync(cut) ? cut : abs(r.base_image);
    let check = {};
    try { check = JSON.parse(execFileSync("python", [path.join(ROOT, "scripts/verify_pack.py"), ref, img, path.join(Q, `${r.id}_check.png`)], { encoding: "utf8" })); } catch (e) { check = { verdict_hint: `check failed: ${e.message.slice(0, 80)}` }; }
    const pass = /^PASS/.test(check.verdict_hint || "");
    const res = { status: pass ? "done" : "needs_review", image: `image_requests/${r.id}.png`, rounds: 1, notes: `Label check: ${check.verdict_hint} (similarity ${check.label_similarity ?? "?"}). Any person in the image is an AI model: Severe, AI mark.` };
    fs.writeFileSync(path.join(Q, `${r.id}.result.json`), JSON.stringify(res, null, 2));
    console.log(r.id, res.status);
  }
} else console.log("usage: node scripts/image_queue.mjs prepare|finish");
