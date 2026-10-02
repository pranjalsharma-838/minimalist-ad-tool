# CHECKPOINT: Minimalist Ad Desk (paused 2026-10-02)

Repo: `Desktop\minimalist-ad-tool` (git, last commit "Format run gate…"). Test brand: Minimalist, standing in for the target brand BPC. Run the app with `node server.js`; tests with `npm test` (35 passing). Git binary: `%LOCALAPPDATA%\Programs\Git\cmd`.

## Where it stopped

**Run `pipeline/runs/2026-10-02b`** (format-aware run, 12 briefs across 8 layouts):
- **Done:** stages 1–5 (rules only):
  - 8 briefs approved for the image step;
  - 2 flagged, both real: SPF 56 used as a claim on 4416615341943591; "sweatproof" on 4500111383646459;
  - 2 blocked, both real: anti-bacterial drug claims on 9868853523169382 and 1115173371246578.
- **Was running when paused:** the stand-in AI judge for the 12 briefs. It was stopped and wrote 0 files.

## Resume steps

1. Re-run the stand-in judge. Inputs are `judge_prompts/system.md` + `<id>.user.md`, with schema `eval/rendered/schema.json`; outputs go to `judge/<id>.json`. Then run `node pipeline/05_compliance.js 2026-10-02b`.
2. Run `python pipeline/06_deck.py 2026-10-02b`.
3. Image step for the approved briefs. The user logs in to ChatGPT themselves; never type a password.
   - Open new chats with the in-app "New chat" button, not chatgpt.com (opening the site directly gives "ChatGPT Work: couldn't load your account"; Reload fixes it).
   - Target the message box with `.ProseMirror-focused[aria-label="Ask ChatGPT"]`.
   - Capture every "Generated image" on the page, then run `node pipeline/07_save_image.js <run> <id>`. It deduplicates against images already saved, because old chats stay on the page.
4. Run `node pipeline/08_compose.js 2026-10-02b`. Copy `finals/*.svg` to `public/dev-gen/`, screenshot each at 1080×1080 to `finals/<id>.png`, and check every final by eye.
5. Then: re-run the eval (`node eval/run.js`) and do the full step-by-step recheck. The user asked for a detailed write-up of every problem: the problem, the proposed solution, the approach taken, and the goal.

## Run 1 (`pipeline/runs/2026-10-02`): complete

- 6 backgrounds made.
- 5 finals composed (hero layout, real pack shots in a white frame).
- The before/after is held for real photos.

## Open items for the user

- Change both passwords pasted in chat, and remove them from the transcript before sharing it.
- Clear Git with IT.
- Get an Anthropic API key (the AI layer is a stand-in for now).
- Add US rules before the target brand uses this for real.
- Legal sign-off on the rulebook and the 12 open legal questions.
- Real cut-out pack shots, so products blend into backgrounds.
