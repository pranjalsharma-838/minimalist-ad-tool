# Eval results

Generated 2026-10-04T17:04:11.310Z. Labels: eval/labels.json (independent reviewer agent; saw research files and ads only, not rules/code).
Model layer: outputs in eval/sim_model/ were produced by Claude Code subagents given the exact rendered prompt (eval/rendered/), because no API key was available. They pass through the app's real validation code. This approximates, but is not, the production API path.
Brand/legal decisions (rules/brand_decisions.json): 1 of 1 reviewer label(s) adjusted in memory to match a later decision; eval/labels.json itself is unchanged.
How far each split generalises (see eval/README.md): tuning = read while writing the rules (optimistic); holdout = same Meta capture, hash-split and sealed until the rules were frozen (held out, but in-distribution); synthetic = adversarial edge cases written during the build (not independent of the builder); ood = brands never seen in the build + a different channel (Amazon.in listings), labelled blind and committed before scoring (the closest to 'ads you have not seen').

### Rules only

| split | n | agree | missed risk (block→pass/fix) | under (fix→pass) | over-block (pass→block) | over-severity (fix→block) | over (pass→fix) | phrase recall | extra flags | model findings dropped |
|---|---|---|---|---|---|---|---|---|---|---|
| tuning | 20 | 15 | 0 | 3 | 0 | 0 | 2 | 28/34 (82%) | 10 | 0 |
| holdout | 13 | 10 | 1 | 1 | 0 | 0 | 1 | 15/29 (52%) | 5 | 0 |
| synthetic | 16 | 8 | 3 | 3 | 0 | 0 | 2 | 4/14 (29%) | 2 | 0 |
| ood | 12 | 6 | 0 | 3 | 0 | 3 | 0 | 23/54 (43%) | 9 | 0 |
| ALL | 61 | 39 | 4 | 10 | 0 | 3 | 5 | 70/131 (53%) | 26 | 0 |

### Rules + model (stand-in)

| split | n | agree | missed risk (block→pass/fix) | under (fix→pass) | over-block (pass→block) | over-severity (fix→block) | over (pass→fix) | phrase recall | extra flags | model findings dropped |
|---|---|---|---|---|---|---|---|---|---|---|
| tuning | 20 | 16 | 0 | 0 | 0 | 1 | 3 | 31/34 (91%) | 15 | 4 |
| holdout | 13 | 11 | 0 | 0 | 0 | 1 | 1 | 26/29 (90%) | 10 | 1 |
| synthetic | 16 | 13 | 1 | 0 | 0 | 0 | 2 | 14/14 (100%) | 2 | 0 |
| ood | 12 | 8 | 0 | 0 | 0 | 4 | 0 | 44/54 (81%) | 16 | 3 |
| ALL | 61 | 48 | 1 | 0 | 0 | 6 | 6 | 115/131 (88%) | 43 | 8 |

