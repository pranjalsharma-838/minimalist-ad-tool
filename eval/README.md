# Scorer evaluation (Part B)

**Question:** does the scorer flag what an independent compliance reviewer would flag, at the right severity?

## Set-up
- **49 cases** in three splits:
  - **tuning** (20): real competitor/brand ads read while writing the rules, so optimistic;
  - **holdout** (13): real ads sealed until the rules were written;
  - **synthetic** (16): adversarial ads with implied cures, strengthened stats, euphemisms and clean controls.

  Sources: `corpus_tuning.json`, `corpus_holdout.json`, `cases_synthetic.json`, built by `build_cases.js`.
- **Labels:** `labels.json` was written by an independent reviewer agent that saw the research files and the ads, never the rules or the code. Each case has a verdict (pass / fix / block) and the exact phrases it flagged.
- **Model layer:** with no API key available, the AI-judge outputs in `sim_model/` were produced by Claude subagents given the exact prompt the app would send (`rendered/`, from `render_prompts.js`). They pass through the app's real validation code (span check, severity cap, computed verdict). This approximates the production path but is not the same as it.

## Run
```bash
node eval/run.js        # writes results/summary.md and results/details.json
```

## Results (latest run, 2026-10-03: 43 rules)

| | Verdict agreement | Phrase recall | Missed blocks |
|---|---|---|---|
| Rules only, all 49 | 34/49 | 48/78 (62%) | 4 |
| Rules + AI judge, all 49 | 40/49 | 72/78 (92%) | 1 |

The honest numbers are holdout and synthetic; the tuning split is optimistic by construction. Disagreements are listed case by case in `results/summary.md`. The main remaining weakness is *over*-flagging (pass → fix on clean ads), which is the safer direction for a pre-screen.

## Generator check
`check_generator.js`, `render_generator.js` and `render_generator_svgs.js` re-run the scorer on ads produced by the generator (Part A), so generated copy is held to the same rules as any other ad (`gen/`).
