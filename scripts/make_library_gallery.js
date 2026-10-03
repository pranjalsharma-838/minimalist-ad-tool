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
    exportable: risk !== "severe" && !/warning/i.test(verdict),
    extras: extras.map((x) => ({ f: path.relative(ROOT, x.f).replace(/\\/g, "/"), tag: { "4x5": "4:5", "9x16": "9:16", hi: "Hindi", ta: "Tamil" }[x.tag] || x.tag })),
  };
}).sort((a, b) => a.product.localeCompare(b.product) || a.format.localeCompare(b.format));
const products = [...new Set(ads.map((a) => a.product))];
const card = (a) => `<article class="card" data-product="${esc(a.product)}" data-risk="${a.risk}">
  <a href="${esc(a.png)}" target="_blank"><img loading="lazy" src="${esc(a.png)}" alt="${esc(a.title)}"></a>
  <div class="meta">
    <div class="row"><span class="risk ${a.risk}">${a.risk}</span>${a.exportable ? '<span class="ok">exportable after review</span>' : '<span class="no">not exportable</span>'}<span class="run">${esc(a.run)}</span></div>
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
.ok{color:var(--low)}.no{color:var(--severe);font-weight:700}.run{margin-left:auto;color:var(--muted)}
</style></head><body>
<header><h1>Ad library review</h1><p>${ads.length} ads · internal test (Minimalist is the test brand) · every claim cites a source; the product is the real pack shot, never AI-drawn. Click an image for full size; 4:5 / 9:16 / language versions and each ad's description are linked under it.</p></header>
<div class="filters" id="f"><button class="on" data-p="*">All products</button>${products.map((p) => `<button data-p="${esc(p)}">${esc(p)}</button>`).join("")}
<span style="width:16px"></span><button class="on" data-r="*">All risk</button>${["low", "medium", "high", "severe"].map((r) => `<button data-r="${r}">${r}</button>`).join("")}</div>
<main id="g">${ads.map(card).join("\n")}</main>
<script>
let P="*",R="*";const f=document.getElementById("f");
f.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
if(b.dataset.p){P=b.dataset.p;f.querySelectorAll("[data-p]").forEach(x=>x.classList.toggle("on",x===b))}
if(b.dataset.r){R=b.dataset.r;f.querySelectorAll("[data-r]").forEach(x=>x.classList.toggle("on",x===b))}
document.querySelectorAll(".card").forEach(c=>{c.style.display=(P==="*"||c.dataset.product===P)&&(R==="*"||c.dataset.risk===R)?"":"none"})});
</script></body></html>`;
fs.writeFileSync(path.join(ROOT, "index.html"), html);
console.log(`${ads.length} ads → ad_library/index.html (${ads.filter((a) => !a.exportable).length} not exportable)`);
