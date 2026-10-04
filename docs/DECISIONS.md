# Decision doc: Minimalist Ad Desk

**Framing.** The expensive failure is publishing a claim that shouldn't run, not writing a bland one. So the tool is a pre-screen that hands reviewers ads that are already fixed. Its best verdict is "Ready for human review", never "approved".

## 1. The standard

`rules/brand_rules.json`: **43 rules**, each with a severity, a rationale and its sources.
- **32 claims rules** come from 66 law and platform sources, 60 checked against the original text. Open legal questions (such as "acne" on a cosmetic) are *fix, ask legal*, never *block*.
- **11 tone and language rules** come from the brand's own philosophy (no fluff, no fear) and its counted copy (56 of 60 titles lead with a concentration). Where Minimalist's live copy breaks its philosophy or the law, the rules side with the philosophy and the law.
- **Voice is soft, law is hard.** An off-voice ad costs a revision; an illegal claim costs a recall. Only fear hooks reach *fix*.
- **Ad type changes tone, never law:** tone rules relax for creator ads; legal rules never do.
- **The AI judge** can add findings but never remove a rule hit. It takes the milder severity of its view and the rulebook's. Quotes it can't find in the ad are discarded. The verdict is computed in code.

**Evidence** (blind labels; judge played by agents on the exact production prompt; `eval/README.md`): **90%** of flagged phrases caught on held-back ads (rules alone 52%). **81%** on 12 ads from 10 unseen brands in another channel, scored once, with **no missed blocks**. The cost is over-strictness: catalog checks first fired on other brands' products; they're now scoped to Minimalist.

## 2. How the ads are made

- **The look is the brand's own, the concepts are new.** House style comes from Minimalist's longest-running *static* ads: white canvas, the real pack as the hero, 0–15 words on the image, details in the caption, the "Hide Nothing." sign-off. A style check holds every ad to that budget; the style editor may only cut words.
- **The product is never AI-drawn.** Any AI person or hands makes an ad **Severe**: kept for review, never exported until real, consented photos replace it.
- **Every claim traces to a source:** page facts, live offers (dated, "T&C apply"), verbatim verified reviews.
- **Blend, don't copy:** each concept takes one element from each of 3 competitor statics running 30+ days. "Trending now" does the same with formats several brands launched in the last 60 days and still run.
- **Nothing is removed; everything is risk-rated.** About half the library isn't exportable by design: the AI-model ads need real photos and the comparisons need a reviewer to sign off the proof. That's the pre-screen working, not failing.
- **Retry loop, max 3 rounds:** a flagged claim is removed or replaced, never reworded.

## 3. Scope

The brief prefers one deep feature; the brand team also wanted a working ad library. So the library is built as **modules on top of the standard**, each removable without touching it. **If only one thing shipped, it would be the checker** (rules, judge guardrails, eval), with the sourced generator as its first user. Cut first: language versions, results ledger, regulatory watch, trend signals, format picker, image pipeline.

**Cut on purpose:** AI-drawn products or AI results shown as real; non-Indian markets (a US rule set comes first); a pixel-level image re-check (every final is checked by eye instead).

## 4. The decision I was least sure about

**Does a claim on Minimalist's own product page count as proof?** If yes, ads repeat "Reduces Acne" at scale. If no, the tool flags the brand's own copy everywhere and gets ignored. **Resolution:** being on the page lowers severity one step for proof-type rules (time frames, stats, acne wording), never for block-level ones (cures, guarantees, fairness). The page proves the brand said it, not that it's legal. The tension is real: the judge flagged the page's own "reduces sebum" once and passed it another time.

## Worth questioning in the brief

- *Tone* and *language* overlap. Here tone is register (fear, hype, urgency) and language is vocabulary and claim structure.
- "Any ad" clashes with "Minimalist tone" for creator ads (see §1).
- "Get the creative out" clashes with "review before spend": export is a draft plus a review note, not a cleared asset.
