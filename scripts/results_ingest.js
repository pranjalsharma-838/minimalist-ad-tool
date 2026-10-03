// Add-on (c) — learn from OUR results. Competitor ads only show what works for them.
// Input: results/ledger.csv (one row per ad per reporting period; export from Meta Ads Manager or paste):
//   ad_id,period_start,period_end,spend,impressions,clicks,purchases,revenue
//   ad_id = the library id (e.g. niacinamide-10-with-matmarine__t36) used as the ad name in Ads Manager.
// Joins each ad's metadata (format/template, angle, hook_type, layout) from pipeline/runs/*/briefs_final.json,
// aggregates by format, angle and hook, and writes research/own_results.json, which lib/archetype.js reads.
// Scoring: CTR = clicks/impressions, CVR = purchases/clicks, ROAS = revenue/spend. A group only counts once it
// has >= MIN_IMPR impressions (small samples are noise). score (0..1) = ROAS relative to the best group,
// falling back to CTR when there are no purchases yet.
// Usage: node scripts/results_ingest.js
import fs from "node:fs";
import path from "node:path";

const MIN_IMPR = 3000;
const ledgerFile = "results/ledger.csv";
if (!fs.existsSync(ledgerFile)) {
  fs.mkdirSync("results", { recursive: true });
  fs.writeFileSync(ledgerFile, "ad_id,period_start,period_end,spend,impressions,clicks,purchases,revenue\n");
  console.log("Created empty results/ledger.csv — add rows once ads run.");
}
const rows = fs.readFileSync(ledgerFile, "utf8").trim().split(/\r?\n/).slice(1).filter(Boolean).map((l) => {
  const [ad_id, period_start, period_end, ...n] = l.split(",");
  const [spend, impressions, clicks, purchases, revenue] = n.map(Number);
  return { ad_id, period_start, period_end, spend, impressions, clicks, purchases, revenue };
});
const meta = new Map();
for (const run of fs.readdirSync("pipeline/runs")) {
  const f = path.join("pipeline/runs", run, "briefs_final.json");
  const m = path.join("pipeline/runs", run, "match.json");
  if (!fs.existsSync(f)) continue;
  const match = fs.existsSync(m) ? new Map(JSON.parse(fs.readFileSync(m, "utf8")).map((x) => [x.id, x])) : new Map();
  for (const b of JSON.parse(fs.readFileSync(f, "utf8"))) {
    const x = match.get(b.source_ad_id) || {};
    meta.set(b.source_ad_id, { template_id: x.template_id, template_name: x.template_name, angle: b.angle || x.angle || "unknown", hook_type: b.hook_type || "unknown", layout: b.layout });
  }
}
const groups = { template: {}, angle: {}, hook_type: {} };
const unknown = new Set();
for (const r of rows) {
  const m = meta.get(r.ad_id);
  if (!m) { unknown.add(r.ad_id); continue; }
  for (const [dim, key] of [["template", m.template_id], ["angle", m.angle], ["hook_type", m.hook_type]]) {
    const g = (groups[dim][key] ||= { spend: 0, impressions: 0, clicks: 0, purchases: 0, revenue: 0, ads: new Set() });
    for (const k of ["spend", "impressions", "clicks", "purchases", "revenue"]) g[k] += r[k] || 0;
    g.ads.add(r.ad_id);
  }
}
const out = { built: new Date().toISOString().slice(0, 10), min_impressions: MIN_IMPR, rows: rows.length, unknown_ad_ids: [...unknown] };
for (const dim of Object.keys(groups)) {
  const list = Object.entries(groups[dim]).map(([k, g]) => ({ key: k, ads: g.ads.size, spend: g.spend, impressions: g.impressions, ctr: g.impressions ? g.clicks / g.impressions : 0, cvr: g.clicks ? g.purchases / g.clicks : 0, roas: g.spend ? g.revenue / g.spend : 0, enough_data: g.impressions >= MIN_IMPR }));
  const ok = list.filter((x) => x.enough_data);
  const useRoas = ok.some((x) => x.roas > 0);
  const best = Math.max(1e-9, ...ok.map((x) => (useRoas ? x.roas : x.ctr)));
  out[dim] = Object.fromEntries(list.map((x) => [x.key, { ...x, score: x.enough_data ? +((useRoas ? x.roas : x.ctr) / best).toFixed(2) : null, basis: useRoas ? "roas" : "ctr" }]));
}
fs.writeFileSync("research/own_results.json", JSON.stringify(out, null, 2));
console.log(`${rows.length} ledger rows · ${Object.keys(out.template).length} formats · ${Object.values(out.template).filter((x) => x.enough_data).length} with enough data${unknown.size ? ` · unknown ad ids: ${[...unknown].join(", ")}` : ""}`);
