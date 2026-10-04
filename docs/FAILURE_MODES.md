# Failure modes: how a well-functioning version still causes a bad outcome

None of these are bugs. Each is what happens when the tool does exactly what it was built to do.

## 1. "Ready for human review" turns into "approved"

**What happens.** The pre-screen catches most of what reviewers catch: 91% of reviewer-flagged phrases in the eval. So reviewers start trusting it, and review shrinks to a glance at the verdict. Then a claim of a kind the rulebook has never seen goes out with a clean pre-screen. Examples: a new ingredient trend, a new regulator focus, a claim made through the image rather than the words.

**Why it's likely.** The better the tool performs, the stronger this effect gets. The eval itself shows the gap: rules alone caught 52% on the sealed set, so nearly half of what was caught depended on model judgement, which can't be audited the same way.

**What I'd do:**
- *Before launch*, partly built already:
  - The verdict's best value is "Ready for human review". It is never "approved".
  - A rules-only check is grey, not green.
  - Every export carries a review ticket listing which fact each line cites.
  - Add: reviewer sign-off per claim line in the ticket, not one tick per ad.
- *After launch:* legal re-reviews a random 10% of passed ads each month, and every miss becomes a new rule plus a regression test. Track the reviewer override rate. If it falls toward zero, that's a warning sign, not a success.

## 2. The standard is wrong, or goes stale, and the tool enforces it confidently

**What happens.** The rules are my derivation, not Minimalist legal's. 11 questions are still open; for example, which data can back "India's No.1". (The acne question was answered yes on 4 Oct. The answer sits in `rules/brand_decisions.json` and is applied in code, so it can be reversed by deleting one entry.) The rules also age:
- ASCI's synthetic-content guideline takes effect around Dec 2026 (`scripts/reg_watch.js` now watches ASCI and CDSCO pages and lists new items);
- CDSCO is issuing notices on cosmetic "treatment" claims;
- new launches aren't in the 2 Oct 2026 catalog snapshot.

A confident tool enforcing the wrong line fails two ways. It blocks good ads, and the team routes around it. Or it passes ads that are now non-compliant.

A design-caused version of this, which is my own choice working as intended: a claim on Minimalist's own product page gets its severity lowered one step (DECISIONS §5). If that page line is itself risky (e.g. "Reduces Acne"), the generator repeats it in every ad built from that page, one level softer than it should be, at scale. *Before launch:* legal reviews the product pages the generator reads, not just the ads. *After launch:* any page line that legal later rejects is added to a page-level deny list, and every ad built from it is re-scored.

**What I'd do:**
- *Before launch:* legal signs off the rulebook and answers the 11 open questions, each recorded in `rules/brand_decisions.json` like the acne one. Rules and decisions are versioned, and every report shows both versions. The catalog check reads the live Shopify feed instead of a snapshot.
- *After launch:* a quarterly rule review, and a feed of ASCI and CDSCO updates.
- *For a brand or market switch:* the shared rules are India-first. For a brand selling mainly in the US, a US rule set (FTC, FDA's cosmetic/drug line, TikTok Shop and Amazon policies) is a **before-launch** item.

## 3. Everyone learns to write for the scorer

**What happens.** Marketers, and the generator's one automatic revision, learn which words trip the rules and route around them. "Treats acne" becomes "say bye to breakouts". "Guaranteed" becomes "you'll see it, promise". The claim survives under a softer word. The opposite failure follows: every ad converges on safe, word-for-word copy that underperforms, and the team stops using the tool for the ads that matter.

**Why it's likely.** Any fixed checker invites this. The competitor-adaptation pipeline makes it more likely, because it starts from aggressive category ads.

**What I'd do:**
- *Before launch:*
  - Keep the model layer's job as judging implied claims, not keywords.
  - Cap automatic rewrites at 3 rounds (the agreed loop). A flagged claim may only be *removed or replaced by another cited fact*, never reworded, and the best judged version is kept. There's no open-ended "rewrite until the scorer is happy".
  - Keep the eval's adversarial set: implied cures, strengthened stats, euphemisms.
- *After launch:*
  - Add every real rejection to that set, and re-run the eval on each rulebook change.
  - Compare the performance of tool-made ads against others. If tool-made ads lose, the standard is too timid and that should be fixed openly, not worked around.

---

## Seen in the pilot (2026-10-03): evidence for the three modes above

- **The judge is not consistent between runs (mode 1).** The same page wording, "reduces sebum & pores", was passed on the pilot's niacinamide t3 and flagged as a body-function claim on the scale run. An AI judge is a second opinion, not a standard. That's why human review stays mandatory and why every miss should become a rule.
- **Checking depth matters (mode 1).** Finalize once brought back a version the AI judge had never read, because it looked "cleaner" on rules alone. It's fixed: versions are now compared only at equal checking depth. But it shows how a well-meant "keep the best" step can quietly undo a review.
- **Live data goes stale (mode 2).** Offers and prices are captured on a date and printed in the footnote. Re-running `collect_offers.js` before every export is a process step, not something the tool enforces yet. One freebie offer had no terms on the site at all; that ad was kept "with warnings" rather than given made-up terms.
- **Severe formats must not leak (mode 1).** Transformation-journey and before/after creatives carry the AI mark and a Severe risk, and are not exportable until real study photos replace the AI frames. The risk is someone cropping the mark off. The library description repeats the risk level so the warning travels with the file.
- **Language versions (mode 3).** Translation drifts claims easily; the pilot caught "3rd" written as a word, which broke the numbers lock. Machine checks run on a back-translation, but a fluent reviewer must sign off every non-English version.
- **An unattended job can hang instead of failing (2026-10-04).** The first test of the weekly Ad Library check waited forever after the hidden browser's connection dropped, and left the browser running. Every browser call now has a time limit, a lost connection starts a fresh browser, the whole run has a 25-minute cap, and the weekly report says which competitor pages couldn't be read (their ads keep last week's status instead of being marked stopped).
- **A design change can drop legal text silently (mode 1, 2026-10-04).** When the footnote was cut to two lines for the cleaner house look, the overflow check still allowed three. Two creatives lost the end of their qualifier, including an AI-illustration note. The check now matches what's drawn, and the style check fails any footnote past two lines. The lesson: every visual change needs the legal-furniture checks re-run, not just an eye-check.
- **The record of the process can be wrong, not just the product (observed, 2026-10-04).** The transcript export read only normal user turns. Every message the user typed while the agent was mid-task is logged as a separate "queued" entry, so 40 of the user's messages, including corrections and pushback, were silently missing. The transcript looked cleaner than the build really was. Nothing in the app caught it; it surfaced while adding grammar corrections for the newest messages. Fixed in `1ffd766` and disclosed in the transcript's index. The lesson: the build log is a system with its own failure modes. Check it against the raw session, not only by reading it.
- **Comparisons attract the hardest findings (mode 1).** All 7 Us vs Them ads were flagged by the independent judge, even though each comparison came from the brand's own product page. The page proves the brand said it, not that it's like-for-like. So comparisons stay High or Severe, and a human signs off the proof before any export.

Also considered, but not in the top three: a rival-ad pool that drifts toward the most aggressive competitors, because aggressive ads often run longest, which skews what gets adapted. The image model producing backgrounds that imply results through mood alone (spotless surfaces, "glow" lighting). A fetched product page that is itself non-compliant, so the generator repeats the brand's own risky line at scale (partly handled by not trusting product-page wording for block-level rules).
