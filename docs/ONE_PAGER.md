# Minimalist Ad Desk: one page

**The ask, in the brief's own words:** build the loop that makes ads the way "the video script and image brief generator we made" does, "but instead that is passed to ChatGPT for image generation"; "select 10–12 competitor ad pools, and the brand context engine runs on it and makes the changes, then the brief passes through the compliance, and then GPT receives things". Minimalist is the test brand, "so the same pipeline can later be reused for other brands". Formats go beyond before/after: "product journey, actives and information on those, and many other formats you must have found on Meta from competitors".

## Architecture

```
Product link (beminimalist.co)
  -> Facts: the page, read into numbered facts (F1, F2 ...); every ad line cites them
  -> Audiences: who the page says it is for (e.g. "Newborns & Up" + "Sensitive skin" -> parents, and grown-ups with sensitive skin)
  -> Formats: 17 agreed formats + 2 proof ads, ranked from competitor statics that ran 30+ days (Meta Ad Library)
  -> Copy: Claude (or, with no key, word for word from the page / a Claude stand-in on the same prompt)
  -> Product image FIRST: ChatGPT re-renders the real pack photo; the label is checked word by word, up to 3 rounds; reused after
  -> Scenes AFTER, in parallel: person, creator, product in hand, texture, before/after, progress (written for the product's real user)
  -> Checks: 44 rules -> AI judge (rulebook only) -> brand decisions -> verdict set in code -> three scores
  -> Review: named reviewer ticks every line before download; review ticket travels with the PNG (1:1, 4:5, 9:16)
```

Two front ends share this engine: the app (`npm start`: Ads for a product, Score any ad incl. bulk upload, Final ads, Image library) and the library pipeline (`pipeline/`, 433 ads for the top 20 sellers + the underarm roll-on). A weekly script re-checks the Meta Ad Library every Monday 10:00.

## How ads are rated

| Layer | Values | Who sets it |
|---|---|---|
| Finding severity | **Block** (stops the ad), **Fix** (change before use), **Advisory** (a note) | Rulebook; the AI judge can only be milder, never harsher |
| Verdict | Ready for human review / Ready (limited check, no AI judge) / Needs a fix / Blocked | Code, from the findings. Never "approved": "Humans approve." |
| Risk | Low / Medium / High / **Severe** | Format and imagery. "Whenever models are used in concepts we will say the risk is severe, but we will keep those as well." Severe = no download until real, consented photos |
| Scores | Brand alignment 0–100, Chance to win 0–100, Compliance | Alignment: matches Minimalist's long-running ads. Win: share of comparable statics that ran 30+ days (122 ads, 11 brands). Compliance: the verdict |

## Decisions made (all applied in code: `rules/brand_decisions.json`, `lib/rules.js`)

- **DEC-01** acne wording allowed (cure/treat/prevent still flagged). **DEC-02/03** comparison ads in, proof attached before use. **DEC-04** AI texture shots are Low risk, marked illustrative.
- **DEC-05** "Things which are mentioned in the listing will be treated leniently": listing claims one step milder, proof still confirmed.
- **DEC-06** pregnancy/lactation safety stated on the listing: accepted.
- **DEC-07** AI images: "don't block this, just a warning". Made, warned, rated Severe (India's ASCI AI rule, from about late Dec 2026).
- **Customer quotes** allowed; "customer consent needed if name is shown, otherwise fine".
- **AI judge** "should strictly stick to rules and never its own judgement": off-rulebook notes are advisory only.
- **Baby products**: ads made and rated Severe, "because this is for babies"; no before/after or progress images; parent-and-baby scenes.
- **Images**: "after the product image is rendered correctly we send the request for rest of the images", "all shoot parallely"; the real pack photo must attach or nothing is sent.
- **Library**: every ad shown, "fix and bring back and give warning", random order, blocked ads shown with the reason, no download.

## What we fixed (the main ones)

| Problem (as raised) | Fix |
|---|---|
| "New ads are loading the previously made ones" | Build makes everything fresh; old scenes never reused (approved textures excepted) |
| "Many placeholders" / blank tiles | No empty tiles; one loading line per ad with its progress |
| "Different background, this is not acceptable"; grey shelf under bottles | Renders whitened to pure white; cut-out shadows trimmed; page photos whitened |
| "Why are we not using the loop I established for getting the product image?" | Products without a checked image wait for the ChatGPT render + label check, then reuse it |
| "The original image is missing" in the ChatGPT prompt | Photo must visibly attach; Send fallback for ChatGPT's new layout |
| "This is for babies and you made random shit" | Scenes written from the page's real use and audience |
| "Hindi and Tamil ads are also in English" | Line-by-line swap via back-translation |
| Client name, emails, passwords in shared files | Removed from the repo, history and transcript |

## Tools used

Node (no installs), headless Edge for PNGs, ChatGPT via a signed-in browser window (or the OpenAI API), Claude API (or a Claude stand-in on the exact prompt), Python + OpenCV for the label check, Meta Ad Library, Git/GitHub. Cheaper models (Sonnet) did the repetitive judging and grammar work.

## Not yet proven

The AI judge and the copy model have only run as stand-ins (no keys); `scripts/check_claude_route.mjs` and `check_api_route.mjs` re-run both live. The win score is a proxy until real spend and sales data exist.
