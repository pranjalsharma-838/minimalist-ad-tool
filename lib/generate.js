// Ad generator: fact sheet -> copy -> layout spec -> self-score.
//
// Two modes:
//  - "model": the model writes copy that must cite fact ids; code checks every number against the
//    cited facts and every citation id against the sheet. One automatic revision if the self-score
//    blocks; never more (a loop that rewrites until the scorer is happy optimises against the scorer).
//  - "verbatim": no API key needed. Lines are picked from the page facts word for word. Duller,
//    but it cannot invent a claim — which is the failure that costs money.
import { refusalReason } from "./extract.js";
import { structuredCall, loadPrompt, llmAvailable } from "./llm.js";
import { scoreAd } from "./score.js";
import { layoutProblems } from "../public/render.js";

const NOT_CITABLE = new Set(["testimonial", "faq", "inci", "name"]);
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
  const usable = sheet.facts.filter((f) => !NOT_CITABLE.has(f.kind));
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
    .filter((f) => f.kind !== "inci")
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

// The ad as the scorer sees it: everything printed on the creative, field by field.
export function adFromCopy(copy, sheet) {
  const hero = heroOf(sheet);
  const heroLine = hero ? (hero.name === "SPF" ? `SPF ${hero.pct}` : `${hero.pct} ${hero.name}`) : "";
  return {
    ad_type: "brand",
    headline: copy.headline,
    on_image_text: [heroLine, copy.subhead, ...copy.proof_points, sheet.title].filter(Boolean).join("\n"),
    footnote: copy.footnote,
    cta: copy.cta,
    primary_text: "",
  };
}

export function specFromCopy(copy, sheet) {
  return {
    hero: heroOf(sheet),
    headline: copy.headline,
    subhead: copy.subhead,
    proofPoints: copy.proof_points,
    footnote: copy.footnote,
    cta: copy.cta,
    productName: sheet.title,
    imageSrc: sheet.images[0] || "",
  };
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

  let report = await scoreAd(adFromCopy(copy, sheet), { sheet });
  if (mode === "model" && report.verdict.code === "BLOCKED" && !log.some((l) => /fell back/.test(l.step))) {
    log.push({ step: "self-score blocked the first draft; one revision requested", findings: report.findings.filter((f) => f.severity === "block").map((f) => f.rule_id) });
    try {
      const revised = await modelCopy(sheet, findingsAsText(report));
      if (checkCopy(revised, sheet).length === 0 && layoutProblems(specFromCopy(revised, sheet)).length === 0) {
        copy = revised;
        report = await scoreAd(adFromCopy(copy, sheet), { sheet });
      } else log.push({ step: "revision failed code checks; kept first draft" });
    } catch (e) {
      log.push({ step: "revision call failed", error: e.message });
    }
  }

  return { refused: false, mode, copy, spec: specFromCopy(copy, sheet), report, log };
}
