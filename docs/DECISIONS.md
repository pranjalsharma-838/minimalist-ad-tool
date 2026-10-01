# Decision doc: Minimalist Ad Desk

**Problem.** Ads are slow to make, and slower to clear brand and legal review. The expensive failure is publishing a claim that shouldn't run, not writing a bland one. So the tool is built as a pre-screen that gets ads to reviewers already fixed. It never approves anything.

## 1. The brand rules, and how they were derived

There are 37 rules in `rules/brand_rules.json`. Each has a dimension, a severity, a rationale, source ids and a confidence note. The rules come from two separate evidence bases (`research/`):
- **Regulation and platform policy.** 63 entries: ASCI Code and guidelines, the D&C Act and Cosmetics Rules, the DMR Act Schedule, the CPA 2019 and CCPA 2022 guidelines, Meta, Google, and FDA and EU notes. **60 were verified against primary text.** 12 questions are genuinely open (e.g. is "acne" acceptable on a cosmetic in India?). Rules that touch an open question are set to *fix → route to legal*, never *block*.
- **The brand.** This has two parts. *Stated* philosophy: "no unnecessary marketing fluff", "chemical-free products don't exist", the critique of fear-mongering. *Observed* language: counts across 80 product titles, 6 live product pages and 18 live Minimalist ads. For example, 56 of 60 single products lead with a concentration, there is never a space before %, and brand copy uses 0 emoji.

Two derivation calls matter most:
- **Where Minimalist's own copy contradicts its stated philosophy, the rules follow the philosophy and the law.** Examples of contradicting copy: "flawless", "skin lightening active", "guaranteed UV safety" and "US FDA-approved labs". So the scorer flags some live Minimalist ads. That is intended, and the choice is open to challenge.
- **Where the brand's evidence is inconsistent, there is no rule.** It writes both "02%" and "2%", so format is not enforced. The tool only checks that the number matches the product.

Severity reflects cost. **Block** means the ad can't be exported. **Fix** means change it or attach substantiation. **Advisory** never blocks. The verdict is computed by code, and its best possible value is "Ready for human review", never "approved". The model layer can *add* findings but cannot remove or downgrade a rule hit. Its severity comes from the rulebook, and any span it quotes that isn't in the ad is discarded.

## 2. What was cut, and why

- **Generating the product or results.** The ad always uses the real pack shot, as-is. A generated bottle is a fabricated depiction of a real product, from a brand whose whole position is that it doesn't misrepresent. ASCI's Sept 2026 synthetic-content guideline also bans AI-generated results, even when labelled. *Revised during the build:* the competitor-adaptation pipeline (`pipeline/`) does use an image model, but **for the background only**. A checker blocks any prompt that asks for the product, text, skin, before/after results or endorsement cues, and the tool places the real pack shot and the checked copy on top. Before/after briefs require real, unretouched study photos.
- **More placements.** There is one size: 1080×1080, which runs in Meta feed and as a Google square. Each extra size is another layout where the footnote, the thing that qualifies the claim, can get cropped or shrunk below legibility (ASCI: ≥26px at 1080 for video, applied here by analogy).
- **Per-market rules, video, approval workflow and Slack.** The rules are India-first. Instead of a workflow, the tool exports a review ticket: the copy, the fact each line cites, the findings and the rules version.
- **Generating Pediatrics (baby-care) ads.** The generator refuses and routes to a human. The scorer still checks such ads.

## 3. The decision I was least sure about

**Should a claim Minimalist already publishes on its product page count as substantiated?**
- If yes, generated ads are clean by construction, but they would reproduce "Reduces Acne", "US FDA-approved labs" and "prevent and heal diaper rashes" at scale.
- If no, every generated ad is flagged for its own brand's copy, and marketers learn to ignore the tool.

**Resolution: provenance lowers severity one step on substantiation-type rules only.** Those are time-bound results, statistics, authority claims and acne wording. Provenance never applies to block-level rules (drug or cure claims, guarantees, fairness, regulator approval). The page shows the brand has published the claim; it doesn't show the claim is legal. This was tested, not assumed: copying the Salicylic page word for word produced "Reduces Acne…" as a headline, and the rules first missed it.

## Things in the brief worth questioning

- *Tone* and *language* overlap. Here, **tone** means register (fear, hype, urgency, emoji) and **language** means vocabulary and claim structure (concentration stated exactly, hedging, "natural" framing).
- "Works on any ad" collides with "Minimalist tone" for creator and competitor ads. The scorer takes an ad type: creator ads get relaxed tone rules, full legal rules and a disclosure check.
- "Get the creative out" sits in tension with "review before spend". Export produces a draft plus a ticket, not a cleared asset.
