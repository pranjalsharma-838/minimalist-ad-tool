# Minimalist Ad Desk (prototype)

Two surfaces for Minimalist's performance-marketing team:

- **Generate**: paste a beminimalist.co product URL and get a composed 1080×1080 ad. It uses the real pack shot and only facts from the brand-authored sections of that product page. Each line cites the fact it came from, and the ad is pre-screened before export.
- **Score any ad**: paste any ad (yours, an agency's, a creator's, a competitor's), or upload an image ad. The report gives a verdict, each flagged span with its severity, the rule and source behind it, and a suggested fix.

## Setup (under 2 minutes)

Requires Node.js 20+.

```bash
npm install
npm start            # http://localhost:5173
```

Optional, for model judgment and model-written copy:

```bash
# PowerShell:  $env:ANTHROPIC_API_KEY="sk-ant-..."; npm start
# bash:        ANTHROPIC_API_KEY=sk-ant-... npm start
```

**Without a key the tool still works, with less coverage, and it says so on screen:**
- copy is taken word-for-word from the product page;
- the scorer runs its rule layer only;
- the verdict reads "limited check" and is never shown as a pass.

`npm test` runs the unit and regression tests. `node eval/run.js` runs the eval (see `eval/README.md`).

## Where things are

| Path | What |
|---|---|
| `rules/brand_rules.json` | **The standard.** 37 rules, each with a dimension, severity, rationale, sources and confidence. |
| `prompts/` | Every prompt the app sends: scorer, generator and image transcription. They are loaded from disk at runtime; no prompt text is in the code. |
| `research/` | Evidence the rules were derived from: the regulatory source base (63 entries, 60 verified against primary text), brand-language corpus, 33 real Meta Ad Library ads and the product catalog snapshot. |
| `lib/` | extract (page → fact sheet), rules (regex + computed checks), judge (model layer + validation), score (merging + verdict), generate (copy + self-score). |
| `public/` | UI and the SVG ad renderer. |
| `eval/` | 49 labelled cases, the eval harness and results. |
| `docs/` | Decision doc and failure modes. |

## Known limitations

- **Page fetch is scraping.** It is done server-side, which avoids the browser's cross-site (CORS) block, and parses Minimalist's current Shopify theme. If the theme changes, extraction fails loudly and offers manual entry. Manually entered facts are labelled unverified.
- **Catalog snapshot is dated 2026-10-02.** Concentration and SPF checks against "what Minimalist sells" don't know about later launches.
- **The model layer was not run against the live API during the build** (no key was available). It was evaluated using the exact rendered prompt and a Claude Code stand-in; see `eval/README.md`.
- **One placement only (1080×1080),** for reasons given in `docs/DECISIONS.md`.
- **Market:** the rules are India-first (ASCI, D&C Act, DMR Act, CCPA, Meta/Google), with US/EU notes. There is no per-market switch.
- **Video ads:** not supported; only static ads and text.
