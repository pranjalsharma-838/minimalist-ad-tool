# Decision doc: Minimalist Ad Desk

**Framing.** The expensive failure is publishing a claim that shouldn't run, not writing a bland one. So this is a pre-screen that gets ads to reviewers already fixed. It never approves anything.

## 1. The brand rules, and how they were derived

There are 39 rules in `rules/brand_rules.json`. Each has a severity, a rationale, source ids and a confidence note. They draw on two evidence bases (`research/`):
- **Regulation and platform policy:** 63 entries (ASCI, D&C Act/Cosmetics Rules, DMR Act Schedule, CPA/CCPA, Meta, Google, FDA/EU notes), **60 verified against primary text**. 12 questions are open (e.g. "acne" on a cosmetic in India). Rules touching them are *fix → legal*, never *block*.
- **The brand:** *stated* philosophy ("no unnecessary marketing fluff", "chemical-free products don't exist", anti-fear-mongering) and *observed* language, counted across 80 titles, 6 product pages and 18 live ads (e.g. 56 of 60 products lead with a concentration; 0 emoji in brand copy).

Two derivation calls:
- **Where Minimalist's own copy contradicts its stated philosophy, the rules follow the philosophy and the law.** Examples: "flawless", "skin lightening active", "guaranteed UV safety". So some live Minimalist ads get flagged, deliberately.
- **Inconsistent evidence produces no rule.** The brand writes both "02%" and "2%", so only the number is checked.

**Severity reflects cost.** Block disables export; fix means change it or attach substantiation; advisory never blocks. The verdict is computed by code, and its best value is "Ready for human review". The model layer can add findings, never remove a rule hit. Its severity is the milder of its own view and the rulebook's. It can't raise code-only checks, and quoted spans not found in the ad are discarded.

**Evidence it works:** 49 cases labelled by an independent agent that never saw the rules. On the sealed set, rules plus model caught 90% of flagged phrases versus 52% for rules alone, with no missed blocks (`eval/`). The caveat is that the model layer was a same-prompt stand-in, because no API key was available.

## 2. What was cut, and why

- **Generated products or results.** The ad always uses the real pack shot. A generated bottle fabricates a real product, and ASCI's Sept 2026 guideline bans AI-generated results, even labelled. *Revised during the build:* the competitor-adaptation pipeline uses an image model for **backgrounds only**. A checker blocks prompts asking for product, text, skin, results or endorsements. Before/after needs real study photos.
- **More placements.** There is one size, 1080×1080 (Meta feed, Google square). Each extra size is another chance for the claim's footnote to be cropped or shrunk below the legible 26px.
- **Per-market rules, video, approval workflow.** The rules are India-first. Instead of a workflow, export includes a review ticket: the copy, each line's cited fact, the findings and the rules version.
- **Pediatrics generation.** The generator refuses it; the scorer still checks those ads.

## 3. The decision I was least sure about

**Does a claim on Minimalist's own product page count as substantiated?**
- If yes, generated ads repeat "Reduces Acne", "US FDA-approved labs" and "heal diaper rashes" at scale.
- If no, every ad is flagged for the brand's own copy, and the tool gets ignored.

**Resolution:** being on the page lowers severity one step, on substantiation-type rules only (timeframes, stats, authority, acne wording). It never applies to block-level rules (cure claims, guarantees, fairness, regulator approval). The page proves the brand published the claim, not that it's legal. This was tested: copying the Salicylic page word for word produced "Reduces Acne…", which the rules first missed.

## Worth questioning in the brief

- *Tone* and *language* overlap. Here, tone means register (fear, hype, urgency, emoji); language means vocabulary and claim structure.
- "Any ad" clashes with "Minimalist tone" for creator and competitor ads. An ad-type input relaxes tone rules for creators but keeps legal rules and the disclosure check.
- "Get the creative out" clashes with "review before spend". Export is a draft plus a ticket, not a cleared asset.
