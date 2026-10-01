# Eval results

Generated 2026-10-01T20:15:44.333Z. Labels: eval/labels.json (independent reviewer agent; saw research files and ads only, not rules/code).
Model layer: outputs in eval/sim_model/ were produced by Claude Code subagents given the exact rendered prompt (eval/rendered/), because no API key was available. They pass through the app's real validation code. This approximates, but is not, the production API path.
Tuning-split numbers are optimistic: rules were written while reading those ads, and some appear verbatim as rulebook examples. Holdout and synthetic are the honest numbers.

### Rules only

| split | n | agree | missed risk (block→pass/fix) | under (fix→pass) | over-block (pass→block) | over-severity (fix→block) | over (pass→fix) | phrase recall | extra flags | model findings dropped |
|---|---|---|---|---|---|---|---|---|---|---|
| tuning | 20 | 14 | 0 | 4 | 0 | 0 | 2 | 27/35 (77%) | 9 | 0 |
| holdout | 13 | 11 | 1 | 0 | 0 | 0 | 1 | 15/29 (52%) | 6 | 0 |
| synthetic | 16 | 10 | 3 | 3 | 0 | 0 | 0 | 4/14 (29%) | 1 | 0 |
| ALL | 49 | 35 | 4 | 7 | 0 | 0 | 3 | 46/78 (59%) | 16 | 0 |

### Rules + model (stand-in)

| split | n | agree | missed risk (block→pass/fix) | under (fix→pass) | over-block (pass→block) | over-severity (fix→block) | over (pass→fix) | phrase recall | extra flags | model findings dropped |
|---|---|---|---|---|---|---|---|---|---|---|
| tuning | 20 | 16 | 0 | 0 | 0 | 1 | 3 | 31/35 (89%) | 15 | 4 |
| holdout | 13 | 11 | 0 | 0 | 0 | 1 | 1 | 26/29 (90%) | 11 | 1 |
| synthetic | 16 | 15 | 1 | 0 | 0 | 0 | 0 | 14/14 (100%) | 1 | 0 |
| ALL | 49 | 42 | 1 | 0 | 0 | 2 | 4 | 71/78 (91%) | 27 | 5 |

## Per-case disagreements (rules + model)
- **meta_2422634991565984** (tuning, Minimalistinc): reviewer **fix**, tool **fix**; missed: [fix] Limited Time offer on kits! — Urgency with no stated end date; false urgency risk (ASCI-G-DARK, CCPA-DP).
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
