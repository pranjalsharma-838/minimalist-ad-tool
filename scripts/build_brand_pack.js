// Builds the Minimalist brand pack (the brand-context agent's source files) from raw channel captures:
//   brand_packs/minimalist/product_catalog.md   — top-20 SKUs: actives, format, price, suitability, usage
//   brand_packs/minimalist/claims_matrix.md     — every website claim, classified BY RULE (traceable):
//       DO NOT USE            a block-level rule hit (e.g. anti-bacterial, heal, skin lightening)
//       NEEDS SUBSTANTIATION  a fix-level rule hit (clinically proven, time-bound, acne wording…)
//       SUBSTANTIATED ON PAGE a test with its method stated on the page (ISO, report no., n, lab)
//       USABLE AS PUBLISHED   no rule hits
//   brand_packs/minimalist/channel_listings.md  — website vs Amazon.in vs Flipkart, per SKU (if captured)
// Usage: node scripts/build_brand_pack.js
import fs from "node:fs";
import { runRules } from "../lib/rules.js";

const dir = "brand_packs/minimalist";
const web = JSON.parse(fs.readFileSync(`${dir}/raw/website.json`, "utf8"));
const read = (f) => (fs.existsSync(`${dir}/raw/${f}`) ? JSON.parse(fs.readFileSync(`${dir}/raw/${f}`, "utf8")) : null);
const amazon = read("amazon_in.json");
const flipkart = read("flipkart.json");
const pick = (list, rank) => (list || []).find((x) => x.rank === rank);

const METHOD = /\b(ISO\s?\d+|in-?vivo|in-?vitro|study (number|report)|report no|n\s?=\s?\d+|\d+\s+(subjects|volunteers|babies|participants)\b(?! (agreed|said|noticed|saw|felt|reported))|independent (third[- ]party )?lab|clinical research lab|tested on \d+)/i;

function classify(fact, sheet) {
  const hits = runRules({ ad_type: "brand", headline: "", primary_text: fact.text, on_image_text: "", footnote: "", cta: "" }, { sheet })
    .filter((h) => h.dimension === "policy");
  const blocks = hits.filter((h) => h.severity === "block");
  const fixes = hits.filter((h) => h.severity === "fix");
  if (blocks.length) return { status: "DO NOT USE", why: blocks.map((h) => `${h.rule_id} "${h.span}"`).join(", ") };
  if (fact.kind === "study" && METHOD.test(fact.text)) return { status: "SUBSTANTIATED ON PAGE", why: "test method stated" + (fixes.length ? `; still check ${fixes.map((h) => h.rule_id).join(", ")}` : "") };
  if (fixes.length) return { status: "NEEDS SUBSTANTIATION", why: fixes.map((h) => `${h.rule_id} "${h.span}"`).join(", ") };
  return { status: "USABLE AS PUBLISHED", why: "" };
}

const md = (s) => String(s ?? "").replace(/\|/g, "/").replace(/\n/g, " ");
const today = web.collected;

// ---- catalog ----
const cat = [`# Minimalist product catalog — top 20 sellers`, ``, `Source: beminimalist.co product pages (brand-authored sections only), captured ${today}. Rank = position in the brand's Best Sellers collection (order assumed sales-ranked, unverified). Prices are the site's default variant on that date and change often — re-check before quoting.`, ``];
for (const p of web.products) {
  if (p.error) { cat.push(`## ${p.rank}. ${p.handle} — NOT CAPTURED (${p.error})`, ""); continue; }
  const f = (k) => p.facts.filter((x) => x.kind === k).map((x) => x.text);
  const line = (re) => p.facts.find((x) => re.test(x.text))?.text || "not stated";
  cat.push(
    `## ${p.rank}. ${p.title}`,
    `- URL: ${p.url} · handle \`${p.handle}\``,
    `- Headline actives (from pack title): ${p.actives.map((a) => (a.name === "SPF" ? `SPF ${a.pct}` : `${a.pct} ${a.name}`)).join(", ") || "none in title"}`,
    `- Price (default variant, ${today}): ₹${p.price_inr ?? "?"}`,
    `- Tagline: ${md(f("claim")[0] || "not stated")}`,
    `- Suitability: ${md(f("suitability").join(" · ") || "not stated")}`,
    `- How to use: ${md(f("usage").join(" · ") || "not stated")}`,
    `- Pregnancy / age: ${md(line(/pregnan|lactat|years of age|\d+\+ years/i))}`,
    `- Full INCI: on the product page ("All Ingredients") — ${p.facts.some((x) => x.kind === "inci") ? "captured in raw/website.json" : "not found"}`,
    ``
  );
}
fs.writeFileSync(`${dir}/product_catalog.md`, cat.join("\n"));

