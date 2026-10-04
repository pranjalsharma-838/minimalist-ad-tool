import { renderAdSvg, SIZE, PLACEMENTS, placementSvg } from "./render.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

async function api(path, body) {
  const r = await fetch(path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {});
  const j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

// ---------- status + Claude API key ----------
// Without a key the app still works (copy word for word from the page, rules-only check). With one, the writer and
// the AI judge run live. The key is sent only to this local server, which keeps it in memory for the session.
let llm = false;
function showStatus(s) {
  llm = s.llm;
  $("#status").innerHTML = `Rules v${esc(s.rulesVersion)} · AI judge: <b class="${s.llm ? "on" : "off"}">${s.llm ? "on" : "off (rules only)"}</b>`;
  $("#mode").querySelector('[value="model"]').disabled = !s.llm;
  if (!s.llm) $("#mode").value = "verbatim";
  $("#keyform").style.display = s.llm ? "none" : "";
}
api("/api/status").then(showStatus).catch(() => ($("#status").textContent = "server not reachable"));
$("#keyform").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#keymsg").textContent = "checking…";
  try {
    await api("/api/key", { key: $("#apikey").value });
    $("#apikey").value = "";
    $("#keymsg").textContent = "";
    showStatus(await api("/api/status"));
    $("#mode").value = "model";
  } catch (err) {
    $("#keymsg").textContent = err.message;
  }
});

// ---------- tabs ----------
document.querySelectorAll(".tab").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === b));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("hidden", p.id !== `tab-${b.dataset.tab}`));
    if (b.dataset.tab === "images") initImageLibrary();
  })
);
const showTab = (name) => document.querySelector(`.tab[data-tab="${name}"]`).click();

// ---------- report rendering (shared) ----------
const SEV_LABEL = { block: "Block", fix: "Must fix", advisory: "Advisory" };
const DIM_LABEL = { policy: "Policy & claims", tone: "Brand tone", language: "Brand language" };
const FIELD_LABEL = { headline: "Headline", primary_text: "Primary text", on_image_text: "On-image text", footnote: "Footnote", cta: "CTA" };
const VERDICT_SHORT = { BLOCKED: "Blocked", NEEDS_CHANGES: "Fix first", READY_FOR_REVIEW: "Ready for review", LIMITED_CHECK: "Rules only" };

function highlightField(ad, field, findings) {
  const text = ad[field] || "";
  const marks = findings.filter((f) => f.field === field && f.end > f.start).sort((a, b) => a.start - b.start);
  let out = "", i = 0;
  for (const m of marks) {
    if (m.start < i) continue;
    out += esc(text.slice(i, m.start)) + `<mark class="${m.severity}" title="${esc(m.rule_id)}">${esc(text.slice(m.start, m.end))}</mark>`;
    i = m.end;
  }
  return out + esc(text.slice(i));
}

// Three scores (report.scores: brand alignment, chance to win, compliance), when the scorer provides them.
const pct = (n) => (typeof n === "number" ? Math.round(n <= 1 && n > 0 ? n * 100 : n) : "–");
function scoresCompact(sc) {
  if (!sc) return "";
  const a = sc.alignment, w = sc.win, c = sc.compliance;
  return `<span class="scores">${a ? `<span title="Brand alignment${a.band ? ": " + esc(a.band) : ""}">Fit ${pct(a.score)}</span>` : ""}${w ? `<span title="Chance to win${w.band ? ": " + esc(w.band) : ""}">Win ${pct(w.score)}</span>` : ""}${c ? `<span class="cmp ${esc(c.code)}" title="Compliance">${esc(c.label || c.code)}</span>` : ""}</span>`;
}
function scoresBlock(sc) {
  if (!sc) return "";
  const parts = (p) => (p || []).map((x) => `<li><b>${esc(x.name)}</b> ${pct(x.score)}${x.why ? ` <span class="hint">— ${esc(x.why)}</span>` : ""}</li>`).join("");
  const card = (title, s, extra = "") => s ? `<div class="score-card"><div class="score-top"><span>${title}</span><b>${pct(s.score)}</b>${s.band ? `<small>${esc(s.band)}</small>` : ""}</div>${extra}${s.parts?.length ? `<ul>${parts(s.parts)}</ul>` : ""}</div>` : "";
  const c = sc.compliance;
  return `<div class="score-cards">
    ${card("Brand alignment", sc.alignment)}
    ${card("Chance to win", sc.win, sc.win?.basis || sc.win?.n != null ? `<p class="hint">${sc.win.n != null ? `Based on ${esc(sc.win.n)} comparable ads. ` : ""}${esc(sc.win.basis || "")}</p>` : "")}
    ${c ? `<div class="score-card cmp ${esc(c.code)}"><div class="score-top"><span>Compliance</span><b>${c.score != null ? pct(c.score) : ""}</b><small>${esc(c.label || c.code)}</small></div></div>` : ""}
  </div>`;
}

