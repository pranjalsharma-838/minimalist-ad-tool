# Submission: Minimalist Ad Creative Tool

Mapped point by point to the original brief, for evaluation. Minimalist is the test brand used to build and prove the pipeline. Nothing is published; every creative carries an "INTERNAL TEST" mark.

## Part A: product URL → finished visual ad

| Requirement | What exists | Where / how to check |
|---|---|---|
| Paste a product URL, get a finished ad | App: URL → page facts → copy (every line cites a page fact) → composed 1080×1080 ad with the **real pack shot**, pre-screened before export | `npm start`, then http://localhost:5173 |
| At scale: an ad library | Pipeline: format choice (48 types) → cited brief → compliance loop → background prompt → AI background → real pack shot composited with shadow → PNG in 1:1, 4:5, 9:16 (+ Hindi/Tamil) → library with a description per ad | `pipeline/RUNBOOK.md`; output in `ad_library/INDEX.md` |
| Grounded in the real brand | Brand pack from the website + Amazon (catalog, 294-claim matrix, house style), 118 real gallery images, 13 clean cut-outs | `brand_packs/minimalist/` |
| Grounded in what works in the market | 74 competitor ads from 10 Indian brands tagged to 48 formats. 57 are "winners" (running 30+ days). Each concept blends 3 winners, never copies one | `research/winners.md`, `research/template_library.md` |
| Real, current commercial data | Live prices, MRP and offers ("Buy 2, Get 3rd Free", "Upto 33% OFF + Freebies", "Build Your Own Bundle…") captured by script with a date; real star ratings and verified reviews | `scripts/collect_offers.js`, `scripts/collect_reviews.js` |
| Customer language | Amazon.in best-seller competitors (5 per product type) + reviews mined into concerns; concern ads only where our page answers the concern | `research/competitor_map.md`, `research/customer_language.md` |

**Produced in this submission:**
- **Pilot:** 8 ads (2 products × 4 formats) × 3 sizes, plus Hindi and Tamil versions of 2 ads, all composed and checked by eye.
- **Scale run:** 7 products × 4 formats = 28 briefs across 21 different formats, all passed by the rules and the AI judge. Their backgrounds are generating; the finals are composed as each background lands.
- **Transformation-journey example:** Day 1 → Week 2 → Week 4, rated **Severe** and carrying the AI label. It's not exportable until real study photos replace the AI frames.

## Part B: score any ad on policy/claims, brand tone and brand language

| Requirement | What exists | Where / how to check |
|---|---|---|
| Any ad, any source | Paste text or upload an image; the ad type (brand / creator / competitor) adjusts the tone rules but never the legal ones | App, scoring surface; `lib/score.js` |
| Policy and claims | 43 rules (drug claims, statistics, timeframes, SPF accuracy, fairness, offers and discounts under CCPA/ASCI, influencer disclosure…), each sourced to 66 verified regulatory references | `rules/brand_rules.json`, `research/regulatory_sources.md` |
| Brand tone and language | Rules derived from Minimalist's stated philosophy and observed copy (concentration-led, no emoji, no fear or hype) | Same rulebook, `dimension` field |
| An AI judge for implied claims | The judge adds findings but can't remove rule hits; quotes are verified against the ad; the verdict is computed by code; the best verdict is "Ready for human review" | `lib/judge.js`, `prompts/scorer_system.md` |
| Evidence it works | 49 independently labelled cases: rules + judge caught 92% of flagged phrases (rules alone 62%), with 1 missed block | `eval/README.md`, `eval/results/summary.md` |

## Deliverables

| Deliverable | Status | Where |
|---|---|---|
| Working app | ✅ Node only, no packages to install; runs on Windows, macOS and Linux | `README.md` (setup on a new device) |
| Commit history | ✅ 70+ commits, each a readable step | `git log` |
| Transcript | ✅ Redacted (emails, passwords, keys removed; verified 0 left) | `docs/TRANSCRIPT.md`, `scripts/export_transcript.js` |
| Prompts as files | ✅ All 9: scorer (system + user), brief writer, image prompt director, translator, generator (system + user), tagger, transcriber | `prompts/` |
| One-page decision doc | ✅ | `docs/DECISIONS.md` |
| Failure-modes list | ✅ 3 main modes + evidence seen in the pilot | `docs/FAILURE_MODES.md` |
| Architecture + run order | ✅ including a diagram of every agent, script and check | `docs/pipeline_diagram.png`, `docs/ARCHITECTURE.md`, `pipeline/RUNBOOK.md` |

## Extras added during the build (user requests)

Risk levels (formats never removed), a retry loop that keeps the best judged version, archetype skill, asset library with cut-outs, image prompt director, blended concepts and balanced angles, situation-first concepts, automatic social proof, an own-results ledger that feeds format choice, offer/discount rules, Hindi/regional versions with their own compliance checks, a regulatory watch (ASCI AI-content rule, CDSCO), 4:5 and 9:16 placements, and script-first data capture (token-light).

## Known limits (honest)

- **No API keys:** the AI judge, brief writer and director were run by Claude agents receiving the exact production prompts. Backgrounds come from ChatGPT in a browser the user logs into.
- **The judge is inconsistent across runs** on page wording such as "reduces sebum", so human review stays mandatory (`FAILURE_MODES.md`).
- **Data gaps:**
  - Flipkart reviews aren't parsed and Nykaa blocks scripts, so customer language comes from the website + Amazon.
  - Minimalist's own Amazon listing match is sometimes the wrong listing.
- **Severe formats** (before/after, transformation journey) need real consented study photos before any use.
- **India-first rules:** Running the pipeline for a US brand or market needs a US rule set (FTC/FDA, TikTok Shop, Amazon) before going live.
