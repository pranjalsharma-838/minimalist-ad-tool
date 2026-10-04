// Ad generator: fact sheet -> copy -> every format the product can fill (lib/app_formats.js) -> self-score.
//
// Two modes:
//  - "model": the model writes copy that must cite fact ids; code checks every number against the
//    cited facts and every citation id against the sheet. One automatic revision if the self-score
//    blocks; never more (a loop that rewrites until the scorer is happy optimises against the scorer).
//  - "verbatim": no API key needed. Lines are picked from the page facts word for word. Duller,
//    but it cannot invent a claim — which is the failure that costs money.
import { refusalReason } from "./extract.js";
import { structuredCall, loadPrompt, llmAvailable } from "./llm.js";
import { scoreAd, verdictFor } from "./score.js";
import { layoutProblems } from "../public/render.js";
import { FORMATS, buildFormat, listFormats, pickQuote, pickStat, textureOf, badgesOf } from "./app_formats.js";

export { FORMATS, pickQuote, pickStat, textureOf, badgesOf };

// The product name IS citable: it's the pack, and it's the source of the concentration ("2% Granactive
// Retinoid"). Banning it blocked 10 of 12 pipeline briefs on the first gate run.
const NOT_CITABLE = new Set(["testimonial", "faq", "inci"]);
// Prices, offers, the rating and reviews are for the offer / price / rating / quote formats, which quote them exactly;
// the copywriter never sees them (2026-10-05: they joined the fact sheet with the app's new formats).
const LIVE_KINDS = new Set(["price", "offer", "rating", "review"]);
const CTAS = ["Shop now", "Learn more", "See ingredients"];

export const COPY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "subhead", "proof_points", "footnote", "cta", "citations"],
  properties: {
    headline: { type: "string" },
    subhead: { type: "string" },
    proof_points: { type: "array", items: { type: "string" } },
    footnote: { type: "string" },
    cta: { type: "string", enum: CTAS },
    citations: {
      type: "object",
      additionalProperties: false,
      required: ["headline", "subhead", "proof_points", "footnote"],
      properties: {
        headline: { type: "array", items: { type: "string" } },
        subhead: { type: "array", items: { type: "string" } },
        proof_points: { type: "array", items: { type: "array", items: { type: "string" } } },
        footnote: { type: "array", items: { type: "string" } },
      },
    },
  },
};

const nums = (s) => (String(s).match(/\d+(?:\.\d+)?/g) || []).map((n) => n.replace(/^0+(?=\d)/, ""));

// Every number in a line must appear in the facts it cites (or the product title).
export function checkCopy(copy, sheet) {
  const problems = [];
  const byId = new Map(sheet.facts.map((f) => [f.id, f]));
  const titleNums = new Set(nums(sheet.title));
  const lines = [
    ["headline", copy.headline, copy.citations.headline],
    ["subhead", copy.subhead, copy.citations.subhead],
    ...copy.proof_points.map((p, i) => [`proof point ${i + 1}`, p, copy.citations.proof_points[i] || []]),
    ["footnote", copy.footnote, copy.citations.footnote],
  ];
  for (const [label, text, cites] of lines) {
    if (!text || !text.trim()) continue;
    if (!cites || cites.length === 0) {
      problems.push(`${label} has no citation`);
      continue;
    }
    const facts = cites.map((id) => byId.get(id));
    if (facts.some((f) => !f)) problems.push(`${label} cites an id that doesn't exist (${cites.join(", ")})`);
    const bad = facts.filter((f) => f && NOT_CITABLE.has(f.kind));
    if (bad.length) problems.push(`${label} cites ${bad.map((f) => `${f.id} (${f.kind})`).join(", ")}, which can't support a claim`);
    const allowed = new Set([...titleNums, ...facts.filter(Boolean).flatMap((f) => nums(f.text))]);
    const extra = nums(text).filter((n) => !allowed.has(n));
    if (extra.length) problems.push(`${label} uses number(s) ${extra.join(", ")} not found in its cited facts`);
  }
  if (copy.proof_points.length > 3) problems.push("more than 3 proof points");
  return problems;
}

