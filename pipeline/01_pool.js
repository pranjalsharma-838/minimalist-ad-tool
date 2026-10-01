// Stage 1 — Pool: pick 10–12 competitor ads that have run 14+ days, spread across ad types and brands.
// Usage: node pipeline/01_pool.js <run-date YYYY-MM-DD> [size=12]
// Reads research/competitor_ads/*.json (Meta Ad Library captures). Writes pipeline/runs/<date>/pool.json.
// "Running 14+ days and still active" is the proxy for "this creative works": Meta's Ad Library
// doesn't disclose spend or results for commercial ads.
import fs from "node:fs";
import path from "node:path";

const [date, sizeArg] = process.argv.slice(2);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
  console.error("Usage: node pipeline/01_pool.js <YYYY-MM-DD> [size]");
  process.exit(1);
}
const SIZE = Number(sizeArg || 12);
const MAX_PER_BRAND = 2;
const runDir = path.join("pipeline", "runs", date);
fs.mkdirSync(runDir, { recursive: true });

const src = "research/competitor_ads";
const all = fs.readdirSync(src).filter((f) => f.endsWith(".json")).flatMap((f) => JSON.parse(fs.readFileSync(path.join(src, f), "utf8")));
const cutoff = new Date(new Date(date).getTime() - 14 * 864e5);
const qualifying = all.filter((a) => a.started_running && new Date(a.started_running) <= cutoff);
const seen = new Set();
const unique = qualifying.filter((a) => {
  const key = `${a.brand}|${(a.headline || "").toLowerCase()}|${(a.on_image_text || "").slice(0, 60).toLowerCase()}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Round-robin over ad types (rarest first, so before/after or comparison ads aren't crowded out),
// at most MAX_PER_BRAND per brand, statics with a downloaded image preferred, longest-running first.
const byType = new Map();
for (const a of unique.sort((x, y) => (y.image_file ? 1 : 0) - (x.image_file ? 1 : 0) || (y.days_running || 0) - (x.days_running || 0))) {
  if (!byType.has(a.ad_type)) byType.set(a.ad_type, []);
  byType.get(a.ad_type).push(a);
}
const types = [...byType.keys()].sort((a, b) => byType.get(a).length - byType.get(b).length);
const perBrand = new Map();
const pool = [];
while (pool.length < SIZE && types.some((t) => byType.get(t).length)) {
  for (const t of types) {
    if (pool.length >= SIZE) break;
    const list = byType.get(t);
    const i = list.findIndex((a) => (perBrand.get(a.brand) || 0) < MAX_PER_BRAND);
    if (i < 0) continue;
    const [a] = list.splice(i, 1);
    perBrand.set(a.brand, (perBrand.get(a.brand) || 0) + 1);
    pool.push(a);
  }
  if (types.every((t) => byType.get(t).every((a) => (perBrand.get(a.brand) || 0) >= MAX_PER_BRAND))) break;
}

fs.writeFileSync(path.join(runDir, "pool.json"), JSON.stringify(pool, null, 2));
const count = (k) => Object.entries(pool.reduce((m, a) => ((m[a[k]] = (m[a[k]] || 0) + 1), m), {})).map(([x, n]) => `${x} ${n}`).join(", ");
console.log(`captured ${all.length} · running 14+ days ${qualifying.length} · distinct ${unique.length} · pooled ${pool.length}`);
console.log(`by type: ${count("ad_type")}`);
console.log(`by brand: ${count("brand")}`);
if (pool.length < 10) console.log("NOTE: fewer than 10 qualifying ads — widen the brand list or relax the per-brand cap.");
