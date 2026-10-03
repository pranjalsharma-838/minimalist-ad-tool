# Submission: Minimalist Ad Creative Tool

Mapped to the brief, standard first. Minimalist is the test brand used to build and prove the pipeline. Nothing is published, and every creative carries an "INTERNAL TEST" mark.

## Read first: two limits that colour every number below

1. **The AI judge has not run live.** No API key was available. The judge, brief writer and image director were played by Claude agents given the *exact* production prompts, and their outputs went through the app's real validation code.
   - **Plan:** set `ANTHROPIC_API_KEY` and run `npm run eval`. The same cases go through the live API on the same code path.
   - Compare live and stand-in results case by case; every disagreement becomes a regression case.
2. **How far the evaluation generalises, per split** (details in `eval/README.md`):
   - **Holdout:** a sealed, hash-split slice of the same Meta capture. It's held out, but **in-distribution**.
   - **Synthetic:** cases written during the build, so not independent.
   - **Unseen brands and channel (OOD):** 12 Amazon.in listings from 10 brands never seen in the build, labelled blind, committed before scoring and scored once. This was added after external review. It's the closest thing here to "ads you have not seen".

## 1. The standard (Part B): score any ad on policy/claims, brand tone and brand language

| What | Detail | Where |
|---|---|---|
| Rules | **43**: 32 policy/claims (9 block · 22 fix · 1 advisory), 6 tone, 5 language. Tone and language are advisory except fear hooks, because an off-voice ad costs a revision while an illegal claim costs a recall. The AI judge covers voice beyond the rules | `rules/brand_rules.json` |
| Sources | 66 regulatory/platform sources, 60 verified against primary text; brand philosophy plus counted brand copy | `research/regulatory_sources.md`, `research/brand_corpus.md` |
| AI judge guardrails | Adds findings, never removes a rule hit. Severity = min(judge, rulebook). Quotes must exist in the ad. Verdict computed in code; best verdict "Ready for human review" | `lib/judge.js`, `lib/score.js` |
| Any ad | Ad type changes tone, never law: 10 tone/language rules relax for creator ads (`lib/rules.js:278-281`) | `lib/rules.js` |
| Computed checks | Concentration and SPF vs the catalog; prices/discounts vs the dated offer capture; "free" needs its condition; creator disclosure | `lib/rules.js` |

**Evaluation** (rules + AI judge, stand-in; independent blind labels):

| Split | What it is | Phrases caught | Missed blocks | Over-severity |
|---|---|---|---|---|
| Holdout (13) | Sealed slice of the same Meta capture | **90%** (rules alone 52%) | 0 | 1 |
| **Unseen brands + channel (12)** | 10 new brands' Amazon.in listings, blind labels committed before scoring, scored once | **81%** (rules alone 43%) | **0** | 5 → 4 after a scoped fix (re-run not clean) |
| Synthetic (16) | Edge cases written during the build (not independent) | 100% | 1 | 0 |
| Tuning (20) | Read while writing the rules (optimistic) | 91% | 0 | 1 |

The tool errs toward over-flagging, not under-flagging. On unseen brands the main error was catalog checks firing on other brands' products; they are now scoped to Minimalist's own ads (details in `eval/README.md`).

## 2. Part A: product URL → finished visual ad

