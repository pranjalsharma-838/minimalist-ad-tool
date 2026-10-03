// Minimalist's own long-running Meta ads — STATICS ONLY (user rule 2026-10-04: "from meta we were supposed to scrape
// statics and not videos, for competitor as well as ours"). We make static ads, so the house-style reference is the
// brand's static image and carousel ads only.
// Input: research/minimalist_top_ads/statics_scrape_<date>.json, captured in the browser from the Meta Ad Library
// (page Minimalistinc, India, active ads; the library page needs JavaScript). Each static carries its signed image
// links (they expire, so the downloaded image is the record). This script downloads the creatives (carousels: the
// first 4 cards), rewrites index.json with statics only, and moves any earlier video cover frames out of the set.
// Usage: node scripts/collect_own_top_ads.js
import fs from "node:fs";

const dir = "research/minimalist_top_ads";
const scrape = fs.readdirSync(dir).filter((f) => /^statics_scrape_.*\.json$/.test(f)).sort().pop();
const { captured, statics } = JSON.parse(fs.readFileSync(`${dir}/${scrape}`, "utf8"));

// Earlier set (2026-10-03) mixed in 10 video cover frames: keep them out of the reference, on record only.
const old = fs.existsSync(`${dir}/index.json`) ? JSON.parse(fs.readFileSync(`${dir}/index.json`, "utf8")) : [];
const videos = old.filter((a) => a.format === "video");
if (videos.length) {
  fs.mkdirSync(`${dir}/excluded_video_covers`, { recursive: true });
  for (const v of videos) if (v.file && fs.existsSync(`${dir}/${v.file}`)) fs.renameSync(`${dir}/${v.file}`, `${dir}/excluded_video_covers/${v.file}`);
  fs.writeFileSync(`${dir}/excluded_video_covers/index.json`, JSON.stringify(videos, null, 2));
}

const index = [];
for (const s of statics) {
  const files = [];
  for (const [i, src] of s.srcs.slice(0, 4).entries()) {
    const name = i ? `${s.id}_${i + 1}.jpg` : `${s.id}.jpg`;
    const r = await fetch(src, { headers: { "user-agent": "Mozilla/5.0" } }).catch(() => null);
    if (r?.ok) { fs.writeFileSync(`${dir}/${name}`, Buffer.from(await r.arrayBuffer())); files.push(name); }
  }
  index.push({ id: s.id, started: s.started, active: true, format: s.format, days_running: s.days, captured, ...(files.length ? { file: files[0], files } : { download_error: "fetch failed" }) });
}
fs.writeFileSync(`${dir}/index.json`, JSON.stringify(index, null, 2));
console.log(`${index.filter((a) => a.file).length}/${index.length} statics saved (${index.reduce((n, a) => n + (a.files?.length || 0), 0)} images); days running: ${index.map((a) => a.days_running).join(", ")}; ${videos.length} video covers moved to excluded_video_covers/`);
