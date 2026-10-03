# Decision doc: Minimalist Ad Desk

**Framing.** The expensive failure is publishing a claim that shouldn't run, not writing a bland one. So the tool is a pre-screen that gets ads to reviewers already fixed. Its best verdict is "Ready for human review", never "approved".

## 1. The standard, and how it was derived

`rules/brand_rules.json` holds **43 rules**. Each has a dimension, a severity, a rationale, sources and a confidence note.

- **32 policy/claims rules** (9 block, 22 fix, 1 advisory). They come from 66 law and platform sources (`research/regulatory_sources.md`), 60 of them verified against primary text. Open legal questions, such as "acne" on a cosmetic, give *fix → legal*, never *block*.
- **6 tone rules:** fear/shame hooks are *fix*; hype, emoji, exclamation marks, urgency and non-educational copy are *advisory*.
- **5 language rules**, all *advisory*: concentration-first headlines, concentration format, "natural" framing, unhedged efficacy, vague purity claims.
- **Tone and language come from the brand:** its stated philosophy (no fluff, anti-fear-mongering) and its counted copy (56 of 60 titles lead with a concentration; 0 emoji). Where Minimalist's own copy breaks its philosophy or the law, the rules follow the philosophy and the law, so the tool flags some of Minimalist's live ads on purpose.
- **Tone and language are thin and soft by design.** An off-voice ad costs a revision; an illegal claim costs a recall. So only the expensive dimension can block. Part B is legal-first with a brand-voice layer, not three equal pillars. The AI judge also reads every ad against the brand corpus for voice problems the rules don't encode.
- **Ad type changes tone, never law.** 10 tone/language rules carry a creator severity: 9 are skipped for creator ads, and fear hooks drop to advisory. This is applied in `lib/rules.js:278-281`. Legal rules and the disclosure check have no override.
- **Guardrails on the AI judge:**
  - it can add findings but never remove a rule hit;
  - its severity is the milder of its own view and the rulebook's;
  - quoted spans not found in the ad are discarded;
  - the verdict is computed in code.

**Evidence** (`eval/README.md`; AI judge = stand-in given the exact production prompt):
- On a sealed holdout from the same Meta capture, rules plus judge caught **90%** of reviewer-flagged phrases (rules alone 52%).
- On **12 ads from 10 brands never seen in the build, from a different channel** (Amazon.in listings), labelled blind and scored once, recall was **81%** (rules alone 43%), with **no missed blocks**.
- The cost was over-severity: 5 of 12 "fix" ads were blocked, mostly by catalog checks firing on other brands. That check is now scoped to Minimalist's own ads, and the post-fix re-run is reported separately as no longer clean.

## 2. How the ads are made

- **The product is never AI-drawn.** The image model makes backgrounds only; code composites the real pack shot or its cut-out. A checker refuses prompts that ask for the product.
- **Every claim traces to a source:** page facts, offers captured live with their date and "T&C apply", or verbatim verified reviews.
- **Blend, don't copy.** Each concept takes one element from each of 3 competitor winners (ads running 30+ days), and the angles are balanced across the library.
- **Formats are never removed; they're risk-rated.** Severe formats (before/after, transformation journey) carry the AI mark and are not exportable until real study photos exist.
- **Retry loop, max 3 rounds.** A flagged claim is removed or replaced, never reworded. The best *judged* version is kept.

## 3. Scope: why so broad, and what I'd ship if only one thing could

The brief prefers one deep feature over six. The brand team also wanted a working ad-library pipeline, so I built it as **modules on top of the standard**. Each module can be removed without changing the standard.

**If only one thing shipped, it would be Part B:** the rules, the judge guardrails and the eval, with Part A's sourced generator as its first consumer.

Cut first, in this order: language versions, own-results ledger, regulatory watch, trend signal, archetype skill, image pipeline.

## 4. What was cut, and why

- **Generated products, results or people presented as real.** See §2.
- **Per-market rules and video.** The rules are India-first; a US market needs FTC/FDA and TikTok/Amazon rules first.
- **A pixel-level re-check of generated images.** Dropped by user decision; every final is checked by eye on contact sheets instead.

## 5. The decision I was least sure about

**Does a claim on Minimalist's own product page count as substantiated?** If yes, generated ads repeat "Reduces Acne" at scale. If no, every ad is flagged for the brand's own copy and the tool gets ignored.

**Resolution:** being on the page lowers severity one step, on substantiation-type rules only (timeframes, stats, acne wording). It never applies to block-level rules (cures, guarantees, fairness, regulator approval). The page proves the brand published a claim, not that it's legal. The tension is real: the judge flagged the page's own "reduces sebum" as a body-function claim in one run and passed it in another.

## Worth questioning in the brief

- *Tone* and *language* overlap. Here, tone means register (fear, hype, urgency); language means vocabulary and claim structure.
- "Any ad" clashes with "Minimalist tone" for creator ads. See "Ad type" in §1.
- "Get the creative out" clashes with "review before spend". Export is a draft plus a review ticket, not a cleared asset.

*Iteration:* `docs/TRANSCRIPT.md` opens with an index of 16 moments where an output was wrong and how each was caught (with commits), plus 6 where my pushback changed the build.
