# Minimalist Ad Desk

Turns a product page into a checked, on-brand static ad, and scores any ad for claims and brand fit. Minimalist is the test brand; nothing here is published.

## Run it
1. Install **Node.js 20+**. Nothing else to install.
2. In this folder run `npm start` and open http://localhost:5173.
3. Paste your **Claude API key** in the box at the top right (or copy `.env.example` to `.env` and put it there). Without a key the app still works, with copy taken word for word from the product page and the rule checks only.

**Image Studio:** run `npm run studio` once (in a second window, next to `npm start`), sign in to ChatGPT in the browser window it opens, then leave it running. Prompts typed under "Make a different image" in the app are then made automatically, one at a time, and every image is label-checked against the real pack (up to 3 tries; a picture that still fails is shown as "Needs review" and is not offered for ads). The sign-in is remembered in its own browser profile (`%LOCALAPPDATA%\MinimalistImageStudio`); the worker never types a password. Progress is in `image_requests\worker.log`. Every image we hold, including the studio's, is searchable in the app's **Image library** tab.

`npm test` runs the tests. `npm run eval` re-runs the scorer evaluation.

**Weekly trend check (optional):** `powershell -ExecutionPolicy Bypass -File scripts\schedule_weekly.ps1` makes Windows re-check competitors' ads in the Meta Ad Library every Monday and refresh the Trending section (`-Remove` turns it off). Or run it once with `node scripts/adlib_weekly.js`.

## What's where
- `docs/SUBMISSION.md` is the place to start.
- Also in `docs/`: the decision doc (`DECISIONS.md`), the failure modes (`FAILURE_MODES.md`) and the build transcript (`TRANSCRIPT.md`).
- `ad_library/index.html` is every ad made (433), in random order, with a Trending section on top; ads that are not ready carry a warning and blocked ones have no download. The app's "Final ads" tab shows the same ads.
- `prompts/` holds every prompt the tool uses.
- `pipeline/RUNBOOK.md` explains how to run the ad library pipeline.


Run on any computer: put ANTHROPIC_API_KEY and OPENAI_API_KEY in .env, npm start; no ChatGPT browser needed. (Or paste the keys in the app header; they stay in server memory only.) With an OpenAI key the server makes queued image requests itself through the OpenAI Images edit API (the real pack photo attached, 1024x1536, same label check and up to 3 rounds); without one, `npm run studio` and the ChatGPT window stay the way.
