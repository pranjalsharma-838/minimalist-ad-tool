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
import { layoutProblems, SIGN_OFF, wrap, measure } from "../public/render.js";
import { lockupFor, lockupText } from "./brief_check.js";
import fs from "node:fs";
import { goodReviews } from "./reviews.js";
// Pack label-line colours for the ingredient lockup (sampled from the brand's pack shots; unknown products get black).
const ACCENT = (() => { try { return JSON.parse(fs.readFileSync(new URL("../brand_packs/minimalist/assets/accent_colours.json", import.meta.url), "utf8")); } catch { return {}; } })();
const handleOf = (sheet) => (String(sheet.url || "").match(/\/products\/([^/?#]+)/) || [])[1] || "";

// The product name IS citable: it's the pack, and it's the source of the concentration ("2% Granactive
// Retinoid"). Banning it blocked 10 of 12 pipeline briefs on the first gate run.
const NOT_CITABLE = new Set(["testimonial", "faq", "inci"]);
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

// Minimal look (2026-10-04): the creative shows the headline, the product name and a short subhead (≤ 8 words, as in
// the brand's statics); a longer subhead and the proof points are caption lines (primary text). The app's editor still
// shows every field.
const shortLine = (s) => Boolean(s) && s.length <= 60 && s.split(/\s+/).length <= 8;
const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;

// Formats the app can build from a product page alone (user, 2026-10-04: "there's only one layout, the standard product
// ad"). Every line on them is a page fact or the generated copy, which cites page facts. Formats that need a person, a
// real result photo, a live offer or a comparison basis stay in the library pipeline, where those inputs exist.
export const FORMATS = [
  { id: "hero", label: "Product hero", template: 1 },
  { id: "actives", label: "Ingredient focus", template: 3 },
  { id: "badges", label: "Benefit badges", template: 2 },
  { id: "stat", label: "Study result", template: 25 },
  { id: "review", label: "Customer quote", template: 26 },
  { id: "question", label: "Question and answer", template: 35 },
  { id: "texture", label: "Texture shot", template: 21 },
];
// Real texture photos in the asset library (type "texture"); a product without one can't have a texture shot.
const TEXTURES = (() => { try { return JSON.parse(fs.readFileSync(new URL("../brand_packs/minimalist/assets/index.json", import.meta.url), "utf8")).assets.filter((a) => a.type === "texture"); } catch { return []; } })();
export const textureOf = (sheet) => TEXTURES.find((a) => a.product_handle === handleOf(sheet)) || null;
// Badges are proof points short enough for a pill (≤ 6 words); longer ones stay in the caption, never shortened.
// Page label lines ("Suitable for: 16+ years of age", "Pregnancy/Lactation: Safe") read as specs, not benefits, and
// lose their meaning without the label, so they never become badges.
const badgesOf = (copy) => (copy.proof_points || []).filter((p) => words(p) <= 6 && p.length <= 44 && !/^[^:]{2,30}:\s/.test(p)).slice(0, 2);
const lockedActives = (sheet) => (sheet.actives || []).filter((a) => a.pct).slice(0, 3);
// A consumer-study line that opens with its percentage ("93% subjects saw … in 4 weeks"): split into the big number and
// the rest of the same sentence, every word kept.
export function pickStat(sheet) {
  for (const f of sheet.facts) {
    if (f.kind !== "study") continue;
    const m = f.text.match(/^(\d{1,3}(?:\.\d+)?%)\s+(.{8,110})$/);
    if (m) return { value: m[1], label: m[2].replace(/\.$/, ""), id: f.id, section: f.section };
  }
  return null;
}
// A customer quote short enough for the card in full (6 lines at its smallest text size; a longer one is never
// shortened). First choice: the verified reviews captured from the brand site, already screened for mixed or negative
// wording (lib/reviews.js, the same set the library pipeline uses), with their stars, name and date. Fallback: a quote
// the brand prints on the product page itself (kind "testimonial").
const fitsCard = (q) => wrap(`“${q}”`, Math.round(32 * 0.7), 440, 0.52).length <= 6;
// The whole card must fit (stars and a two-line source take room too), measured exactly as it will be drawn.
const cardFits = (sheet, quote, stars, source) => fitsCard(quote) && measure({ layout: "review", headline: sheet.title, review: { stars, quote, source }, footnote: "One customer's experience. Results vary.", cta: "Shop now" }).fits;
export function pickQuote(sheet) {
  const rv = goodReviews(handleOf(sheet));
  const r = rv.reviews.find((x) => cardFits(sheet, x.text.trim(), x.stars, `${x.name}, verified buyer, ${x.stars}★, ${x.date} (beminimalist.co, captured ${rv.day})`));
  if (r) return { quote: r.text.trim(), name: r.name, stars: r.stars, date: r.date, id: `REV:${r.name}:${r.date}`, verified: true, day: rv.day };
  for (const f of sheet.facts) {
    if (f.kind !== "testimonial") continue;
    const sig = f.text.trim().match(/^([\s\S]*?)["”]?\s+[-–—]\s*([A-Z][a-z]+(?:\s[A-Z]\.?)?)\.?["”]?\s*$/);
    const quote = (sig ? sig[1] : f.text).trim().replace(/^["“]\s*/, "").replace(/["”]\s*$/, "").trim();
    if (quote && cardFits(sheet, quote, 0, "customer quote on the product page")) return { quote, name: sig ? sig[2] : "", id: f.id };
  }
  return null;
}
const strengthOf = (a) => (a.name === "SPF" ? `SPF ${a.pct}` : `${a.pct} ${a.name}`);
const questionOf = (sheet) => { const a = lockedActives(sheet)[0]; return a ? `What does ${strengthOf(a)} do?` : ""; };

// Which formats this product and copy can fill, and why not when one can't.
export function formatOptions(copy, sheet) {
  const why = {
    hero: "",
    actives: lockedActives(sheet).length ? "" : "Needs an active with its strength in the product name.",
    badges: badgesOf(copy).length ? "" : "Needs a caption line of 6 words or fewer. Add one in the editor and re-check.",
    stat: pickStat(sheet) ? "" : "Needs a consumer-study percentage on the product page.",
    review: pickQuote(sheet) ? "" : "Needs a verified review captured for this product, or a customer quote on its page, short enough for the card in full (about 220 characters; a longer one is never shortened).",
    question: questionOf(sheet) && copy.headline ? "" : "Needs an active with its strength in the product name.",
    texture: textureOf(sheet) ? "" : "Needs a real photo of this product's texture in the asset library (none on file yet; it's never drawn by AI).",
  };
  return FORMATS.map((f) => ({ ...f, available: !why[f.id], why: why[f.id] }));
}

// What the creative draws in each format, for the scorer, plus the caption (everything that isn't drawn).
function drawn(copy, sheet, format) {
  const caption = (shown) => [shortLine(copy.subhead) && shown.subhead ? "" : copy.subhead, ...(copy.proof_points || []).filter((p) => !(shown.badges || []).includes(p)), shown.footnoteToCaption ? copy.footnote : ""].filter(Boolean).join(" ");
  if (format === "actives") {
    return { headline: copy.headline, lines: lockedActives(sheet).map((a) => `${a.name} ${a.pct}`), footnote: copy.footnote, caption: caption({}) };
  }
  if (format === "badges") {
    const b = badgesOf(copy);
    return { headline: copy.headline, lines: b, footnote: copy.footnote, caption: caption({ badges: b }) };
  }
  if (format === "stat") {
    const st = pickStat(sheet);
    return { headline: copy.headline, lines: [`${st.value} ${st.label}`], footnote: "Consumer study result as published on the product page.", caption: caption({ footnoteToCaption: true }), cites: [st.id] };
  }
  if (format === "review") {
    const q = pickQuote(sheet);
    const source = q.verified ? `${q.name}, verified buyer, ${q.stars}★, ${q.date} (beminimalist.co, captured ${q.day})` : `${q.name ? `${q.name}, ` : ""}customer quote on the product page`;
    return { headline: sheet.title, lines: [q.quote, source, lockupText(lockupFor({ layout: "review", headline: sheet.title }, sheet))].filter(Boolean), footnote: "One customer's experience. Results vary.", caption: [copy.headline, caption({ footnoteToCaption: true })].filter(Boolean).join(" "), cites: [q.id] };
  }
  if (format === "question") {
    return { headline: questionOf(sheet), lines: [copy.headline], footnote: copy.footnote, caption: caption({}) };
  }
  if (format === "texture") {
    return { headline: copy.headline, lines: [lockupText(lockupFor({ layout: "hero", headline: copy.headline }, sheet))], footnote: copy.footnote, caption: caption({}) };
  }
  return { headline: copy.headline, lines: [lockupText(lockupFor({ layout: "hero", headline: copy.headline }, sheet)), shortLine(copy.subhead) ? copy.subhead : "", sheet.title], footnote: copy.footnote, caption: caption({ subhead: true }) };
}

// The ad as the scorer sees it, field by field.
export function adFromCopy(copy, sheet, format = "hero") {
  const d = drawn(copy, sheet, format);
  return {
    ad_type: "brand",
    headline: d.headline,
    on_image_text: [...d.lines, SIGN_OFF].filter(Boolean).join("\n"),
    footnote: d.footnote,
    cta: copy.cta,
    primary_text: d.caption,
  };
}

export function specFromCopy(copy, sheet, format = "hero") {
  const opt = formatOptions(copy, sheet).find((f) => f.id === format);
  if (!opt || !opt.available) format = "hero";
  const d = drawn(copy, sheet, format);
  const base = {
    layout: format,
    format,
    hero: heroOf(sheet),
    headline: d.headline,
    subhead: "",
    caption: d.caption,
    accent: ACCENT[handleOf(sheet)] || "",
    proofPoints: copy.proof_points,
    footnote: d.footnote,
    cta: copy.cta,
    productName: sheet.title,
    imageSrc: sheet.images[0] || "",
    testMark: process.env.TEST_MARK ?? "INTERNAL TEST — not for publication",
  };
  if (format === "actives") return { ...base, actives: lockedActives(sheet).map((a) => ({ name: a.name, pct: a.pct })) };
  if (format === "badges") return { ...base, badges: badgesOf(copy).map((text) => ({ text })) };
  if (format === "stat") { const st = pickStat(sheet); return { ...base, stat: { value: st.value, label: st.label } }; }
  if (format === "review") {
    const q = pickQuote(sheet);
    return { ...base, review: { stars: q.verified ? q.stars : 0, quote: q.quote, source: d.lines[1] }, lockup: lockupFor({ layout: "review", headline: sheet.title }, sheet) };
  }
  if (format === "question") return { ...base, question: d.headline, answer: copy.headline };
  if (format === "texture") return { ...base, textureSrc: `/api/texture?handle=${encodeURIComponent(handleOf(sheet))}`, lockup: lockupFor({ layout: "hero", headline: copy.headline }, sheet) };
  // Product hero: the active and its % in the pack-label style (same rule as the library ads).
  return { ...base, subhead: shortLine(copy.subhead) ? copy.subhead : "", lockup: lockupFor({ layout: "hero", headline: copy.headline }, sheet) };
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

  // The format picked in the app (product hero unless the product can fill the one asked for).
  const pickFormat = () => (formatOptions(copy, sheet).find((f) => f.id === opts.format && f.available) ? opts.format : "hero");
  let format = pickFormat();
  let report = await scoreAd(adFromCopy(copy, sheet, format), { sheet });
  if (mode === "model" && report.verdict.code === "BLOCKED" && !log.some((l) => /fell back/.test(l.step))) {
    log.push({ step: "self-score blocked the first draft; one revision requested", findings: report.findings.filter((f) => f.severity === "block").map((f) => f.rule_id) });
    try {
      const revised = await modelCopy(sheet, findingsAsText(report));
      if (checkCopy(revised, sheet).length === 0 && layoutProblems(specFromCopy(revised, sheet)).length === 0) {
        copy = revised;
        format = pickFormat();
        report = await scoreAd(adFromCopy(copy, sheet, format), { sheet });
      } else log.push({ step: "revision failed code checks; kept first draft" });
    } catch (e) {
      log.push({ step: "revision call failed", error: e.message });
    }
  }

  return { refused: false, mode, copy, format, formats: formatOptions(copy, sheet), spec: specFromCopy(copy, sheet, format), report, log };
}
