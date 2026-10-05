# Process log — 5 Oct 2026 (final day)

What changed on the last day, why, and how each change was checked. Logs from the checks are in `logs/`.

## How an ad is made now (both set-ups)

1. **Facts.** The app reads the beminimalist.co product page. Every line on an ad traces back to a page fact.
2. **Audiences.** The app reads who the page says the product is for (for example "Newborns & Up" and "Sensitive skin" on the Pediatrics cleanser give two audiences: parents of babies, and grown-ups with sensitive or eczema-prone skin). Each audience cites its page facts. Scene images rotate across the audiences, so one build covers more than one angle.
3. **Product image first.** A product with no checked image in the library gets one ChatGPT render of its real pack photo. The photo must visibly attach before anything is sent. The label is then compared word by word with the real pack, up to 3 rounds. The passed render is saved and reused on every later build. The ads wait (hidden, one status line) until it passes.
4. **Then the scenes, in parallel.** The other new images of the build (person, creator, product in hand, texture, before/after, progress) are held in the queue until the product image has a result, then made side by side: up to 3 ChatGPT tabs, or up to 4 at once with an OpenAI key. Anything showing the pack uses the passed render as its product photo and goes through the same label check.
5. **Scenes match the product's real use.** Baby products: a parent and baby at bath time from a respectful distance, never close-ups, and no before/after or progress images at all. Hair: scalp. Underarm: roll-on use. Sunscreen: before stepping out. Body: after a shower. Face: as before.
6. **Checks.** 44 rules, then the AI judge (when a Claude key is set) strictly against the rulebook: it can only raise a problem by citing a rule; anything else is an advisory note that can't change the verdict. Claims that appear on the brand's own listing are treated one step more leniently (brand decision DEC-05).
7. **Export.** Download unlocks only after a named reviewer ticks every line on the image and caption as checked against its source. The review ticket records who signed off.

Reused, never re-made: the 21 library products' checked pack renders (backdrop whitened so no box shows), their approved texture shots, and other products' renders in routine and range ads. Text, layout, badges and percentages are drawn by the app.

## Changes on 5 Oct

| Change | Why (user request) | Checked by |
|---|---|---|
| Final ads tab; 433 library ads in random order; not-ready ads shown with a plain warning; no download for blocked ads | "final ads still miss the ai generated ones", "randomise the library", "fix and bring back and give warning" | UI check: 433 cards, 83 warnings, 0 blocked cards with download |
| 8 needs-fix ads reworded and re-judged; internal capture notes removed from 59 captions | DeepSeek review + "fix and bring back" | Stand-in judge re-run on the same prompt: 7 of 8 cleared |
| Pack renders whitened; cut-out shadows trimmed (no grey shelf) | "poor product rendering in a few" | Contact sheets of all 433 ads and close-ups of 105 |
| Products without a checked render wait for the label-checked ChatGPT render, which is then reused | "why are we not using the loop i established" | Live: B12 moisturiser and Pediatrics cleanser renders passed and were used |
| Photo must attach before a ChatGPT request is sent; Send fallback for ChatGPT's new layout | "the original image is missing" | Screenshot of the ChatGPT tab with the photo attached; render then sent automatically |
| Product image first, then the rest in parallel | "after the product image is rendered correctly we send the request for rest", "all shoot parallely" | `scripts/check_api_route.mjs` (log: `logs/api_route_check.json`); live cleanser run (texture and before/after in two tabs at once) |
| Scenes written for the product's real user; no result images for baby products | "this is for babies and you made random shit" | `tests/audience_formats.test.js` |
| Audiences read from the page; scenes rotate across them | "adults with sensitive skin is also a strong angle" | `tests/audience_formats.test.js` |
| Two new formats: Week-by-week journey (4 to 12 weeks, from the page's own study period) and Product in hand (label-checked, Severe) | "2 more format needed" | Tests + live body-lotion build |
| Pediatrics: ads made and rated Severe (not refused) | "it should make images and show severe" | Live cleanser build |
| AI judge rule-bound; reviewer sign-off before download; listing claims lenient | DeepSeek review + "strictly stick to rules" + "listing will be treated leniently" | Tests + live sign-off check |
| Tests use a throwaway image queue | 649 test requests had piled into the real queue | Full test run adds 0 requests to `image_requests/` |

## Runs with a key connected

No real API key was available. Both key routes were run end to end with a stand-in for the outside service, everything else real:

- **OpenAI key** (`node scripts/check_api_route.mjs`, log `logs/api_route_check.json`): the product render ran first and passed the real label check; the 3 other images were held until then, then ran in parallel (2.3 s against the stand-in) and all passed.
- **Claude key** (`node scripts/check_claude_route.mjs <product>`, log `logs/claude_route_check.json`), run on the never-tried Kojic + Mandelic Body Lotion: the copy came through the model path and passed the app's code checks; the AI judge ran with the full rulebook (24 k-character system prompt) and the verdict was set in code.

Re-run both with a real key to measure real timings.

## New-product test

Kojic + Mandelic Body Lotion (never used before): page read, audience found ("People with dry skin", F12), product render made in ChatGPT and label-checked, 8 ads ready on white within seconds of it, week-by-week journey 4 weeks (the page states no study period), scene images made in parallel.

## Tests

141 tests, all passing (`logs/tests_2026-10-05.txt`).