export function renderReport(report, el) {
  const v = report.verdict;
  const dims = Object.entries(report.dimensions)
    .map(([d, s]) => `<div class="dim ${s.worst}"><span>${DIM_LABEL[d]}</span><b>${s.worst === "clear" ? "No issues found" : SEV_LABEL[s.worst]}</b><small>${s.count} finding${s.count === 1 ? "" : "s"}</small></div>`)
    .join("");
  const cov = report.coverage;
  const coverage = cov.model
    ? `Checked by: rule layer (rules v${esc(cov.rules_version)}) + model judgment (${esc(cov.model_name)}).`
    : `Checked by: rule layer only (rules v${esc(cov.rules_version)}). ${cov.model_error ? "Model call failed: " + esc(cov.model_error) : "No API key set"} — implied claims and overall tone were not assessed.`;
  const adView = Object.keys(FIELD_LABEL)
    .filter((f) => (report.ad[f] || "").trim())
    .map((f) => `<div class="adfield"><small>${FIELD_LABEL[f]}</small><div>${highlightField(report.ad, f, report.findings).replace(/\n/g, "<br>")}</div></div>`)
    .join("");
  const cards = report.findings
    .map(
      (f) => `<article class="finding ${f.severity}">
        <header><span class="sev">${SEV_LABEL[f.severity]}</span><span class="rid">${esc(f.rule_id)}</span> ${esc(f.title)} <span class="dimtag">${DIM_LABEL[f.dimension] || ""}</span></header>
        ${f.span ? `<blockquote>“${esc(f.span)}” <small>in ${FIELD_LABEL[f.field] || f.field}</small></blockquote>` : ""}
        <p>${esc(f.message)}</p>
        <p class="fixline"><b>Fix:</b> ${esc(f.fix)}</p>
        ${f.note ? `<p class="note">${esc(f.note)}</p>` : ""}
        ${f.model_comment ? `<p class="note">${esc(f.model_comment)}</p>` : ""}
        <footer>Source: ${(f.sources || []).map(esc).join(", ") || "—"} · basis: ${esc(f.confidence)} · found by ${f.layer === "model" ? "model" : "rule"}</footer>
      </article>`
    )
    .join("");
  const reads = report.tone_read
    ? `<div class="reads"><p><b>Tone:</b> ${esc(report.tone_read)}</p><p><b>Language:</b> ${esc(report.language_read)}</p></div>`
    : "";
  const dropped = report.dropped_model_findings?.length
    ? `<p class="hint">${report.dropped_model_findings.length} model finding(s) discarded because the quoted text wasn't in the ad or the rule id didn't exist.</p>`
    : "";
  el.innerHTML = `
    <div class="verdict ${v.code}"><b>${esc(v.label)}</b><span>${esc(v.detail)}</span></div>
    ${scoresBlock(report.scores)}
    <div class="dims">${dims}</div>
    <p class="coverage">${coverage}</p>
    ${reads}
    <h3>The ad, with flagged spans</h3><div class="adview">${adView}</div>
    <h3>${report.findings.length ? "Findings" : "No findings"}</h3>${cards}${dropped}`;
}

// ---------- images (pack shots, cut-outs, texture photos), inlined so PNG export works ----------
const imgCache = new Map();
function dataUrlOf(src) {
  if (!src) return Promise.resolve("");
  if (src.startsWith("data:")) return Promise.resolve(src);
  if (!imgCache.has(src)) {
    imgCache.set(src, (async () => {
      const r = await fetch(/^https?:/.test(src) ? "/api/image?src=" + encodeURIComponent(src) : src);
      if (!r.ok) return "";
      const b = await r.blob();
      return new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); });
    })().catch(() => ""));
  }
  return imgCache.get(src);
}
// A photo with its own studio backdrop sets the canvas to that colour (its corner pixel), so it doesn't sit in a grey box.
const cornerCache = new Map();
function cornerColour(dataUrl) {
  if (!cornerCache.has(dataUrl)) cornerCache.set(dataUrl, (async () => {
    try {
      const img = new Image(); img.src = dataUrl; await img.decode();
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext("2d"); x.drawImage(img, 0, 0);
      const [r, g, b, a] = x.getImageData(2, 2, 1, 1).data;
      return a > 200 ? `rgb(${r},${g},${b})` : "";
    } catch { return ""; }
  })());
  return cornerCache.get(dataUrl);
}

// ---------- product: library first, then facts ----------
let sheet = null, handle = "";
let copy = null, mode = "", log = [];
let formats = [], items = {}, notShown = [], selected = "";
let inputs = {}, uploads = {}, aiValues = {};
let gen = 0; // bumps on every new build or edit, so late answers from an older one are dropped

