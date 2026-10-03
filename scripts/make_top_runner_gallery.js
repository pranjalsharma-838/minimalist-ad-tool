// Gallery of Minimalist's own long-running STATIC Meta ads (the house-style reference,
// brand_packs/minimalist/ad_style_top_runners.md). Videos are excluded (user rule 2026-10-04).
// Usage: node scripts/make_top_runner_gallery.js  → research/minimalist_top_ads/index.html
import fs from "node:fs";

const dir = "research/minimalist_top_ads";
const ads = JSON.parse(fs.readFileSync(`${dir}/index.json`, "utf8")).filter((a) => a.file && a.format !== "video").sort((a, b) => b.days_running - a.days_running);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const card = (a) => (a.files || [a.file]).map((f, i, all) => `<figure><a href="${esc(f)}" target="_blank"><img src="${esc(f)}" alt="Ad ${esc(a.id)}" loading="lazy"></a>
<figcaption><b>${a.days_running} days</b> running · since ${esc(a.started)}<br>${a.format === "carousel" ? `Carousel, card ${i + 1} of ${all.length} shown` : "Static image"} · <a href="https://www.facebook.com/ads/library/?id=${esc(a.id)}" target="_blank">Ad Library</a></figcaption></figure>`).join("\n");
fs.writeFileSync(`${dir}/index.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Minimalist Top Statics</title><style>
:root{--bg:#fff;--fg:#111;--mute:#666;--line:#e5e5e5;--card:#fafafa}
@media (prefers-color-scheme:dark){:root{--bg:#141414;--fg:#eee;--mute:#aaa;--line:#333;--card:#1c1c1c}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1200px;margin:0 auto;padding:24px 16px}h1{margin:0 0 4px;font-size:24px}p.sub{margin:0 0 16px;color:var(--mute)}
ol{margin:0 0 24px;padding-left:20px;columns:2 320px;column-gap:32px}li{margin:0 0 6px;break-inside:avoid}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
figure{margin:0;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
img{display:block;width:100%;aspect-ratio:1/1;object-fit:contain;background:#fff}figcaption{padding:8px 10px;font-size:13px;color:var(--mute)}
figcaption b{color:var(--fg)}a{color:inherit}</style></head><body><main>
<h1>Minimalist's top-running static Meta ads</h1>
<p class="sub">${ads.length} static ads (${ads.reduce((n, a) => n + (a.files || [a.file]).length, 0)} images) still active on 4 Oct 2026 after 52–98 days. Videos excluded: 19 of the page's 27 active ad cards are video. Longest-running first. Click an image to enlarge.</p>
<ol><li><b>Little text:</b> 0–15 words. Two ads show only the pack and its box.</li>
<li><b>Product is the hero:</b> large, with a gel splash, oil drops, a water ripple or a hand.</li>
<li><b>White or light-grey backgrounds,</b> soft daylight, lots of white space.</li>
<li><b>One title, one small grey line,</b> set beside the pack.</li>
<li><b>At most one tag:</b> black ("Clinically Tested", "Updated") or one accent on an offer ("FREE").</li>
<li><b>Offers in plain words</b> ("Three products, At the cost of two") with one tiny condition line.</li>
<li><b>Hands, never faces.</b> People appear only in the brand's videos. No CTA on the image.</li></ol>
<div class="grid">${ads.map(card).join("\n")}</div></main></body></html>`);
console.log(`${dir}/index.html: ${ads.length} statics`);
