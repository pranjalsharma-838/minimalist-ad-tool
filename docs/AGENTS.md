# Minimalist Ad Desk: the AI agents and prompts

Minimalist Ad Desk turns a product page into a checked static ad, and scores any ad for risky claims and brand fit. Minimalist is the test brand. Nothing here is published, and every creative carries an "INTERNAL TEST - not for publication" mark.

Eleven AI roles work in the project. Each has a written instruction file (a "prompt"), and most have fixed code checks around them. The idea behind the whole design: the AI may suggest, but code and people decide. The expensive failure is a claim that gets published and should not have been, so the best verdict any ad can get is "Ready for human review", never "approved".

**Stand-ins.** No Claude API key was available during the build. Where a step is meant to call the AI directly, Claude agents were given the exact same prompt and played the part (a "stand-in"). The project notes say the app's AI layer (copy writer, judge, ad text reader) has never run live. Without a key the app still works: it copies lines word for word from the product page and runs only the fixed rule checks. The brief writer, style editor, image prompt director, translator and competitor ad tagger are Claude-agent steps by design in the library pipeline. Where this guide says "stand-in", it means the sources say so.

This guide was written on 2026-10-04 from the prompt files, the pipeline runbook, the code around each agent and the two Claude Code agent files. Every rule below comes from those files.

## Summary

| Agent | Job in one line | When it runs | Prompt file | Can it change the ad? | Who checks its output |
|---|---|---|---|---|---|
| Ad copy writer | Writes headline, subhead, proof points, footnote and CTA from product-page facts | App ("make an ad from a link") | generator_system.md, generator_user.md | Yes, it writes the copy | Code (citations, numbers, fit), then the judge and rules; a person reviews |
| AI judge | Finds problems the fixed rules miss and comments on rule hits | App (every scored ad and every generated ad); library step 5 | scorer_system.md, scorer_user.md | No, findings only | Code validates every finding and computes the verdict |
| Ad text reader | Copies the text off an uploaded ad image | App (image ads) | transcribe_system.md | No | The marketer can correct the text; then it is scored like pasted text |
| Competitor ad tagger | Describes one competitor ad's structure and the product it sells | Competitor-ad pipeline, stage 2 | pipeline_tagger.md | No | No code check found; tags feed product matching and brief inputs |
| Trend tagger | Sorts one new competitor ad into the format list | Weekly "Trending now" check | trend_tagger.md | No | Code limits it to the format list; a person can sort by hand |
| Brief writer | Turns a tagged competitor ad plus our facts into a cited ad brief | Library step 2 (and retry rounds, step 4) | pipeline_brief_writer.md | Yes, it writes the brief | Compliance gate, judge, retry loop (max 3), style check, person |
| Style editor | Trims over-long on-image text so the ad fits the house look | Library step 6b | style_editor.md | Yes, but only by cutting | Code refuses any new word or new problem |
| Image prompt director | Writes background-only prompts for the image model | Library step 7 (optional since 2026-10-04) | image_prompt_director.md | No copy changes; it shapes the background | Prompt checker (code), then a person looks at every image |
| Translator | Makes Hindi, Marathi, Tamil, Telugu or Bengali versions of an approved ad | Library language step (5c) | translator.md | Yes, it writes the translated version | Language checker (code), then a fluent human signs off |
| Brand context agent | Answers questions about Minimalist's own facts, claims and style | On demand; step 1 of the pipeline | .claude/agents/minimalist-brand-context.md | No | It cites its source file for every answer; no code check |
| Asset library agent | Labels real brand photos and cuts out pack shots | On demand, when photos are refreshed | .claude/agents/minimalist-asset-library.md | No ad; it builds the photo index | Cut-outs must pass a visual check |

The folder also holds one more prompt, 00_build_this_pipeline.md. It is a one-time instruction for rebuilding the whole pipeline for another brand (last section).

## 1. Ad copy writer

**Job.** Write the words for one 1080x1080 ad for a Minimalist product, using only what the product page says. The layout already shows the brand wordmark, the big concentration and active (for example "10% Niacinamide"), the product name and the product photo. The writer does not supply those.

**Inputs.**
- Product title and the "hero" the layout shows.
- The product page address.
- Product facts, each with an id (F1, F2 and so on). Testimonial and FAQ facts are labelled and may not be cited as claims. Ingredient lists are left out of what the writer sees.
- On a revision: the reviewer findings on the previous draft.

**Output.**
- Headline: up to 60 characters.
- Subhead: up to 120 characters.
- Proof points: 0 to 3, each up to 70 characters.
- Footnote: up to 200 characters (it prints large, so it must fit 3 lines). It holds the qualifier for any statistic or test claim, or the patch-test safety statement if the facts have one. Empty if nothing needs qualifying.
- CTA: one of "Shop now", "Learn more", "See ingredients".
- Citations: the fact ids behind each field.

**Rules it must follow.**
- Claims
  - Say only what the cited facts say. Every line cites its fact ids.
  - Shorten, reorder or plainly rephrase a fact. Do not add a benefit, result, ingredient, number, timeframe, comparison or authority ("dermatologist", "clinically") that the cited fact lacks.
  - Never make a fact stronger. "Helps reduce" must not become "eliminates". "90% subjects agreed skin felt less oily" must not become "reduces oil by 90%".
  - Never use a testimonial or FAQ answer as a claim.
  - Never turn a perception study into an efficacy claim or drop its qualifier. Any statistic carries its qualifier (who, what was measured, when) in the footnote.
  - Keep efficacy hedged where the facts hedge it, and cosmetic in scope: appearance, feel, oiliness, texture, look of spots. Not disease, cure, heal, treat, permanent or guaranteed.
  - Never use: fair, fairness, whitening, lightening (as a skin-colour outcome), flawless, miracle, magic, best, #1, guaranteed, 100%, chemical-free, toxin-free, no side effects.