$("#manual-toggle").onclick = () => $("#manual-form").classList.toggle("hidden");
const handleFromUrl = (u) => (String(u).match(/\/products\/([^/?#]+)/) || [])[1] || "";

function showSheet(s, refusal, cached) {
  sheet = s;
  const rows = s.facts
    .map((f) => `<tr class="${["testimonial", "faq", "inci"].includes(f.kind) ? "excluded" : ""}"><td>${f.id}</td><td>${esc(f.kind)}</td><td>${esc(f.section)}</td><td>${esc(f.text)}</td></tr>`)
    .join("");
  $("#facts-body").innerHTML = `<p class="hint">${esc(s.title)} · actives from pack title: ${s.actives.map((a) => esc(a.pct + " " + a.name)).join(", ") || "none"} · source: ${s.source}${cached ? ` · page read ${esc(new Date(cached).toLocaleDateString())} (saved copy; tick "Re-read" to refresh)` : ""}. Greyed rows (testimonials, FAQ answers, full INCI) cannot be cited as claims; prices, offers, the rating and reviews are quoted only by the offer, price, rating and quote formats.</p><table>${rows}</table>`;
  $("#facts").classList.remove("hidden");
  $("#gen-controls").classList.toggle("hidden", Boolean(refusal));
  $("#extract-msg").innerHTML = refusal ? `<div class="refusal"><b>Generator won't write this one.</b> ${esc(refusal)}</div>` : `${esc(s.title)}: ${s.facts.length} facts.`;
  loadRequests();
}

$("#extract-form").onsubmit = async (e) => {
  e.preventDefault();
  const url = $("#url").value;
  handle = handleFromUrl(url);
  $("#gen-result").classList.add("hidden");
  $("#extract-msg").textContent = "Opening product…";
  // Library first: the existing ads show while the facts load (nothing is generated).
  if (handle) { loadLibrary(handle); loadProductImages(handle); }
  try {
    const { sheet: s, refusal, cached } = await api("/api/extract", { url, refresh: $("#refresh").checked });
    showSheet(s, refusal, cached);
  } catch (err) {
    $("#extract-msg").innerHTML = `<span class="err">${esc(err.message)}</span> You can enter the product manually instead.`;
    $("#manual-form").classList.remove("hidden");
  }
};

$("#manual-form").onsubmit = async (e) => {
  e.preventDefault();
  const manual = Object.fromEntries(new FormData(e.target));
  handle = "";
  $("#library").classList.add("hidden");
  $("#prod-images").classList.add("hidden");
  const { sheet: s, refusal } = await api("/api/extract", { manual });
  showSheet(s, refusal);
};

let library = null;
async function loadLibrary(h) {
  try {
    library = await api(`/api/library?handle=${encodeURIComponent(h)}`);
  } catch { library = { groups: [], count: 0 }; }
  $("#library").classList.remove("hidden");
  $("#lib-count").textContent = library.count ? `(${library.count} ads in ${library.groups.length} formats)` : "";
  $("#lib-body").innerHTML = library.count
    ? library.groups.map((g, gi) => `<div class="lib-group"><h4>${esc(g.title)} <span class="hint">${esc(g.template)}</span></h4><div class="lib-cards">${g.ads.map((a, ai) => `
        <div class="lib-card">
          <button type="button" class="lib-open" data-g="${gi}" data-a="${ai}" title="Open"><img src="${esc(a.png)}" alt="${esc(g.title)}" loading="lazy" /></button>
          <span class="chips"><span class="chip risk-${esc(a.risk)}">${esc(cap(a.risk) || "?")} risk</span><span class="chip ${a.exportable ? "ok" : "no"}">${a.exportable ? "Exportable" : "Not exportable"}</span>${a.ai ? '<span class="chip no">AI person</span>' : ""}</span>
          ${a.scores ? scoresCompact(libScores(a.scores)) : '<span class="hint small">Not scored yet</span>'}
          <span class="dlrow" title="Download PNG">${adSizes(a).map((s) => `<a class="dl" href="${esc(s.url)}" download="${esc(s.url.split("/").pop())}" title="Download ${esc(s.label)} PNG">${esc(s.label)}</a>`).join("")}</span>
          <span class="hint small">${esc(a.run)}</span>
        </div>`).join("")}</div></div>`).join("")
    : `<p class="hint">No ads for this product in the library yet. Make new ones below.</p>`;
  $("#lib-body").querySelectorAll(".lib-open").forEach((b) => (b.onclick = () => openLibraryAd(library.groups[b.dataset.g], library.groups[b.dataset.g].ads[b.dataset.a])));
}
const cap = (s) => String(s || "").replace(/^./, (c) => c.toUpperCase());
// Library scores (scripts/score_library.js) in the shape the new-ad score widgets already draw.
const libScores = (s) => ({
  alignment: { score: s.alignment, band: s.alignment_band, parts: s.parts?.alignment },
  win: { score: s.win, band: s.win_band, parts: s.parts?.win },
  compliance: { score: s.compliance, code: s.verdict, label: s.verdict_label },
});
// Every size file this ad has: 1:1, 4:5, 9:16 and the language versions (hi, ta) when they exist.
const LANG = { hi: "Hindi", ta: "Tamil" };
const adSizes = (a) => [{ label: "1:1", url: a.png }, ...a.placements.map((p) => ({ label: LANG[p.label] || p.label, url: p.png }))];
function openLibraryAd(g, a) {
  const sizes = adSizes(a);
  const sc = a.scores;
  $("#viewer-body").innerHTML = `
    <div class="viewer-grid">
      <div>
        <img id="v-img" src="${esc(a.png)}" alt="" />
        <div class="sizes"><span class="hint">Preview</span><span class="sizebtns">${sizes.map((s, i) => `<button type="button" class="ghost size${i === 0 ? " on" : ""}" data-url="${esc(s.url)}">${esc(s.label)}</button>`).join("")}</span></div>
        <div class="sizes"><span class="hint">Download PNG</span><span class="sizebtns">${sizes.map((s) => `<a class="dlbtn" href="${esc(s.url)}" download="${esc(s.url.split("/").pop())}">${esc(s.label)}</a>`).join("")}</span></div>
      </div>
      <div>
        <p><span class="tag existing">Existing</span> <b>${esc(g.title)}</b></p>
        <p class="chips"><span class="chip risk-${esc(a.risk)}">${esc(cap(a.risk))} risk</span><span class="chip ${a.exportable ? "ok" : "no"}">${a.exportable ? "Exportable" : "Not exportable"}</span></p>
        ${a.not_exportable_why ? `<p class="hint">${esc(a.not_exportable_why)}</p>` : ""}
        <p class="hint">${esc(a.template)} · run ${esc(a.run)} · ${esc(a.verdict)}</p>
        ${sc ? `${scoresBlock(libScores(sc))}<p class="hint"><b>Reviewed by:</b> ${esc(sc.reviewed_by || "not recorded")}</p>${sc.findings?.length ? `<ul class="hint">${sc.findings.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}` : `<p class="hint">Scores not available for this ad yet (they are written by scripts/score_library.js).</p>`}
        <h3>On the image</h3><ul>${a.on_image.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
        <h3>Caption</h3><p>${esc(a.caption)}</p>
        <p class="row"><a href="${esc(a.md)}" target="_blank" rel="noopener">Full description</a></p>
      </div>
    </div>`;
  $("#viewer-body").querySelectorAll("button.size").forEach((b) => (b.onclick = () => {
    $("#v-img").src = b.dataset.url;
    $("#viewer-body").querySelectorAll("button.size").forEach((x) => x.classList.toggle("on", x === b));
  }));
  $("#viewer").showModal();
}

// ---------- image studio requests (the app only queues and polls; it never calls an image API) ----------
let pollTimer = null;
async function loadRequests() {
  clearTimeout(pollTimer);
  if (!handle) { $("#img-requests").innerHTML = ""; return; }
  const { requests } = await api(`/api/image-requests?handle=${encodeURIComponent(handle)}`).catch(() => ({ requests: [] }));
  const STATUS = { queued: ["Queued", ""], working: ["Working", "st-wait"], done: ["Done", "ok"], needs_review: ["Needs review", "no"], failed: ["Failed", "no"] };
  $("#img-requests").innerHTML = requests.map((r) => {
    const [label, cls] = STATUS[r.status] || [cap(r.status), ""];
    const res = r.result, review = r.status === "needs_review";
    const body = res?.url
      ? `<p>${review ? '<span class="chip no">Warning</span> The pack label did not pass the check. Not offered for ads.' : '<span class="tag new">New</span> from the image studio'}${res.rounds ? `, ${esc(res.rounds)} round(s)` : ""}</p>
         <a href="${esc(res.url)}" target="_blank" rel="noopener"><img class="${review ? "warn" : ""}" src="${esc(res.url)}" alt="Result" /></a>
         <p class="hint">${esc(res.notes || "")}</p>
         <p class="row"><a class="dlbtn" href="${esc(res.url)}" download="${esc(r.id)}.png">Download PNG</a>${review ? `<a href="/img/image_requests/${encodeURIComponent(r.id)}_check.png" target="_blank" rel="noopener">See the label comparison</a>` : ""}</p>
         ${review ? "" : '<p class="hint">Any person in it is an AI model: Severe risk, needs the AI mark.</p>'}`
      : res?.notes ? `<p class="hint">${esc(res.notes)}</p>`
      : r.status === "working" ? `<p class="hint">${esc(r.progress || "ChatGPT is drawing it")}. This updates by itself.</p>`
      : `<p class="hint">Waiting for the image studio. If nothing happens, run <b>npm run studio</b> on this computer and sign in to ChatGPT in its window.</p>`;
    return `<div class="req"><div><span class="chip ${cls}">${esc(label)}</span> <span class="hint">${esc(new Date(r.requested_at).toLocaleString())}</span></div><p>${esc(r.prompt)}</p>${body}</div>`;
  }).join("");
  // A request that just finished adds its image to this product's image list.
  const finished = requests.filter((r) => ["done", "needs_review"].includes(r.status)).map((r) => r.id).join();
  if (finished !== lastFinished) { lastFinished = finished; if (handle) loadProductImages(handle); }
  if (requests.some((r) => !["done", "failed", "needs_review"].includes(r.status))) pollTimer = setTimeout(loadRequests, 10000);
}
let lastFinished = "";
$("#img-queue").onclick = async () => {
  if (!handle) return ($("#img-msg").textContent = "Open a beminimalist.co product first.");
  $("#img-msg").textContent = "Queuing…";
  try {
    await api("/api/image-request", { handle, prompt: $("#img-prompt").value, sheet });
    $("#img-prompt").value = "";
    $("#img-msg").textContent = "Queued.";
    loadRequests();
  } catch (err) { $("#img-msg").textContent = err.message; }
};

// ---------- image library: every image we hold, searchable (GET /api/images) ----------
const IMG_TYPES = { requested: "Image studio request", verified_render: "Verified pack render", ai_texture: "Texture shot (verified)", cutout: "Cut-out", real_pack: "Real pack photo", real_texture: "Real texture", real_photo: "Real photo (other)", ai_scene: "AI scene / person / frame", review_photo: "Customer review photo" };
const imgChips = (e) => {
  const c = [`<span class="chip">${esc(IMG_TYPES[e.type] || e.type)}</span>`];
  if (e.type === "ai_scene") c.push('<span class="chip risk-severe">AI — Severe</span>');
  else if (e.ai) c.push('<span class="chip risk-medium">AI-made</span>');
  if (e.type === "review_photo") c.push('<span class="chip risk-medium">Reference only</span>');
  if (e.type === "requested" && e.status === "needs_review") c.push('<span class="chip no">Needs review</span>');
  if (e.type === "requested" && !["done", "needs_review"].includes(e.status)) c.push(`<span class="chip st-wait">${esc(e.status || "queued")}</span>`);
  return `<span class="chips">${c.join("")}</span>`;
};
const imgCard = (e, i) => `<button type="button" class="img-card" data-i="${i}" title="${esc(e.label)}"><img src="${esc(e.url)}" alt="${esc(e.label)}" loading="lazy" />${imgChips(e)}<span class="hint small">${esc(e.product || e.handle || "")}</span></button>`;
const IMG_USE = new Set(["real_pack", "cutout", "verified_render"]);

function openImage(e) {
  const canUse = e.handle && IMG_USE.has(e.type) && e.use_in_ad !== false;
  $("#viewer-body").innerHTML = `
    <div class="viewer-grid">
      <img class="${e.type === "requested" && e.status === "needs_review" ? "warn" : ""}" src="${esc(e.url)}" alt="${esc(e.label)}" />
      <div>
        <p><b>${esc(e.label)}</b></p>
        ${imgChips(e)}
        <p class="hint">${esc(e.product || "")}${e.handle ? ` · ${esc(e.handle)}` : ""} · ${esc(e.file || "")}</p>
        <p>${esc(e.usage)}</p>
        ${e.prompt ? `<h3>Prompt</h3><p>${esc(e.prompt)}</p>` : ""}
        ${e.notes ? `<h3>Notes</h3><p class="hint">${esc(e.notes)}</p>` : ""}
        <p class="row">
          ${canUse ? `<button type="button" id="img-use">Make new ads for this product</button>` : ""}
          <a class="dlbtn" href="${esc(e.url)}" download="${esc(e.file || "image.png")}">Download</a>
          <a href="${esc(e.url)}" target="_blank" rel="noopener">Open full size</a>
          ${e.check_url ? `<a href="${esc(e.check_url)}" target="_blank" rel="noopener">Label comparison</a>` : ""}
        </p>
        ${canUse ? `<p class="hint">The ad builder picks the best verified pack image for this product by itself (cut-out of the verified render first), so this opens the product and builds from the same asset library.</p>` : `<p class="hint">${e.type === "requested" && e.status === "needs_review" ? "Needs review: not offered for ads." : "View or download only: the ad builder does not take this kind of image."}</p>`}
      </div>
    </div>`;
  $("#img-use")?.addEventListener("click", () => {
    $("#viewer").close();
    showTab("generate");
    $("#url").value = `https://beminimalist.co/products/${e.handle}`;
    $("#extract-form").requestSubmit();
  });
  $("#viewer").showModal();
}

// This product's images, under the product (first 24; the Image library tab has all of them and the search).
let productImages = [];
async function loadProductImages(h) {
  try { productImages = await api(`/api/images?handle=${encodeURIComponent(h)}`); } catch { productImages = []; }
  $("#prod-images").classList.toggle("hidden", !productImages.length);
  $("#pi-count").textContent = productImages.length ? `(${productImages.length})` : "";
  $("#pi-body").innerHTML = productImages.slice(0, 24).map(imgCard).join("");
  $("#pi-body").querySelectorAll(".img-card").forEach((b) => (b.onclick = () => openImage(productImages[b.dataset.i])));
}
$("#pi-open").onclick = async () => { showTab("images"); await imgReady; $("#img-handle").value = handle; $("#img-q").value = ""; $("#img-type").value = ""; runImageSearch(); };

let imgList = [], imgShown = 0, imgInit = false, imgTimer = null, imgSeq = 0;
const IMG_PAGE = 120;
async function runImageSearch() {
  const my = ++imgSeq;
  const qs = new URLSearchParams({ q: $("#img-q").value.trim(), handle: $("#img-handle").value, type: $("#img-type").value });
  $("#img-count").textContent = "Searching…";
  try {
    const list = await api(`/api/images?${qs}`);
    if (my !== imgSeq) return;
    imgList = list; imgShown = 0;
    $("#img-grid").innerHTML = "";
    $("#img-count").textContent = list.length ? `${list.length} image${list.length === 1 ? "" : "s"}` : "No images match. Try fewer words, or clear the product and type filters.";
    showMoreImages();
  } catch (err) { $("#img-count").textContent = err.message; }
}
function showMoreImages() {
  const from = imgShown;
  imgShown = Math.min(imgList.length, imgShown + IMG_PAGE);
  $("#img-grid").insertAdjacentHTML("beforeend", imgList.slice(from, imgShown).map((e, k) => imgCard(e, from + k)).join(""));
  $("#img-grid").querySelectorAll(".img-card:not([data-bound])").forEach((b) => { b.dataset.bound = "1"; b.onclick = () => openImage(imgList[b.dataset.i]); });
  $("#img-more").classList.toggle("hidden", imgShown >= imgList.length);
  $("#img-more").textContent = `Show more (${imgList.length - imgShown} left)`;
}
let imgReady = Promise.resolve();
function initImageLibrary() {
  if (imgInit) { imgReady = runImageSearch(); return imgReady; } // refresh: new studio images may have arrived
  imgInit = true;
  imgReady = setupImageLibrary();
  return imgReady;
}
async function setupImageLibrary() {
  $("#img-type").innerHTML += Object.entries(IMG_TYPES).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
  try {
    const all = await api("/api/images");
    const seen = new Map(all.filter((e) => e.handle).map((e) => [e.handle, e.product || e.handle]));
    $("#img-handle").innerHTML += [...seen].sort((a, b) => a[1].localeCompare(b[1])).map(([h, t]) => `<option value="${esc(h)}">${esc(t)}</option>`).join("");
  } catch { /* the search below reports the error */ }
  $("#img-q").addEventListener("input", () => { clearTimeout(imgTimer); imgTimer = setTimeout(runImageSearch, 250); });
  $("#img-type").onchange = $("#img-handle").onchange = runImageSearch;
  $("#img-search").onsubmit = (e) => { e.preventDefault(); runImageSearch(); };
  $("#img-more").onclick = showMoreImages;
  await runImageSearch();
}

// ---------- new ads: every format, ranked, rendered progressively ----------
const fmtOf = (id) => formats.find((f) => f.id === id);

async function hydrate(id) {
  const it = items[id], spec = it.spec, up = uploads[id] || {};
  const s = { ...spec, cutoutHrefs: [] };
  s.imageHref = await dataUrlOf(spec.imageSrc);
  if (spec.cutout && s.imageHref) s.cutoutHrefs.push(s.imageHref);
  for (const k of ["steps", "range"]) {
    s[k] = await Promise.all((spec[k] || []).map(async (x) => {
      const href = await dataUrlOf(x.imageSrc);
      if (x.cutout && href) s.cutoutHrefs.push(href);
      return { ...x, imageHref: href };
    }));
  }
  if (spec.textureSrc) s.textureHref = await dataUrlOf(spec.textureSrc);
  if (up.texture) s.textureHref = up.texture;
  if (up.person) s.personHref = up.person;
  if (up.before && up.after) s.photos = [up.before, up.after];
  // White canvas when every pack is a clean cut-out (as in the library); else the photo's own studio colour.
  const photo = [spec, ...(spec.steps || []), ...(spec.range || [])].find((x) => x.imageSrc && !x.cutout);
  s.canvas = photo ? (await cornerColour(await dataUrlOf(photo.imageSrc))) || "#FFFFFF" : "#FFFFFF";
  return s;
}

const thumbUrls = {};
async function drawThumb(id) {
  const it = items[id];
  if (!it) return;
  const svg = renderAdSvg(await hydrate(id));
  if (thumbUrls[id]) URL.revokeObjectURL(thumbUrls[id]);
  thumbUrls[id] = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const card = $(`#strip [data-id="${id}"]`);
  if (card) card.querySelector(".tim").innerHTML = `<img src="${thumbUrls[id]}" alt="" />`;
  updateThumbInfo(id);
}

function stateOf(id) {
  const f = fmtOf(id), it = items[id];
  if (!it) return { cls: "wait", text: "Rendering…" };
  if (f.status === "needs_input") return { cls: "need", text: "Needs input" };
  if (it.judging) return { cls: "wait", text: "AI check…" };
  const code = it.report.scores?.compliance?.code === "BLOCKED" ? "BLOCKED" : it.report.verdict.code;
  return { cls: code, text: VERDICT_SHORT[code] || code };
}
function updateThumbInfo(id) {
  const card = $(`#strip [data-id="${id}"]`), f = fmtOf(id);
  if (!card || !f) return;
  const st = stateOf(id);
  card.querySelector(".tinfo").innerHTML = `
    <span class="tlab"><span class="rank">#${f.rank}</span> ${esc(f.label)}</span>
    <span class="chips"><span class="chip risk-${f.risk}">${esc(f.risk_label)}</span><span class="chip st-${st.cls}">${esc(st.text)}</span></span>
    ${scoresCompact(items[id]?.report?.scores)}`;
}

function renderStrip() {
  $("#strip").innerHTML = formats.map((f) => `<button type="button" class="thumb${f.id === selected ? " on" : ""}" data-id="${f.id}" role="option" aria-selected="${f.id === selected}">
      <span class="tim"><span class="skel"></span></span><span class="tinfo"></span></button>`).join("");
  $("#strip").querySelectorAll(".thumb").forEach((b) => (b.onclick = () => select(b.dataset.id)));
  formats.forEach((f) => updateThumbInfo(f.id));
  $("#not-shown").innerHTML = notShown.length ? `Not offered for this product: ${notShown.map((n) => `<b>${esc(n.label)}</b> (${esc(n.why)})`).join("; ")}.` : "";
}

function select(id) {
  selected = id;
  document.querySelectorAll("#strip .thumb").forEach((b) => { b.classList.toggle("on", b.dataset.id === id); b.setAttribute("aria-selected", b.dataset.id === id); });
  drawMain();
}

// Sizes: 1:1 is the rendered ad; 4:5 and 9:16 put the same approved 1:1 on a taller canvas (same recipe as the library,
// pipeline/08_compose.js), so every size is the one reviewed creative.
let previewSize = "1x1";
const placementOf = (key) => PLACEMENTS.find((p) => p.key === key) || PLACEMENTS[0];
function svgFor(spec, key) {
  const svg = renderAdSvg(spec), p = placementOf(key);
  return p.key === "1x1" ? svg : placementSvg(svg, p.h, spec.backgroundHref || "");
}
function drawSizeButtons(blocked) {
  $("#size-preview").innerHTML = PLACEMENTS.map((p) => `<button type="button" class="ghost size${p.key === previewSize ? " on" : ""}" data-size="${p.key}">${p.label}</button>`).join("");
  $("#size-dl").innerHTML = PLACEMENTS.map((p) => `<button type="button" class="dlbtn" data-dl="${p.key}"${blocked ? " disabled" : ""} title="Download ${p.label} PNG (${p.w}×${p.h})">${p.label}</button>`).join("");
  $("#size-preview").querySelectorAll("button").forEach((b) => (b.onclick = () => { previewSize = b.dataset.size; drawMain(); }));
  $("#size-dl").querySelectorAll("button").forEach((b) => (b.onclick = () => downloadSize(b.dataset.dl)));
}

// Why export is off for this format, if it is.
function exportBlock(id) {
  const f = fmtOf(id), it = items[id];
  if (!f || !it) return "Still rendering.";
  if (f.status === "needs_input") return `Draft: still needs ${f.missing.join(", ")}. Fill it in above, then it can be checked and exported.`;
  if (it.report.verdict.code === "BLOCKED" || it.report.scores?.compliance?.code === "BLOCKED") return "Export disabled: the ad has a blocking finding. Fix it and re-check.";
  if (f.risk === "severe") return "Export disabled: Severe risk (a person, hands or skin photo is used). Kept for review until a reviewer confirms real, consented photos.";
  return "";
}

async function drawMain() {
  const id = selected, f = fmtOf(id), it = items[id];
  if (!f || !it) return;
  const myGen = gen;
  const spec = await hydrate(id);
  if (myGen !== gen || id !== selected) return;
  $("#preview").innerHTML = svgFor(spec, previewSize);
  const block = exportBlock(id);
  drawSizeButtons(Boolean(block));
  $("#export-note").textContent = block || "Exports include the review ticket — send both to the reviewer. This is not an approval.";
  $("#fmt-head").innerHTML = `
    <h3 class="fmt-title"><span class="tag new">New</span> #${f.rank} ${esc(f.label)}</h3>
    <p class="chips"><span class="chip risk-${f.risk}">${esc(f.risk_label)} risk</span>${f.status === "needs_input" ? '<span class="chip st-need">Needs input</span>' : ""}${it.judging ? '<span class="chip st-wait">AI check running…</span>' : ""}</p>
    <p class="hint">${f.template ? `Catalog format #${f.template.id} ${esc(f.template.name)} · ranked by the same scoring as the library: ${esc(f.template.why)}.` : ""} ${esc(f.risk_note)}${f.visual ? ` Product image: ${esc(f.visual)}.` : ""}</p>`;
  if (f.status === "needs_input") $("#gen-report").innerHTML = `<div class="verdict DRAFT"><b>Draft — needs input</b><span>Still missing: ${esc(f.missing.join(", "))}. Empty slots show as [brackets] on the image and are not scored. Anything already filled is checked below.</span></div><div id="draft-report"></div>`;
  renderReport(it.report, f.status === "needs_input" ? $("#draft-report") : $("#gen-report"));
  drawNeeds(id);
  $("#gen-log").innerHTML = log.length ? `<details><summary>Generation log (${esc(mode)} copy)</summary><pre>${esc(JSON.stringify(log, null, 2))}</pre></details>` : `<p class="hint">Copy: ${esc(mode)}.</p>`;
}

// What this format still needs, and how to supply it: typed lines, an AI draft with citations, or a real photo.
function drawNeeds(id) {
  const f = fmtOf(id), el = $("#needs");
  const show = f.fields.length || f.photos.length || f.notes.length || f.missing.length;
  el.classList.toggle("hidden", !show);
  if (!show) return;
  const field = (x) => x.options
    ? `<label>${esc(x.label)}<select data-key="${esc(x.key)}" class="sel">${x.options.map((o) => `<option value="${esc(o.value)}"${o.value === x.value ? " selected" : ""}>${esc(o.label)}</option>`).join("")}</select></label>`
    : `<label>${esc(x.label)}${x.cited ? ' <span class="chip ok">from the page</span>' : x.typed ? ' <span class="chip risk-medium">typed, no source yet</span>' : ""}<input data-key="${esc(x.key)}" value="${esc(x.value)}"${x.max ? ` maxlength="${x.max}"` : ""} /></label>`;
  const photo = (p) => `<label>${esc(p.label)} ${p.have ? '<span class="chip ok">added</span>' : ""}<input type="file" accept="image/png,image/jpeg,image/webp" data-photo="${esc(p.key)}" /></label>`;
  el.innerHTML = `
    <h4>${f.missing.length ? "This format still needs" : "Lines and photos for this format"}</h4>
    ${f.missing.length ? `<ul class="missing">${f.missing.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
    ${f.notes.map((n) => `<p class="hint">${esc(n)}</p>`).join("")}
    ${f.person ? `<p class="hint">Any person, hands or skin photo is treated as an AI model, exactly like the library: it carries the "AI-GENERATED — ILLUSTRATIVE" mark and Severe risk. The product itself is always the real pack, composited by the app.</p>` : ""}
    <div class="needs-fields">${f.fields.map(field).join("")}${f.photos.map(photo).join("")}</div>
    <div class="row">
      ${f.fields.some((x) => !x.options) ? `<button type="button" id="apply-inputs">Apply and re-check</button>` : ""}
      ${f.ai_draft ? `<button type="button" id="ai-draft" class="ghost"${llm ? "" : ' disabled title="Needs a Claude API key (top right)"'}>Write the missing lines with AI (cited to the page)</button>` : ""}
      <span id="needs-msg" class="hint"></span>
    </div>`;
  const collect = () => {
    const values = {};
    el.querySelectorAll("input[data-key]").forEach((i) => (values[i.dataset.key] = i.value));
    el.querySelectorAll("select[data-key]").forEach((s) => (values[s.dataset.key] = s.value));
    return values;
  };
  const apply = (values) => {
    const prev = inputs[id] || {};
    // AI-drafted lines keep their citations only while unchanged; anything edited counts as typed.
    const cites = {};
    for (const [k, c] of Object.entries(prev.aiCites || {})) if (values[k] === aiValues[id]?.[k]) cites[k] = c;
    inputs[id] = { ...prev, values, cites };
    return rescoreOne(id);
  };
  el.querySelector("#apply-inputs")?.addEventListener("click", () => apply(collect()));
  // Picking another offer / question replaces the lines that came with the old one.
  el.querySelectorAll("select.sel").forEach((s) => s.addEventListener("change", () => apply({ [s.dataset.key]: s.value })));
  el.querySelectorAll("input[data-photo]").forEach((inp) => inp.addEventListener("change", async () => {
    const file = inp.files[0];
    if (!file) return;
    uploads[id] = { ...(uploads[id] || {}), [inp.dataset.photo]: await shrink(file) };
    const prev = inputs[id] || {};
    inputs[id] = { ...prev, photos: { ...(prev.photos || {}), [inp.dataset.photo]: true } };
    rescoreOne(id);
  }));
  el.querySelector("#ai-draft")?.addEventListener("click", async () => {
    $("#needs-msg").textContent = "Writing from the page facts…";
    try {
      const out = await api("/api/draft", { copy, sheet, format: id, inputs });
      aiValues[id] = out.values;
      inputs[id] = { ...(inputs[id] || {}), values: { ...collect(), ...out.values }, cites: out.cites, aiCites: out.cites };
      await rescoreOne(id);
      $("#needs-msg").textContent = out.problems.length ? `Some lines were dropped because they didn't match the page: ${out.problems.join("; ")}` : "Written and checked against the page.";
    } catch (err) { $("#needs-msg").textContent = err.message; }
  });
}

// Uploaded photos are scaled to at most 1600px so the page and the PNG stay light.
async function shrink(file) {
  const url = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(file); });
  const img = new Image(); img.src = url; await img.decode();
  const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.9);
}

