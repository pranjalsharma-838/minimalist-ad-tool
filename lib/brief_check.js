// Checks and converts briefs of ANY format (research/ad_format_library.md).
// Every printed line must cite facts; a citation is "F3" (the brief's main product) or
// "<handle>:F3" (another of our products, used in journey / range layouts). Each number in a line must
// appear in the cited facts or in the cited product's title. Offer terms are the one exception: they
// come from the marketer, not a product page, so they're marked unverified instead of cited.
const NOT_CITABLE = new Set(["testimonial", "faq", "inci"]);
// Numbers glued to a letter or hyphen are ingredient codes, not claims: "Oligopeptide-10", "Vitamin B5",
// "Q10" (format run: "Oligopeptide-10" was flagged as an uncited number).
// (lookbehind also excludes digits/dots, else "Oligopeptide-10" yields a stray "0" — caught by its test)
const nums = (s) => (String(s ?? "").match(/(?<![A-Za-z\-\d.])\d+(?:\.\d+)?(?![A-Za-z\d])/g) || []).map((n) => n.replace(/^0+(?=\d)/, ""));
export const LAYOUTS = ["hero", "actives", "journey", "stat", "callouts", "spec", "range", "offer", "before_after", "badges", "oldnew", "thisvsthat", "review", "socialproof", "faq", "question", "native", "pricecompare", "timeline", "splitscreen"];

// Every printed line of a brief, with its citations, in reading order.
export function briefLines(b) {
  const L = [];
  const add = (label, text, cites) => text && String(text).trim() && L.push({ label, text: String(text), cites: cites || [] });
  const c = b.citations || {};
  add("headline", b.headline, c.headline);
  add("subhead", b.subhead, c.subhead);
  (b.proof_points || []).forEach((p, i) => add(`proof point ${i + 1}`, p, (c.proof_points || [])[i]));
  (b.actives || []).forEach((a, i) => add(`active ${i + 1}`, `${a.pct || ""} ${a.name} ${a.line}`.trim(), a.cites));
  (b.steps || []).forEach((s, i) => add(`step ${i + 1}`, `${s.label || ""} ${s.line}`.trim(), s.cites));
  if (b.stat) add("stat", `${b.stat.value} ${b.stat.label}`, b.stat.cites);
  (b.callouts || []).forEach((x, i) => add(`callout ${i + 1}`, x.text, x.cites));
  (b.specs || []).forEach((x, i) => add(`spec ${i + 1}`, `${x.label}: ${x.value}`, x.cites));
  (b.range || []).forEach((x, i) => add(`range ${i + 1}`, x.label, x.cites));
  (b.badges || []).forEach((x, i) => add(`badge ${i + 1}`, x.text, x.cites));
  for (const [k, col] of [["old", b.old], ["new", b.new], ...(b.columns || []).map((c, i) => [`column ${i + 1}`, c])]) (col?.items || []).forEach((it, i) => add(`${k} item ${i + 1}`, typeof it === "string" ? it : it.text, typeof it === "string" ? col.cites : it.cites));
  if (b.faq) add("faq", `${b.faq.question} ${b.faq.answer}`, b.faq.cites);
  if (b.question) add("question", `${b.question} ${b.answer || ""}`, b.question_cites);
  // Marketer-supplied lines (review text, proof numbers, prices) are not product-page facts: they must be
  // [placeholders] or carry a source; they are listed for the scorer but not citation-checked.
  add("footnote", b.footnote, c.footnote);
  return L;
}

