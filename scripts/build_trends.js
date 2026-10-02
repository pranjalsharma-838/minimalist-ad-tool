// Trend file v1 (layer 3), built from the competitor ads we hold. Reports market behaviour only.
//   momentum  — share of a format's ads that started in the last 60 days (brands are launching it now)
//   longevity — share of its ads running 90+ days (it keeps working)
//   saturation — number of distinct brands running it (high = crowded, harder to stand out)
// formats[id] (0..1) = 0.6*winner share (30+ days) + 0.4*breadth (brands / most brands on any format) -- the archetype skill's trend signal.
// (v1 used 0.5*momentum + 0.5*longevity; those two are near-complements, so every format scored ~0.5. Momentum is now reported only.)
// Scope: India, Meta, 10 brands, 74 ads (2026-10-02 capture). Global sources (Google Ads Transparency,
// TikTok Creative Center, trade press) are NOT included yet — stated in the file.
import fs from "node:fs";

const asOf = new Date("2026-10-03");
const winners = JSON.parse(fs.readFileSync("research/winners.json", "utf8")).ads;
const raw = new Map(fs.readdirSync("research/competitor_ads").filter((f) => f.endsWith(".json")).flatMap((f) => JSON.parse(fs.readFileSync(`research/competitor_ads/${f}`, "utf8"))).map((a) => [String(a.id), a]));
const templates = JSON.parse(fs.readFileSync("config/templates.json", "utf8")).templates;

const by = {};
for (const w of winners) {
  const a = raw.get(String(w.id)) || {};
  const days = w.days_running ?? a.days_running ?? 0;
  (by[w.template_id] ||= []).push({ brand: w.brand, days, started: a.started_running });
}
const formats = {}, table = [];
const maxBrands = Math.max(...Object.values(by).map((xs) => new Set(xs.map((x) => x.brand)).size));
for (const t of templates) {
  const xs = by[t.id] || [];
  if (!xs.length) continue;
  const recent = xs.filter((x) => x.days <= 60).length / xs.length;
  const long = xs.filter((x) => x.days >= 90).length / xs.length;
  const brands = new Set(xs.map((x) => x.brand)).size;
  const win = xs.filter((x) => x.days >= 30).length / xs.length;
  formats[t.id] = +(0.6 * win + 0.4 * (brands / maxBrands)).toFixed(2);
  table.push({ id: t.id, name: t.name, ads: xs.length, brands, winner_share: +win.toFixed(2), momentum: +recent.toFixed(2), longevity: +long.toFixed(2), saturated: brands >= 6 });
}
table.sort((a, b) => formats[b.id] - formats[a.id]);
fs.writeFileSync("research/trends.json", JSON.stringify({ built: asOf.toISOString().slice(0, 10), scope: "India · Meta Ad Library · 10 competitor brands · 74 ads. Global sources not yet included.", formats, table }, null, 2));
const md = ["# Trend file v1 — formats (market behaviour only, no recommendation)", "", `Scope: India, Meta, 10 brands, 74 ads, as of ${asOf.toISOString().slice(0, 10)}. Signal = 0.6 x winner share (ran 30+ days) + 0.4 x breadth (brands using it vs the most-used format). Momentum = share started in the last 60 days (reference only); longevity = share running 90+ days; saturated = 6+ brands run it. Global sources (Google Ads Transparency, TikTok Creative Center, trade press) not yet included.`, "", "| # | Format | Ads | Brands | Winner share | Momentum | Longevity | Saturated | Signal |", "|---|---|---|---|---|---|---|---|---|", ...table.map((r) => `| ${r.id} | ${r.name} | ${r.ads} | ${r.brands} | ${r.winner_share} | ${r.momentum} | ${r.longevity} | ${r.saturated ? "yes" : ""} | ${formats[r.id]} |`)];
fs.writeFileSync("research/trends.md", md.join("\n") + "\n");
console.log(table.slice(0, 8).map((r) => `${r.id} ${r.name}: ${formats[r.id]} (${r.ads} ads, ${r.brands} brands${r.saturated ? ", saturated" : ""})`).join("\n"));
