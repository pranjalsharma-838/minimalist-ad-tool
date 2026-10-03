# Runbook: product-led ad library run

Run from `Desktop\minimalist-ad-tool`. `<run>` is a run id such as `2026-10-03-pilot`. Steps marked **[agent]** are judgement steps done by a Claude agent with the named prompt; everything else is code.

| # | Step | Command / prompt | Check before moving on |
|---|---|---|---|
| 0 | Refresh inputs (as needed) | `node scripts/build_brand_pack.js` · `node scripts/build_trends.js` · winners: `research/winners.json` (winner agent) | Winner tags present; trend file date |
| 1 | Pick formats per product (archetype skill) | `node pipeline/00_product_run.js <run> <formats-per-product> <handle> …` | Shortlist varied across families; risk levels sensible |
| 2 | **[agent]** Write briefs | `prompts/pipeline_brief_writer.md` on `brief_inputs/*.md` → `briefs_draft/*.json` | Every line cited |
| 3 | Gate | `node pipeline/05_compliance.js <run>` | Count of `needs_retry` |
| 4 | **[agent]** Retry loop (≤3 rounds) | `node pipeline/05b_retry.js <run> prepare` → the writer rewrites from `retry_inputs/*.roundN.md` → step 3 again | Flags removed or replaced, never reworded |
| 5 | **[agent]** AI judge (stand-in until an API key exists) | `judge_prompts/` → `judge/<id>.json`, then step 3 again | New findings → step 4 |
| 6 | Keep best versions | `node pipeline/05b_retry.js <run> finalize` | No brief dropped |
| 7 | **[agent]** Image prompt director | `node pipeline/06b_director_inputs.js <run>` → `prompts/image_prompt_director.md` → `director/<id>.json` | `node pipeline/06c_prompts.js <run>` re-checks every prompt |
| 8 | Image step | `node pipeline/07b_image_jobs.js <run>` lists every image still needed: background (director), **person** (brief `person_prompt`) and **frames** (brief `frames_prompt`; one image with 2–3 panels). `<run>/casting_overrides.json` recasts people (balanced Indian women and men); `node scripts/reuse_backgrounds.js <run>` reuses a product's existing backgrounds. Generate in ChatGPT (browser, the user logs in) or via the API (`lib/image_api.js`), then `python scripts/split_frames.py <run>` | Look at every image: no product, no text; people natural, AI mark expected |
| 9 | Compose + re-check | `node pipeline/08_compose.js <run>` → `finals/<id>.svg` (clean cut-out + shadow when the asset library has one), then `node pipeline/08b_png.js <run>` (headless Edge) → `finals/<id>.png` | Look at every final PNG |
| 10 | Save to the ad library | `node pipeline/09_library.js <run>` → `ad_library/<product>/<format>/` with `<id>.png` + `<id>.md` description; then `node scripts/make_library_gallery.js` → `ad_library/index.html` (review gallery) | Description complete; review every ad in the gallery |
