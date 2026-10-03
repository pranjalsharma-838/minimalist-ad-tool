# Decision doc: Minimalist Ad Desk

**Framing.** The expensive failure is publishing a claim that shouldn't run, not writing a bland one. So the tool is a pre-screen that hands reviewers ads that are already fixed. Its best verdict is "Ready for human review", never "approved".

## 1. The standard, and how it was derived

`rules/brand_rules.json` holds **43 rules**, each with a dimension, a severity, a rationale, sources and a confidence note.

- **32 policy/claims rules** (9 block, 22 fix, 1 advisory) come from 66 law and platform sources, 60 of them verified against primary text (`research/regulatory_sources.md`). Open legal questions, such as "acne" on a cosmetic, are *fix → legal*, never *block*.
- **6 tone and 5 language rules** come from the brand's stated philosophy (no fluff, no fear-mongering) and its counted copy (56 of 60 titles lead with a concentration; 0 emoji). Where Minimalist's own copy breaks its philosophy or the law, the rules follow the philosophy and the law, so some of its live ads are flagged on purpose.
- **Tone and language are thin and soft by design.** An off-voice ad costs a revision; an illegal claim costs a recall. So only fear hooks (tone) reach *fix*, and the rest stay advisory. Part B is legal-first with a brand-voice layer; the AI judge also reads every ad against the brand corpus.
- **Ad type changes tone, never law.** 10 tone/language rules relax for creator ads (`lib/rules.js:283-285`); legal rules and the disclosure check have no override.
- **AI judge guardrails:** it can add findings but never remove a rule hit; its severity is the milder of its view and the rulebook's; quotes not found in the ad are discarded; the verdict is computed in code.

**Evidence** (`eval/README.md`; the judge is a stand-in given the exact production prompt):
- **Sealed holdout from the same Meta capture:** rules plus judge caught **90%** of reviewer-flagged phrases (rules alone 52%).
- **12 ads from 10 brands never seen in the build, in a different channel (Amazon.in listings)**, labelled blind and scored once: **81%** (rules alone 43%), with **no missed blocks**.
- The cost was over-severity: 5 of 12 "fix" ads were blocked, mostly by catalog checks firing on other brands. That check is now scoped to Minimalist's ads; the post-fix re-run is reported separately.

## 2. How the ads are made

- **The look is the brand's own, the concepts are new.** House style comes from Minimalist's top-running *static* ads (52–98 days; videos excluded): a white canvas, the real pack as the hero, 0–15 words on the image, details in the caption, the "Hide Nothing." sign-off. A style check holds every ad to that budget; a style editor may only cut words, never add them.
- **The product is never AI-drawn.** Code composites the real pack shot. AI-generated people appear only in people formats, always with a visible AI mark, and **any model makes the ad Severe**: kept for review, never exported until real, consented photos replace it.
- **Every claim traces to a source:** page facts, offers captured live (dated, "T&C apply"), or verbatim verified reviews.
- **Blend, don't copy.** Each concept takes one element from each of 3 competitor winners (static ads running 30+ days); angles are balanced so every product gets every angle.
- **Formats are never removed; they're risk-rated.** Severe formats (before/after, transformation journey, anything with a model) are not exportable. Comparisons (Us vs Them) are High: "them" must be something the brand's page itself names, with the basis on the creative.
- **Retry loop, max 3 rounds.** A flagged claim is removed or replaced, never reworded; the best *judged* version is kept.

## 3. Scope: why so broad, and what I'd ship if only one thing could

The brief prefers one deep feature. The brand team also wanted a working ad library, so I built it as **modules on top of the standard**; each can be removed without changing the standard. **If only one thing shipped, it would be Part B** (rules, judge guardrails, eval), with Part A's sourced generator as its first consumer. Cut first, in order: language versions, own-results ledger, regulatory watch, trend signal, archetype skill, image pipeline.

## 4. What was cut, and why

- **Generated products, or AI people or results presented as real.** See §2.
- **Per-market rules and video.** The rules are India-first; a US market needs FTC/FDA and TikTok/Amazon rules first.
- **A pixel-level image re-check.** Dropped by user decision; every final is checked by eye on contact sheets instead.

## 5. The decision I was least sure about

**Does a claim on Minimalist's own product page count as substantiated?** If yes, ads repeat "Reduces Acne" at scale. If no, every ad is flagged for the brand's own copy and the tool gets ignored. **Resolution:** being on the page lowers severity one step, on substantiation-type rules only (timeframes, stats, acne wording), never on block-level rules (cures, guarantees, fairness, regulator approval). The page proves the brand published a claim, not that it's legal. The tension is real: the judge flagged the page's own "reduces sebum" in one run and passed it in another.

## Worth questioning in the brief

- *Tone* and *language* overlap. Here, tone means register (fear, hype, urgency); language means vocabulary and claim structure.
- "Any ad" clashes with "Minimalist tone" for creator ads (see "Ad type", §1).
- "Get the creative out" clashes with "review before spend". Export is a draft plus a review ticket, not a cleared asset.

*Iteration:* `docs/TRANSCRIPT.md` opens with an index of 20 moments where an output was wrong and how each was caught (with commits), plus 8 where my pushback changed the build.