// sheets: { [handle]: factSheet }, main: the brief's own product handle
export function checkBrief(b, sheets, main) {
  const problems = [];
  const layout = b.layout || "hero";
  if (!LAYOUTS.includes(layout)) problems.push(`unknown layout "${layout}"`);
  const resolve = (cite) => {
    const [h, id] = cite.includes(":") ? cite.split(":") : [main, cite];
    const sheet = sheets[h];
    if (!sheet) return { error: `cites product "${h}" whose facts weren't provided` };
    const fact = sheet.facts.find((f) => f.id === id);
    return fact ? { fact, sheet } : { error: `cites ${cite}, which doesn't exist` };
  };
  for (const line of briefLines(b)) {
    if (!line.cites.length) {
      problems.push(`${line.label} has no citation`);
      continue;
    }
    const got = line.cites.map(resolve);
    got.filter((g) => g.error).forEach((g) => problems.push(`${line.label} ${g.error}`));
    const ok = got.filter((g) => g.fact);
    ok.filter((g) => NOT_CITABLE.has(g.fact.kind)).forEach((g) => problems.push(`${line.label} cites ${g.fact.id} (${g.fact.kind}), which can't support a claim`));
    const allowed = new Set(ok.flatMap((g) => [...nums(g.fact.text), ...nums(g.sheet.title)]));
    const extra = nums(line.text).filter((n) => !allowed.has(n) && !/^step$/i.test(n));
    // step numbers ("Step 1") are layout furniture, not claims
    const isStepNo = (n) => line.label.startsWith("step") && /^[1-3]$/.test(n);
    const bad = extra.filter((n) => !isStepNo(n));
    if (bad.length) problems.push(`${line.label} uses number(s) ${bad.join(", ")} not found in its cited facts`);
  }
  if (layout === "offer") {
    if (!b.offer || !String(b.offer.condition || "").trim()) problems.push("offer layout needs offer.condition next to the offer (CCPA 7)");
  }
  if (layout === "journey" && !(b.steps || []).every((s) => sheets[s.product_handle])) problems.push("every journey step needs a product_handle with facts provided");
  if (layout === "range" && !(b.range || []).every((s) => sheets[s.product_handle])) problems.push("every range item needs a product_handle with facts provided");
  return problems;
}

// Everything printed on the creative, as one ad for the scorer.
export function adFromBrief(b, sheets, main) {
  const sheet = sheets[main];
  const hero = sheet.actives[0];
  const heroLine = (b.layout || "hero") === "hero" && hero ? (hero.name === "SPF" ? `SPF ${hero.pct}` : `${hero.pct} ${hero.name}`) : "";
  const body = briefLines(b).filter((l) => !["headline", "footnote"].includes(l.label)).map((l) => l.text);
  const offer = [
    ...(b.offer ? [b.offer.line, b.offer.condition, b.offer.valid_till ? `Valid till ${b.offer.valid_till}` : ""] : []),
    ...(b.review ? [b.review.quote, b.review.source] : []),
    ...(b.proof ? [`${b.proof.value} ${b.proof.label}`, b.proof.source] : []),
    ...(b.prices || []).map((p) => `${p.label} ${p.value} ${p.note || ""}`),
    ...(b.frames || []).map((f) => f.label),
  ].filter(Boolean);
  const names = [...(b.steps || []), ...(b.range || [])].map((x) => sheets[x.product_handle]?.title).filter(Boolean);
  return {
    ad_type: "brand",
    headline: b.headline || (b.offer && b.offer.line) || "",
    on_image_text: [heroLine, ...body, ...offer, ...names, sheet.title].filter(Boolean).join("\n"),
    footnote: b.footnote || "",
    cta: b.cta || "",
    primary_text: "",
  };
}

// Render spec for public/render.js. imageSrc fields are resolved to data URLs by the caller.
export function specFromBrief(b, sheets, main) {
  const sheet = sheets[main];
  const prod = (h) => ({ productName: sheets[h]?.title || "", imageSrc: sheets[h]?.images?.[0] || "" });
  return {
    layout: b.layout || "hero",
    hero: sheet.actives[0] ? { pct: sheet.actives[0].pct, name: sheet.actives[0].name } : null,
    headline: b.headline,
    subhead: b.subhead,
    proofPoints: b.proof_points || [],
    actives: b.actives,
    steps: (b.steps || []).map((s) => ({ ...s, ...prod(s.product_handle) })),
    stat: b.stat,
    callouts: b.callouts,
    specs: b.specs,
    range: (b.range || []).map((r) => ({ ...r, ...prod(r.product_handle) })),
    offer: b.offer,
    photos: b.photos || [],
    badges: b.badges, old: b.old, new: b.new, columns: b.columns, review: b.review, proof: b.proof,
    faq: b.faq, question: b.question, answer: b.answer, prices: b.prices, frames: b.frames,
    aiLabel: Boolean(b.ai_label_required || b.needs_real_photography),
    footnote: b.footnote,
    cta: b.cta,
    productName: ["journey", "range"].includes(b.layout) ? "" : sheet.title,
    imageSrc: sheet.images[0] || "",
    testMark: process.env.TEST_MARK ?? "INTERNAL TEST — not for publication",
  };
}
