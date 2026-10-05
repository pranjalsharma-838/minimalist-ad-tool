# Minimalist Ad Desk

A tool that turns a product page into a ready-to-review static ad, and checks any ad (ours, an agency's, a competitor's) for risky claims and for whether it sounds and looks like the brand. Minimalist is the test brand. Nothing has been published, and every image carries an "internal test" mark.

**To try it:** run `npm start`, open http://localhost:5173 and paste your Claude API key in the box at the top right. Without a key it still runs: copy comes word for word from the product page and only the rule checks run.

## The part I'd ship first: the checker

- **44 rules** come from Indian advertising law and platform policy (66 sources, 60 checked against the original text) and from how Minimalist actually writes. Legal problems block an ad or need a fix. Voice problems only advise, because an off-brand line costs a rewrite while an illegal claim costs a recall.
- **An AI judge** reads every ad too. It judges strictly against the rulebook: it can add a problem only by citing one of the 44 rules, never clears one the rules found, and anything it raises outside the rules is shown as an advisory note that can't change the verdict. The final verdict is decided in code.
- **No silent approvals:** before any download, a named reviewer ticks every line on the image and in the caption as checked against its source. The review ticket records who signed and which lines.
- **Claims from the brand's own listing are treated one step more leniently** (brand decision, 5 Oct): the brand has already published them, but a reviewer still confirms the proof is on file. The ad shows which listing line each claim came from. Legal can keep any claim type at full severity by adding it to one list in `lib/rules.js`. The best an ad can get is "Ready for human review", never "approved".
- **How well it works:** an independent reviewer labelled ads blind. The checker caught 90% of the phrases they flagged on held-back ads (the rules alone caught 52%; the rest came from the AI judge), and 81% on 12 ads from 10 brands it had never seen, with no missed blocks. That set is small and was scored once, so read it as a direction, not a guarantee. Its main mistake is being too strict, not too lenient (details in `eval/README.md`).
- **Caveat:** no API key was available during the build, so the AI judge was played by Claude agents given the exact same prompt. The 90% therefore measures the rules plus that prompt, not a live run of the shipped judge. `npm run eval` re-runs it live once a key is added.

## Making ads

- **From a product link:** the app reads the page and writes copy where every line traces back to it. It puts the real product photo on a clean layout and checks the result. Seven layouts: product hero, ingredient focus, benefit badges, study result, customer review (verified reviews captured from the brand site, stars and date kept), question and answer, and texture shot (an AI-made texture swatch beside the real, label-checked pack, marked "AI-generated, illustrative"). A layout the product can't fill honestly is shown greyed out with the reason. You can edit and re-check, then download the PNG with a review note. Timed on 10 products: about 3–4 seconds each without a key (`results/timing_2026-10-04.md`).
- **The ad library** (`ad_library/index.html`, and the "Final ads" tab in the app) holds every ad the pipeline made: 433 across Minimalist's top 20 best sellers plus its underarm roll-on (17 agreed formats per product plus proof ads built on each page's study or lab figures), in 1:1, 4:5 and 9:16 (a few in Hindi and Tamil), shown in random order. Every ad carries three scores and an AI judge review. 350 are ready for human review. 23 need a fix and 60 are blocked; each of those shows a plain warning saying why (for example, 57 before/after and progress ads use AI-made result images, which India's AI-content rule bans even with a label; most needs-fix ads are comparisons waiting for their proof), and blocked ads can't be downloaded.
- **Product images:** each product's pack and a texture shot were re-rendered in ChatGPT from the brand's own photo, then checked word by word against the real label (automatic comparison plus a visual read), up to 3 rounds. 21 of 21 passed; the AI texture is rated Low risk and keeps an "illustrative" mark.
- **The look** comes from Minimalist's own longest-running static ads: white background, the product big, about 15 words on the image, details in the caption, and its "Hide Nothing." sign-off.
- **The ideas** come from competitor ads that have run for over 30 days, blended so nothing is copied.
- **Trending now:** a section for formats at least two brands launched in the last two months and are still running, each recreated Minimalist's way. A scheduled script re-checks the Meta Ad Library every Monday (about 4 minutes, nothing to install) and reports new launches, stopped ads and trends not yet recreated.
- **Safety:**
  - The product photo is always real, never AI-drawn.
  - Any ad with an AI person or hands carries a visible AI label and is rated Severe, so it can't be exported until real, consented photos replace it.
  - Ads that aren't ready stay visible with a warning; blocked ones have no download button.

## How to read the three scores

- **Alignment (0–100):** how much the ad sounds and looks like Minimalist. It is measured against the brand's own long-running ads: sentence length, no hype or exclamation marks, actives and percentages first, and few words on the image.
- **Win (0–100):** learned from 122 static ads in the Meta Ad Library (Minimalist's own and competitors'), using whether the advertiser kept each one running for 30+ days. Brands keep paying for ads that sell, so long-running ads are the best public stand-in for "best sellers". It is still a stand-in: once real spend and sales data for these ads exist, it can be re-trained on them.
- **Compliance:** the rule-and-judge verdict (Ready for review / Needs a fix / Blocked). It is decided in code and can't be raised by the other two scores.

## Keys and data

- API keys go in `.env` or the app's settings box. The box keeps them in the server's memory only (they are not written to disk), and a key can only be set from the computer the app runs on.
- With a Claude key, the ad's copy and the product-page facts go to Anthropic. With an OpenAI key, the image prompt and the real pack photo go to OpenAI. Nothing else leaves the machine.
- Without keys the app still runs: copy is taken word for word from the page, only the rules run, and images come from the ChatGPT window you sign into yourself (`npm run studio`).
## The deliverables

| | |
|---|---|
| Working app | `npm start` (Node only, nothing to install) |
| Commit history | `git log`: about 100 small commits, around 23 of them fixes to the agent's own mistakes |
| Transcript | `docs/TRANSCRIPT.md`, which opens with an index of what went wrong and how it was caught |
| Prompts | `prompts/`, including one that rebuilds this pipeline for any brand |
| Decision doc | `docs/DECISIONS.md` |
| Rulebook changelog | `rules/CHANGELOG.md` (every rule change, from the commit history) |
| Failure modes | `docs/FAILURE_MODES.md` |

## What's still rough

- **The AI judge hasn't run live,** and it isn't fully consistent from run to run, so a person always reviews.
- **India's ASCI rule on AI content** (released 29 Sep 2026) comes into force about three months after publication, so from late December 2026. The checker applies it already, so ads are safe on the day it starts.
- **Customer-review language** comes from the brand site and Amazon only (Flipkart isn't parsed, and Nykaa blocks scripts).
- **The rules are India-first;** another market needs its own rule set.
- **Texture photos:** the texture shots are AI-rendered beside the verified pack (labelled illustrative). A real texture shoot would replace them; only the oat cleanser has a real one today.
- **New competitor ads are sorted into formats by AI,** so with no key the weekly check lists them as unsorted (this week's 49 were sorted by stand-in agents on the same prompt).
- **Brand and legal answers (4 Oct):** comparison ads are in, and acne wording is fine on a cosmetic. Both are recorded in `rules/brand_decisions.json` and applied automatically. The 7 comparison ads still can't be exported until someone attaches the proof behind each comparison.
