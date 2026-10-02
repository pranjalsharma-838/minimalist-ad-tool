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

## After the pilot
- Audit findings → fixes.
- Scale to the top 7 products (top20.json order) × 4–5 formats.
- Final write-up (problem / proposed solution / approach / goal for every problem).
- Update README, DECISIONS and ARCHITECTURE; add eval/README.md.

## Deferred (conserving tokens)
Amazon best-seller competitor search, Flipkart, Instagram, Amazon 11–20, deep Meta, Google Ads Transparency, global trend sources.
