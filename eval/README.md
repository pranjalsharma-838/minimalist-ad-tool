# Scorer evaluation (Part B)

**Question:** does the scorer flag what an independent compliance reviewer would flag, at the right severity, including on ads it has never seen?

## What each split is, and how far it generalises

| Split | n | Source | Held out how | Independent of the builder? | Read it as |
|---|---|---|---|---|---|
| tuning | 20 | Meta Ad Library, India (12 Minimalist + 8 competitor ads) | Not held out: read while writing the rules | No | Optimistic; a consistency check |
| holdout | 13 | The same Meta capture (6 Minimalist + 7 competitor) | Hash split (`scripts/split_corpus.js`), sealed until the rules were frozen, labelled blind | Labels yes; ads from the same distribution | **In-distribution** generalisation |
| synthetic | 16 | Adversarial edge cases (implied cures, strengthened stats, euphemisms, clean controls) | Written during the build | **No**: written by the builder | Stress test only; 100% here proves little |
| **ood** | 12 | **Amazon.in listing copy (title + bullets) from 10 brands never seen anywhere in the build** (WishCare, Hyphen, The True Therapy, L'Oréal Paris, Himalaya, Nivea, Vaseline, Cetaphil, Pond's, Vilvah) | Collected after the rules were frozen (`scripts/build_ood_eval.js`); blind labels **committed before scoring** (commit `00fc3e5`); **scored once** | Yes, on both axes: new brands **and** a new channel | The closest thing here to "ads you have not seen" |

**Labels:**
- The independent reviewer agent never saw the rules, code or tool output. It read only the ads, `research/regulatory_sources.md` and `research/brand_corpus.md`.
- The same written instructions were used for all splits (`labels.json`, `labels_ood.json`).
- None of the pipeline's own generated ads are in the eval.

**Model layer:**
- No API key was available. So the AI-judge outputs (`sim_model/`) came from Claude subagents given the exact production prompt and schema (`rendered/`), and they pass through the app's real validation code.
- This approximates the production API path but is not the same as it.
- With a key, `npm run eval` re-runs every split through the live API.

## Results (rules + AI judge, stand-in)

**Frozen result:** rules as they were before the OOD set was collected; OOD scored once.

| Split | Verdict agreement | Phrase recall | Missed blocks | Over-severity (fix→block) | Rules alone: recall |
|---|---|---|---|---|---|
| tuning | 16/20 | 91% | 0 | 1 | 83% |
| holdout | 11/13 | **90%** | 0 | 1 | 52% |
| synthetic | 13/16 | 100% | 1 | 0 | 29% |
| **ood** | **7/12** | **81%** (44/54) | **0** | **5** | 43% |
| all | 47/61 | 88% | 1 | 7 | 54% |

**What the OOD result says:**
- Recall drops from 90% in-distribution to **81% on unseen brands and channel**.
- The tool **never under-called a block**: all 3 reviewer blocks were blocked (rosacea/cystic-acne claims, "clears & prevents acne", "fairness").
- **The error is over-severity:** 5 of 12 "fix" ads were blocked. Most came from the **catalog checks**, which compare stated strengths and SPF with *Minimalist's* catalog and so fired on other brands' products (e.g. "Glycolic Bright 8%").
- For a pre-screen that's the safer direction, but it is noise a reviewer would have to clear.

**Fixed after the test, so this second line is no longer a clean held-out number:** catalog checks now run only for Minimalist's own ads, or when a Minimalist product page is attached (`lib/rules.js`, `runRules`). On re-scoring:

| | OOD agreement | Over-severity | Extra flags | Holdout |
|---|---|---|---|---|
| post-fix | 8/12 | 4 | 17 (was 25) | unchanged (90% recall, 11/13) |

The remaining over-severity comes mostly from acne wording. The regulatory file marks this as an open legal question; the reviewer used *fix*, and the rules plus judge used *block*.

Full per-case output:
- frozen: `results/summary_ood_frozen.md`, `results/details_ood_frozen.json`;
- current: `results/summary.md`, `results/details.json`.

## Run

```bash
node eval/run.js        # all splits; rules-only and rules + judge
```

## Generator check
`check_generator.js`, `render_generator.js` and `render_generator_svgs.js` re-run the scorer on ads produced by the generator (Part A), so generated copy is held to the same rules as any other ad (`gen/`).
