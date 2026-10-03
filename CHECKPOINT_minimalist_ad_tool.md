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

## PROGRESS 2026-10-03 from 07:40 (latest at top)
- **Pilot:** 8/8 pass rules + judge; 8 director prompts clean (`director/`, `chatgpt_prompts.md`).
  - **BLOCKED:** ChatGPT is not logged in. Asked the user to log in (Google sign-in); never type passwords.
- **Fixed:**
  - CLM-16 "buying";
  - finalize stale-version bug (judged versions first);
  - badge overflow;
  - shadow/cut-out compositing;
  - 4:5 + 9:16 inset-card placements;
  - 08b PNG via headless Edge;
  - judge schema saved for stand-ins.
- **Add-ons done (v1):**
  - (a) blend 3 winners + angle balancing;
  - (c) `scripts/results_ingest.js` + `results/ledger.csv` → archetype scoring;
  - (d) situation-first angle;
  - (e) auto social proof;
  - (f) `scripts/collect_marketplace_reviews.js` (Amazon best-seller competitors, `research/competitor_map.md`) + `scripts/mine_customer_language.js` → `research/customer_language.*` (concern map). Flipkart markup not parsed; Nykaa 403;
  - (g) `lib/lang_check.js`, `prompts/translator.md`, `pipeline/05c_translate_check.js`, Indic fonts;
  - (h) `scripts/reg_watch.js` → `research/reg_watch.md`.
- **Scale run** `2026-10-03-scale`: 7 products × 4 = 28 inputs (21 formats). Next: brief writer → gate → judge → retry → finalize → director, then images once logged in.
- **Open-problem notes:**
  - "acne safe" badge on the SPF t2 brief needs a human check;
  - own-listing ASINs from the offers search are sometimes wrong (4–58 ratings);
  - white cast is our own sunscreen's top complaint (7 of the ≤3★ reviews).

## WORK ORDER from the user (2026-10-03 03:31). Start at 07:40, in this order. Few parallel agents (conserve tokens); scripts over agents.
1. **Existing tasks:**
   - fix the CLM-16 false flag;
   - finish the pilot: judge → director → backgrounds → compose → eye-check → library with descriptions;
   - audit;
   - scale to the top 7 products × 4–5 formats;
   - final problem write-up.
2. **Add-ons (user list):**
   a. **Mix ideas instead of copying:** each concept blends 2–3 proven competitor ads (winners.json); a balancing step keeps format/angle variety even across the library.
   b. **Every claim traces to a source** (already the gate); the pack shot is composited, never AI-drawn (already the rule). Keep both and show them in the per-ad description.
   c. **Learn from our own results:** score each ad by hook/angle/format. Competitor ads only show what works for THEM, so add a results ledger (hook, angle, format, spend, CTR, ROAS) that feeds back into archetype ranking once our ads run.
   d. **Situation-first concepts** (a moment or context: morning rush, commute, humid day, gym, before makeup) as an angle type.
   e. **Social proof added automatically wherever suitable:** real RATING/REV facts as a badge or footnote; never rounded; verbatim.
   f. **Customer-language mining from Nykaa, Amazon.in and Flipkart reviews**, by script where possible: the words customers use, concerns that get solved (feeds the concern-angle ads).
   g. **Hindi + regional-language versions** with the same compliance (rules must run on the translated text; disclaimer in the same language, per CCPA-11).
   h. **Regulatory watch:** the ASCI rule on AI-generated content (Dec 2026) and CDSCO notices. Add both to the sources and rules; a periodic check.
3. **Then:** the open problems (FAILURE_MODES, deferred collectors, image-pipeline gaps: shadow/light match, 4:5 + 9:16).
4. **Then:** a quick look at architecture changes, plus a junk clean-up (old runs, scratch files, superseded scripts). Ask before deleting anything not clearly junk.

## After the pilot
- Audit findings → fixes.
- Scale to the top 7 products (top20.json order) × 4–5 formats.
- Final write-up (problem / proposed solution / approach / goal for every problem).
- Update README, DECISIONS and ARCHITECTURE; add eval/README.md.

## Deferred (conserving tokens)
Amazon best-seller competitor search, Flipkart, Instagram, Amazon 11–20, deep Meta, Google Ads Transparency, global trend sources.