// One format again (after inputs or photos), with the AI judge when a key is set.
async function rescoreOne(id, { rulesOnly = !llm } = {}) {
  const myGen = gen;
  if (items[id]) items[id].judging = !rulesOnly;
  updateThumbInfo(id);
  if (id === selected) $("#needs-msg") && ($("#needs-msg").textContent = "Checking…");
  try {
    const out = await api("/api/rescore", { copy, sheet, format: id, inputs, rulesOnly });
    if (myGen !== gen) return;
    const i = formats.findIndex((f) => f.id === id);
    formats[i] = { ...out.meta, rank: formats[i].rank };
    items[id] = { spec: out.spec, report: out.report, judged: !rulesOnly };
  } catch (err) {
    if (items[id]) items[id].judging = false;
    if (id === selected) $("#export-note").textContent = err.message;
  }
  await drawThumb(id);
  if (id === selected) drawMain();
}

// The AI judge, one call per format, three at a time, best-ranked first (the one on screen jumps the queue).
function judgeAll() {
  if (!llm) return;
  const myGen = gen;
  const queue = formats.filter((f) => f.status === "ready" && !items[f.id]?.judged).map((f) => f.id).sort((a, b) => (b === selected) - (a === selected));
  let running = 0, done = 0;
  const total = queue.length;
  const next = () => {
    if (myGen !== gen) return;
    $("#gen-progress").textContent = done < total ? `AI judge: ${done} of ${total} formats checked…` : `All ${total} ready formats checked by the AI judge.`;
    while (running < 3 && queue.length) {
      const id = queue.shift();
      running++;
      rescoreOne(id, { rulesOnly: false }).finally(() => { running--; done++; next(); });
    }
  };
  next();
}