| What | Where |
|---|---|
| App: URL → page facts → copy where every line cites a fact → 1080×1080 ad with the **real pack shot**, pre-screened, exported with a review ticket | `npm start` → http://localhost:5173 |
| Brand facts (catalog, claims matrix, house style from the brand's own top-running statics), 118 real photos, 13 clean cut-outs | `brand_packs/minimalist/` |

## 3. Deliverables

| Deliverable | Where |
|---|---|
| Working app (Node only, no installs; Windows/macOS/Linux) | `README.md` |
| Commit history (~95 commits, about 23 of them fixes to agent mistakes) | `git log` |
| Transcript, opening with an index of where things went wrong and how each was caught | `docs/TRANSCRIPT.md` |
| Prompts as files, including a reusable prompt to build this pipeline for any brand | `prompts/` (start with `00_build_this_pipeline.md`) |
| One-page decision doc (standard, scope defence, least-sure decision, brief critique) | `docs/DECISIONS.md` |
| Failure modes: 3 design-caused, each with before/after-launch actions | `docs/FAILURE_MODES.md` |
| Architecture, run order, diagram | `docs/ARCHITECTURE.md`, `pipeline/RUNBOOK.md`, `docs/pipeline_diagram.png` |

## 4. Built on top: modules, each removable without touching the standard

- **Ad library pipeline:**
  - competitor winners (static ads running 30+ days; video ads are not evidence) tagged to 48 formats;
  - format selection (no format removed; risk levels);
  - briefs blending 3 winners with balanced angles (incl. situation-first);
  - live offers and real reviews captured by script;
  - real pack shot composited with a shadow, in 1:1, 4:5 and 9:16;
  - AI-generated people (balanced Indian women and men) only where a format needs a person.
- **House style from the brand's own top-running static ads** (8 ads, 52–98 days; videos excluded):
  - white canvas, the real pack as the hero;
  - a short title, the product name and one grey line;
  - a quiet "Shop now →" and the "Hide Nothing." sign-off.
  - **Text budget:** a style check holds every ad to the brand's statics, and **88/88 are within budget**. Details go to the caption, which is compliance-checked too.
    - **The ceiling is the statics' observed maximum, not a stricter choice:** 20 words on a single image (their routine card), 30 on list layouts (their carousel explainer cards).
    - **15 words is the median of our 88 ads after editing,** not a rule.
  - **Side by side:** `research/style_compare.png` shows the brand's statics next to one of our ads per layout.
- **Output:** `ad_library/` holds **88 unique ads and 268 PNGs**, each with a description file (creative copy, caption, facts, risk). Open `ad_library/index.html` for the gallery, which filters by product, risk and "AI people".
  - **Coverage:** every one of the 7 products has every angle (situation-first, concern solved, ingredient science, social proof, routine, texture, offer, transformation journey). Each product also has a people pack (lifestyle, human usage, routine journey) and an **Us vs Them** comparison.
  - **Models are Severe:** 40 ads use an AI model (person, hands or skin frames). Each is rated Severe and carries the AI-GENERATED mark.
  - **Comparisons:** the 7 Us vs Them ads compare only against something the brand's page itself names. The independent judge flagged all 7 (1 block: "melanin reduction" reads as skin lightening), so they stay High/Severe until a reviewer signs off the proof.
  - **Open question for the brand team:** does Minimalist do comparison ads at all? Its philosophy rejects fear-based and exaggerated marketing, but not comparison as such, and its own Amazon gallery runs a "vs Other Vitamin C Serums" table. The judge's 6 "implied denigration" flags suggest only like-for-like, study-based comparisons fit the brand. If the answer is no, the format is dropped. Its machinery (rows citing a page fact for both sides, the basis on the creative) carries over to "old way / new way" habit comparisons.
  - **Not exportable:** 48 ads: every model and Severe ad, the comparisons, and ads kept with open warnings.
  - Every image was checked by eye on contact sheets.
- **Also built:** Hindi/regional versions with their own checks, an own-results ledger feeding format choice, and a regulatory watch (ASCI AI-content rule, CDSCO).
## Other known limits

- Flipkart reviews aren't parsed and Nykaa blocks scripts, so customer language comes from the website and Amazon only.
- The AI judge is inconsistent across runs on some page wording ("reduces sebum"), so human review stays mandatory.
- Severe formats, including anything with an AI model, need real, consented photos (and study backing for any result) before any use.
- The rules are India-first; a US market needs a US rule set (FTC/FDA, TikTok Shop, Amazon).