- Brand voice
  - Educational and specific. Ingredient first, outcome second.
  - Calm. No questions that assume a problem about the reader ("Struggling with...?"), no "say goodbye", no warnings, no urgency, no emoji. At most one exclamation mark, and none is preferred.
  - A plain, true headline beats a clever one. If the facts are thin, write less.
- Revisions
  - Fix every reviewer finding. Never fix one by inventing a new claim. Removing the line is always acceptable.

**Guardrails in code.**
- Every line must have a citation. The cited id must exist. A testimonial, FAQ or ingredient-list fact cannot support a claim. Every number in a line must appear in the cited facts or the product title. More than 3 proof points is rejected. A line that does not fit the layout is rejected.
- If the draft fails these checks, it is sent back once with the problems listed. If it fails again, the tool falls back to word-for-word copy from the page.
- If the model is unavailable, the tool also falls back to word-for-word copy.
- The finished ad is then scored by the fixed rules and the judge. If the verdict is "Blocked" (and the tool has not already fallen back to word-for-word copy), the writer gets one more chance with the findings listed. The new draft replaces the first only if it passes the code checks; otherwise the first draft stays. The code comments say never more than that, because a loop that rewrites until the scorer is happy would start optimising against the scorer.
- Word-for-word mode uses whole facts only and never cuts a sentence, because cutting can change its meaning. The CTA is "Shop now".
- The code picks the ad format, not the writer. Seven formats exist: product hero, ingredient focus, benefit badges, study result, customer quote, question and answer, texture shot. If a product cannot fill the requested format honestly, it falls back to product hero and shows the reason. A texture shot needs a real texture photo on file. A customer quote must fit its card in full and is never shortened. A study result needs a consumer-study percentage on the page.
- The creative shows the headline, the product name and a short subhead (8 words or fewer). A longer subhead and the proof points go to the caption. The renderer adds the brand sign-off "Hide Nothing.".
- The tool refuses to write copy for the Pediatrics (baby care) range. Such copy needs a human writer and legal sign-off. The scorer can still check a human-written ad.

**Known limits.**
- The AI mode has only been tested with stand-ins. Word-for-word mode is duller by design, but it cannot invent a claim.

## 2. AI judge (scorer)

**Job.** Act as a pre-review screener. Read one ad and report the problems a brand or legal reviewer would raise, so the ad reaches them already fixed. It is not the approver. It can never declare an ad safe or approved, and nothing it writes changes the verdict directly.

