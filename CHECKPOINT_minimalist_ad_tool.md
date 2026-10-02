# CHECKPOINT: Minimalist Ad Desk (updated 2026-10-03, later)

Architecture agreed with the user: `docs/ARCHITECTURE.md`. Step-by-step run order: `pipeline/RUNBOOK.md`. Decisions:
- winner = 30+ days running;
- formats are never removed (risk levels Low/Medium/High/Severe instead);
- the best brief is always kept;
- AI people/results get the "AI-GENERATED — ILLUSTRATIVE" mark;
- SPF 50 is the claim; lab figures go in the footnote unless lab results are the main theme;
- images come from ChatGPT via the browser; the user logs in (never type the passwords).

## Done
- **Brand context** agent + pack; **asset library** (118 images, 13 usable cut-outs).
- **Archetype skill**, now with:
  - template-level winners;
  - product-fit (a generic template scores 0.6 on facts);
  - variety penalty across products.
- **Risk levels**, **retry loop** (proven), **image prompt director** prompt + configs.
- **Winner agent DONE:** `research/winners.json` + `.md`, 74 ads, 57 winners. Offer creative is the top format with 13 winners.
- **Trend file v1 DONE:** `scripts/build_trends.js` → `research/trends.json` + `.md`. The score was fixed: v1 was flat at 0.5 because momentum and longevity are near-complements.
- **20 layouts** in `public/render.js`. The 11 new ones are not yet checked by eye.
- **New scripts:**
  - `pipeline/06c_prompts.js`: re-checks the director's prompts and writes `chatgpt_prompts.md`;
  - `pipeline/09_library.js`: saves to `ad_library/` with a per-ad `.md` description.

## Pilot (in progress): run `2026-10-03-pilot`
- **Products:** niacinamide-10-with-matmarine and multi-vitamin-spf-50, 4 formats each. That gives 6 distinct formats: 36 offer, 38 bundle, 3 ingredients, 1 hero, 2 badges, 4 flat lay.
- **Status:** brief writer agent dispatched (step 2). Next: gate → retry → judge stand-in → finalize → director → 06c → ChatGPT backgrounds → compose → eye-check → 09 library.

## HALTED 2026-10-03 (user: near usage limit). Resume here
- **New since the last update:**
  - Live offers and prices by script: `scripts/collect_offers.js`, 4 exact sitewide offers.
  - Real reviews by script: `scripts/collect_reviews.js` (Yotpo), screened by the rules plus a negative-wording filter in `00_product_run.js`.
  - Rules OFR-01..04 (offers/discounts).
  - 37/37 tests pass. All committed (186441e).
- **Pilot state:**
  - 6/8 briefs approved.
  - Both `*__t36` offer briefs are flagged CLM-16 ("free" without its condition). This is a FALSE flag: the offer sits in `brief.offer.line` "Buy 2, Get 3rd Free", but the finding has an empty field and sentence, so the condition in the same line isn't seen.
  - **Fix next:** in `lib/brief_check.js` `adFromBrief`, check how `offer.line` maps into the ad fields (it's probably passed without a field name), then rerun `05_compliance.js 2026-10-03-pilot`.
- **Then:**
  - judge stand-in (judge_prompts/) → finalize → director (06b) → 06c → ChatGPT backgrounds → compose → eye-check → 09 library.
- **Planned next (user ideas, 2026-10-03):**
  - **Concern-angle ads:** cluster our 1–3★ reviews plus competitor reviews (Shopify/Yotpo feeds via script; Amazon via the Helium 10 review analysis). Map each concern to a page fact that answers it → Problem→Product / FAQ / This-vs-that formats. Never name competitors; cosmetic concerns only.
  - **Image-pipeline gaps to fix first:** a shadow/light match for the composited pack shot, and 4:5 + 9:16 sizes (currently 1080×1080 only).
- **Token rule:** use script-based scraping wherever possible (user, 2026-10-03).

## After the pilot
- Audit findings → fixes.
- Scale to the top 7 products (top20.json order) × 4–5 formats.
- Final write-up (problem / proposed solution / approach / goal for every problem).
- Update README, DECISIONS and ARCHITECTURE; add eval/README.md.

## Deferred (conserving tokens)
Amazon best-seller competitor search, Flipkart, Instagram, Amazon 11–20, deep Meta, Google Ads Transparency, global trend sources.
