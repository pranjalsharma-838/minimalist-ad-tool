import { renderAdSvg, SIZE } from "./render.js";

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

async function api(path, body) {
  const r = await fetch(path, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {});
  const j = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
  if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

// ---------- status ----------
api("/api/status").then((s) => {
  $("#status").innerHTML = `Rules v${esc(s.rulesVersion)} · Model judgment: <b class="${s.llm ? "on" : "off"}">${s.llm ? "on" : "off (rules only)"}</b>`;
  if (!s.llm) {
    $("#mode").value = "verbatim";
    $("#mode").querySelector('[value="model"]').disabled = true;
  }
}).catch(() => ($("#status").textContent = "server not reachable"));

// ---------- tabs ----------
document.querySelectorAll(".tab").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === b));
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("hidden", p.id !== `tab-${b.dataset.tab}`));
  })
);

// ---------- report rendering (shared) ----------
const SEV_LABEL = { block: "Block", fix: "Must fix", advisory: "Advisory" };
const DIM_LABEL = { policy: "Policy & claims", tone: "Brand tone", language: "Brand language" };
const FIELD_LABEL = { headline: "Headline", primary_text: "Primary text", on_image_text: "On-image text", footnote: "Footnote", cta: "CTA" };

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
        <header><span class="sev">${SEV_LABEL[f.severity]}</span><span class="rid">${esc(f.rule_id)}</span> ${esc(f.title)} <span class="dimtag">${DIM_LABEL[f.dimension]}</span></header>
        ${f.span ? `<blockquote>“${esc(f.span)}” <small>in ${FIELD_LABEL[f.field]}</small></blockquote>` : ""}
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
    <div class="dims">${dims}</div>
    <p class="coverage">${coverage}</p>
    ${reads}
    <h3>The ad, with flagged spans</h3><div class="adview">${adView}</div>
    <h3>${report.findings.length ? "Findings" : "No findings"}</h3>${cards}${dropped}`;
}

// ---------- generate flow ----------
let sheet = null, current = null, imageDataUrl = "";

$("#manual-toggle").onclick = () => $("#manual-form").classList.toggle("hidden");

function showSheet(s, refusal) {
  sheet = s;
  const rows = s.facts
    .map((f) => `<tr class="${["testimonial", "faq", "inci"].includes(f.kind) ? "excluded" : ""}"><td>${f.id}</td><td>${esc(f.kind)}</td><td>${esc(f.section)}</td><td>${esc(f.text)}</td></tr>`)
    .join("");
  $("#facts-body").innerHTML = `<p class="hint">${esc(s.title)} · actives from pack title: ${s.actives.map((a) => esc(a.pct + " " + a.name)).join(", ") || "none"} · source: ${s.source}. Greyed rows (testimonials, FAQ answers, full INCI) cannot be cited as claims.</p><table>${rows}</table>`;
  $("#facts").classList.remove("hidden");
  $("#gen-controls").classList.toggle("hidden", Boolean(refusal));
  $("#extract-msg").innerHTML = refusal ? `<div class="refusal"><b>Generator won't write this one.</b> ${esc(refusal)}</div>` : `Found ${s.facts.length} facts.`;
}

$("#extract-form").onsubmit = async (e) => {
  e.preventDefault();
  $("#extract-msg").textContent = "Fetching product page…";
  $("#gen-result").classList.add("hidden");
  try {
    const { sheet: s, refusal } = await api("/api/extract", { url: $("#url").value });
    showSheet(s, refusal);
  } catch (err) {
    $("#extract-msg").innerHTML = `<span class="err">${esc(err.message)}</span> You can enter the product manually instead.`;
    $("#manual-form").classList.remove("hidden");
  }
};

$("#manual-form").onsubmit = async (e) => {
  e.preventDefault();
  const manual = Object.fromEntries(new FormData(e.target));
  const { sheet: s, refusal } = await api("/api/extract", { manual });
  showSheet(s, refusal);
};

async function toDataUrl(src) {
  if (!src) return "";
  const r = await fetch("/api/image?src=" + encodeURIComponent(src));
  if (!r.ok) return "";
  const b = await r.blob();
  return new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.readAsDataURL(b);
  });
}

function drawPreview() {
  // The product photo is inlined as a data URL so PNG export works (an SVG drawn to canvas can't load external images).
  $("#preview").innerHTML = renderAdSvg({ ...current.spec, imageHref: imageDataUrl });
  const blocked = current.report.verdict.code === "BLOCKED";
  $("#dl-png").disabled = blocked;
  $("#export-note").textContent = blocked
    ? "Export disabled: the ad has a blocking finding. Fix it below and re-check."
    : "Exports include the review ticket — send both to the reviewer. This is not an approval.";
  renderReport(current.report, $("#gen-report"));
  $("#gen-log").innerHTML = current.log?.length
    ? `<details><summary>Generation log (${current.mode} mode)</summary><pre>${esc(JSON.stringify(current.log, null, 2))}</pre></details>`
    : `<p class="hint">Copy mode: ${current.mode}.</p>`;
}