// Deterministic copy: whole facts only (no truncation — cutting a sentence can change its meaning).
export function verbatimCopy(sheet) {
  const usable = sheet.facts.filter((f) => !NOT_CITABLE.has(f.kind) && !LIVE_KINDS.has(f.kind));
  const claims = usable.filter((f) => f.kind === "claim");
  const pick = (pool, max, taken) => pool.find((f) => f.text.length <= max && !taken.has(f.id));
  const taken = new Set();
  const take = (f) => (f ? (taken.add(f.id), f) : null);

  const headline = take(pick(claims, 60, taken)) || { id: sheet.facts[0].id, text: sheet.title };
  const firstSentence = (t) => (t.match(/^[^.]*\./) || [t])[0].trim();
  const subPool = claims.filter((f) => !taken.has(f.id) && firstSentence(f.text).length <= 120 && firstSentence(f.text) === f.text);
  const sub = take(subPool[0]);
  const proofs = [];
  for (const f of usable.filter((f) => ["claim", "suitability", "usage"].includes(f.kind))) {
    if (proofs.length === 3) break;
    if (!taken.has(f.id) && f.text.length <= 70 && !/^\d+%\s+subjects/i.test(f.text)) proofs.push(take(f));
  }
  const safety = usable.find((f) => f.kind === "study" && /patch test/i.test(f.text) && f.text.length <= 200);
  return {
    headline: headline.text,
    subhead: sub ? sub.text : "",
    proof_points: proofs.map((f) => f.text),
    footnote: safety ? safety.text.replace(/^Note:\s*/i, "") : "",
    cta: "Shop now",
    citations: {
      headline: [headline.id],
      subhead: sub ? [sub.id] : [],
      proof_points: proofs.map((f) => [f.id]),
      footnote: safety ? [safety.id] : [],
    },
  };
}

function factsBlock(sheet) {
  return sheet.facts
    .filter((f) => f.kind !== "inci" && !LIVE_KINDS.has(f.kind))
    .map((f) => `${f.id} [${f.kind}] (${f.section}) ${f.text}`)
    .join("\n");
}

function heroOf(sheet) {
  const a = sheet.actives[0];
  return a ? { pct: a.pct, name: a.name } : null;
}

async function modelCopy(sheet, revision = "") {
  const hero = heroOf(sheet);
  const { data } = await structuredCall({
    system: loadPrompt("generator_system.md"),
    user: loadPrompt("generator_user.md", {
      TITLE: sheet.title,
      HERO: hero ? `${hero.pct} ${hero.name}` : "(none — no concentration in the title)",
      URL: sheet.url || "(manual entry)",
      FACTS: factsBlock(sheet),
      REVISION: revision ? `\nReviewer findings on your previous draft — fix all of them:\n${revision}\n` : "",
    }),
    schema: COPY_SCHEMA,
    effort: "medium",
  });
  return data;
}

// ---------- formats (2026-10-05: every format that fits, ranked, all clickable; see lib/app_formats.js) ----------
// Kept for older callers: one row per format with available = ready to export once checked.
export function formatOptions(copy, sheet, inputs = {}) {
  const { built, notShown } = listFormats(copy, sheet, inputs);
  return [
    ...built.map((b) => ({ ...b.meta, available: b.meta.status === "ready", why: b.meta.missing.length ? `Needs ${b.meta.missing.join(", ")}.` : "" })),
    ...notShown.filter((n) => FORMATS.some((f) => f.id === n.id)).map((n) => ({ id: n.id, label: n.label, available: false, status: "not_fit", why: `Not offered: ${n.why}.` })),
  ];
}

// The render spec (public/render.js) and the ad as the scorer sees it, for one format. A format the product can't fill
// honestly falls back to the product hero.
const built = (copy, sheet, format, inputs) => { const b = buildFormat(format, copy, sheet, inputs); return b.notFit ? buildFormat("hero", copy, sheet, inputs) : b; };
export const specFromCopy = (copy, sheet, format = "hero", inputs = {}) => built(copy, sheet, format, inputs).spec;
export const adFromCopy = (copy, sheet, format = "hero", inputs = {}) => built(copy, sheet, format, inputs).ad;

// Scores one built format and folds in what the app itself knows: the layout check and lines typed without a source.
export async function scoreBuilt(b, sheet, { rulesOnly = false } = {}) {
  const report = await scoreAd(b.ad, { sheet, extraSheets: b.extraSheets, rulesOnly, layout: b.spec.layout, template_id: b.meta.template?.id });
  const extra = [];
  if (b.layout.length) extra.push({ rule_id: "LAYOUT", dimension: "language", severity: "block", title: "Copy doesn't fit the layout", field: "headline", start: 0, end: 0, span: "", message: b.layout.join(" "), fix: "Shorten the copy.", sources: [], confidence: "layout check", layer: "rule" });
  for (const t of b.meta.typed) extra.push({ rule_id: "UNSOURCED", dimension: "policy", severity: "fix", title: "Line typed in the app, no page source", field: "on_image_text", start: 0, end: 0, span: t.text, message: `"${t.label}" was typed in the app, so nothing on the product page backs it yet.`, fix: "Attach the source (page fact, study, offer terms) or use a line from the page.", sources: [], confidence: "app check", layer: "rule" });
  if (extra.length) {
    report.findings.unshift(...extra);
    report.verdict = verdictFor(report.findings, report.coverage);
  }
  return report;
}

