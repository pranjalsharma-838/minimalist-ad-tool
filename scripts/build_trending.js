// "Trending now" (user request 2026-10-04): formats that MULTIPLE brands launched in the last 2 months and are still
// running. Those get recreated in Minimalist's minimal house style (run <date>-trending) and shown at the top of
// the gallery. Different from winners (30+ days running = proven) and from trends.json (format-level averages):
// this is what several brands have started doing recently and haven't switched off.
//   - statics only (image + carousel cards; video ads are not evidence, user rule 2026-10-04)
//   - started within TREND_DAYS (default 60) of the as-of date
//   - still running: research/competitor_status_<date>.json from the Ad Library check (latest file); without one,
//     "running at capture" is assumed and the output says so
//   - grouped by the ad's primary format (research/winners.json); kept when â‰¥ TREND_MIN_BRANDS (default 2) brands
// Usage: node scripts/build_trending.js  â†’ research/trending.json + research/trending.md
import fs from "node:fs";

const DAYS = Number(process.env.TREND_DAYS || 60), MIN_BRANDS = Number(process.env.TREND_MIN_BRANDS || 2);
const statusFile = fs.readdirSync("research").filter((f) => /^competitor_status_\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().pop();
const status = statusFile ? new Map((JSON.parse(fs.readFileSync(`research/${statusFile}`, "utf8")).ads || []).map((s) => [String(s.id), s.status])) : null;
const asOf = new Date(process.env.AS_OF || (statusFile ? statusFile.slice(18, 28) : new Date().toISOString().slice(0, 10)));
const ads = fs.readdirSync("research/competitor_ads").filter((f) => f.endsWith(".json")).flatMap((f) => JSON.parse(fs.readFileSync(`research/competitor_ads/${f}`, "utf8")));
const tags = new Map(JSON.parse(fs.readFileSync("research/winners.json", "utf8")).ads.map((w) => [String(w.id), w]));
const T = new Map(JSON.parse(fs.readFileSync("config/templates.json", "utf8")).templates.map((t) => [t.id, t]));
const daysOf = (a) => Math.round((asOf - new Date(a.started_running)) / 864e5);

const recent = ads.filter((a) => a.format !== "video" && a.started_running && daysOf(a) <= DAYS && tags.has(String(a.id)));
const live = recent.filter((a) => !status || status.get(String(a.id)) === "active");
const groups = new Map();
for (const a of live) {
  const w = tags.get(String(a.id));
  if (!groups.has(w.template_id)) groups.set(w.template_id, []);
  groups.get(w.template_id).push({ id: String(a.id), brand: a.brand, started: a.started_running, days: daysOf(a), format: a.format, image_file: a.image_file, url: `https://www.facebook.com/ads/library/?id=${a.id}`, one_line: w.one_line || a.visual_notes || "" });
}
const trends = [...groups.entries()].map(([id, xs]) => ({ template_id: id, name: T.get(id)?.name, family: T.get(id)?.family, layout: T.get(id)?.layout, brands: [...new Set(xs.map((x) => x.brand))], ads: xs.sort((a, b) => a.days - b.days) }))
  .filter((t) => t.brands.length >= MIN_BRANDS)
  .sort((a, b) => b.brands.length - a.brands.length || b.ads.length - a.ads.length);

const out = {
  built: new Date().toISOString(), as_of: asOf.toISOString().slice(0, 10), window_days: DAYS, min_brands: MIN_BRANDS,
  still_running: status ? `checked live in the Meta Ad Library on ${new Date(statusFile.slice(18, 28)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "assumed: running when captured (2 Oct 2026); run the status check to confirm",
  counts: { statics: ads.filter((a) => a.format !== "video").length, started_in_window: recent.length, still_running: live.length, stopped: recent.length - live.length },
  trends,
};
fs.writeFileSync("research/trending.json", JSON.stringify(out, null, 2));
fs.writeFileSync("research/trending.md", [
  "# Trending now: formats several brands launched recently and still run",
  "",
  `As of ${out.as_of}. Competitor static ads (10 Indian skincare brands, Meta Ad Library) that **started in the last ${DAYS} days** and are **still running** (${out.still_running}). A format is trending when **at least ${MIN_BRANDS} brands** are running it. Built by \`scripts/build_trending.js\`; the Minimalist recreations are in run \`2026-10-04-trending\` and at the top of \`ad_library/index.html\`.`,
  "",
  `${out.counts.started_in_window} of ${out.counts.statics} statics started in the window; ${out.counts.still_running} are still running${out.counts.stopped ? ` (${out.counts.stopped} stopped since the capture)` : ""}.`,
  "",
  "| Format | Brands | Ads | Newest | Brands running it |",
  "|---|---|---|---|---|",
  ...trends.map((t) => `| #${t.template_id} ${t.name} | ${t.brands.length} | ${t.ads.length} | ${t.ads[0].days} days ago | ${t.brands.join(", ")} |`),
  "",
  ...trends.flatMap((t) => [`## #${t.template_id} ${t.name}`, "", ...t.ads.map((a) => `- ${a.brand} Â· started ${a.started} (${a.days} days) Â· [Ad Library](${a.url}): ${a.one_line}`), ""]),
].join("\n"));
console.log(`${trends.length} trending formats (${out.counts.still_running}/${out.counts.started_in_window} recent statics still running): ${trends.map((t) => `#${t.template_id} ${t.name} (${t.brands.length} brands)`).join("; ")}`);
