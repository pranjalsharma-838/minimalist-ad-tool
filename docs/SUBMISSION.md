# Minimalist Ad Desk

A tool that turns a product page into a ready-to-review static ad, and checks any ad (ours, an agency's, a competitor's) for risky claims and for whether it sounds and looks like the brand. Minimalist is the test brand. Nothing has been published, and every image carries an "internal test" mark.

**To try it:** run `npm start`, open http://localhost:5173 and paste your Claude API key in the box at the top right. Without a key it still runs: copy comes word for word from the product page and only the rule checks run.

## The part I'd ship first: the checker

- **43 rules** come from Indian advertising law and platform policy (66 sources, 60 checked against the original text) and from how Minimalist actually writes. Legal problems block an ad or need a fix. Voice problems only advise, because an off-brand line costs a rewrite while an illegal claim costs a recall.
- **An AI judge** reads every ad too. It can add problems but never clear one the rules found, and the final verdict is decided in code. The best an ad can get is "Ready for human review", never "approved".
- **How well it works:** an independent reviewer labelled ads blind. The checker caught 90% of the phrases they flagged on held-back ads, and 81% on 12 ads from 10 brands it had never seen, with no missed blocks. Its main mistake is being too strict, not too lenient (details in `eval/README.md`).
- **Caveat:** no API key was available during the build, so the AI judge was played by Claude agents given the exact same prompt. `npm run eval` re-runs it live once a key is added.

## Making ads

- **From a product link:** the app reads the page and writes copy where every line traces back to it. It puts the real product photo on a clean layout and checks the result. You can edit and re-check, then download the PNG with a review note. Timed on 10 products: about 3–4 seconds each without a key (`results/timing_2026-10-04.md`).
- **The ad library** (`ad_library/index.html`) shows what the full pipeline makes: 95 ads across Minimalist's 7 best sellers, every angle for every product, in three sizes, a few in Hindi and Tamil.
- **The look** comes from Minimalist's own longest-running static ads: white background, the product big, about 15 words on the image, details in the caption, and its "Hide Nothing." sign-off.
- **The ideas** come from competitor ads that have run for over 30 days, blended so nothing is copied.
- **Trending now:** a section for formats at least two brands launched in the last two months and are still running, each recreated Minimalist's way.
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
- **Brand and legal answers (4 Oct):** comparison ads are in, and acne wording is fine on a cosmetic. Both are recorded in `rules/brand_decisions.json` and applied automatically. The 7 comparison ads still can't be exported until someone attaches the proof behind each comparison.
