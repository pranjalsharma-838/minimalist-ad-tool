# Pipeline architecture (agreed 2026-10-03; updated after the pilot + add-ons, and on 2026-10-04 for the brand's static house style)

Test brand: Minimalist. Once proven, the pipeline runs for any brand by swapping the brand pack. The step-by-step run order is `pipeline/RUNBOOK.md`.

```
              ┌──────────── live data (scripts, no browser) ────────────┐
              │ offers + prices · real reviews + rating · competitor     │
              │ reviews (Amazon best sellers) · customer concerns        │
              └───────────────┬──────────────────────────────────────────┘
request ─► [1 Brand context] ─┴► [2 Winners] ─► [3 Trends] ─► [4 Archetype skill] ─► [5 Brief writer] ⇄ [6 Scorer] ─► [7 Image prompt director] ─► [8 Image generation] ─► [9 Compose + re-check] ─► [10 Ad library]
                                                  ▲   ▲            │ blend 3 winners           │ rules + AI judge        │ background only                │ real pack shot + shadow,
                     [Asset library] ─────────────┘   │            │ balanced angles           │ retry ≤3, best kept      │                                │ 1:1 · 4:5 · 9:16, languages
                     [Own results ledger] ────────────┘            └ auto social proof          └ language versions (5c)
                     [Regulatory watch] ──► rules + sources (human reads new items)
```

| # | Layer | Kind | Inputs → output | Status |
|---|---|---|---|---|
| 1 | Brand context | Agent `minimalist-brand-context` | brand pack → facts with ids, claims status, house style | Built (website + Amazon top 10; Flipkart/Instagram not captured) |
| L | Live data | Scripts: `collect_offers.js`, `collect_reviews.js`, `collect_marketplace_reviews.js`, `mine_customer_language.js` | site/Yotpo/Amazon → PRICE*, OFFER*, RATING, REV* facts; competitor map; concern map | Built (Nykaa 403, Flipkart markup unparsed) |
| 2 | Winners | Winner agent → `research/winners.json` | 74 competitor ads → template tags, 57 winners (30+ days); **statics only** count (51 winners): the 6 video winners are ignored by the code (user rule 2026-10-04) | Built |
| 3 | Trends | `scripts/build_trends.js` | winners → winner share + breadth per format | v1 (India Meta only) |
| 3b | Trending now | `scripts/build_trending.js` + a live-status check | competitor statics started in the last 60 days, still running, grouped by format; kept when ≥ 2 brands → recreated in Minimalist's style (run `<date>-trending`), shown first in the gallery | Built (7 formats on 2026-10-04) |
| A | Asset library | Agent `minimalist-asset-library` | galleries → labelled assets, 13 clean cut-outs | Built |
| R | Own results | `scripts/results_ingest.js` + `results/ledger.csv` | our ad results → score per format/angle/hook; 35% of the archetype score once a format has ≥ 3,000 impressions | Built, waiting for live data |
| 4 | Archetype selection | Skill + `lib/archetype.js` | winners, trends, facts, objective, own results, variety penalty → ranked shortlist with risk. Never removes a format | Built |
| 5 | Brief writer | Agent role, `prompts/pipeline_brief_writer.md` | input (blend of 3 winners, balanced angle incl. situation-first/concern, social proof) → cited brief | Built |
| 6 | Scorer | `lib/rules.js` (43 rules incl. OFR-01..04 offers) + AI judge + brand/legal answers (`rules/brand_decisions.json`, applied by `lib/decisions.js`) | brief → findings → retry loop; finalize keeps the best *judged* version | Built |
| 6s | Style fit | `scripts/style_check.js` + `prompts/style_editor.md` + `scripts/apply_style_edits.js` | brief → on-image text budget from the brand's own top-running statics (0–15 words, ≤ 8-word title, ≤ 2 footnote lines); edits may only cut, code refuses new words | Built (88/88 within budget) |
| 6b | Language versions | `prompts/translator.md` + `lib/lang_check.js` | approved brief → hi/ta/te/bn/mr; back-translation rules, numbers lock, native risk words, same-language disclaimer; a fluent human signs off | Built (pilot hi+ta pass) |
| 7 | Image prompt director | Agent role, `prompts/image_prompt_director.md` + `06c_prompts.js` re-check | brief + zones → background-only prompt | Built; optional since the minimal look draws no scene backgrounds |
| 8 | Image generation | ChatGPT via browser (user logs in) or `lib/image_api.js` with an OpenAI key | person / frames prompt → AI model image (Severe, AI mark) | Built (browser) |
| 9 | Compose | `08_compose.js` + `08b_png.js` (headless Edge) | minimal house layout: white canvas (or the pack photo's own studio grey), real cut-out with shadow, title + one grey line, quiet CTA, "Hide Nothing." sign-off → PNG in 3 sizes + languages; rules re-check | Built |
| 10 | Ad library | `09_library.js` | finals → `ad_library/<product>/<format>/` with a description per ad | Built |
| W | Regulatory watch | `scripts/reg_watch.js` | ASCI + CDSCO pages → new items to read (ASCI AI-content rule expected Dec 2026) | Built |

## Rules agreed

- **Winner** = a competitor ad still running after **30+ days**. Competitors per SKU type = Amazon.in best sellers, first 5 non-Minimalist (`research/competitor_map.md`).
- **Nothing is removed.** Every format is ranked. Formats that need assets we don't have are still made, with a risk level and the suggestion to use real photos.
- **Risk levels:** Low / Medium / High / Severe (`lib/risk.js`). **Any model (AI person, hands or skin frames) makes an ad Severe** (user rule 2026-10-04): kept for review, never exportable until real, consented photos replace it. Comparisons (Us vs Them) are High by default.
- **House style = the brand's own top-running static ads** (`brand_packs/minimalist/ad_style_top_runners.md`): Meta evidence is statics only, for competitors and the brand. White canvas, product as the hero, 0–15 words on the image, details in the caption.
- AI-generated people, skin or results always get a visible **"AI-GENERATED — ILLUSTRATIVE"** mark.
- **The product is never generated.** The real pack shot or its cut-out is composited by the tool, large and in front, including on ads with AI-generated people (balanced Indian women and men, always marked).
- **Every claim traces to a source:** page facts, dated offer captures, verbatim reviews. Offers are quoted exactly with the capture date and "T&C apply". Reviews are quoted verbatim, verified buyers only, with negative/mixed wording filtered out.
- **Blend, don't copy:** each concept takes one element from each of 3 winners. Angles are balanced across a run.
- **SPF:** the labelled SPF 50 is the claim; lab results go in the footnote unless lab results are the brief's main theme.
- **Retry loop:** up to 3 rounds. A flagged claim is removed or replaced, never reworded. The best version is always kept.
- **Scripts over agents** wherever a page or feed can be read directly (token cost).

## Explicitly out of scope (user decision)

Voice-editor pass, pixel re-check, separate selection stage. Other brands and markets (US rules, a new brand pack, TikTok Creative Center) come after the Minimalist test works.
