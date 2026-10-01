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

**What happens.** The rules are my derivation, not Minimalist legal's. 12 questions are open; for example, whether "acne" claims are acceptable on a cosmetic in India. The rules also age:
- ASCI's synthetic-content guideline takes effect around Dec 2026;
- CDSCO is issuing notices on cosmetic "treatment" claims;
- new launches aren't in the 2 Oct 2026 catalog snapshot.

A confident tool enforcing the wrong line fails two ways. It blocks good ads, and the team routes around it. Or it passes ads that are now non-compliant.

**What I'd do:**
- *Before launch:* legal signs off the rulebook and resolves the 12 open questions. Rules are versioned, and every report shows the rules version and date. The catalog check reads the live Shopify feed instead of a snapshot.
- *After launch:* a quarterly rule review, and a feed of ASCI and CDSCO updates.
- *For the target brand switch:* the shared rules are India-first. the target brand sells mostly in the US, so a US rule set (FTC, FDA's cosmetic/drug line, TikTok Shop and Amazon policies) is a **before-launch** item.

## 3. Everyone learns to write for the scorer

**What happens.** Marketers, and the generator's one automatic revision, learn which words trip the rules and route around them. "Treats acne" becomes "say bye to breakouts". "Guaranteed" becomes "you'll see it, promise". The claim survives under a softer word. The opposite failure follows: every ad converges on safe, word-for-word copy that underperforms, and the team stops using the tool for the ads that matter.

**Why it's likely.** Any fixed checker invites this. The competitor-adaptation pipeline makes it more likely, because it starts from aggressive category ads.

**What I'd do:**
- *Before launch:*
  - Keep the model layer's job as judging implied claims, not keywords.
  - Cap automatic rewrites at one; no loop that rewrites until the scorer is happy.
  - Keep the eval's adversarial set: implied cures, strengthened stats, euphemisms.
- *After launch:*
  - Add every real rejection to that set, and re-run the eval on each rulebook change.
  - Compare the performance of tool-made ads against others. If tool-made ads lose, the standard is too timid and that should be fixed openly, not worked around.

---

Also considered, but not in the top three: a rival-ad pool that drifts toward the most aggressive competitors, because aggressive ads often run longest, which skews what gets adapted. The image model producing backgrounds that imply results through mood alone (spotless surfaces, "glow" lighting). A fetched product page that is itself non-compliant, so the generator repeats the brand's own risky line at scale (partly handled by not trusting product-page wording for block-level rules).
