// Draws docs/pipeline_diagram.svg (+ .png via headless Edge/Chrome): every agent, script and check, what it
// does, and how they connect to the final output. Regenerate whenever the pipeline changes.
// Usage: node scripts/make_pipeline_diagram.js
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const W = 2600, H = 1330, F = "Helvetica Neue, Helvetica, Arial, sans-serif";
const K = {
  agent: { fill: "#111111", text: "#FFFFFF", sub: "#C9C9C9", stroke: "#111111" },
  script: { fill: "#ECEAE5", text: "#111111", sub: "#555555", stroke: "#ECEAE5" },
  check: { fill: "#FFFFFF", text: "#111111", sub: "#555555", stroke: "#B42318" },
  output: { fill: "#E3F1E7", text: "#0B3D1E", sub: "#2F6B45", stroke: "#2F6B45" },
  source: { fill: "#FFFFFF", text: "#111111", sub: "#666666", stroke: "#BDBDBD" },
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const nodes = {};
const parts = [];
function box(id, x, y, w, h, kind, title, lines = [], tag = "") {
  const k = K[kind];
  nodes[id] = { x, y, w, h };
  parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${k.fill}" stroke="${k.stroke}" stroke-width="${kind === "check" ? 3 : 2}"${kind === "check" ? ' stroke-dasharray="10 6"' : ""}/>`);
  if (tag) parts.push(`<text x="${x + w - 14}" y="${y + 26}" text-anchor="end" font-family="${F}" font-size="15" font-weight="700" fill="${k.sub}" letter-spacing="1">${esc(tag)}</text>`);
  parts.push(`<text x="${x + 18}" y="${y + 34}" font-family="${F}" font-size="22" font-weight="700" fill="${k.text}">${esc(title)}</text>`);
  lines.forEach((l, i) => parts.push(`<text x="${x + 18}" y="${y + 62 + i * 22}" font-family="${F}" font-size="16" fill="${k.sub}">${esc(l)}</text>`));
}
const edges = [];
function arrow(a, b, { from = "r", to = "l", label = "", dash = false, color = "#444" } = {}) { edges.push({ a, b, from, to, label, dash, color }); }
const pt = (n, side) => { const o = nodes[n]; return side === "r" ? [o.x + o.w, o.y + o.h / 2] : side === "l" ? [o.x, o.y + o.h / 2] : side === "t" ? [o.x + o.w / 2, o.y] : [o.x + o.w / 2, o.y + o.h]; };
function col(x, label) { parts.push(`<text x="${x}" y="150" font-family="${F}" font-size="17" font-weight="700" fill="#888" letter-spacing="2">${esc(label)}</text>`); }

parts.push(`<rect width="${W}" height="${H}" fill="#FAF9F6"/>`);
parts.push(`<text x="60" y="70" font-family="${F}" font-size="38" font-weight="700" fill="#111">Ad creative pipeline — agents, scripts and checks</text>`);
parts.push(`<text x="60" y="108" font-family="${F}" font-size="19" fill="#555">Test brand: Minimalist. Product URL in → compliant, sourced ads out. The product is never AI-drawn; every claim cites a source; a human reviews before any use.</text>`);

// Column 1 — sources
col(60, "1 · SOURCES");
box("src_site", 60, 170, 300, 92, "source", "Brand website", ["product pages, prices, offers", "Yotpo reviews"]);
box("src_amz", 60, 282, 300, 92, "source", "Amazon.in", ["best-seller competitors", "listings + reviews"]);
box("src_meta", 60, 394, 300, 92, "source", "Meta Ad Library", ["74 competitor ads, 10 brands;", "statics only (videos ignored)"]);
box("src_reg", 60, 506, 300, 92, "source", "Regulators", ["ASCI, CCPA, D&C Act,", "CDSCO notices"]);
box("src_url", 60, 640, 300, 92, "source", "Product URL (request)", ["the one input a user gives", "(app) or a product list"]);
box("src_own", 60, 752, 300, 112, "source", "Own top-running statics", ["8 static Meta ads, 52–98 days", "(videos excluded) → house look", "+ text budget (style guide)"]);
box("src_results", 60, 1080, 300, 92, "source", "Our live ad results", ["Meta Ads Manager export", "→ results/ledger.csv"]);

// Column 2 — data scripts + knowledge agents
col(420, "2 · KNOWLEDGE (scripts + agents)");
box("s_offers", 420, 170, 420, 92, "script", "Offers & prices", ["collect_offers.js · live MRP, sale price,", "sitewide offers, capture date"], "SCRIPT");
box("s_reviews", 420, 282, 420, 92, "script", "Reviews & customer language", ["collect_reviews · marketplace_reviews ·", "mine_customer_language → concern map"], "SCRIPT");
box("a_brand", 420, 394, 420, 114, "agent", "Brand-context agent", ["facts with ids · 294-claim matrix ·", "house style + ad style from the", "brand's own top-running statics"], "AGENT");
box("a_assets", 420, 528, 420, 92, "agent", "Asset-library agent", ["118 real photos labelled ·", "13 clean cut-outs of the pack"], "AGENT");
box("a_winners", 420, 640, 420, 114, "agent", "Winner agent + trends", ["tags 74 ads to 48 formats · winner =", "a static running 30+ days (51) ·", "build_trends.js: winner share × breadth"], "AGENT");
box("s_reg", 420, 774, 420, 92, "script", "Regulatory watch", ["reg_watch.js · new ASCI / CDSCO items", "→ rules + sources (human reads)"], "SCRIPT");
box("s_ledger", 420, 1080, 420, 92, "script", "Own-results scoring", ["results_ingest.js · ROAS / CTR by", "format, angle, hook (≥3,000 impr.)"], "SCRIPT");

// Column 3 — decide
col(900, "3 · DECIDE");
box("k_arch", 900, 470, 400, 190, "agent", "Archetype skill", ["ranks all 48 formats per product:", "winners · trends · page facts ·", "objective · OUR results (35%) ·", "variety penalty — never removes a", "format, gives each a risk level"], "SKILL");
box("s_input", 900, 690, 400, 136, "script", "Brief inputs", ["00_product_run.js · blend 3 winners,", "balanced angle (situation-first,", "concern, offer…), social proof"], "SCRIPT");

// Column 4 — create + check loop
col(1360, "4 · WRITE & CHECK");
box("a_writer", 1360, 400, 420, 136, "agent", "Brief-writer agent", ["every line cites a fact id; on-image", "text budget (title + 1 line + tag);", "details go to the caption"], "AGENT");
box("c_scorer", 1360, 600, 420, 160, "check", "Scorer (Part B)", ["43 rules + AI judge (image + caption)", "verdict computed in code", "eval: 90% holdout · 81% unseen", "brands, 0 missed blocks"], "CHECK");
box("c_retry", 1360, 800, 420, 92, "check", "Retry loop ≤ 3 rounds", ["flag → remove or replace, never reword", "best JUDGED version always kept"], "CHECK");
box("a_trans", 1360, 930, 420, 116, "agent", "Translator agent", ["Hindi · Tamil · Telugu · Bengali · Marathi", "+ language check: back-translation rules,", "numbers lock, same-language footnote"], "AGENT");

// Column 5 — image
col(1840, "5 · IMAGE");
box("c_style", 1840, 400, 360, 118, "check", "Style check + editor", ["brand statics' text budget (0–15", "words); edits only cut, code-checked", "→ 88/88 ads within budget"], "CHECK");
box("a_director", 1840, 538, 360, 116, "agent", "Image prompt director", ["optional: the minimal look draws", "no scene backgrounds; person /", "frames prompts come from the brief"], "AGENT");
box("c_prompt", 1840, 674, 360, 92, "check", "Prompt check", ["refuses any prompt that draws", "the product; AI-label rules"], "CHECK");
box("x_gen", 1840, 786, 360, 92, "source", "ChatGPT / OpenAI image", ["AI people & frames only: any", "model makes the ad SEVERE"]);
box("s_compose", 1840, 898, 360, 170, "script", "Compose + re-check", ["minimal: white canvas, real pack", "large + shadow, title + 1 line,", "quiet CTA, \"Hide Nothing.\" · AI mark", "1:1 · 4:5 · 9:16 · rules re-run"], "SCRIPT");

// Column 6 — outputs
col(2260, "6 · OUTPUT");
box("o_lib", 2260, 560, 300, 190, "output", "Ad library", ["88 ads · 268 PNGs · gallery", "every product × every angle", "+ Us vs Them · description per ad", "(creative copy, caption, facts, risk)", "Severe / models → never exported"]);
box("o_app", 2260, 790, 300, 150, "output", "The app", ["Part A: URL → finished ad", "Part B: score any ad", "(rules + AI judge)"]);
box("o_review", 2260, 980, 300, 116, "output", "Human review", ["verdict at best: “Ready for", "human review” — never auto-", "approved"]);

// Edges
arrow("src_site", "s_offers"); arrow("src_site", "s_reviews", { to: "l" }); arrow("src_amz", "s_reviews");
arrow("src_site", "a_brand", { to: "l" }); arrow("src_amz", "a_assets", { to: "l" }); arrow("src_meta", "a_winners", { to: "l" });
arrow("src_reg", "s_reg", { to: "l" }); arrow("src_results", "s_ledger");
arrow("src_url", "a_brand", { to: "l", dash: true });
arrow("src_own", "a_brand", { to: "l" });
for (const n of ["a_brand", "a_assets", "a_winners"]) arrow(n, "k_arch");
arrow("s_ledger", "k_arch", { to: "l", label: "learns" });
arrow("k_arch", "s_input", { from: "b", to: "t" });
for (const n of ["s_offers", "s_reviews"]) arrow(n, "s_input", { to: "l" });
arrow("s_input", "a_writer", { to: "l" });
arrow("a_writer", "c_scorer", { from: "b", to: "t" });
arrow("c_scorer", "c_retry", { from: "b", to: "t" });
arrow("c_retry", "a_writer", { from: "l", to: "l", label: "fix", color: "#B42318" });
arrow("s_reg", "c_scorer", { label: "rules" });
arrow("c_retry", "a_trans", { from: "b", to: "t" });
arrow("c_retry", "c_style", { label: "approved" });
arrow("c_style", "a_director", { from: "b", to: "t" });
arrow("a_director", "c_prompt", { from: "b", to: "t" });
arrow("c_prompt", "x_gen", { from: "b", to: "t" });
arrow("x_gen", "s_compose", { from: "b", to: "t" });

arrow("a_trans", "s_compose", { label: "languages" });
arrow("s_compose", "o_lib"); arrow("s_compose", "o_review");
arrow("c_scorer", "o_app", { from: "b", to: "l", dash: true, label: "Part B" });

const defs = `<defs>${["#444", "#B42318"].map((c, i) => `<marker id="m${i}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`).join("")}</defs>`;
const lines = edges.map(({ a, b, from, to, label, dash, color }) => {
  const [x1, y1] = pt(a, from), [x2, y2] = pt(b, to);
  let d;
  if (from === "l" && to === "l") d = `M${x1},${y1} C${x1 - 70},${y1} ${x2 - 70},${y2} ${x2},${y2}`;
  else if (from === "b" && to === "b") d = `M${x1},${y1} C${x1},${y1 + 260} ${x2},${y2 + 260} ${x2},${y2}`;
  else if (from === "b" || to === "t") d = `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
  else d = `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;
  const mk = color === "#B42318" ? "m1" : "m0";
  const lab = label ? `<text x="${from === "l" ? x1 - 60 : x1 + 10}" y="${from === "b" ? y1 + 20 : y1 - 8}" font-family="${F}" font-size="15" font-style="italic" fill="${color}">${esc(label)}</text>` : "";
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="2" ${dash ? 'stroke-dasharray="7 6"' : ""} marker-end="url(#${mk})"/>${lab}`;
});
// Legend
const L = [["agent", "AI agent / skill (judgement)"], ["script", "Script (no AI: fetch, compute, compose)"], ["check", "Compliance check"], ["output", "Output"], ["source", "Source / external service"]];
const legend = L.map(([k, t], i) => `<rect x="${60 + i * 500}" y="${H - 70}" width="34" height="24" rx="5" fill="${K[k].fill}" stroke="${K[k].stroke}" stroke-width="2"${k === "check" ? ' stroke-dasharray="6 4"' : ""}/><text x="${104 + i * 500}" y="${H - 52}" font-family="${F}" font-size="17" fill="#333">${t}</text>`).join("");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${parts[0]}${lines.join("")}${parts.slice(1).join("")}${legend}</svg>`;
fs.writeFileSync("docs/pipeline_diagram.svg", svg);
const browser = [process.env.BROWSER, `${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`, `${process.env.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe`, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => p && fs.existsSync(p));
if (browser) {
  const html = path.resolve("docs/pipeline_diagram.wrap.html");
  fs.writeFileSync(html, `<!doctype html><body style="margin:0"><img src="pipeline_diagram.svg" width="${W}" height="${H}" style="display:block"></body>`);
  try { execFileSync(browser, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${W},${H}`, `--screenshot=${path.resolve("docs/pipeline_diagram.png")}`, "file:///" + html.replace(/\\/g, "/")], { stdio: "ignore", timeout: 60000 }); } finally { fs.rmSync(html, { force: true }); }
  console.log("docs/pipeline_diagram.svg + .png");
} else console.log("docs/pipeline_diagram.svg (no browser found for PNG)");
