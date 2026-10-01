# Competitor-adapted static ad brief pipeline

Same stage discipline as earlier internal static-ad and UGC pipelines. Mechanical work is a plain script; judgement work is an agent step with its prompt in `prompts/`. **Test brand: Minimalist**, used to build and prove the pipeline. Every output carries an "INTERNAL TEST — not for publication" mark.

| # | Stage | How | Output (in `pipeline/runs/<date>/`) |
|---|---|---|---|
| 1 | **Pool**: 10–12 competitor ads still active and running 14+ days, spread across ad types, max 2 per brand | `node pipeline/01_pool.js <date>` (reads `research/competitor_ads/*.json`) | `pool.json` |
| 2 | **Tag** each ad's structure | Agent step, "tagger" role, `prompts/pipeline_tagger.md` | `tags/<id>.json` |
| 3 | **Match** each ad to our product for that concern; fetch the product-page facts | `node pipeline/03_match.js <date>` (`config/product_map.json`) | `match.json`, `products/<handle>.json` |
| 4 | **Adapt** (brand context): keep the structure, use only our cited facts, write a background-only image prompt | Agent step, "brief writer" role, `prompts/pipeline_brief_writer.md` | `briefs_draft/<id>.json` |
| 5 | **Compliance gate**: citations/numbers, layout fit, image-prompt check, scorer (rules + model) | `node pipeline/05_compliance.js <date>` | `briefs_final.json` |
| 6 | **Deck + prompts** | `python pipeline/06_deck.py <date>` | `Ad_Briefs_<date>.pptx`, `chatgpt_prompts.md` |
| 7 | **Image step**: background only | Browser: the user logs in to ChatGPT themselves; the agent pastes each prompt from `chatgpt_prompts.md` and saves the image | `backgrounds/<id>.png` |
| 8 | **Compose + re-check** the real pack shot and checked copy over the background | `node pipeline/08_compose.js <date>` | `finals/<id>.svg` (PNG via the app's export) |

## Rules that don't bend

- **The image model never draws the product, any text, skin, faces, results, doctors or badges.** The prompt checker (`lib/image_prompt_check.js`) blocks it in stage 5. A generated bottle would be a fabricated depiction of a real product. Generated result imagery is banned by ASCI's Sept 2026 synthetic-content guideline, even with a label.
- **Before/after briefs need real, unretouched study photos.** Such briefs are marked `needs_real_photography`. The image model only makes the layout background with two empty photo frames.
- **Structure, not wording.** Briefs never reuse a competitor's headline, slogans or distinctive copy (ASCI 4.3, plagiarism).
- **Only "approved_for_image_step" briefs reach stage 7.** Flagged briefs go back to a human. Blocked briefs stop.
- **ChatGPT login is done by the user**, in the browser window. The agent never types a password.

## Swapping the brand (for the target brand's launch)

Replace these three things:
- `config/product_map.json` (concerns → products);
- the catalog snapshot (`research/products_snapshot_*.json`);
- the brand-specific rules in `rules/brand_rules.json` (the TON-/LNG- rules and brand-derived rationale).

The policy rules (CLM-, CRE-) are regulation-based and shared. **the target brand sells mostly in the US, so a US rule set (FTC, FDA cosmetic/drug line, TikTok Shop / Amazon ad policies) must be added before real use.**
