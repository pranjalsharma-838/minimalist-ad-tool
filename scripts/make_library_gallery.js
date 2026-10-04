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
  // Our versions: the trending run's recreations first, then the same format made in any later batch (no "not made yet"
  // when the format exists; user 2026-10-05: nothing pending).
  const all = ads.filter((a) => tid(a) === t.template_id);
  const ours = [...all.filter((a) => a.run === "trending"), ...all.filter((a) => a.run !== "trending")].slice(0, 4);
  const refs = t.ads.filter((x, i, all) => all.findIndex((y) => y.brand === x.brand) === i).slice(0, 4);
  return `<div class="trow"><div class="tinfo"><h3>#${t.template_id} ${esc(t.name)}</h3><p><b>${t.brands.length} brands</b> · ${t.ads.length} ads · newest ${t.ads[0].days} days ago</p><p class="tb">${esc(t.brands.join(", "))}</p></div>
  <div class="trefs">${refs.map((x) => `<a href="${esc(x.url)}" target="_blank" title="${esc(x.one_line)}"><img loading="lazy" src="../${esc(x.image_file)}" alt="${esc(x.brand)}"><span>${esc(x.brand)} · ${x.days}d</span></a>`).join("")}</div>
  <div class="tarrow">→</div><div class="tours">${ours.length ? ours.map((a) => `<a href="${esc(a.png)}" target="_blank"><img loading="lazy" src="${esc(a.png)}" alt="${esc(a.title)}"></a><span><span class="risk ${a.risk}">${a.risk}</span> ${a.exportable ? "exportable after review" : "not exportable"} · <a href="${esc(a.md)}" target="_blank">description</a></span>`).join("") : "<span>not made yet</span>"}</div></div>`;
};
const trending = TR && TR.trends.length ? `<section class="trend"><h2>Trending now</h2><p>Formats that at least ${TR.min_brands} competitor brands launched in the last ${TR.window_days} days and are still running (statics only; ${esc(TR.still_running)}). Left: their ads. Right: our version in Minimalist's minimal style, built from those references, never copying them.</p>${TR.trends.map(trendRow).join("")}</section>` : "";
// Three scores per ad (scripts/score_library.js → ad_library/scores.json): alignment, win probability, compliance.
const SCORES = fs.existsSync("ad_library/scores.json") ? JSON.parse(fs.readFileSync("ad_library/scores.json", "utf8")) : {};
const scoreRow = (a) => {
  const s = SCORES[path.basename(a.png, ".png")];
  if (!s) return "";
  return `<p class="scores" title="Reviewed by: ${esc(s.reviewed_by)}"><b>Align ${s.alignment ?? "—"}</b> · <b>Win ${s.win ?? "—"}</b> · <b>Compliance ${s.compliance ?? "—"}</b> <span class="v">${esc(s.verdict_label)}</span></p>`;
};
const card = (a) => { const s = SCORES[path.basename(a.png, ".png")] || {}; return `<article class="card" data-product="${esc(a.product)}" data-risk="${a.risk}" data-ai="${a.ai ? "yes" : "no"}" data-format="${esc(a.format)}" data-verdict="${s.verdict || ""}" data-export="${a.exportable ? "yes" : "no"}" data-align="${s.alignment ?? ""}" data-win="${s.win ?? ""}" data-comp="${s.compliance ?? ""}" data-text="${esc(`${a.title} ${a.format} ${a.product} ${a.angle || ""}`.toLowerCase())}">
  <a href="${esc(a.png)}" target="_blank"><img loading="lazy" src="${esc(a.png)}" alt="${esc(a.title)}"></a>
  <div class="meta">
    <div class="row"><span class="risk ${a.risk}">${a.risk}</span>${a.exportable ? '<span class="ok">exportable after review</span>' : '<span class="no">not exportable</span>'}${a.ai ? '<span class="aib">AI people</span>' : ""}<span class="run">${esc(a.run)}</span></div>
    <h3>${esc(a.format)}</h3>
    <p class="prod">${esc(a.product)}</p>
    ${a.angle && a.angle !== "— · hook: —" ? `<p class="angle">${esc(a.angle)}</p>` : ""}
    ${scoreRow(a)}
    <p class="links">Download: <a href="${esc(a.png)}" download>1:1</a>${a.extras.map((x) => ` · <a href="${esc(x.f)}" download>${esc(x.tag)}</a>`).join("")} · <a href="${esc(a.md)}" target="_blank">description</a></p>
  </div>
</article>`; };
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ad Library Review</title>
<style>
:root{--bg:#F4F2EE;--card:#fff;--ink:#111;--muted:#666;--line:#E3E0D9;--low:#2F6B45;--medium:#9A6B00;--high:#B45309;--severe:#B42318}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 "Helvetica Neue",Helvetica,Arial,sans-serif}
header{padding:28px 24px 8px;max-width:1400px;margin:auto}h1{margin:0 0 6px;font-size:28px}header p{margin:0;color:var(--muted)}
.filters{display:flex;flex-wrap:wrap;gap:8px;padding:16px 24px;max-width:1400px;margin:auto}
.filters button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 12px;cursor:pointer;font:inherit}
.filters button.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.filters{align-items:center}.filters input[type=search],.filters select{border:1px solid var(--line);border-radius:8px;padding:6px 10px;font:inherit;background:#fff}.filters input[type=search]{min-width:240px}.filters label{display:flex;align-items:center;gap:6px;font-size:13px}#cnt{font-size:13px;color:#666;margin-left:auto}.scores{font-size:12px;margin:4px 0}.scores .v{color:#666}
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
<div class="filters" id="f">
<input id="q" type="search" placeholder="Search headline, format, product…" aria-label="Search">
<select id="fp" aria-label="Product"><option value="">All products</option>${products.map((p) => `<option>${esc(p)}</option>`).join("")}</select>
<select id="ff" aria-label="Format"><option value="">All formats</option>${[...new Set(ads.map((a) => a.format))].sort().map((x) => `<option>${esc(x)}</option>`).join("")}</select>
<select id="fv" aria-label="Verdict"><option value="">Any verdict</option><option value="READY_FOR_REVIEW">Ready for review</option><option value="LIMITED_CHECK">Ready (limited check)</option><option value="NEEDS_CHANGES">Needs fixes</option><option value="BLOCKED">Blocked</option></select>
<select id="fr" aria-label="Risk"><option value="">Any risk</option>${["low", "medium", "high", "severe"].map((r) => `<option>${r}</option>`).join("")}</select>
<select id="fe" aria-label="Exportable"><option value="">Exportable or not</option><option value="yes">Exportable after review</option><option value="no">Not exportable</option></select>
<select id="fa" aria-label="AI people"><option value="">Any imagery</option><option value="no">No AI people</option><option value="yes">AI people (Severe)</option></select>
<label>Min alignment <input id="ma" type="range" min="0" max="100" step="5" value="0"><b id="mav">0</b></label>
<label>Min win <input id="mw" type="range" min="0" max="100" step="5" value="0"><b id="mwv">0</b></label>
<select id="so" aria-label="Sort"><option value="">Sort: product</option><option value="align">Best alignment</option><option value="win">Best win</option><option value="comp">Best compliance</option></select>
<button id="clr" type="button">Clear</button><span id="cnt"></span></div>
<main id="g">${ads.map(card).join("\n")}</main>
<script>
const $=id=>document.getElementById(id),g=$("g"),cards=[...document.querySelectorAll(".card")];
function apply(){const q=$("q").value.trim().toLowerCase(),ma=+$("ma").value,mw=+$("mw").value;$("mav").textContent=ma;$("mwv").textContent=mw;let n=0;
for(const c of cards){const d=c.dataset;const ok=(!q||d.text.includes(q))&&(!$("fp").value||d.product===$("fp").value)&&(!$("ff").value||d.format===$("ff").value)&&(!$("fv").value||d.verdict===$("fv").value)&&(!$("fr").value||d.risk===$("fr").value)&&(!$("fe").value||d.export===$("fe").value)&&(!$("fa").value||d.ai===$("fa").value)&&(+d.align||0)>=ma&&(+d.win||0)>=mw;c.style.display=ok?"":"none";if(ok)n++}
const k={align:"align",win:"win",comp:"comp"}[$("so").value];if(k)cards.slice().sort((a,b)=>(+b.dataset[k]||0)-(+a.dataset[k]||0)).forEach(c=>g.appendChild(c));else cards.forEach(c=>g.appendChild(c));
$("cnt").textContent=n+" of "+cards.length+" ads";location.hash=new URLSearchParams([...document.querySelectorAll("#f input,#f select")].filter(e=>e.id&&e.value&&e.value!=="0").map(e=>[e.id,e.value])).toString()}
document.querySelectorAll("#f input,#f select").forEach(e=>e.addEventListener("input",apply));
$("clr").onclick=()=>{document.querySelectorAll("#f input,#f select").forEach(e=>e.value=e.type==="range"?0:"");apply()};
new URLSearchParams(location.hash.slice(1)).forEach((v,k)=>{if($(k))$(k).value=v});apply();
</script></body></html>`;
fs.writeFileSync(path.join(ROOT, "index.html"), html);
console.log(`${ads.length} ads → ad_library/index.html (${ads.filter((a) => !a.exportable).length} not exportable)`);
