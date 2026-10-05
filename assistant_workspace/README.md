# Assistant workspace

Where the AI assistant (Claude Code) kept its own working material during the build:

- `../CHECKPOINT_minimalist_ad_tool.md`: the running resume file, with decisions, status and open items, written as the work went.
- `../docs/AGENTS.md`: every agent, its instructions and the code checks around it.
- `../docs/TRANSCRIPT.md`: the build conversation. Grammar-only corrections and explanatory notes are disclosed in place; the raw session log stays on the build machine.
- `../pipeline/runs/<run>/`: each batch's working files (briefs, retry inputs, judge prompts and stand-in judge outputs, reuse maps, ChatGPT job lists).
- `../brand_packs/minimalist/assets/ai_renders/<product>/verification.json`: the label check for every AI-rendered pack and texture, word by word.
- `../scripts/`: one-off tools, all kept (cut-outs, label check, ChatGPT runner, weekly Ad Library check, scoring).

Nothing here is published. Minimalist is the test brand.
