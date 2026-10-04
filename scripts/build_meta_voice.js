// Minimalist's voice, MEASURED from its own long-running Meta ads (plan item 2, 2026-10-05).
// Two inputs, both Minimalist's own ads on Meta, India:
//   1. on-image text of its STATIC top runners (research/minimalist_top_ads/on_image_text.json, read by eye from the
//      saved images; pack labels not counted) -> how much text sits on the image and how titles are written;
//   2. the ad copy (primary text + headline / link lines) of every brand-authored ad still running after 30+ days
//      (research/minimalist_top_ads/ad_copy_<date>.json, captured from the Meta Ad Library with Playwright, text only).
//      Video ads are used for their WORDING only (never for visuals). Creator partnership ads ("<creator> with
//      Minimalistinc") are in the creator's voice, so they are counted but kept out of the brand numbers.
// Output: brand_packs/minimalist/meta_voice_profile.json — the numbers lib/tiers.js compares a new ad against.
// Usage: node scripts/build_meta_voice.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { measure, sentences, words, median, quantile, ingredientFirst, mentionsActive, hookType, HOOKS, hypeHits, fearHits, emojiCount, exclamationCount, ctaPhrases, strip } from "../lib/voice_features.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "research", "minimalist_top_ads");
const OUT = path.join(root, "brand_packs", "minimalist", "meta_voice_profile.json");
const WINNER_DAYS = 30;
const BRAND_PAGE = /^minimalistinc$/i;

const r1 = (x) => (x == null ? null : +x.toFixed(2));
const share = (n, d) => (d ? +(n / d).toFixed(2) : null);
const per100 = (n, w) => (w ? +((100 * n) / w).toFixed(2) : 0);

// ---------- 1. on-image text of the statics ----------
const oi = JSON.parse(fs.readFileSync(path.join(dir, "on_image_text.json"), "utf8"));
const units = []; // one per image (a carousel contributes one unit per card)
for (const s of oi.statics) {
  if (s.cards) s.cards.forEach((lines, i) => units.push({ id: s.id, card: i + 1, format: s.format, lines }));
  else units.push({ id: s.id, card: null, format: s.format, lines: s.lines });
}
const unitWords = units.map((u) => ({ id: u.id, card: u.card, format: u.format, words: u.lines.reduce((n, l) => n + words(l.text), 0) }));
const singles = unitWords.filter((u) => u.format === "image");
const cards = unitWords.filter((u) => u.format === "carousel");
const allLines = units.flatMap((u) => u.lines);
const titles = allLines.filter((l) => l.role === "title");
// Title targets come from single images only: carousel explainer cards use a sentence as their "title".
const singleTitles = units.filter((u) => u.format === "image").flatMap((u) => u.lines.filter((l) => l.role === "title"));
const oiText = allLines.map((l) => l.text).join("\n");
const oiWords = words(oiText);
const tagsPer = units.map((u) => u.lines.filter((l) => l.role === "tag").length);

const on_image = {
  source: "research/minimalist_top_ads/on_image_text.json (read by eye from the saved statics; pack labels and size marks not counted)",
  ads: oi.statics.length,
  images: units.length,
  days_running: oi.statics.map((s) => s.days_running),
  words_per_image: {
    single_images: { values: singles.map((u) => u.words), min: Math.min(...singles.map((u) => u.words)), median: median(singles.map((u) => u.words)), max: Math.max(...singles.map((u) => u.words)) },
    carousel_cards: { values: cards.map((u) => u.words), min: Math.min(...cards.map((u) => u.words)), median: median(cards.map((u) => u.words)), max: Math.max(...cards.map((u) => u.words)) },
    with_no_text: singles.filter((u) => u.words === 0).map((u) => u.id),
  },
  title_words: { median: median(titles.map((t) => words(t.text))), max: Math.max(...titles.map((t) => words(t.text))), examples: titles.map((t) => t.text) },
  title_words_single_images: { median: median(singleTitles.map((t) => words(t.text))), max: Math.max(...singleTitles.map((t) => words(t.text))), examples: singleTitles.map((t) => t.text) },
  tags_per_image: { max: Math.max(...tagsPer), images_with_a_tag: tagsPer.filter((n) => n > 0).length, examples: allLines.filter((l) => l.role === "tag").map((l) => l.text) },
  titles_naming_an_active_or_pct: { share: share(titles.filter((t) => mentionsActive(t.text)).length, titles.length), n: titles.length, examples: titles.filter((t) => mentionsActive(t.text)).map((t) => t.text) },
  emoji_per_100w: per100(emojiCount(oiText), oiWords),
  exclamation_per_100w: per100(exclamationCount(oiText), oiWords),
  exclamation_examples: allLines.filter((l) => l.text.includes("!")).map((l) => l.text),
  hype_words: hypeHits(oiText),
  fear_words: fearHits(oiText),
  cta_on_image: ctaPhrases(oiText).length,
  people: { faces: oi.statics.filter((s) => s.person).length, hands: oi.statics.filter((s) => s.hands).length, of: oi.statics.length },
  supporting_lines: allLines.filter((l) => ["line", "condition", "offer"].includes(l.role)).map((l) => l.text),
};