**Inputs.**
- Ad type: brand-written, or creator / paid partnership (the creator's own voice).
- The ad field by field: headline, primary text, on-image text, footnote, CTA.
- The hits already found by the fixed rule checks.
- The product page facts for the advertised product (brand-written lines only, customer reviews left out). If no page is attached, it judges the claims on the ad alone.
- The rulebook (43 rules) with its version number.

**Output.**
- Findings. Each has the rule it falls under, a dimension (policy, tone or language), the field, the exact quoted span, a severity, a plain-English reason and a concrete fix.
- A review of each rule hit: "agree" or "likely false positive", with a reason.
- A two-sentence tone read and a two-sentence language read.

**Rules it must follow.**
- Role
  - Humans approve. The judge finds what they would find, earlier.
  - Unsure about policy: raise it and say what would resolve it (for example, "acceptable if the study file shows n and duration").
  - Tone and language: raise only what a Minimalist brand reviewer would ask to change. Do not pad the report with tone nits.
- Standard
  - Judge against the rulebook, not general taste. Every finding names its rule.
  - The rulebook follows Minimalist's stated philosophy and the regulations. Where the brand's own site or ads contradict that philosophy ("flawless", "skin lightening", "guaranteed UV safety"), the rulebook wins. Never excuse a line because "the brand already says this".
  - A real problem no rule covers goes under "UNLISTED". Use this sparingly. These are shown to the reviewer as opinion, capped below "block".
- Reading the ad
  - Read every field. On-image text counts at least as much as primary text.
  - Judge implied claims, not just keywords. "Say goodbye to breakouts" is a cure claim. "Your skin will thank you in 7 days" is a time-bound result. "No more dark spots" is an absolute.
  - A statistic is only as strong as its qualifier. Flag any stat worded more strongly than its study, and any stat shown without its qualifier on the creative.
  - Compare the ad to the page facts. A claim not on the page is unsubstantiated as far as the tool knows. A claim on the page can still break a rule, because the page is not a legal clearance.
  - Creator ads are not held to Minimalist's brand tone, but they are held to every policy rule, and the judge checks for a clear paid-partnership disclosure.
  - Competitor-style copy (emoji bullets, "Struggling with...?", urgency) is a tone problem, not an illegal one. Keep tone and policy separate.
- Output
  - Quote the smallest span that carries the problem, copied exactly. One finding per problem; if a phrase breaks two rules, report the more serious.
  - The fix must remove the problem without inventing a claim, and must never add a number, result or timeframe not in the ad or the facts. "Remove it" or "attach substantiation" is a valid fix.
  - Give a severity view, knowing the rulebook's severity is what counts for listed rules.
  - Do not include internal or system tags in the answer.

**Guardrails in code.**
- A finding is discarded if its rule is not in the rulebook (and not "UNLISTED"), or if its quoted span cannot be found in the ad.
- Checks that compare numbers (SPF and concentration against the product catalog) belong to the fixed rules only. The judge may not raise them. The stand-in test showed the judge raising one on a guess, which would have hard-blocked an ad on no evidence.
- Severity is the milder of the judge's view and the rulebook's. The judge can never make a rule harsher. "UNLISTED" findings are capped at "fix" and labelled as opinion.
- The judge can never remove or downgrade a fixed-rule hit. A "likely false positive" comment is shown to the reviewer and never acted on. A judge finding that repeats a fixed-rule hit on the same text is dropped as a duplicate.
- Brand and legal decisions are then applied (see below). A decided finding stays on the report, lowered to advisory and labelled with the decision id. Nothing is deleted.
- The verdict is computed in code from the findings: "Do not publish" (any block), "Fix before review" (any must-fix), or "Ready for human review". If the judge did not run, a clean result is labelled "Ready for human review (limited check)", with a warning that implied claims and tone were not assessed. If the model call fails or declines, the ad is treated as not assessed by the judge.
- In the library pipeline, only what the creative draws, plus the caption, is scored.
- Brand and legal decisions on file (4 Oct 2026):
  - DEC-01: acne wording on a cosmetic is acceptable. Still flagged: treat, cure, heal, prevent, stop, promises to eliminate ("acne-free", "no more acne", "say goodbye to breakouts"), anti-bacterial claims, and every hair-fall claim.
  - DEC-02: "Us vs Them" comparison ads are allowed. No rule changes: each still needs like-for-like proof on file and its basis on the creative, so they stay High risk and not exportable until a reviewer attaches the proof.
  - DEC-03: the brand's taglines "Hide Nothing." and "Skin Science" may appear on the creative. A judge finding that quotes only a tagline is kept but not acted on.

**Known limits.**
- The judge has only run as a stand-in. The project notes say it is not fully consistent from run to run, so a person always reviews.
- Tested with the stand-in: it caught 90% of the phrases an independent reviewer flagged on held-back ads (fixed rules alone: 52%), and 81% on 12 ads from 10 unseen brands in another channel, with no missed blocks. Its main mistake is being too strict, not too lenient.
- Without a key, no implied-claim or tone check happens at all.

## 3. Ad text reader (transcriber)

**Job.** Copy the text off an uploaded ad image so it can be checked against claims and brand rules. It does not judge the ad.

**Inputs.** The ad image.

**Output.** Headline, on-image text, footnote, CTA, illegible parts, and visual notes.

**Rules it must follow.**
- Copy text exactly as printed, including numbers, % signs, symbols (PA++++), asterisks and small print. Do not correct spelling or rephrase.
- Headline is the largest, most prominent line. On-image text is every other line, top to bottom, one per line. Footnote is the small print, disclaimers and asterisked notes. CTA is the button text.
- Text on the product pack in the photo is not ad copy. Leave it out, but mention in the visual notes if the pack shows a concentration or claim.
- If text is too small or blurry to read with confidence, do not guess. Write "[illegible]" and say where it is. Illegible small print matters because it is often the qualifier on a claim.
- Visual notes: one or two sentences on anything a claims reviewer would care about (before/after imagery, skin shown changing, a doctor or lab coat, a badge or seal, a comparison chart). Otherwise "none".

**Guardrails in code.**
- It needs an API key. Without one the app asks the user to paste the ad text instead.
- The transcript is scored like any pasted ad, with the judge's usual checks. The marketer can correct the transcript first.

**Known limits.** The project notes say the AI layer has never run live.

## 4. Competitor ad tagger

**Job.** Describe the structure of one competitor Meta skincare ad so a different brand can later adapt it. It only describes. It writes no new copy and does not judge whether the competitor's claims are true.

**Inputs.** The ad image (if available), its captured text (headline, primary text, on-image text, CTA) and the brand it came from.

**Output.** One short phrase or sentence per field:
- ad type (one of: before_after, ingredient_explainer, problem_solution, offer_promo, routine_regimen, testimonial_ugc, comparison, product_hero, expert_authority, other);
- hook angle, headline text (verbatim), visual layout, claim type, proof device, CTA style, colour palette, persona, text density (low, medium or high);
- risk notes: anything in the structure that is hard to reuse compliantly, or "none";
- why it works, written for a brief writer who will reuse the structure with different facts;
- the advertised product: name as shown, actives with the percentage exactly as printed (or empty), format, and 1 to 4 concern words.

**Rules it must follow.**
- Observe only. No new copy. No judgement on whether claims are true.
- Copy the headline verbatim.
- If the ad sells several products, describe the one shown most prominently. If no product can be identified, leave the name empty, the actives empty and the format "other".
- Never guess a concentration that is not printed.
- Never mention the brand the structure will be adapted for.

**Guardrails in code.** None found in the files read. The tags are used downstream: the matching step reads the advertised product to find the closest Minimalist product, and the tags go into the brief writer's input.

**Known limits.**
- The competitor pool covers only each brand's first ~30 active ads, because Meta rate-limited "load more". "Running 14+ days" is a proxy for "working", and it favours aggressive evergreen ads.
- The code ignores video ads: Meta evidence is statics only.
- The library run's step 0 also names a "winner agent" for research/winners.json. No separate prompt file for it exists in the prompts folder, so it is not described here.

## 5. Trend tagger (weekly)

**Job.** Sort one new competitor static ad into the project's list of ad formats (48 formats), so the weekly "Trending now" check can tell which formats several brands have started running. It describes only. It writes no copy and does not judge claims.

**Inputs.** The ad image; the text captured from its Ad Library card (page name, post text, headline, button); the format list with ids, names and families.

**Output.**
- Whether it is a static skincare, hair care or body care ad. False for a video still, a blank or broken image, or an ad that is not selling those.
- One best-fit format id. Pick by how the image is built (what a designer would have to recreate), not by its topic. For example, a discount sticker on a product photo is "Offer creative"; a pack beside three ingredient callouts is "Product + ingredients"; a quote card is "Review creative".
- Up to 2 secondary format ids, or none.
- One sentence on the layout, describing structure and not repeating claims.

**Rules it must follow.**
- Describe what you see. No copy. No judging whether claims are true.
- Never mention any brand the format might later be adapted for.

**Guardrails in code.**
- The format id must be one from the list. Secondary ids that repeat the main one are dropped, and no more than 2 are kept.
- The weekly script reads only static ads (video is skipped) that started within the last 60 days.
- Tagging runs only when a Claude key is set. Otherwise the new ads are listed as untagged and do not count toward trends until a person sorts them. A tagging failure is logged and the ad stays untagged.
- A format counts as trending only when at least 2 brands launched it in the last 60 days and the ads still run. The weekly report names any trending format not yet recreated in the library.

**Known limits.** The first weekly run's new competitor ads were tagged by stand-in agents using this prompt. Counts differ between notes (46 in the project checkpoint, 49 in the submission note).

## 6. Brief writer

**Job.** Turn one tagged competitor ad into a static ad brief for Minimalist. Keep the competitor's structure (hook angle, layout, proof device, CTA style). Replace every word and fact with Minimalist's own.

**Inputs.**
- The competitor ad's tags and text, for reference only.
- One Minimalist product's fact sheet, with ids. Testimonial, FAQ and ingredient-list facts cannot be cited as claims.
- For routine and range layouts, companion products' facts, cited with the product handle in front (for example "salicylic-lha-2-cleanser:F13").
- On a retry: the flags from the last check.

**Output.** One brief with: ad type, layout, source ad id, product title, headline, subhead, tag, caption, proof points (caption only), the layout's own blocks (actives, steps, stat, callouts, specs, range, offer, and so on), footnote, CTA, citations for each line, a layout description for a designer, an image prompt, whether real photography is needed and what, and adaptation notes (what was kept, what was dropped and why).

**Rules it must follow.**
- Keep and replace
  - Never reuse the competitor's headline, slogans or distinctive phrasing. Copying another advertiser's layout, copy or slogans so closely that it suggests plagiarism is barred (clause 4.3 of the rules of ASCI, India's advertising standards body). Adapt the mechanism, not the wording.
  - If the structure depends on something Minimalist's facts cannot support (a stat not on the page, a doctor endorsement, a time-bound result), drop that element and say so in the adaptation notes. Never invent a fact to fill the slot.
- Claims
  - Every line cites its fact ids. Numbers must appear in the cited facts or the product title.
  - Never make a fact stronger. "Helps reduce" stays hedged. A "% subjects said" perception stat stays a perception stat, and its qualifier goes in the footnote.
  - Lab or test results (for example "SPF value obtained: 56") go in the footnote. The labelled value (SPF 50) is always the claim. Only when lab results are the brief's main theme may a clearly labelled lab row sit in the body, and then the labelled value must also appear.
  - Offer terms, review text, rating data and prices are not on product pages. Write them as [placeholders in square brackets] for the marketer to fill. Never invent an offer or a review. Only a genuine review or listing data with its source and date may be used.
  - Never quote a customer review on a stat layout. FAQ facts are citable only on the FAQ layout.
- Brand voice
  - Calm and educational, ingredient and concentration first. No fear hooks ("Struggling with...?"), no "say goodbye", no emoji, no urgency, no hype words.
- Look and text amount (matched to Minimalist's own top-running static ads)
  - On the image: a headline of 2 to 6 words (usually product plus % or one plain idea), an optional subhead of 8 words or fewer, an optional tag of 3 words or fewer (a small black label stating only a fact the page states, for example "Fragrance-free"). Nothing else. No proof points on the image.
  - The caption holds how-to, extra benefits, ingredients, rating, a review and sourcing lines: 2 to 4 short sentences, each citing its facts. The caption is compliance-checked like the image.
  - The footnote appears only when the law needs it on the creative: an offer condition with "T&C apply", the SPF lab qualifier, a study qualifier for a stat on the image, or "AI illustration, not real results". One line.
  - One idea per ad. If a concept needs three claims, write three ads.
  - Length limits: headline up to 45 characters, subhead 60, tag 24, caption 400, footnote 90. CTA is "Shop now", shown as a quiet text link.
  - Offers are stated in plain words with one tiny condition line.
  - Do not write the sign-off "Hide Nothing." into the copy. The renderer draws it.
- Layout choice (default mapping; the writer may override with a reason in the notes)
  - Product hero: hero. Ingredient explainer: actives (2 to 3 ingredients). Routine: journey (2 to 3 steps using the main product and companions). Testimonial: stat (a study sentence, never a customer review). Problem-solution and expert authority: callouts (3 to 4 labels, no skin close-ups, no doctor). Comparison: usvsthem, or spec for our own tested facts. Other or range guide: range. Offer: offer. Before/after: before_after.
  - Added 2026-10-03: badges, oldnew, thisvsthat, review, socialproof, faq, question, native, pricecompare, timeline, splitscreen. The "old way" in oldnew and the two columns in thisvsthat are habits or approaches, never other brands. Timeline and splitscreen need real photography and an AI label, and the footnote states the study the timeline reflects.
  - Added 2026-10-04: usvsthem, with a headline of 2 to 6 words and 1 to 3 comparison rows. "Them" is a benchmark, an ingredient form or a label type that the page itself names. Never a named or recognisable brand, never "other brands" or "competitors", never "hide", "fake" or "harmful". The footnote states the basis of the comparison.
  - Never compare against a named brand on any layout.
- Image prompt (a background only; the tool places the real product photo and all copy on top)
  - Describe setting, surface, lighting, props and palette in the style of Minimalist's top ads: pure white or very light grey, soft daylight, at most a texture swatch (gel smear, foam, water droplets). No busy scenes.
  - Keep the right 45% of the frame clear and evenly lit for the product, and the left 50% calm and low-detail for the copy. For journey and range layouts, keep the middle 80% clear.
  - Say explicitly: no product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands. Square, 1080x1080.
  - Never ask the image model for the product or packaging, any text, human skin or faces, before/after or result imagery, or doctors, lab coats, badges, seals or certificates.
- Photo-dependent structures
  - If the structure relies on before/after skin photos or any real-result photography, set "needs real photography" and describe exactly what real, unretouched study photos are required. The image model never makes these (ASCI's 2026 synthetic-content guideline bans AI-generated results even with a label). The image prompt still asks only for a background, with two clearly empty photo frames.

**Guardrails in code.**
- The compliance gate (step 3) runs four checks on every brief: citations and numbers; fit to the layout; the image prompt checker; and the scorer (fixed rules plus judge). Nothing reaches the image step unless all pass or only advisory issues remain.
- Citation checks as for the copy writer. An offer layout without a condition is rejected. A comparison layout needs 1 to 3 rows and the basis of the comparison in the footnote. Journey and range items need a product with facts supplied. The brand's own taglines may stand as a tag without a citation.
- Long lines are moved to the caption by code, so the judge sees exactly what the creative draws and what the caption says.
- Status after the gate: "approved for image step", "needs retry", or "refused" (only when the image prompt asks to draw the product). No brief is dropped.
- Risk can only go up. The format's own risk level and the brief's AI flag are floors. Any brief that puts a person or hands in the creative (a person or frames image prompt) is rated Severe, kept for review and never exportable.
- Retry loop, at most 3 rounds (step 4). A flagged claim must be removed or replaced with a different cited fact, never reworded into a near-synonym. That instruction is written into every retry input and the gate runs again after each round. Every round is archived.
- Finalizing (step 6) keeps the best version of every brief. Versions the judge actually read come first. Among those, the lowest "cost" wins: hard failures count most, then blocks, then must-fixes, then risk level. The newest version wins a tie. A version checked only by rules is never allowed to beat one the judge read. A brief that never passes is kept "with warnings", not dropped.
- After finalizing, the style check and style editor run (section 7).

**Known limits.** The brief writer runs as a Claude agent given this prompt, not as an app feature.

## 7. Style editor

**Job.** Make finished, compliance-checked briefs that break the on-image text budget fit it, by cutting and never by writing. The brand's own top-running static ads carry 0 to 15 words on the image: one short title, one small grey line, at most one tag, with the product as the hero.

**Inputs.** The brief, the style check's findings (words on the image, headline length, footnote lines) and the product title.

**Output.** Only the fields it changes, per ad: headline, subhead, offer line, offer condition, footnote, and a one-line reason.

**Rules it must follow.**
- It may:
  - shorten a line by keeping the clause that carries the idea (for example, "Back from a run: a light lather on a wet face" becomes "Back from a run: a light lather");
  - move a line off the image by setting it to empty, so it goes to the caption;
  - use words already in the brief or the product title, reordered only where needed to read naturally;
  - keep one offer per ad, moving the second offer to the caption.
- It may never:
  - add a word that is not in the brief or the product title;
  - change a claim's strength. Never drop a hedge ("helps", "the look of"), a qualifier, "subjects said", a time frame attached to a stat, or a negation;
  - trim a study stat, a review quote or an offer's terms into a different meaning. Study-stat headlines keep the study's exact wording and are exempt from the headline limit;
  - cut a footnote below what the law needs on the creative (offer condition and "T&C apply", the SPF lab qualifier, a stat's study qualifier, the basis of a comparison, "AI illustration").

**Guardrails in code.**
- Every word of a new line must already be in the brief's printed text, caption or product title. An offer line or footnote can only be cut from its own original words.
- The replaced line moves to the caption, so nothing is lost and the re-check still sees it.
- The edit is refused if the citation check gains a problem, or if the fixed rules gain a rule hit. A refused edit leaves the brief as it was. Each pre-edit brief is archived.
- The budget the style check measures: up to 20 words on the image (up to 30 on list-style layouts), a headline of up to 8 words (study-stat headlines are exempt), and a footnote of up to 2 lines. The style check must pass afterwards.

**Known limits.** Output for this step has been produced as stand-in output (a file the script reads), per the script's own notes.

## 8. Image prompt director

**Job.** Turn one approved brief into model-ready image prompts for the background only. The tool then places the real product photo and the compliance-checked copy on top. It does not write copy, choose the layout or invent facts. Where the brief is silent, it decides and logs the decision in a "rationale" line so a human can push back.

**Inputs.**
- The brief: layout, overlaid copy, facts, visual direction, the format's risk level.
- Layout zones: where copy, product and footnote sit, as fractions of the canvas.
- The product footprint: the real pack shot's shape, colours, size and light direction. The director never describes the label or design.
- The target model, the placement (ratio and size), brand visual settings (colours, banned words, banned imagery), and how many variants.

**Output.** For each variant: what it varies on, the image prompt and a negative prompt. Plus a rationale, asset requirements, a risk level, whether an AI label is required, a risk note, and a "refused" field.

**Rules it must follow.**
- Design
  - Prompts follow a fixed order: scene and scale; composition; lighting (direction, quality, colour temperature, and it must match the pack shot's light); background (colour with hex, material, depth); one style anchor; technical (ratio, lens, resolution feel); exclusions.
  - Be specific enough that two runs give recognisably the same image. Banned vague words: clean, minimal, beautiful, stunning, luxury, glow, radiant, vibrant, dreamy, soft feminine.
  - Variants differ on exactly one axis (surface, palette or light).
  - Follow the brand visual settings: use its colours, never its banned words or imagery.
  - Apply the art-director test before output: would a senior art director at the brand sign off on this as the base for the ad?
  - House look, taken from Minimalist's own top-running static ads: pure white or very light grey seamless background, soft daylight from the upper left, a gentle contact shadow, at most one texture element where the product will stand, and a large product zone (the pack fills 50 to 65% of the frame). Avoid busy sets, coloured backdrops, decorative props and dramatic lighting.
  - Hands: Indian hands, palm up or fingers poised where the pack will be added, on white or light grey. The brand's statics show hands, never faces. People only when the brief asks for a person, real-looking Indian adults in natural light and casual clothes with a phone-camera feel, no studio gloss.
  - For ChatGPT image: write natural sentences, put the exclusions as final sentences ("Do not include: ..."), start with "Create a photographic background image:", and say "the area is intentionally empty" for each empty zone.
- Safety
  - Never generate the product. Describe only its empty zone and the shadow it needs. Never mention its label, brand name, text or packaging. If the brief asks for the product itself, set "refused" and stop. This is the one hard stop.
  - No text, letters, numbers, logos, signage or labels in the image.
  - People, hands, skin or results (before/after, timelines, medical imagery) only when the brief's format requires it. Set risk high for people or hands, severe for skin results or before/after. Set the AI label to required, and note that AI-generated results are banned even when labelled and must be replaced with real photos before any publication. Even then: no medical settings, doctors, lab coats, badges or certificates.
  - Never name any brand (competitor or other) in a prompt. Describe qualities instead. Copying another brand's look risks trade-dress copying (ASCI 4.3).

**Guardrails in code.**
- The prompt checker re-checks every director prompt (and the brief writer's own image prompt) after the director. It blocks anything that asks the model to draw the product or packaging (the only outright refusal, rated severe). It flags text or logos (high), people, hands or skin (high), before/after or result imagery (severe), and doctors, lab coats, badges, seals or certificates (high).
- "No product, no text, no people" phrases are not counted as asks. Reserving empty space for the real pack shot or for copy is not counted as an ask either.
- A prompt must also say no text, say no product, and reserve empty space. If it does not, it is marked incomplete.
- The AI label becomes required when people, hands, skin or before/after imagery appears.
- A refused prompt is left out of the prompt list sent to the image tool.
- Any image made by a model of a person, hands or skin makes the whole ad Severe: kept for review, not exportable. A person looks at every generated image for product, text and natural-looking people.

**Known limits.**
- The step is optional since 2026-10-04, because the minimal house look draws no scene backgrounds. It is still used for formats with a person or frames.
- The director's own risk labels (high for people or hands) are lower than the later project rule (Severe for any model-made person, hands or skin). Code applies the stricter rule.
- The prompt says variants are usually 3 to 4. The input script defaults to 1.

## 9. Translator

**Job.** Translate an ad that has already passed compliance in English into Hindi (hi), Marathi (mr), Tamil (ta), Telugu (te) or Bengali (bn). The job is to keep it compliant in the new language, not to improve it.

**Inputs.** One approved English brief and the target language code.

**Output.** A translation file per ad and language, with the language, the register ("everyday conversational", with Hinglish allowed for product and ingredient names), and for each shown line (headline, on-image text lines, footnote, CTA, and primary text if present) both the translated text and a literal English back-translation. Plus notes for a fluent reviewer.

**Rules it must follow.**
- Meaning-for-meaning, never stronger. Add no benefits, urgency or emotion that the English lacks. A cosmetic verb stays a cosmetic verb. Avoid words meaning treatment, cure or medicine (for example the Hindi words for ilaaj, upchaar, dawa), fairness or whitening (gorapan), guarantee, or "best" and "cheapest".
- Numbers are locked. Every %, SPF, PA rating, price, size and count appears exactly as in English. Western digits are preferred. "SPF 50", "PA++++" and "10%" stay as written.
- Keep these in Latin script: product and ingredient names (Niacinamide, Matmarine, SPF), offer text the website shows in English (quoted exactly), and the brand name.
- Translate the footnote and disclaimer into the same language and register as the claim (CCPA-11). Keep "T&C apply" as the local equivalent plus "(T&C)".
- The back-translation is literal: what the words say, not what the English said. That is how the checker catches drift.
- Customer reviews are not translated as if the customer said them in that language. Keep the original quote and add a translated line marked "(translation)".
- If something cannot be said safely in the language, keep the English phrase and explain why in the notes.
- After writing, run the translation check. Fix every "block". Explain or fix every "fix".

**Guardrails in code.**
- A missing translated line, or a missing back-translation, is a "fix".
- Numbers in the translation must match the English exactly, with native-script digits converted before comparing. Any difference is a "block".
- The full English rule set runs on the back-translation, with the same product page.
- A list of risky words per language (drug, fairness, guarantee, "best", doctor, miracle and similar), kept conservative on purpose. Any hit is a "fix" for a human to review.
- The footnote must actually be in the ad's language, or it is a "fix".
- The checker says plainly: machine checks only. A fluent human reviewer signs off every non-English version before use.

**Known limits.** The pilot passed for Hindi and Tamil only. The checks cannot read meaning in the other languages, which is why a person signs off.

## 10. Brand context agent (Claude Code agent: minimalist-brand-context)

**Job.** Be the single source of truth about Minimalist itself: its top-20 products, what it may and may not claim, what each sales channel says, and how it looks and sounds. It holds nothing about competitors or platform rules. For those it points to the regulatory sources and the rulebook, and to the competitor format library.

**Inputs.** A question, from a person or another agent. It has no memory between calls. It reads these files from disk on every call (all in the brand_packs/minimalist folder): the product catalog, the claims matrix, the channel listings (website, Amazon.in, Flipkart), the house style, the top-runner ad style, the raw captures, and the process log. It can also use research/brand_corpus.md and research/sku_dictionary.json.

**Output.** An answer that cites the file each fact came from. For any claim, it gives the claims-matrix status in the matrix's own words (DO NOT USE, NEEDS SUBSTANTIATION, SUBSTANTIATED ON PAGE or USABLE AS PUBLISHED). It flags anything open, stale, conflicting between channels or missing.

**Rules it must follow.**
- Facts
  - Never invent a product fact, claim, price or style convention. A wrong guess is worse than "not covered in my source files".
  - If a file is missing, stale or silent on the question, say so and ask.
  - Prices change often: always give the capture date, and never quote a price as current.
  - "USABLE AS PUBLISHED" means no rule hit, not legally cleared.
- Channels
  - When the website, Amazon.in and Flipkart disagree, report each one with its source. Do not pick one. Say where a reseller makes claims the brand's own pages do not.
- Style
  - Tag style points [BRAND STANDARD], and say whether they are stated (the brand says it) or observed (we saw it).
  - For creative style, layout or how much copy an ad should carry, answer first from the top-runner style file and tag it "BRAND STANDARD, observed in top-running static ads". Flag any brief or creative that breaks the text budget or the visual rules. New concepts are fine, but the look, tone and text density must match.
  - The top-runner standard: 0 to 15 words on the image; the product as the hero; offers in plain words with one tiny condition line; details in the caption; a quiet CTA and the "Hide Nothing." sign-off; hands, not faces. Full-person formats are a requested departure and must say so.
- Scope
  - Never help produce material meant to be published as Minimalist. Outputs from this project are internal tests.
  - Do not answer platform-rule or competitor questions from general knowledge.
- Refreshing
  - Re-run the collection, then rebuild the brand pack and add a dated line to the process log.
  - Use the browser, not web fetch. Pace page loads. Never log in to a channel on the user's behalf.
  - A blocked or failed page means "not captured", never "doesn't exist".

**Guardrails in code.** None. The agent's tools are read, search, shell and write. The citation habit and the claims matrix are the checks. The rule checks downstream test whatever it supplies.

**Known limits.**
- The claims matrix reflects the fixed rule layer only.
- The architecture note says Flipkart and Instagram were not captured when it was written. The agent file lists raw Flipkart and Instagram captures, but the raw folder holds no such files at the time of writing (it has website, Amazon.in, offers, reviews and top-20 files). The status of those two channels could not be confirmed.
- Two copies of the agent file exist (the repository and the user's own agent folder). They differ only in how they describe the test brand's purpose.

## 11. Asset library agent (Claude Code agent: minimalist-asset-library)

**Job.** Build and maintain the library of real brand photos: images from the brand's own website and Amazon.in galleries, labelled by type, plus transparent cut-outs of pack shots. The archetype skill reads this library to know which real photos exist for each product. Real assets lower a format's risk level.

**Inputs.** Downloaded gallery images, with a manifest. Cut-outs, with a manifest.

**Output.** The labelled index. For each image: product, file, source, type (pack shot, in-hand, application, texture, macro, infographic, ingredient, lifestyle, before/after, result, timeline, customer photo, expert photo, creator content, unboxing and others), background, light direction and shadow side, people (none, hands, face or body), whether it contains text, any claims visible on the image (listed verbatim), which of the 48 formats it can serve as a real asset for, the cut-out path (only if clean), and one line of notes. Also counts per type and per product, and a list of products with no real in-hand, application or texture image. Those gaps are why a format's risk goes up.

**Rules it must follow.**
- Never generate, retouch or alter a product image.
- Look at every image. Never guess from the filename.
- Flag any image carrying a claim on the claims matrix's DO NOT USE list.
- Use a cut-out only if its visual check is marked clean. Every cut-out must be checked on a black background.
- If an image is ambiguous, say so in the notes.
- Never label an AI-generated or third-party image as the brand's own.

**Guardrails in code.**
- The generator offers a texture-shot format only for a product with a real texture photo in this library. A texture is never drawn by AI.
- The composing step uses a clean cut-out when the library has one.

**Known limits.** Only one product (the oat cleanser) has a real texture photo on file. The seven best sellers need a texture shoot before they get texture ads. The project notes count 118 images and 13 usable cut-outs as of the last checkpoint.

## Rules every agent shares

These appear in more than one prompt, check or agent file.

- **Never invent a claim.** Every claim line cites a source: product-page text, a dated offer or price capture, or a verbatim verified review. Missing data stays a placeholder in [square brackets]. Customer testimonial, FAQ and ingredient-list facts cannot support claims (FAQ is citable only on the FAQ layout).
- **Never make a fact stronger.** Hedges, qualifiers, time frames and negations stay. A perception stat stays a perception stat, with its qualifier in the footnote.
- **Calm, cosmetic language.** No fear hooks, "say goodbye", emoji, urgency or hype. No disease, cure, heal or treat claims. No fairness or whitening claims. The translator applies the same limits in each language.
- **The product is never AI-drawn.** Image models make backgrounds only. Code adds the real pack shot or a clean cut-out with a matching shadow.
- **AI people, hands and skin are Severe.** Any ad using an AI-made person, hands or skin frames is rated Severe, carries a visible "AI-GENERATED - ILLUSTRATIVE" mark, is kept for review and is not exportable until real, consented photos replace it. Reason given in the files: ASCI's 2026 synthetic-content guideline bans AI-generated results even when labelled.
- **No endorsement cues.** No doctors, lab coats, badges, seals or certificates in generated images or copy.
- **Humans approve.** The best verdict is "Ready for human review". The AI judge can add findings but never remove a rule hit. The verdict is computed in code, never by the AI. Open legal questions give "fix, ask legal", never "block".
- **Structure, not wording.** Competitor ads supply structure only. Briefs never reuse a competitor's headline, slogans or distinctive copy, and never name a competitor brand.
- **Statics only for Meta evidence.** Image and carousel ads count, for competitors and for Minimalist's own ads. The code ignores video ads.
- **House look.** White or light grey, the product as the hero, 0 to 15 words on the image, details in the caption, a quiet CTA, and the "Hide Nothing." sign-off drawn by the renderer.
- **Nothing is dropped; everything is risk-rated.** Formats are never removed. They carry a risk level of Low, Medium, High or Severe.
- **Test brand, no client naming.** Minimalist is the test brand and outputs carry an "INTERNAL TEST - not for publication" mark. The tagger prompts must not mention the brand the structure will later be adapted for. The transcript says the shared repository copy is checked for no client name before it is pushed.
- **Scripts before agents.** Prices, offers, reviews and competitor data come from page feeds by script. Agents do only judgement work.
- **Honesty about stand-ins.** A stand-in is never presented as the real AI layer. Report miss rates and limits.

## The rebuild prompt (00_build_this_pipeline.md)

**Job.** A one-time instruction to paste into an agentic coding assistant in an empty folder, so it rebuilds this pipeline for any beauty or personal-care brand. It has blanks to fill in (brand, site, market and law, channels, category, competitor source, image tool). Minimalist was the test brand.

**What it requires (its non-negotiables).**
- The expensive failure is publishing a claim that should not run. The best verdict is "Ready for human review".
- Every claim line cites a source fact. No invented numbers, results, reviews or offers.
- The product is never AI-drawn.
- Rules come from primary sources (law, platform policy, the brand's stated philosophy and its counted copy), each with an id, a dimension (policy, tone or language), a severity (block, fix or advisory), a rationale, sources and a confidence note. Open legal questions give "fix, ask legal", never "block".
- The AI judge may add findings but never remove a rule hit. Its severity is the milder of its own view and the rulebook's. Quoted spans must exist in the ad. The verdict is computed in code.
- Formats are risk-rated, never removed. Severe formats are for review only and carry a visible AI mark.
- Retry loop of at most 3 rounds. A flagged claim is removed or replaced, never reworded. Keep the best version the judge has read.
- Scripts before agents.
- Honesty: report miss rates and limits. Never present a stand-in as the real thing.

**Its list of agents, with what each must never do.**
- Brand context: invent a fact.
- Asset library: generate or retouch the product.
- Winner tagger: copy wording into briefs.
- Brief writer: cite a fact that is not in the input.
- AI judge: remove a rule hit or raise severity.
- Image prompt director: mention the product, text or brand names.
- Translator: strengthen a claim or change a number.
- Independent labeller: open the rules, code or tool output.

The winner tagger and independent labeller are named here and in the architecture and evaluation notes. They have no prompt file in the prompts folder, so they are not covered in sections 1 to 11.