## Per-case disagreements (rules + model)
- **meta_3043932412484720** (tuning, Minimalistinc): reviewer **pass**, tool **fix**
- **meta_2010383689596000** (tuning, Minimalistinc): reviewer **fix**, tool **fix**; missed: [fix] 86% pure Vitamin C — Ambiguous next to a 10% serum: 86% is the vitamin C content of the ethyl ascorbic acid raw material (brand_corpus 3.3, S9), not the product; misleads by ambiguity (ASCI-1.4).
- **meta_2047762822837459** (tuning, pixelplaykhushi with Minimalistinc): reviewer **pass**, tool **fix**
- **meta_924256144009084** (tuning, Mamaearth): reviewer **pass**, tool **fix**
- **meta_8722721711110279** (tuning, Kozicare - Skin & Body Care): reviewer **fix**, tool **block**
- **meta_2196301691128293** (tuning, Chemist At Play): reviewer **fix**, tool **fix**; missed: [fix] 100% pure, stable Ethyl Ascorbic Acid — Raw-material purity can be read as product concentration; misleading by ambiguity (ASCI-1.4). | [fix] Deeply penetrates for visible results — Penetration/efficacy claim needs product data (ASCI-1.1, ASCI-RPT-BPC).
- **meta_1673367467228372** (holdout, Minimalistinc): reviewer **fix**, tool **fix**; missed: [fix] The Gel Cleanser you loved — Card 1 says gel, card 2 says cream cleanser while copy says same formula; confirm the format fact (ASCI-1.4).
- **meta_1422362619946108** (holdout, Spicy candy with Minimalistinc): reviewer **pass**, tool **fix**
- **meta_1023280860675735** (holdout, Dermatouch): reviewer **fix**, tool **fix**; missed: [fix] your key to a flawless complexion — Exaggerated promise most users will not get (ASCI-1.5); off brand vocabulary (brand_corpus 4.1).
- **meta_1368951565453816** (holdout, The Derma Co.): reviewer **fix**, tool **block**
- **meta_621835826921394** (holdout, Dot & Key): reviewer **fix**, tool **fix**; missed: [fix] 80 min water resistant — Water-resistance claim needs a named test method; open question (Q4).
- **syn_stat_strengthened** (synthetic, synthetic): reviewer **block**, tool **fix**
- **syn_clean_spf** (synthetic, synthetic): reviewer **pass**, tool **fix**
- **syn_generic_tone** (synthetic, synthetic): reviewer **pass**, tool **fix**
- **ood_B0CW1N7QRT** (ood, WishCare): reviewer **fix**, tool **block**; missed: [fix] SPF rating of 50+ — Conflicts with 'SPF 50' in the headline; the stated SPF must match the label and the in-vivo report on file (BIS-SPF, ASCI-1.1; Q4). | [fix] In-Vivo Tested — Test claim needs lab/study source and date in the ad (ASCI-1.2) and an IS 17494 / ISO 24444 report on file (BIS-SPF; open Q4). | [fix] free from OMC and Oxybenxone — Free-from framing denigrates legally permitted UV filters (EU-655-4/5/6 §5(1); open Q12) and would disparage Minimalist's own Light Fluid SPF, whose page (S6) names ethylhexyl methoxycinnamate, i.e. OMC (brand_corpus §5); also misspelled.
- **ood_B0FDQZBV6K** (ood, Hyphen): reviewer **fix**, tool **fix**; missed: [fix] 20% Collagen — Reads as 20% collagen content, yet no collagen appears among the listed actives; a % tied to a benefit is misleading by ambiguity (ASCI-1.4; CPA-2(28)) and breaks concentration transparency (brand_corpus §6; open Q5). | [fix] 18% Brightening — Percentage attached to a benefit, not an ingredient - can read as an 18% brightening result (ASCI-1.4; ASCI-RPT-BPC 'Y% more' with unclear basis); name the actives (11% + 5% + 2%) instead.
- **ood_B09W1JM81P** (ood, The True Therapy): reviewer **block**, tool **block**; missed: [fix] reduces the formation of open pores (or blackheads) — Scientifically inaccurate structure claim (blackheads are not open pores) (Q2; COS-R36) - wrong for a science-first brand (brand_corpus §6).
- **ood_B0B9QMYYY4** (ood, L'Oreal Paris): reviewer **fix**, tool **fix**; missed: [fix] Glycolic Bright 8% — Concentration conflict: headline '8%' reads as 8% glycolic, but the body twice says '1% Glycolic Acid' with '2% Niacinamide' and never quantifies Melasyl - misleading on quantity (ASCI-1.4; CPA-2(28)); reconcile with the formula (brand_corpus §6 concentration transparency).
- **ood_B0CKTQGLMZ** (ood, Himalaya): reviewer **fix**, tool **block**; missed: [fix] Organically sourced Turmeric — Organic claim needs certification on file; an organic halo on a largely synthetic acid serum is an ASCI enforcement pattern (ASCI-RPT-BPC).
- **ood_B00E96N6O8** (ood, NIVEA): reviewer **fix**, tool **block**
- **ood_B0BXSDJQNR** (ood, Vaseline): reviewer **fix**, tool **fix**; missed: [fix] Gives Brighter Skin — Whole face-and-body brightening led by glutathione (commonly marketed for skin lightening) reads as skin-lightening - ASCI-G-FAIR / META-HW-WHITEN exposure; open Q3, route to legal; reframe to radiance or the look of dullness.
- **ood_B01CCGW4OE** (ood, Cetaphil): reviewer **fix**, tool **fix**; missed: [fix] DEFENDS AGAINST 5 SIGNS OF SKIN SENSITIVITY — Multi-part efficacy claim (irritation, weakened barrier) needs finished-product data on file (ASCI-1.1).
- **ood_B0BLCM1BQD** (ood, vilvah STORE): reviewer **fix**, tool **block**