// ---------- 2. ad copy of long-running brand-authored ads ----------
const capFile = fs.readdirSync(dir).filter((f) => /^ad_copy_\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort().pop();
if (!capFile) throw new Error("No research/minimalist_top_ads/ad_copy_<date>.json capture found (see header).");
const cap = JSON.parse(fs.readFileSync(path.join(dir, capFile), "utf8"));
const asOf = new Date(cap.captured);
const CTA_BUTTON = /^(shop now|learn more|order now|see details|book now|sign up|download|get offer|buy now|apply now|subscribe)$/i;

function linkLines(c) {
  return c.after_primary_lines.filter((l) =>
    !/^\d+:\d\d \/ \d+:\d\d$/.test(l) && // video timer
    !/^[A-Z0-9.-]+\.[A-Z]{2,}$/.test(l) && // link domain
    l !== c.advertiser && !/instagram photos and videos/i.test(l) && !/^reward:/i.test(l) &&
    l.length <= 110); // longer lines are the destination site's boilerplate description (Zepto, Blinkit, site meta)
}

const all = cap.cards.map((c) => {
  const days = Math.floor((asOf - new Date(c.started)) / 864e5);
  const ll = linkLines(c);
  return { id: c.library_id, started: c.started, days, video: c.has_video, creator: !BRAND_PAGE.test(c.advertiser), advertiser: c.advertiser, primary: c.primary_text, headline_lines: ll.filter((l) => !CTA_BUTTON.test(l)), button: ll.find((l) => CTA_BUTTON.test(l)) || null };
});
const excluded = { creator_partnership: all.filter((a) => a.creator).length, under_30_days: all.filter((a) => !a.creator && a.days < WINNER_DAYS).length, no_copy: all.filter((a) => !a.creator && a.days >= WINNER_DAYS && !a.primary.trim()).length };
const brandLong = all.filter((a) => !a.creator && a.days >= WINNER_DAYS && a.primary.trim());
// Versions of one ad share their copy: count each distinct primary text once (headline variants are kept).
const byText = new Map();
for (const a of brandLong) {
  const k = a.primary.replace(/\s+/g, " ").trim().toLowerCase();
  if (!byText.has(k)) byText.set(k, { ...a, ids: [a.id], headline_lines: [...a.headline_lines], buttons: a.button ? [a.button] : [] });
  else { const e = byText.get(k); e.ids.push(a.id); e.headline_lines.push(...a.headline_lines.filter((h) => !e.headline_lines.includes(h))); if (a.button) e.buttons.push(a.button); }
}
const copies = [...byText.values()];
excluded.duplicate_versions = brandLong.length - copies.length;

const primaryAll = copies.map((c) => c.primary).join("\n");
const pw = words(strip(primaryAll));
const sentW = copies.flatMap((c) => sentences(c.primary).map(words));
const hooks = Object.fromEntries(HOOKS.map((h) => [h, { count: 0, share: 0, examples: [] }]));
for (const c of copies) {
  const h = hookType(c.primary);
  hooks[h].count++;
  hooks[h].examples.push(sentences(c.primary)[0]);
}
for (const h of HOOKS) { hooks[h].share = share(hooks[h].count, copies.length); if (!hooks[h].count) delete hooks[h]; }
const per = copies.map((c) => ({ c, m: measure(c.primary) }));
const hedgeEff = per.reduce((n, x) => n + (x.m.hedge?.efficacy_sentences || 0), 0);
const hedged = per.reduce((n, x) => n + (x.m.hedge?.hedged || 0), 0);
const lineWith = (re, c) => sentences(c.primary).find((s) => re.test(s));
const headlineLines = [...new Set(copies.flatMap((c) => c.headline_lines))];
const buttons = {};
for (const a of brandLong) if (a.button) buttons[a.button.toLowerCase()] = (buttons[a.button.toLowerCase()] || 0) + 1;
const inText = {};
for (const c of copies) for (const p of ctaPhrases(c.primary)) inText[p] = (inText[p] || 0) + 1;

const ad_copy = {
  source: `research/minimalist_top_ads/${capFile} (Meta Ad Library, page Minimalistinc, India, active ads, captured ${cap.captured} with Playwright, text only)`,
  cards_on_page: all.length,
  used: { ads: brandLong.length, distinct_copies: copies.length, video_ads_used_for_wording_only: brandLong.filter((a) => a.video).length, static_ads: brandLong.filter((a) => !a.video).length, days_running: { min: Math.min(...brandLong.map((a) => a.days)), max: Math.max(...brandLong.map((a) => a.days)) } },
  excluded,
  sentence_words: { n: sentW.length, mean: r1(sentW.reduce((a, b) => a + b, 0) / sentW.length), median: median(sentW), p25: quantile(sentW, 0.25), p75: quantile(sentW, 0.75) },
  primary_text_words: { median: median(copies.map((c) => words(strip(c.primary)))), min: Math.min(...copies.map((c) => words(strip(c.primary)))), max: Math.max(...copies.map((c) => words(strip(c.primary)))) },
  hook_types: hooks,
  ingredient_first: { share: share(copies.filter((c) => ingredientFirst(c.primary)).length, copies.length), examples: copies.filter((c) => ingredientFirst(c.primary)).map((c) => sentences(c.primary)[0]) },
  names_an_active_or_pct: share(copies.filter((c) => mentionsActive(c.primary)).length, copies.length),
  hedged_efficacy: { efficacy_sentences: hedgeEff, hedged, share: share(hedged, hedgeEff), hedged_examples: per.flatMap((x) => sentences(x.c.primary).filter((s) => /\b(help|visibly|designed to|support)\w*/i.test(s))).slice(0, 6) },
  second_person_per_100w: per100(per.reduce((n, x) => n + (x.m.second_person_per_100w * x.m.words) / 100, 0), pw),
  emoji: { per_100w: per100(emojiCount(primaryAll), pw), ads_with_any: copies.filter((c) => emojiCount(c.primary) > 0).length, of: copies.length, examples: copies.filter((c) => emojiCount(c.primary)).map((c) => lineWith(/\p{Extended_Pictographic}/u, c)) },
  exclamation: { per_100w: per100(exclamationCount(primaryAll), pw), ads_with_any: copies.filter((c) => exclamationCount(c.primary) > 0).length, of: copies.length, examples: copies.filter((c) => exclamationCount(c.primary)).map((c) => lineWith(/!/, c)) },
  hype: { per_100w: per100(hypeHits(primaryAll).length, pw), words: hypeHits(primaryAll), examples: copies.filter((c) => hypeHits(c.primary).length).map((c) => lineWith(new RegExp(hypeHits(c.primary)[0], "i"), c)) },
  fear: { per_100w: per100(fearHits(primaryAll).length, pw), words: fearHits(primaryAll), examples: copies.filter((c) => fearHits(c.primary).length).map((c) => lineWith(new RegExp(fearHits(c.primary)[0], "i"), c)) },
  cta: { buttons, in_text: inText },
  headline_lines: { median_words: median(headlineLines.map(words)), max_words: Math.max(...headlineLines.map(words)), examples: headlineLines },
  copies: copies.map((c) => ({ ids: c.ids, started: c.started, days: c.days, video: c.video, hook: hookType(c.primary), opener: sentences(c.primary)[0], headline_lines: c.headline_lines })),
};

// ---------- the numbers the scorer compares against ----------
const targets = {
  image_words_single_max: on_image.words_per_image.single_images.max,
  image_words_single_median: on_image.words_per_image.single_images.median,
  image_words_card_max: on_image.words_per_image.carousel_cards.max,
  title_words_max: on_image.title_words_single_images.max,
  title_words_median: on_image.title_words_single_images.median,
  tags_max: on_image.tags_per_image.max,
  sentence_words: { median: ad_copy.sentence_words.median, p25: ad_copy.sentence_words.p25, p75: ad_copy.sentence_words.p75 },
  exclamation_per_100w: r1(Math.max(on_image.exclamation_per_100w, ad_copy.exclamation.per_100w)),
  emoji_per_100w: ad_copy.emoji.per_100w,
  hype_per_100w: ad_copy.hype.per_100w,
  fear_per_100w: ad_copy.fear.per_100w,
  opener_names_active_share: share(titles.filter((t) => mentionsActive(t.text)).length + copies.filter((c) => ingredientFirst(c.primary)).length, titles.length + copies.length),
  // Reported, and used only as a floor: the brand's live Meta copy hedges few outcome lines, while its house style
  // (and LNG-04) asks for the hedged form, so an ad is never marked down for hedging MORE than the brand does.
  hedged_share: ad_copy.hedged_efficacy.share,
  hook_shares: Object.fromEntries(Object.entries(hooks).map(([k, v]) => [k, v.share])),
};

const profile = {
  built: new Date().toLocaleDateString("en-CA"),
  brand: "Minimalist",
  how_to_read: "Measured, not written: every number comes from Minimalist's own Meta ads that were still running after 30+ days. 'targets' are what lib/tiers.js compares a new ad with (alignment score). Rates are per 100 words. Hype and fear words use the rulebook's own TON-02 / TON-01 patterns. The brand's live copy is not perfect: where it uses fear hooks or hype ('Tired of…', 'Say goodbye to…', 'unlock'), the profile records it honestly; the tone rules still flag those lines, because the rules side with the brand's stated philosophy (no fear, no fluff).",
  rebuild: "node scripts/build_meta_voice.js",
  on_image,
  ad_copy,
  targets,
  caveats: [
    `Small sample: ${on_image.ads} static ads (${on_image.images} images) and ${copies.length} distinct brand-authored copies. Treat the numbers as a direction, not a law.`,
    "'Still running after 30+ days' is a proxy for 'worked': Meta keeps spending on ads that perform, but an ad can also run because nobody switched it off.",
    "On-image text was read by eye from 600 px images; small print may be slightly off.",
    "Meta shows one version of a multi-version ad; the copy captured is the version shown (e.g. two statics of the Alpha Lipoic cleanser carry the Zepto Salicylic copy of their sibling version).",
    "Video ads contribute wording only. Their visuals are never used (user rule 2026-10-04).",
  ],
};
fs.writeFileSync(OUT, JSON.stringify(profile, null, 1) + "\n");
console.log(`meta_voice_profile.json: ${on_image.ads} statics (${on_image.images} images, ${on_image.words_per_image.single_images.min}-${on_image.words_per_image.single_images.max} words on single images, median ${on_image.words_per_image.single_images.median}) · ${copies.length} distinct copies from ${brandLong.length} long-running brand ads (${excluded.creator_partnership} creator, ${excluded.under_30_days} under 30 days excluded)`);
console.log(`sentence ${ad_copy.sentence_words.median} words (median) · opener names an active ${targets.opener_names_active_share} · hedged ${ad_copy.hedged_efficacy.share} · ! ${targets.exclamation_per_100w}/100w · emoji ${ad_copy.emoji.per_100w}/100w · hype ${ad_copy.hype.per_100w}/100w · fear ${ad_copy.fear.per_100w}/100w`);
console.log(`hooks: ${Object.entries(hooks).map(([k, v]) => `${k} ${v.count}`).join(", ")}`);