// ---- claims matrix ----
const cm = [`# Minimalist claims matrix — website claims, classified by rule`, ``, `Every brand-authored claim/study/ingredient line on the top-20 product pages (${today}), run through rules/brand_rules.json (policy rules only). The status is mechanical and traceable to a rule id — it is a pre-screen for legal, not a legal opinion.`, ``, `- **DO NOT USE** — breaks a block-level rule even though the brand publishes it.`, `- **NEEDS SUBSTANTIATION** — usable only with the study/qualifier on file and shown (fix-level rule hit).`, `- **SUBSTANTIATED ON PAGE** — the page states the test method (ISO standard, lab, report number, n).`, `- **USABLE AS PUBLISHED** — no rule hits; still cite it as the page states it.`, `- Customer testimonials are never claims and are excluded.`, ``, `**Limit:** this classification is the RULE layer only. Implied claims — e.g. ingredient literature presented as product results (CLM-23), unhedged efficacy — are judged by the model layer and are NOT reflected here. "USABLE AS PUBLISHED" means "no rule hit", not "cleared".`, ``];
const totals = {};
for (const p of web.products.filter((p) => !p.error)) {
  const sheet = { actives: p.actives, facts: p.facts };
  const rows = p.facts.filter((f) => ["claim", "study", "ingredient_note"].includes(f.kind)).map((f) => ({ f, c: classify(f, sheet) }));
  cm.push(`## ${p.rank}. ${p.title}`, ``, `| Fact | Section | Claim (verbatim) | Status | Why |`, `|---|---|---|---|---|`);
  for (const { f, c } of rows) {
    totals[c.status] = (totals[c.status] || 0) + 1;
    cm.push(`| ${f.id} | ${md(f.section)} | ${md(f.text)} | **${c.status}** | ${md(c.why)} |`);
  }
  cm.push(``);
}
cm.splice(10, 0, `**Totals:** ${Object.entries(totals).map(([k, v]) => `${k} ${v}`).join(" · ")}`, ``);
fs.writeFileSync(`${dir}/claims_matrix.md`, cm.join("\n"));

// ---- channel comparison ----
const ch = [`# Minimalist channel listings — website vs Amazon.in vs Flipkart`, ``, `Website: ${today}. Amazon/Flipkart: from raw/amazon_in.json and raw/flipkart.json (${amazon ? "captured" : "NOT YET CAPTURED"} / ${flipkart ? "captured" : "NOT YET CAPTURED"}). "Differs" notes are the collector's observation, verbatim.`, ``];
for (const p of web.products) {
  const a = pick(amazon, p.rank), k = pick(flipkart, p.rank);
  ch.push(`## ${p.rank}. ${p.title || p.handle}`);
  ch.push(`- **Website**: ₹${p.price_inr ?? "?"} · tagline: ${md(p.facts?.find((f) => f.kind === "claim")?.text || "—")}`);
  ch.push(a ? `- **Amazon.in** (${a.status}): ${md(a.listing_title || "")} · ₹${a.price ?? "?"} (MRP ${a.mrp ?? "?"}) · ${a.rating ?? "?"}★ (${a.rating_count ?? "?"}) · seller ${md(a.seller || "?")}${a.badges?.length ? " · " + a.badges.join(", ") : ""}${a.differs_from_website ? `\n  - Differs: ${md(a.differs_from_website)}` : ""}` : `- **Amazon.in**: not captured`);
  ch.push(k ? `- **Flipkart** (${k.status}): ${md(k.listing_title || "")} · ₹${k.price ?? "?"} (MRP ${k.mrp ?? "?"}) · ${k.rating ?? "?"}★ (${k.rating_count ?? "?"}) · seller ${md(k.seller || "?")}${k.differs_from_website ? `\n  - Differs: ${md(k.differs_from_website)}` : ""}` : `- **Flipkart**: not captured`);
  ch.push(``);
}
fs.writeFileSync(`${dir}/channel_listings.md`, ch.join("\n"));
console.log("claims:", JSON.stringify(totals), "| amazon:", amazon ? amazon.length : 0, "| flipkart:", flipkart ? flipkart.length : 0);
