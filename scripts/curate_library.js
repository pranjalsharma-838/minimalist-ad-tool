// Keeps only the final, good ads in ad_library/ (user, 2026-10-05: "library will have the final good ad images only").
// Kept: verdict READY_FOR_REVIEW (ad_library/scores.json), with or without AI people (those stay marked, not exportable).
// Everything else — blocked, needs-fix, not exportable, stray non-ad files — moves to ad_library_archive/ with the same
// path. Nothing is deleted. Re-run after scripts/score_library.js; then re-run score_library and make_library_gallery.
// Usage: node scripts/curate_library.js [--dry]
import fs from "node:fs";
import path from "node:path";

const LIB = "ad_library", ARCH = "ad_library_archive", dry = process.argv.includes("--dry");
const KEEP_TOP = new Set(["index.html", "scores.json", "README.md"]);
const scores = JSON.parse(fs.readFileSync(path.join(LIB, "scores.json"), "utf8").replace(/^﻿/, ""));
const byId = new Map((Array.isArray(scores.ads) ? scores.ads : Object.values(scores)).map((s) => [s.id, s]));
const SUMMARY = new Map(fs.readdirSync("pipeline/runs").flatMap((r) => {
  const f = path.join("pipeline/runs", r, "finals", "summary.json");
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).map((x) => [`${x.id}__${r.replace(/^\d{4}-\d{2}-\d{2}-?/, "")}`, x]) : [];
}));
// AI-image ads that pass every check stay too (user, 2026-10-05: "final ads still miss the ai generated ones"); they carry the AI mark and are not exportable until real photos replace the AI people.
// Later the same day: every scored ad comes back, the blocked and needs-fix ones with a visible warning in the app
// and gallery (user: "fix and bring back and give warning"). Only stray non-ad files are moved out now.
const good = (id) => Boolean(byId.get(id)?.verdict);

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
let kept = new Set(), moved = 0, ads = new Set();
for (const f of walk(LIB)) {
  const rel = path.relative(LIB, f);
  if (!rel.includes(path.sep) && KEEP_TOP.has(rel)) continue;
  const id = path.basename(f).split(".")[0];
  const isAd = byId.has(id) || SUMMARY.has(id);
  if (isAd) ads.add(id);
  if (isAd && good(id)) { kept.add(id); continue; }
  const to = path.join(ARCH, rel);
  if (!dry) { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.renameSync(f, to); }
  moved++;
}
// Empty format / product folders go too.
const prune = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) prune(path.join(d, e.name)); if (d !== LIB && !fs.readdirSync(d).length && !dry) fs.rmdirSync(d); };
prune(LIB);
console.log(`${kept.size} of ${ads.size} ads kept in ${LIB}/; ${moved} files moved to ${ARCH}/${dry ? " (dry run)" : ""}`);