function fillEditor(c) {
  $("#e-headline").value = c.headline;
  $("#e-subhead").value = c.subhead;
  $("#e-proofs").value = c.proof_points.join("\n");
  $("#e-footnote").value = c.footnote;
  $("#e-cta").value = c.cta;
}

// Shows a freshly built set: the first format large at once, then the strip fills in, then the AI judge (if on).
async function showBuild(out, t0) {
  formats = out.formats; items = Object.fromEntries(Object.entries(out.items).map(([k, v]) => [k, { ...v, judged: false }])); notShown = out.notShown;
  formats.forEach((f, i) => (f.rank = i + 1));
  if (!fmtOf(selected)) selected =out.format || formats.find((f) => f.status === "ready")?.id || formats[0].id;
  $("#gen-result").classList.remove("hidden");
  renderStrip();
  await drawMain();
  await drawThumb(selected);
  if (t0) $("#gen-progress").textContent = `First ad shown in ${((performance.now() - t0) / 1000).toFixed(1)} s. Rendering the other ${formats.length - 1} formats…`;
  const myGen = gen;
  for (const f of formats) {
    if (myGen !== gen) return;
    if (f.id !== selected) { await drawThumb(f.id); await new Promise((r) => setTimeout(r, 0)); }
  }
  $("#gen-progress").textContent = `${formats.length} formats: ${formats.filter((f) => f.status === "ready").length} ready, ${formats.filter((f) => f.status !== "ready").length} need input.${llm ? "" : " Rules-only check (add a Claude API key for the AI judge)."}`;
  judgeAll();
}