// One format, ready for the app: spec + report + what it still needs.
export async function formatItem(copy, sheet, format, inputs = {}, opts = {}) {
  const b = buildFormat(format, copy, sheet, inputs);
  if (b.notFit) throw new Error(`This product can't fill the ${format} format: ${b.notFit}.`);
  return { format, meta: b.meta, spec: b.spec, report: await scoreBuilt(b, sheet, opts), layout_problems: b.layout };
}

// Every format, rules-only (instant): the app shows the first at once and asks the AI judge per format afterwards.
export async function allFormats(copy, sheet, inputs = {}) {
  const { built: list, notShown } = listFormats(copy, sheet, inputs);
  const items = {};
  for (const b of list) items[b.id] = { spec: b.spec, report: await scoreBuilt(b, sheet, { rulesOnly: true }), layout_problems: b.layout };
  return { formats: list.map((b) => b.meta), notShown, items };
}

const findingsAsText = (report) =>
  report.findings
    .filter((f) => f.severity !== "advisory")
    .map((f) => `- [${f.severity}] ${f.rule_id} "${f.span}": ${f.message} Suggested: ${f.fix}`)
    .join("\n");

export async function generateAd(sheet, opts = {}) {
  if (!sheet || !sheet.facts) throw new Error("No product facts. Extract the product first.");
  const refusal = refusalReason(sheet);
  if (refusal) return { refused: true, reason: refusal };

  const mode = opts.mode === "verbatim" || !llmAvailable() ? "verbatim" : "model";
  const log = [];
  let copy;
  if (mode === "model") {
    try {
      copy = await modelCopy(sheet);
      let problems = [...checkCopy(copy, sheet), ...layoutProblems(specFromCopy(copy, sheet))];
      if (problems.length) {
        log.push({ step: "draft rejected by code checks", problems });
        copy = await modelCopy(sheet, problems.map((p) => `- ${p}`).join("\n"));
        problems = [...checkCopy(copy, sheet), ...layoutProblems(specFromCopy(copy, sheet))];
        if (problems.length) {
          log.push({ step: "revision still failed code checks; fell back to verbatim copy", problems });
          copy = verbatimCopy(sheet);
        }
      }
    } catch (e) {
      log.push({ step: "model unavailable; fell back to verbatim copy", error: e.message });
      copy = verbatimCopy(sheet);
    }
  } else {
    copy = verbatimCopy(sheet);
  }

  // Self-check on the product hero with the rules (instant). The AI judge then reads every format separately in the
  // app (one /api/rescore per format), so it isn't run twice here (2026-10-05: progressive rendering).
  let report = await scoreAd(adFromCopy(copy, sheet, "hero"), { sheet, rulesOnly: true });
  if (mode === "model" && report.verdict.code === "BLOCKED" && !log.some((l) => /fell back/.test(l.step))) {
    log.push({ step: "self-score blocked the first draft; one revision requested", findings: report.findings.filter((f) => f.severity === "block").map((f) => f.rule_id) });
    try {
      const revised = await modelCopy(sheet, findingsAsText(report));
      if (checkCopy(revised, sheet).length === 0 && layoutProblems(specFromCopy(revised, sheet)).length === 0) copy = revised;
      else log.push({ step: "revision failed code checks; kept first draft" });
    } catch (e) {
      log.push({ step: "revision call failed", error: e.message });
    }
  }

  const all = await allFormats(copy, sheet, opts.inputs || {});
  // First shown: the top-ranked format that is ready (or the one asked for).
  const first = (opts.format && all.items[opts.format] && all.formats.find((f) => f.id === opts.format)?.status === "ready" && opts.format) || all.formats.find((f) => f.status === "ready")?.id || "hero";
  return { refused: false, mode, copy, log, format: first, spec: all.items[first].spec, report: all.items[first].report, ...all };
}
