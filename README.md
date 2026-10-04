# Minimalist Ad Desk

Turns a product page into a checked, on-brand static ad, and scores any ad for claims and brand fit. Minimalist is the test brand; nothing here is published.

## Run it
1. Install **Node.js 20+**. Nothing else to install.
2. In this folder run `npm start` and open http://localhost:5173.
3. Paste your **Claude API key** in the box at the top right (or copy `.env.example` to `.env` and put it there). Without a key the app still works, with copy taken word for word from the product page and the rule checks only.

`npm test` runs the tests. `npm run eval` re-runs the scorer evaluation.

## What's where
- `docs/SUBMISSION.md` is the place to start.
- Also in `docs/`: the decision doc (`DECISIONS.md`), the failure modes (`FAILURE_MODES.md`) and the build transcript (`TRANSCRIPT.md`).
- `ad_library/index.html` is every ad made, with a Trending section on top. Open it in a browser.
- `prompts/` holds every prompt the tool uses.
- `pipeline/RUNBOOK.md` explains how to run the ad library pipeline.
