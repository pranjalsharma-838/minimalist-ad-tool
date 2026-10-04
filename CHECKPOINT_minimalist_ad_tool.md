# CHECKPOINT: Minimalist Ad Desk

## 2026-10-04 LATEST
- **Ingredient lockup** in the pack-label style (bold active, the pack's accent-colour line, light %) on hero, offer and socialproof ads, on ingredient ads and under each pack in routines and ranges; also in the app.
  - Rule: `lib/brief_check.js` `lockupFor` / `itemLockup`.
  - Colours: `brand_packs/minimalist/assets/accent_colours.json`.
- **"Hide Nothing."** accepted by the user: judge findings on brand taglines are marked accepted (`lib/score.js`). "Skin Science" is allowed as a tag.
- **Trending #10** rebuilt as a lifestyle shot with a Skin Science tag (Severe: a model).
- **Library:** 95 ads / 289 PNGs, 51 not exportable; 95/95 within budget. Commits: 104; tests 47/47.
- **Answered:**
  - sunscreen top 5 = offer, routine bundle, clean product shot, benefit badges, product-in-hand (Severe);
  - gap list (real photos, live key run, texture shots, white-pack cut-outs, app format picker, Meta export, refresh schedule, video/carousels, results loop, second brand).
- **Open:** GitHub push when the user logs in (rebuild the clean copy first).

## 2026-10-04 LATER (superseded by LATEST above)
- **Trending now:**
  - `scripts/build_trending.js` reads 33 of 34 recent competitor statics confirmed live (`research/competitor_status_2026-10-04.json`) and finds 7 formats with 2+ brands launched in the last 60 days;
  - run `2026-10-04-trending` holds 7 ads, one per product (2 Severe: before/after, split-screen);
  - judge round 1 + round 2 fixes; the gallery opens with a Trending section.
- **App:**
  - Claude API key box (memory only, checked against Anthropic, local requests only) plus `.env.example`;
  - the background takes the pack photo's colour; long subheads go to the caption.
- **Timing:** `scripts/time_products.js` gives 10 products in 33.7 s without a key (3.4 s/ad). The library pipeline timing (7 products) is in `results/timing_2026-10-04.md`.
- **Docs:** README is 15 lines; SUBMISSION is short and plain (668 words); DECISIONS is one page (728 words).
- **Transcript:** login-detail messages removed (whole or part, with a note). The user's request to expand short prompts without disclosure was declined; grammar-only corrections stay disclosed.
- **Library:** 95 ads, 50 not exportable; 95/95 within the text budget. Tests 47/47. Commits: 99.
- **GitHub (not required by the brief; a zip of the clean copy also works):** the user will log in later. Before pushing, rebuild the clean copy (fast-export → `sanitize_stream.mjs` → fast-import, fast-forward `Desktop\minimalist-ad-tool-github`), then push in steps under 2 GB.

## 2026-10-04 STYLE OVERHAUL (latest; supersedes the sections below)
User reviews on 2026-10-04:
- **"are we making sure brand tone and style is followed"** → added `scripts/style_check.js`. On-image text budget: ≤ 20 words (30 for lists), headline ≤ 8 words (study-quote headlines exempt), footnote ≤ 2 lines.
- **"show me minimalist top runners"** → gallery at `research/minimalist_top_ads/index.html`.
- **"us vs them is missing, hide nothing tg is missing"** →
  - new layout `usvsthem` (template #17, claim risk High) and run `2026-10-04-usvsthem` (7 ads);
  - the independent judge flagged all 7: 1 block (Alpha Arbutin: "melanin reduction" reads as skin lightening) and 6 fix. All kept with warnings;
  - CLM-12 extended (vs / unlike X / higher than); eval unchanged (88%);
  - "Hide Nothing." sign-off drawn under the wordmark (`SIGN_OFF` in `render.js`, scored in `adFromBrief`).
- **"from meta we were supposed to scrape statics and not videos, for competitor as well as ours"** →
  - video ads are ignored in `archetype.js`, `00_product_run.js` and `build_trends.js` (6 Plum video winners);
  - Minimalist's own reference re-scraped: 8 statics / 11 images (52–98 days); 10 video covers moved to `excluded_video_covers/`; style guide rewritten from statics. Finding: the statics show hands only, no faces;
  - 3 scale briefs re-sourced (t30, t31 keep their creator image; t44 portrait dropped, now low risk).
- **"much cleaner than ours … whenever models are used the risk is severe, keep those … design should be minimalistic"** →
  - renderer redesigned: white canvas (or the pack photo's studio grey `#E5E9EA` for white packs without a cut-out, `assets/studio_bg.json`); no scene backgrounds or panels; big pack; title + product name + one grey line; quiet underlined "Shop now →"; small lockup with "Hide Nothing.";
  - `leanBrief` moves actives lines, prices, offer subheads and long subheads to the caption;
  - `scripts/apply_style_edits.js` + `prompts/style_editor.md`: cuts only, code-validated. 21 edits applied, 0 refused → **88/88 within budget**;
  - any model is Severe: `05_compliance` floor, `risk.js` people/endorser, compose, `scripts/apply_model_risk.js` (27 raised).
- **Bug fixed:** footnotes past 2 lines were silently cut; `layoutProblems` now flags them.
- **Tests:** 47/47 (new `tests/minimal_style.test.js`).
- **Done (2026-10-04, ~02:30 IST):**
  - all 6 runs re-rendered;
  - eye-checked (fixes: white frame/grey boxes, comparison bases kept on the creative, Vitamin C "86% pure" callout cut);
  - library 88 ads / 268 PNGs, 48 not exportable (gallery reads compose summaries), 40 with AI models, all Severe;
  - `research/style_compare.png` (statics vs ours);
  - docs updated (SUBMISSION, DECISIONS, ARCHITECTURE, RUNBOOK, FAILURE_MODES, README);
  - diagram regenerated.
- **Transcript:** the exporter dropped 40 mid-task user messages (queued_command attachments); fixed in `1ffd766`. Grammar corrections added (104 total); START_HERE +5 agent mistakes, +4 pushbacks.
- **Commits:** `ab5f8f2` (code), `1ffd766` (transcript fix), then outputs + docs.
- **GitHub (2026-10-04):**
  - clean history rebuilt (deterministic: the published part reproduces as `64c6419`); 3 new commits `b247867`, `967dc48`, `c8831fe` fast-forwarded into `Desktop\minimalist-ad-tool-github`, remote origin set;
  - scanned 3.8 GB: 0 client names, 0 internal emails;
  - **push not done:** this shell can't show the GitHub sign-in. The user runs from their own terminal (stays under GitHub's 2 GB per-push limit):
    `git push origin 27089c2:refs/heads/main`
    `git push origin 64c6419:refs/heads/main`
    `git push -u origin main`
- **DeepSeek:** follow-up sent 2026-10-04 (tab 1, chat "Assignment Review Request"); read only its new reply.
- **Memory:** project + 2 feedback files updated/added (statics only; minimal design, models Severe).

## FINAL STATE 2026-10-03 ~23:45 (superseded by the 2026-10-04 section above)
- **External review (DeepSeek, "Shortlist") applied to the essentials:**
  - eval provenance plus an OOD set (frozen: 81% recall, 0 missed blocks);
  - catalog checks scoped to Minimalist's own ads;
  - decision doc: rule split, scope, ad-type mechanics;
  - submission leads with the standard;
  - transcript "start here" index.
- **User review rounds:**
  - every product × every angle (23 ads);
  - AI people in place of placeholders;
  - clear product and CTA;
  - a people pack (lifestyle, usage, routine journey) with balanced Indian casting;
  - existing AI people recast.
- **Library:** 81 ads (41 with AI people), 247 PNGs; gallery at `ad_library/index.html`. Tests 41/41.
- **GitHub:** private repo github.com/pranjalsharma-838/minimalist-ad-tool. The clean copy is built by streaming fast-export, then the sanitiser (scratchpad `sanitize_stream.mjs`), then fast-import into `Desktop\minimalist-ad-tool-github`. That gives 0 client names, 0 emails, and the no-reply identity `82684542+pranjalsharma-838@users.noreply.github.com`.
- **Open on the user's side:** change the two passwords shared in chat; optionally add an Anthropic API key in `.env` (live judge). After the push, send a follow-up to DeepSeek. (updated 2026-10-03, later)

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

## WRAP-UP STATE 2026-10-03 ~12:50 (user: finalise submission, run on another device)
- **Submission docs done:** `docs/SUBMISSION.md` (mapped to the brief), README (new-device setup), DECISIONS, FAILURE_MODES, eval/README, redacted `docs/TRANSCRIPT.md` (verified 0 secrets; the user should still change the ChatGPT password).
- **Pilot DONE:** 8 ads × 3 sizes + hi/ta for 2, in `ad_library/`.
- **Scale backgrounds:** generating by a Playwright batch (in-app New chat + reload-if-not-ready). Prompts are served by `python -m http.server 8765` from `pipeline/runs`. When done: `08_compose.js 2026-10-03-scale` → `08b_png.js` → eye-check contact sheets → `09_library.js`.
- **Transformation journey:** run `2026-10-03-transformation` (brief kept with warnings, severe, AI label). Needs a 3-panel skin image from ChatGPT → split into `backgrounds/salicylic-acid-2__t14.frame1..3.png` → compose.
- **Junk clean-up:** the user wants to discuss it later; nothing deleted.

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
