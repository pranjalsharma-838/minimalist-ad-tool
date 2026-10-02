---
name: ad-archetype-selection
description: Decide which ad formats to make for one request (product, audience, placement, objective) in the competitor-adapted ad pipeline. Ranks all 48 template types from config/templates.json using real competitor winners (ads running 30+ days), the trend file, the product's own facts and the objective, then returns a shortlist of 3–4 with a reason and a risk level (Low/Medium/High/Severe) each. Never removes a format; formats needing assets we lack still rank on merit and carry a risk level and suggestions. Use when the user says "what ads should we make for <product>", "pick the formats/archetypes", or at stage 4 of the ad pipeline (Desktop\minimalist-ad-tool).
---

# Ad archetype selection

This is the decision point of the pipeline. It's the cheapest place to be wrong, so the full ranking is always saved for a human to override before briefs are written.

## Steps

1. **Collect the request.** You need: product URL (or handle), objective (`sales` | `awareness` | `education`), audience, placement (default feed 1:1) and how many to shortlist (default 4). If the user only names a product, default to `sales` and say so. Don't ask.
2. **Check the inputs are fresh** (in `Desktop\minimalist-ad-tool`):
   - Winners: `research/competitor_ads_deep/*.json` (preferred), else `research/competitor_ads/*.json`. A winner is an ad still running after **30+ days**.
   - Trends: `research/trends.json`. If it's missing, say "no trend signal yet". Don't invent one.
   - Assets: `brand_packs/minimalist/assets/index.json`. Real assets lower risk.
   - Facts: fetched live from the product page.
3. **Run the ranking:** `node scripts/select_archetypes.js <product-url> <objective> "<audience>" <top>`. It writes `runs/archetypes/<handle>_<date>.json` with the shortlist and all 48 ranked.
4. **Sanity-read the shortlist before presenting it.** Is any pick obviously wrong for this product or objective? Is the reason backed by its parts (winners / trends / facts / objective)? If a pick only scores high because a coarse competitor tag covers many templates (e.g. `product_hero` maps to several), say so.
5. **Present it in plain words.** For each pick: name, one-line reason, risk level with its note, and the suggestions (e.g. "real in-hand photos would lower the risk"). Mention the next 3 in the full ranking as alternatives. Invite an override.
6. **Hand the shortlist to the brief writer** (`prompts/pipeline_brief_writer.md`) only after the user accepts it or the request says to proceed.

## Rules

- **Never remove a format.** Risk is a label, not a filter. Formats that need real people or results images are made with the "AI-GENERATED — ILLUSTRATIVE" mark and a Severe/High risk note.
- **No more than 2 picks from the same family**, so the shortlist covers different kinds of ad.
- **Competitor brands come from the Amazon best-seller searches** (`research/competitor_search_plan.json`), not a hand-picked list. Say which source the winners came from.
- **Log the reasons.** The saved ranking file is the record a human overrides from.

## Known limits

- Competitor ads are tagged with 10 coarse ad types, mapped onto 48 templates. Until the winner agent tags each winner at template level, templates that share a tag get the same winner evidence.
- No trend signal until the trend agent exists.
