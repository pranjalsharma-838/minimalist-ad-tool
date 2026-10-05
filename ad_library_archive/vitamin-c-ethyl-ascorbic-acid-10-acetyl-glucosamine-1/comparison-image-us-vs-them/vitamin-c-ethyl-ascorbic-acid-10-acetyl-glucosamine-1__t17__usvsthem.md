# Vitamin C 10% Face Serum — Comparison image (Us vs Them)

**INTERNAL TEST — not for publication** (Minimalist is the test brand for this pipeline).

| | |
|---|---|
| Product | Vitamin C 10% Face Serum (https://beminimalist.co/products/vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1) |
| Format | #17 Comparison image (Us vs Them) · layout `usvsthem` |
| Why this format | archetype skill |
| Angle / hook | comparison · hook: contrast |
| Blended from | Deconstruct (4500111383646459): two-column v/s comparison with one pack as the hero |
| Social proof | none |
| Placements | 1:1 vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1__t17.png · 4:5 vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1__t17.4x5.png · 9:16 vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1__t17.9x16.png |
| Language versions | none |
| Risk level | **high** |
| AI imagery | no — real pack shot on a plain canvas (no AI people) |
| Compliance verdict | Fix before review (rules + AI judge) |
| Retry rounds | 1 |
| Run | 2026-10-04-usvsthem |

## Copy on the creative
- Headline: Vitamin C content, compared


- Footnote: 86% and 40-50% are the vitamin C content of each ingredient form (product page), not the serum's strength (10%).
- CTA: Shop now · sign-off: Hide Nothing.

## Caption (primary text; compliance-checked like the creative)
Made with the stabilised vitamin C derivative Ethyl Ascorbic Acid, which has 86% pure vitamin C content, higher than the 40-50% content in other vitamin C derivatives. At a pH of ~4.0 it is highly stable. The serum's strength is 10%, as on the pack.

## Facts cited (from the product page)
```json
{"subhead":[],"tag":[],"proof_points":[],"headline":["F5"],"caption":["F5"],"footnote":["F5"]}
```

## Remaining findings / warnings
- [fix] CLM-12 "higher than": Drop the comparison, or state exactly what was compared and how (test, model, report number) in the footnote.
- [fix] UNLISTED "The serum's strength is 10%, as on the pack.": Say what the 10% is, in the pack's wording, e.g. 'The serum contains Ethyl Ascorbic Acid at 10%, as on the pack.' (confirm against the pack).
- [fix] CLM-12 "vs": Drop the comparison, or state exactly what was compared and how (test, model, report number) in the footnote.
- [fix] CLM-12 "vs": Drop the comparison, or state exactly what was compared and how (test, model, report number) in the footnote.


## Image
- Canvas: plain white or the pack photo's own studio grey (minimal house look; generated scene backgrounds are no longer drawn).


- Product: real pack shot from beminimalist.co, composited (never generated).


## Adaptation notes
Kept from the reference (Deconstruct, 129 days): the side-by-side 'v/s' header and one pack as the hero. 'Them' is the page's own comparison (F5): other vitamin C derivatives, an ingredient form, not a brand. Minimalist's Amazon gallery runs a similar table ('vs Other Vitamin C Serums'). Dropped 'India's 1st' and the claims list. CLM-12 expected; basis in the footnote. Risk High: a reviewer confirms the content figures are substantiated.

## Scores

- Minimalist alignment: **93** (high)
- Win probability: **72** (medium; proxy: still running 30+ days)
- Compliance: **45**, Fix before review
- Reviewed by: AI judge (stand-in, same prompt)
- Open findings: fix: CLM-12 "higher than"; fix: UNLISTED "The serum's strength is 10%, as on the pack."; fix: CLM-12 "vs"; fix: CLM-12 "vs"
