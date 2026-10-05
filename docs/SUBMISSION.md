# Minimalist Ad Desk

A tool that turns a product page into a ready-to-review static ad, and checks any ad (ours, an agency's, a competitor's) for risky claims and for whether it sounds and looks like the brand. Minimalist is the test brand. Nothing has been published, and every image carries an "internal test" mark.

**To try it:** run `npm start`, open http://localhost:5173 and paste your Claude API key in the box at the top right. Without a key it still runs: copy comes word for word from the product page and only the rule checks run.

## The part I'd ship first: the checker

- **43 rules** come from Indian advertising law and platform policy (66 sources, 60 checked against the original text) and from how Minimalist actually writes. Legal problems block an ad or need a fix. Voice problems only advise, because an off-brand line costs a rewrite while an illegal claim costs a recall.
- **An AI judge** reads every ad too. It can add problems but never clear one the rules found, and the final verdict is decided in code. The best an ad can get is "Ready for human review", never "approved".
- **How well it works:** an independent reviewer labelled ads blind. The checker caught 90% of the phrases they flagged on held-back ads, and 81% on 12 ads from 10 brands it had never seen, with no missed blocks. Its main mistake is being too strict, not too lenient (details in `eval/README.md`).
- **Caveat:** no API key was available during the build, so the AI judge was played by Claude agents given the exact same prompt. `npm run eval` re-runs it live once a key is added.

## Making ads

- **From a product link:** the app reads the page and writes copy where every line traces back to it. It puts the real product photo on a clean layout and checks the result. Seven layouts: product hero, ingredient focus, benefit badges, study result, customer review (verified reviews captured from the brand site, stars and date kept), question and answer, and texture shot (real texture photos only). A layout the product can't fill honestly is shown greyed out with the reason. You can edit and re-check, then download the PNG with a review note. Timed on 10 products: about 3–4 seconds each without a key (`results/timing_2026-10-04.md`).
- **The ad library** (`ad_library/index.html`) shows what the full pipeline makes: 407 ads across Minimalist's top 20 best sellers plus its underarm roll-on, 17 agreed formats per product plus 2 proof ads built on each page's study or lab figures, all in 1:1, 4:5 and 9:16 (a few in Hindi and Tamil). Every ad carries three scores and an AI judge review: 320 ready for human review, 29 need fixes, 58 blocked (mostly AI result images, which India's new AI-content rule bans even with a label).
- **Product images:** each product's pack and a texture shot were re-rendered in ChatGPT from the brand's own photo, then checked word by word against the real label (automatic comparison plus a visual read), up to 3 rounds. 21 of 21 passed; the AI texture is rated Low risk and keeps an "illustrative" mark.
- **The look** comes from Minimalist's own longest-running static ads: white background, the product big, about 15 words on the image, details in the caption, and its "Hide Nothing." sign-off.
- **The ideas** come from competitor ads that have run for over 30 days, blended so nothing is copied.
- **Trending now:** a section for formats at least two brands launched in the last two months and are still running, each recreated Minimalist's way. A scheduled script re-checks the Meta Ad Library every Monday (about 4 minutes, nothing to install) and reports new launches, stopped ads and trends not yet recreated.
- **Safety:**
  - The product photo is always real, never AI-drawn.
  - Any ad with an AI person or hands carries a visible AI label and is rated Severe, so it can't be exported until real, consented photos replace it.
  - About half the library can't be exported yet, by design.

## The deliverables

| | |
|---|---|
| Working app | `npm start` (Node only, nothing to install) |
| Commit history | `git log`: about 100 small commits, around 23 of them fixes to the agent's own mistakes |
| Transcript | `docs/TRANSCRIPT.md`, which opens with an index of what went wrong and how it was caught |
| Prompts | `prompts/`, including one that rebuilds this pipeline for any brand |
| Decision doc | `docs/DECISIONS.md` |
| Failure modes | `docs/FAILURE_MODES.md` |

## What's still rough

- **The AI judge hasn't run live,** and it isn't fully consistent from run to run, so a person always reviews.
- **Customer-review language** comes from the brand site and Amazon only (Flipkart isn't parsed, and Nykaa blocks scripts).
- **The rules are India-first;** another market needs its own rule set.
- **Texture photos:** the texture shots are AI-rendered beside the verified pack (labelled illustrative). A real texture shoot would replace them; only the oat cleanser has a real one today.
- **New competitor ads are sorted into formats by AI,** so with no key the weekly check lists them as unsorted (this week's 49 were sorted by stand-in agents on the same prompt).
- **Brand and legal answers (4 Oct):** comparison ads are in, and acne wording is fine on a cosmetic. Both are recorded in `rules/brand_decisions.json` and applied automatically. The 7 comparison ads still can't be exported until someone attaches the proof behind each comparison.