$("#generate").onclick = async () => {
  const t0 = performance.now();
  gen++;
  inputs = {}; uploads = {}; aiValues = {}; selected = "";
  $("#extract-msg").textContent = $("#mode").value === "model" ? "Writing the copy (the model takes a few seconds), then building every format…" : "Building every format…";
  try {
    const out = await api("/api/generate", { sheet, mode: $("#mode").value });
    if (out.refused) return ($("#extract-msg").innerHTML = `<div class="refusal">${esc(out.reason)}</div>`);
    copy = out.copy; mode = out.mode; log = out.log || [];
    fillEditor(copy);
    $("#extract-msg").textContent = "";
    await showBuild(out, t0);
    $("#gen-result").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    $("#extract-msg").innerHTML = `<span class="err">${esc(err.message)}</span>`;
  }
};

$("#recheck").onclick = async () => {
  copy = {
    headline: $("#e-headline").value.trim(),
    subhead: $("#e-subhead").value.trim(),
    proof_points: $("#e-proofs").value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 3),
    footnote: $("#e-footnote").value.trim(),
    cta: $("#e-cta").value,
  };
  log.push({ step: "marketer edited copy and re-checked every format" });
  gen++;
  try {
    await showBuild(await api("/api/formats", { copy, sheet, inputs }));
  } catch (err) { $("#export-note").textContent = err.message; }
};

