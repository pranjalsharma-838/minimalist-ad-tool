// Builds ad_library/index.html — a review gallery of every ad in the library (local file, no server needed).
// Reads each ad's PNG + its description .md (written by pipeline/09_library.js). Filters by product and risk.
// Usage: node scripts/make_library_gallery.js   then open ad_library/index.html
import fs from "node:fs";
import path from "node:path";

const ROOT = "ad_library";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(ROOT).map((f) => f.replace(/\\/g, "/"));
const mains = files.filter((f) => f.endsWith(".png") && path.basename(f).split(".").length === 2);
const field = (md, label) => ((md.match(new RegExp(`\\| ${label} \\| ([^\\n]*?) \\|\\s*$`, "m")) || [])[1] || "").replace(/\*\*/g, "").trim();
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
// The compose step decides exportability (finals/summary.json: Severe, models, open warnings, layout issues); the gallery
// reads that instead of guessing from the risk label (it counted 41, the creatives say 48).
const SUMMARY = new Map(fs.readdirSync("pipeline/runs").flatMap((r) => { const f = path.join("pipeline/runs", r, "finals", "summary.json"); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")).map((x) => [`${x.id}__${r.replace(/^\d{4}-\d{2}-\d{2}-?/, "")}`, x]) : []; }));
const ads = mains.map((png) => {
  const base = png.replace(/\.png$/, "");
  const mdFile = `${base}.md`;
  const md = fs.existsSync(mdFile) ? fs.readFileSync(mdFile, "utf8") : "";
  const risk = (field(md, "Risk level").match(/low|medium|high|severe/i) || ["?"])[0].toLowerCase();
  const verdict = field(md, "Compliance verdict");
  const run = (base.match(/__([a-z]+)$/) || [, ""])[1];
  const extras = files.filter((f) => f.startsWith(base + ".") && f.endsWith(".png") && f !== png).map((f) => ({ f, tag: f.slice(base.length + 1, -4) }));
  return {
    png: path.relative(ROOT, png).replace(/\\/g, "/"), md: path.relative(ROOT, mdFile).replace(/\\/g, "/"),
    title: (md.match(/^# (.*)$/m) || [, path.basename(base)])[1], product: field(md, "Product").replace(/\s*\(https?:[^)]*\)/, ""),
    format: field(md, "Format").replace(/ · layout.*$/, ""), angle: field(md, "Angle / hook"), risk, verdict, run,
    exportable: SUMMARY.get(path.basename(base))?.exportable ?? (risk !== "severe" && !/warning/i.test(verdict)),
    ai: /^yes/i.test(field(md, "AI imagery")),
    extras: extras.map((x) => ({ f: path.relative(ROOT, x.f).replace(/\\/g, "/"), tag: { "4x5": "4:5", "9x16": "9:16", hi: "Hindi", ta: "Tamil" }[x.tag] || x.tag })),
  };
}).sort((a, b) => a.product.localeCompare(b.product) || a.format.localeCompare(b.format));
const products = [...new Set(ads.map((a) => a.product))];
// "Trending now" (user request 2026-10-04): formats several brands launched in the last 60 days and still run
// (research/trending.json, scripts/build_trending.js), each next to our Minimalist recreation (run "trending").
const TR = fs.existsSync("research/trending.json") ? JSON.parse(fs.readFileSync("research/trending.json", "utf8")) : null;
const tid = (a) => Number((a.format.match(/^#(\d+)/) || [])[1]);
const trendRow = (t) => {
  const ours = ads.filter((a) => a.run === "trending" && tid(a) === t.template_id);
  const refs = t.ads.filter((x, i, all) => all.findIndex((y) => y.brand === x.brand) === i).slice(0, 4);
  return `<div class="trow"><div class="tinfo"><h3>#${t.template_id} ${esc(t.name)}</h3><p><b>${t.brands.length} brands</b> · ${t.ads.length} ads · newest ${t.ads[0].days} days ago</p><p class="tb">${esc(t.brands.join(", "))}</p></div>
  <div class="trefs">${refs.map((x) => `<a href="${esc(x.url)}" target="_blank" title="${esc(x.one_line)}"><img loading="lazy" src="../${esc(x.image_file)}" alt="${esc(x.brand)}"><span>${esc(x.brand)} · ${x.days}d</span></a>`).join("")}</div>
  <div class="tarrow">→</div><div class="tours">${ours.length ? ours.map((a) => `<a href="${esc(a.png)}" target="_blank"><img loading="lazy" src="${esc(a.png)}" alt="${esc(a.title)}"></a><span><span class="risk ${a.risk}">${a.risk}</span> ${a.exportable ? "exportable after review" : "not exportable"} · <a href="${esc(a.md)}" target="_blank">description</a></span>`).join("") : "<span>not made yet</span>"}</div></div>`;
};
const trending = TR && TR.trends.length ? `<section class="trend"><h2>Trending now</h2><p>Formats that at least ${TR.min_brands} competitor brands launched in the last ${TR.window_days} days and are still running (statics only; ${esc(TR.still_running)}). Left: their ads. Right: our version in Minimalist's minimal style, built from those references, never copying them.</p>${TR.trends.map(trendRow).join("")}</section>` : "";
const card = (a) => `<article class="card" data-product="${esc(a.product)}" data-risk="${a.risk}" data-ai="${a.ai ? "yes" : "no"}">
  <a href="${esc(a.png)}" target="_blank"><img loading="lazy" src="${esc(a.png)}" alt="${esc(a.title)}"></a>
  <div class="meta">
    <div class="row"><span class="risk ${a.risk}">${a.risk}</span>${a.exportable ? '<span class="ok">exportable after review</span>' : '<span class="no">not exportable</span>'}${a.ai ? '<span class="aib">AI people</span>' : ""}<span class="run">${esc(a.run)}</span></div>
    <h3>${esc(a.format)}</h3>
    <p class="prod">${esc(a.product)}</p>
    ${a.angle && a.angle !== "— · hook: —" ? `<p class="angle">${esc(a.angle)}</p>` : ""}
    <p class="links">${a.extras.map((x) => `<a href="${esc(x.f)}" target="_blank">${esc(x.tag)}</a>`).join(" · ")}${a.extras.length ? " · " : ""}<a href="${esc(a.md)}" target="_blank">description</a></p>
  </div>
</article>`;
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ad Library Review</title>
<style>
:root{--bg:#F4F2EE;--card:#fff;--ink:#111;--muted:#666;--line:#E3E0D9;--low:#2F6B45;--medium:#9A6B00;--high:#B45309;--severe:#B42318}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 "Helvetica Neue",Helvetica,Arial,sans-serif}
header{padding:28px 24px 8px;max-width:1400px;margin:auto}h1{margin:0 0 6px;font-size:28px}header p{margin:0;color:var(--muted)}
.filters{display:flex;flex-wrap:wrap;gap:8px;padding:16px 24px;max-width:1400px;margin:auto}
.filters button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 12px;cursor:pointer;font:inherit}
.filters button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;padding:8px 24px 40px;max-width:1400px;margin:auto}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}.card img{display:block;width:100%;aspect-ratio:1;object-fit:cover;background:#eee}
.meta{padding:12px 14px 14px}.meta h3{margin:6px 0 2px;font-size:16px}.prod,.angle{margin:0;color:var(--muted);font-size:13px}.links{margin:8px 0 0;font-size:13px}
.links a{color:var(--ink)}.row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:12px}
.risk{color:#fff;border-radius:6px;padding:1px 7px;text-transform:uppercase;font-weight:700;letter-spacing:.5px}
.risk.low{background:var(--low)}.risk.medium{background:var(--medium)}.risk.high{background:var(--high)}.risk.severe{background:var(--severe)}
.aib{background:#111;color:#fff;border-radius:6px;padding:1px 7px;font-weight:700}.ok{color:var(--low)}.no{color:var(--severe);font-weight:700}.run{margin-left:auto;color:var(--muted)}
.trend{max-width:1400px;margin:8px auto 4px;padding:0 24px}.trend h2{margin:8px 0 4px;font-size:22px}.trend>p{margin:0 0 12px;color:var(--muted)}
.trow{display:flex;flex-wrap:wrap;gap:14px;align-items:center;width:fit-content;max-width:100%;background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin:0 0 10px}
.tinfo h3{margin:0 0 4px;font-size:16px}.tinfo p{margin:0;font-size:13px;color:var(--muted)}.tb{margin-top:4px!important}
.tinfo{flex:0 0 190px}.trefs{display:flex;gap:10px;flex:0 1 auto;overflow-x:auto}.trefs a{flex:0 0 auto;text-decoration:none;color:var(--muted);font-size:12px;text-align:center}.trefs img{display:block;height:230px;width:auto;border-radius:8px;border:1px solid var(--line);background:#eee}
.tarrow{flex:0 0 auto;font-size:26px;color:var(--muted)}.tours{flex:0 0 230px;display:flex;flex-direction:column;gap:6px;font-size:12px}.tours img{display:block;width:230px;height:230px;object-fit:cover;border-radius:8px;border:1px solid var(--line)}
@media (max-width:700px){.tinfo{flex-basis:100%}.tarrow{display:none}}
</style></head><body>
<header><h1>Ad library review</h1><p>${ads.length} ads · internal test (Minimalist is the test brand) · every claim cites a source; the product is the real pack shot, never AI-drawn. Click an image for full size; 4:5 / 9:16 / language versions and each ad's description are linked under it.</p></header>
${trending}
<div class="filters" id="f"><button class="on" data-p="*">All products</button>${products.map((p) => `<button data-p="${esc(p)}">${esc(p)}</button>`).join("")}
<span style="width:16px"></span><button class="on" data-r="*">All risk</button>${["low", "medium", "high", "severe"].map((r) => `<button data-r="${r}">${r}</button>`).join("")}<span style="width:16px"></span><button class="on" data-a="*">All imagery</button><button data-a="yes">AI-generated people (${ads.filter((a) => a.ai).length})</button><button data-a="no">No AI people</button></div>
<main id="g">${ads.map(card).join("\n")}</main>
<script>
let P="*",R="*",A="*";const f=document.getElementById("f");
f.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
if(b.dataset.p){P=b.dataset.p;f.querySelectorAll("[data-p]").forEach(x=>x.classList.toggle("on",x===b))}
if(b.dataset.r){R=b.dataset.r;f.querySelectorAll("[data-r]").forEach(x=>x.classList.toggle("on",x===b))}
if(b.dataset.a){A=b.dataset.a;f.querySelectorAll("[data-a]").forEach(x=>x.classList.toggle("on",x===b))}
document.querySelectorAll(".card").forEach(c=>{c.style.display=(P==="*"||c.dataset.product===P)&&(R==="*"||c.dataset.risk===R)&&(A==="*"||c.dataset.ai===A)?"":"none"})});
</script></body></html>`;
fs.writeFileSync(path.join(ROOT, "index.html"), html);
console.log(`${ads.length} ads → ad_library/index.html (${ads.filter((a) => !a.exportable).length} not exportable)`);
