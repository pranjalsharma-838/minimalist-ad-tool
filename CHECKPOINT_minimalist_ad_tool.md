# CHECKPOINT: Minimalist Ad Desk (updated 2026-10-03)

Architecture agreed with the user: `docs/ARCHITECTURE.md` (brand → winners → trends → archetype skill → brief writer ⇄ scorer retry loop → image generation; asset library feeds archetype + compose). Decisions:
- winner = 30+ days running;
- formats are never removed (risk levels Low/Medium/High/Severe instead);
- the best brief is always kept;
- AI people/results get the "AI-GENERATED — ILLUSTRATIVE" mark;
- images come from ChatGPT via the browser; the user logs in.

## Done

- **Brand context:** agent `minimalist-brand-context`; website pack built (catalog, 294-claim matrix).
- **Asset library:** 118 gallery images; 20 cut-outs (13 clean, 7 white packs unusable by colour, marked). Agent definition `minimalist-asset-library`.
- **Archetype selection:** `lib/archetype.js` + `scripts/select_archetypes.js` + skill `ad-archetype-selection`.
- **Risk levels:** `lib/risk.js`; image prompt check refuses only "draw the product".
- **Retry loop:** `pipeline/05b_retry.js prepare|finalize`, max 3 rounds, best version kept.
- **Image prompt director:** prompt `prompts/image_prompt_director.md` (with the user's draft + 8 agreed changes), `config/brand_visual_minimalist.json`, `config/layout_zones.json`. Not yet wired into the pipeline.
- **Keys:** `.env` loader and OpenAI image API module ready, waiting for the user to add `.env` with ANTHROPIC_API_KEY and OPENAI_API_KEY (never paste keys in chat).

## Running in the background (as of this update)

- Collectors: Minimalist on Amazon.in, Flipkart, Instagram → `brand_packs/minimalist/raw/`.
- Deep Meta Ad Library (10 brands) → `research/competitor_ads_deep/`.
- Google Ads Transparency → `research/competitor_ads_google/`.
- Asset labelling → `brand_packs/minimalist/assets/index.json`.
- Retry round 1 for 4 briefs in run `pipeline/runs/2026-10-02b`. Then re-run `node pipeline/05_compliance.js 2026-10-02b` and `05b_retry.js prepare` (≤3 rounds), then `finalize`.

## Next

1. When the Amazon collector finishes: the Amazon best-seller competitor search (`research/competitor_search_plan.json`) → `research/competitor_map.md`.
2. Rebuild the brand pack (`scripts/build_brand_pack.js`) + house style from Instagram.
3. Winner agent: tag winners at template level (48 types), 30+ days.
4. Wire the image prompt director between the brief and image generation.
5. The 9 new layouts.
6. Trend agent.
7. Image step via ChatGPT for the approved briefs; compose; check each final by eye.
