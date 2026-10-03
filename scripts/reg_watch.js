// Add-on (h) — regulatory watch (script, no browser, no model tokens).
// Fetches the ASCI and CDSCO listing pages, keeps links whose title matches the watch keywords, and diffs
// against the previous snapshot. New items are what a human (or the rules owner) must read and, if needed,
// turn into rules in rules/brand_rules.json + research/regulatory_sources.md.
// Watched: ASCI guidance on AI-generated content in ads (expected Dec 2026) and CDSCO cosmetics notices.
// Usage: node scripts/reg_watch.js   → research/reg_watch.json (snapshot) + research/reg_watch.md (report)
import fs from "node:fs";

const SOURCES = [
  { name: "ASCI guidelines", url: "https://www.ascionline.in/the-asci-code-guidelines/" },
  { name: "ASCI home (news)", url: "https://www.ascionline.in/" },
  { name: "ASCI reports", url: "https://www.ascionline.in/reports/" },
  { name: "CDSCO notices", url: "https://cdsco.gov.in/opencms/opencms/en/Notifications/Public-Notices/" },
];
const KEYWORDS = /\b(AI|artificial intelligence|generative|synthetic|deepfake|digitally (altered|manipulated)|filter|cosmetic|skin|sunscreen|SPF|claim|beauty|personal care|dark pattern|influencer|disclos)/i;
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129 Safari/537.36" };
const strip = (h) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();
const abs = (href, base) => { try { return new URL(href, base).href; } catch { return null; } };

const snapFile = "research/reg_watch.json";
const prev = fs.existsSync(snapFile) ? JSON.parse(fs.readFileSync(snapFile, "utf8")) : { items: [] };
const seen = new Set(prev.items.map((i) => i.url));
const items = [], errors = [];
for (const s of SOURCES) {
  const r = await fetch(s.url, { headers: UA }).catch((e) => ({ ok: false, status: e.message }));
  if (!r.ok) { errors.push(`${s.name}: ${r.status}`); continue; }
  const html = await r.text();
  for (const m of html.matchAll(/<a\b[^>]*href="([^"#]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    const title = strip(m[2]), url = abs(m[1], s.url);
    if (!url || title.length < 12 || title.length > 220 || !KEYWORDS.test(title)) continue;
    if (items.some((i) => i.url === url)) continue;
    items.push({ source: s.name, title, url, first_seen: seen.has(url) ? prev.items.find((i) => i.url === url).first_seen : new Date().toISOString().slice(0, 10), ai: /\b(AI|artificial intelligence|generative|synthetic|deepfake|digitally)/i.test(title) });
  }
  await new Promise((r) => setTimeout(r, 1500));
}
const fresh = items.filter((i) => !seen.has(i.url));
fs.writeFileSync(snapFile, JSON.stringify({ checked: new Date().toISOString(), items, errors }, null, 2));
const md = [
  "# Regulatory watch", "",
  `Last checked ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · ${items.length} matching items · ${prev.items.length ? `${fresh.length} new since last check` : "first snapshot (everything counts as new)"}.`,
  "Watching for: ASCI guidance on AI-generated content in advertising (expected Dec 2026) and CDSCO cosmetics notices. A new item means: read it, then update `rules/brand_rules.json` + `research/regulatory_sources.md` if it changes what ads may say or show.", "",
  errors.length ? `**Fetch problems:** ${errors.join("; ")}` : "", "",
  "## AI-content items", ...(items.filter((i) => i.ai).map((i) => `- ${fresh.includes(i) ? "**NEW** " : ""}[${i.title}](${i.url}) — ${i.source}, first seen ${i.first_seen}`)), items.some((i) => i.ai) ? "" : "- none found yet",
  "", "## Other matching items (cosmetics, claims, disclosure)", ...items.filter((i) => !i.ai).slice(0, 60).map((i) => `- ${fresh.includes(i) ? "**NEW** " : ""}[${i.title}](${i.url}) — ${i.source}`),
].filter((l, i, a) => !(l === "" && a[i - 1] === ""));
fs.writeFileSync("research/reg_watch.md", md.join("\n") + "\n");
console.log(`${items.length} items (${items.filter((i) => i.ai).length} AI-related), ${fresh.length} new; errors: ${errors.join("; ") || "none"}`);
for (const i of items.filter((i) => i.ai)) console.log(" AI:", i.title, "→", i.url);