function fillEditor(copy) {
  $("#e-headline").value = copy.headline;
  $("#e-subhead").value = copy.subhead;
  $("#e-proofs").value = copy.proof_points.join("\n");
  $("#e-footnote").value = copy.footnote;
  $("#e-cta").value = copy.cta;
}

$("#generate").onclick = async () => {
  $("#extract-msg").textContent = "Generating and self-checking…";
  try {
    const out = await api("/api/generate", { sheet, mode: $("#mode").value });
    if (out.refused) return ($("#extract-msg").innerHTML = `<div class="refusal">${esc(out.reason)}</div>`);
    current = out;
    imageDataUrl = await toDataUrl(out.spec.imageSrc);
    fillEditor(out.copy);
    $("#gen-result").classList.remove("hidden");
    $("#extract-msg").textContent = "";
    drawPreview();
  } catch (err) {
    $("#extract-msg").innerHTML = `<span class="err">${esc(err.message)}</span>`;
  }
};

$("#recheck").onclick = async () => {
  const copy = {
    headline: $("#e-headline").value.trim(),
    subhead: $("#e-subhead").value.trim(),
    proof_points: $("#e-proofs").value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 3),
    footnote: $("#e-footnote").value.trim(),
    cta: $("#e-cta").value,
  };
  try {
    const out = await api("/api/rescore", { copy, sheet });
    current = { ...current, copy, spec: out.spec, report: out.report, log: [...(current.log || []), { step: "marketer edited copy and re-checked", layout: out.layout_problems }] };
    drawPreview();
  } catch (err) {
    $("#export-note").textContent = err.message;
  }
};

$("#dl-png").onclick = async () => {
  if (current.report.verdict.code === "BLOCKED") return;
  const svg = renderAdSvg({ ...current.spec, imageHref: imageDataUrl });
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  await img.decode();
  const c = document.createElement("canvas");
  c.width = SIZE.w;
  c.height = SIZE.h;
  c.getContext("2d").drawImage(img, 0, 0);
  c.toBlob((b) => download(b, `${slug()}_1080x1080.png`), "image/png");
};

$("#dl-ticket").onclick = () => download(new Blob([ticket(current)], { type: "text/markdown" }), `${slug()}_review-ticket.md`);

const slug = () => (sheet?.title || "ad").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

function ticket(cur) {
  const r = cur.report;
  const c = cur.copy;
  const cites = c.citations ? (k) => (c.citations[k] || []).join(", ") || "—" : () => "edited by marketer (uncited)";
  const lines = [
    `# Review ticket — ${sheet.title}`,
    ``,
    `- Product page: ${sheet.url || "manual entry (unverified)"}`,
    `- Verdict from pre-screen: **${r.verdict.label}** — ${r.verdict.detail}`,
    `- Checked: ${r.coverage.model ? "rules + model" : "rules only"} · rules v${r.coverage.rules_version} · ${r.scored_at}`,
    `- Copy mode: ${cur.mode}`,
    ``,
    `## Copy on the creative`,
    `| Field | Text | Cited facts |`,
    `|---|---|---|`,
    `| Headline | ${c.headline} | ${cites("headline")} |`,
    `| Subhead | ${c.subhead} | ${cites("subhead")} |`,
    ...c.proof_points.map((p, i) => `| Proof ${i + 1} | ${p} | ${c.citations ? (c.citations.proof_points[i] || []).join(", ") : "edited (uncited)"} |`),
    `| Footnote | ${c.footnote} | ${cites("footnote")} |`,
    `| CTA | ${c.cta} | — |`,
    ``,
    `## Findings`,
    ...(r.findings.length ? r.findings.map((f) => `- **${f.severity.toUpperCase()}** ${f.rule_id} (${f.dimension}) — “${f.span}” — ${f.message} _Fix:_ ${f.fix}${f.note ? ` _(${f.note})_` : ""}`) : ["- none"]),
    ``,
    `## Facts cited`,
    ...sheet.facts.filter((f) => JSON.stringify(c.citations || {}).includes(`"${f.id}"`)).map((f) => `- ${f.id} (${f.section}): ${f.text}`),
    ``,
    `_Pre-screen only. Brand and legal sign-off still required._`,
  ];
  return lines.join("\n");
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
