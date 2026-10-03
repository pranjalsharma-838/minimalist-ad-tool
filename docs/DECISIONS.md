# Decision doc: Minimalist Ad Desk

**Framing.** The expensive failure is publishing a claim that shouldn't run, not writing a bland one. So the tool is a pre-screen that gets ads to reviewers already fixed. It never approves anything: its best verdict is "Ready for human review".

## 1. The standard, and how it was derived

`rules/brand_rules.json` holds **43 rules**, each with a severity, a rationale, sources and a confidence note. Two evidence bases sit behind them:
- **Law and platform policy:** 66 sources in `research/regulatory_sources.md` (ASCI, Drugs & Cosmetics Act/Rules, DMR Act, CPA/CCPA incl. dark patterns, Meta, Google). 60 are verified against primary text. Open questions such as "acne" on a cosmetic give *fix → legal*, never *block*.
- **The brand:** its *stated* philosophy (no marketing fluff, anti-fear-mongering) and its *observed* language (56 of 60 products lead with a concentration; 0 emoji in brand copy). Where Minimalist's own copy breaks its philosophy or the law, the rules follow the philosophy and the law.

The verdict is computed in code. The AI judge can add findings but never remove a rule hit. Its severity is the milder of its own view and the rulebook's, and quoted spans not found in the ad are discarded. **Evidence:** on 49 independently labelled cases, rules plus judge caught 92% of flagged phrases, against 62% for rules alone, with one missed block (`eval/`). Caveat: the judge was a stand-in that received the exact production prompt, because no API key was available.

## 2. How the ads are made: choices made during the build

- **The product is never AI-drawn.** The image model makes backgrounds only. The real pack shot, or a clean cut-out with a matching shadow, is composited by code. A checker refuses any prompt that asks for the product.
- **Copy from competitors' winners, not their words.** A winner is an ad that has run 30+ days. Each concept blends one element from each of 3 winners from different brands, and the angles (situation-first, concern solved, ingredient, social proof, routine, texture, offer) are balanced across the library.
- **Formats are never removed, they're risk-rated** (Low / Medium / High / Severe). Before/after and transformation-journey formats stay, at Severe, with a visible "AI-GENERATED — ILLUSTRATIVE" mark. They can't be published until real study photos replace the AI frames (ASCI bars AI-generated results).
- **Every claim traces to a source:** page facts, live offers captured by script with a date and "T&C apply", and verbatim verified reviews filtered for negative or mixed wording.
- **Retry loop, max 3 rounds.** A flagged claim is removed or replaced with another cited fact, never reworded into a near-synonym. The best *judged* version is always kept, with its remaining warnings.
- **Scripts before agents.** Prices, offers, reviews and competitor data come from page feeds by script, which is cheaper, repeatable and auditable. AI agents do only the judgement steps: briefs, judge, image prompts, translation.

## 3. What was cut, and why

- **Generated products, results or people presented as real.** See above.
- **Per-market rules and video.** The rules are India-first. the target brand's US launch needs FTC/FDA and TikTok/Amazon rules before going live.
- **Fully automatic image generation.** Without an OpenAI key, images come from ChatGPT in a browser the user logs into. One prompt per ad takes about 50 seconds.
- **A pixel-level re-check of generated images.** Dropped by user decision; every final is checked by eye instead.

## 4. The decision I was least sure about

**Does a claim on Minimalist's own product page count as substantiated?** If yes, generated ads repeat "Reduces Acne" or "heal diaper rashes" at scale. If no, every ad is flagged for the brand's own copy, and the tool gets ignored. **Resolution:** being on the page lowers severity one step, on substantiation-type rules only (timeframes, stats, acne wording). It never applies to block-level rules (cure claims, guarantees, fairness, regulator approval). The page proves the brand published a claim, not that it's legal. The pilot showed the tension is real: the judge flagged the page's own "reduces sebum" wording as a body-function claim in one run and passed it in another (see `FAILURE_MODES.md`).

## Worth questioning in the brief

- *Tone* and *language* overlap. Here, tone means register (fear, hype, urgency); language means vocabulary and claim structure.
- "Any ad" clashes with "Minimalist tone" for creator and competitor ads. The ad type relaxes tone rules for creators but keeps legal rules and the disclosure check.
- "Get the creative out" clashes with "review before spend". Export is a draft plus a review ticket, not a cleared asset.