async function downloadSize(key) {
  if (exportBlock(selected)) return;
  const p = placementOf(key), id = selected;
  const svg = svgFor(await hydrate(id), key);
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  await img.decode();
  const c = document.createElement("canvas");
  c.width = p.w;
  c.height = p.h;
  c.getContext("2d").drawImage(img, 0, 0, p.w, p.h);
  c.toBlob((b) => download(b, `${slug()}_${id}_${p.w}x${p.h}.png`), "image/png");
}

$("#dl-ticket").onclick = () => download(new Blob([ticket()], { type: "text/markdown" }), `${slug()}_${selected}_review-ticket.md`);

const slug = () => (sheet?.title || "ad").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

function ticket() {
  const f = fmtOf(selected), r = items[selected].report, c = copy;
  const cites = c.citations ? (k) => (c.citations[k] || []).join(", ") || "—" : () => "edited by marketer (uncited)";
  const sc = r.scores;
  const lines = [
    `# Review ticket — ${sheet.title}`,
    ``,
    `- Product page: ${sheet.url || "manual entry (unverified)"}`,
    `- Verdict from pre-screen: **${r.verdict.label}** — ${r.verdict.detail}`,
    `- Checked: ${r.coverage.model ? "rules + model" : "rules only"} · rules v${r.coverage.rules_version} · ${r.scored_at}`,
    `- Copy mode: ${mode}`,
    `- Format: ${f.label}${f.template ? ` (catalog #${f.template.id} ${f.template.name}, ranked #${f.rank} for this product)` : ""}`,
    `- Risk: ${f.risk_label} — ${f.risk_note}`,
    sc ? `- Scores: brand alignment ${pct(sc.alignment?.score)}, chance to win ${pct(sc.win?.score)}, compliance ${sc.compliance?.label || sc.compliance?.code || "—"}` : "",
    f.status === "needs_input" ? `- DRAFT, still needs: ${f.missing.join(", ")}` : "",
    ...(f.typed.length ? [``, `## Lines typed in the app (no page source yet)`, ...f.typed.map((t) => `- ${t.label}: ${t.text}`)] : []),
    ...(uploads[selected] && Object.keys(uploads[selected]).length ? [``, `Uploaded photos: ${Object.keys(uploads[selected]).join(", ")} (treated as AI models: AI mark, Severe).`] : []),
    ``,
    `## What the image shows`,
    ...[r.ad.headline, ...String(r.ad.on_image_text || "").split("\n")].filter(Boolean).map((l) => `- ${l}`),
    r.ad.footnote ? `- Footnote: ${r.ad.footnote}` : "",
    ``,
    `Caption (post text): ${r.ad.primary_text || "—"}`,
    ``,
    `## Generated copy and its sources`,
    `| Field | Text | Cited facts |`,
    `|---|---|---|`,
    `| Headline | ${c.headline} | ${cites("headline")} |`,
    `| Subhead | ${c.subhead} | ${cites("subhead")} |`,
    ...c.proof_points.map((p, i) => `| Proof ${i + 1} | ${p} | ${c.citations ? (c.citations.proof_points[i] || []).join(", ") : "edited (uncited)"} |`),
    `| Footnote | ${c.footnote} | ${cites("footnote")} |`,
    `| CTA | ${c.cta} | — |`,
    ``,
    `## Findings`,
    ...(r.findings.length ? r.findings.map((x) => `- **${x.severity.toUpperCase()}** ${x.rule_id} (${x.dimension}) — “${x.span}” — ${x.message} _Fix:_ ${x.fix}${x.note ? ` _(${x.note})_` : ""}`) : ["- none"]),
    ``,
    `## Facts cited`,
    ...sheet.facts.filter((x) => JSON.stringify(c.citations || {}).includes(`"${x.id}"`)).map((x) => `- ${x.id} (${x.section}): ${x.text}`),
    ``,
    `_Pre-screen only. Brand and legal sign-off still required._`,
  ];
  return lines.filter((l) => l !== "").join("\n").replace(/\n(#+ )/g, "\n\n$1");
}

// ---------- score flow ----------
$("#score-form").onsubmit = async (e) => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  $("#score-msg").textContent = "Scoring…";
  try {
    let ctxSheet = null;
    if (f.product_url) {
      try {
        ctxSheet = (await api("/api/extract", { url: f.product_url })).sheet;
      } catch (err) {
        $("#score-msg").textContent = `Couldn't read that product page (${err.message}); scoring without it.`;
      }
    }
    const report = await api("/api/score", { ad: { ad_type: f.ad_type, headline: f.headline, primary_text: f.primary_text, on_image_text: f.on_image_text, footnote: f.footnote, cta: f.cta }, sheet: ctxSheet });
    if (!$("#score-msg").textContent.startsWith("Couldn't")) $("#score-msg").textContent = "";
    renderReport(report, $("#score-report"));
  } catch (err) {
    $("#score-msg").innerHTML = `<span class="err">${esc(err.message)}</span>`;
  }
};

$("#image").onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  $("#score-msg").textContent = "Reading text off the image, then scoring…";
  const b64 = await new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(",")[1]);
    fr.readAsDataURL(file);
  });
  try {
    const report = await api("/api/score", { image: b64, mediaType: file.type });
    const t = report.transcript;
    // Put the transcript in the form so the marketer can correct it and re-score.
    const form = $("#score-form");
    form.headline.value = t.headline;
    form.on_image_text.value = t.on_image_text;
    form.footnote.value = t.footnote;
    form.cta.value = t.cta;
    $("#score-msg").innerHTML = `Transcribed from image — check the fields above and re-score if anything was misread.${t.illegible_parts && t.illegible_parts !== "none" ? ` <b>Illegible:</b> ${esc(t.illegible_parts)}` : ""}${t.visual_notes && t.visual_notes !== "none" ? ` <b>Visual:</b> ${esc(t.visual_notes)}` : ""}`;
    renderReport(report, $("#score-report"));
  } catch (err) {
    $("#score-msg").innerHTML = `<span class="err">${esc(err.message)}</span>`;
  }
};
