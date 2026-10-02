# Pipeline architecture (agreed 2026-10-03)

Test brand: Minimalist. It will be replicated for the target brand once the pipeline is proven.

```
request ─► [1 Brand context] ─► [2 Indian winners] ─► [3 Trends] ─► [4 Archetype skill] ─► [5 Brief writer] ⇄ [6 Scorer] ─► [7 Image generation]
                                                                         ▲                         │ retry ≤3 with flags as rules
                                       [Asset library] ──────────────────┘                         └ best version always kept + risk level
```

| # | Layer | Kind | Inputs → output | Status |
|---|---|---|---|---|
| 1 | Brand context | Agent `minimalist-brand-context` | brand pack → facts with ids, claims status, do-not-use list, channel differences, house style | Built; channel collectors pending |
| 2 | Indian winners | Agent (to build) | Amazon best-seller brands (source of truth for *which* brands), Meta Ad Library, Google Ads Transparency → winner file | Collectors running |
| 3 | Trends | Agent (to build) | Global + India ad libraries, trade press → timestamped trend file (formats, hooks, claim structures, what's saturated). Reports the market only; makes no recommendation | Not built |
| A | Asset library | Agent `minimalist-asset-library` | Website + Amazon listing galleries → labelled reusable assets (pack shots, cut-out PNGs, in-hand, texture, application, infographic) | Building |
| 4 | Archetype selection | Skill `ad-archetype-selection` + `lib/archetype.js` | request + 1/2/3 + asset library → ranked shortlist (default 4) with a reason and a risk level each. **Never removes a format** | Building |
| 5 | Brief writer | Agent role (`prompts/pipeline_brief_writer.md`) | shortlist + facts → briefs, every line cited | Built; loop pending |
| 6 | Scorer | Code + AI judge | brief → per-rule findings, severity, fixes, verdict | Built |
| 7 | Image generation | ChatGPT via browser (no API key) | approved image prompts → backgrounds/scenes; the tool composites the real pack shot + checked copy and re-scores | Working; risk levels pending |

## Rules agreed

- **Winner** = a competitor ad still running after **30+ days**. Competitor brands come from the Amazon.in best-seller searches (`research/competitor_search_plan.json`), not a hand-picked list.
- **Nothing is removed.** Every format is ranked. Formats that need assets we don't have are still made, with a risk level and the suggestion to use real photos.
- **Risk levels:** Low / Medium / High / Severe (`lib/risk.js`).
  - Severe: would breach ASCI/law if published as-is (e.g. AI-generated skin results or before/after).
  - High: needs real assets or consent (AI people, endorsements).
  - Medium: needs substantiation on file.
  - Low: fine with standard review.
- AI-generated people, skin or results always get a visible **"AI-GENERATED — ILLUSTRATIVE"** mark on the image.
- **The product is never generated.** The real pack shot (or its cut-out) is always composited by the tool.
- **Retry loop:** up to 3 rounds of scorer flags → brief writer, with the flags as hard rules. A flagged claim is removed or replaced by another cited fact, never reworded. **The best version is always kept**, with its remaining warnings.
- **Images:** ChatGPT through the browser. The user logs in; the agent pastes the prompts.

## Explicitly out of scope (user decision)

Voice-editor pass, pixel re-check, separate selection stage, loop ledger. the target brand replication (US rules, the target brand pack, TikTok Creative Center) comes after the Minimalist test works.
