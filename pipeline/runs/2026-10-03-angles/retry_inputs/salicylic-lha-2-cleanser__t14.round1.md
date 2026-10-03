# Retry round 1 of 3 — brief salicylic-lha-2-cleanser__t14

Rewrite the brief so that every flag below is resolved. These are HARD constraints:
- A flagged claim must be REMOVED or REPLACED with a different cited fact. Never reword it to keep the same meaning (e.g. 'anti-bacterial' -> 'fights bacteria' is not a fix).
- Keep the layout and everything that wasn't flagged unchanged.
- Every line still cites its facts; numbers must be in the cited facts.

## Flags from the scorer
- [fix] CLM-15 "Week 4": The Day 1 / After 6 washes / Week 4 frames form a time-lapse of improvement set against the 6-wash and 4-week stats, and AI-generated frames are not representative, unretouched evidence (the "not real results" note sits only in the footnote). The headline repeats the same day-one-to-week-four timeline. Suggested: Relabel the frames as routine stages (e.g. "Week 4 · in the routine") with the AI-illustration note on the image itself, or replace them with real, unretouched study photos and their qualifier.

## Current brief (JSON)
```json
{
  "ad_type": "before_after",
  "layout": "timeline",
  "source_ad_id": "salicylic-lha-2-cleanser__t14",
  "product_title": "Salicylic Acid + LHA 2% Cleanser",
  "headline": "Day one to week four with 2% Salicylic Acid + LHA",
  "subhead": "",
  "proof_points": [],
  "actives": [],
  "steps": [],
  "stat": null,
  "callouts": [],
  "specs": [],
  "range": [],
  "offer": null,
  "footnote": "90% subjects agreed significant reduction in skin oiliness after 6 washes. 90% subjects agreed skin felt smoother & brighter after 4 weeks. Frames are AI illustrations, not real results.",
  "cta": "Learn more",
  "citations": {
    "headline": [
      "F18",
      "F3"
    ],
    "subhead": [],
    "proof_points": [],
    "footnote": [
      "F16",
      "F18"
    ],
    "frames": [
      [
        "F14"
      ],
      [
        "F16"
      ],
      [
        "F18"
      ]
    ]
  },
  "layout_description": "Headline across the top; three equal portrait frames left to right (Day 1 / After 6 washes / Week 4), each with a dark label bar along its bottom edge, showing AI-generated illustrations of the same cheek area (frames_prompt); AI-GENERATED — ILLUSTRATIVE mark top-right; small real pack shot bottom-right; study/qualifier footnote across the bottom band; CTA bottom-left.",
  "image_prompt": "Empty background scene only: an off-white seamless paper backdrop with a faint cool-grey gradient and soft light from the upper left. Off-white, soft natural light, few props, clinical minimal style. Square 1080x1080. Keep the whole central band of the frame as an empty clear space, evenly lit and calm, reserved for three image panels and copy placed later, and keep the lower right corner empty for a pack photo. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.",
  "needs_real_photography": true,
  "photography_needed": "Real, consented, unretouched photos of the same person at Day 1, after 6 washes and at Week 4 from the brand's own consumer study (F16, F18), same framing, distance and light, with the study report on file, to replace the AI frames before any use.",
  "adaptation_notes": "Kept: three equal labelled frames (Re'equil), footnote carrying the study qualifier (Chemist at Play), timeframe-led headline used as routine length (Dr. Sheth's). Frame labels use only page-stated timeframes: after 6 washes (F16, oiliness perception) and Week 4 (F18, smoother and brighter perception); Day 1 is the start. The 6-week acne-occurrence line (F17) is deliberately not used: it would put an acne claim on AI skin. Both stats stay perception stats with the qualifier in the footnote. Dropped: result headline, badges, struck price, before/after wording. Frames are AI illustrations: Severe, not exportable until real study photos replace them. RATING not added: the footnote is full.",
  "angle": "transformation",
  "hook_type": "statement",
  "blend_sources": [
    {
      "id": "27546140265006255",
      "brand": "Chemist at Play",
      "took": "study qualifier footnote under labelled frames"
    },
    {
      "id": "3961263437511522",
      "brand": "Re'equil",
      "took": "left-to-right progression across equal frames"
    },
    {
      "id": "1550169393471299",
      "brand": "Dr. Sheth's",
      "took": "timeframe-led headline, used as routine length not a result"
    }
  ],
  "frames": [
    {
      "label": "Day 1",
      "cites": [
        "F14"
      ]
    },
    {
      "label": "After 6 washes",
      "cites": [
        "F16"
      ]
    },
    {
      "label": "Week 4",
      "cites": [
        "F18"
      ]
    }
  ],
  "frames_prompt": "Three side-by-side portrait panels of the same adult's cheek and nose-side area (a man in his mid-20s with a medium-brown skin tone and normal-to-oily skin), identical framing, camera distance, soft daylight from the upper left and a plain off-white backdrop in every panel, natural texture and visible pores throughout. Panel 1 (Day 1) shows a slight natural sheen; panel 2 (After 6 washes) shows the same area with a slightly less shiny look; panel 3 (Week 4) shows it looking slightly smoother and a touch brighter. Changes are small, subtle and realistic, never dramatic, with no retouching gloss. No product, no bottle, no packaging, no hands, no text, no letters, no logos.",
  "product_handle": "salicylic-lha-2-cleanser"
}
```

## Original input (facts you may cite)
# Brief input — salicylic-lha-2-cleanser__t14
source_ad_id: salicylic-lha-2-cleanser__t14
Format (from the archetype skill): #14 Progress / timeline · family Transformation · layout "timeline" (if "new", use the closest built layout and describe the intended design in layout_description) · image source REAL PHOTO:result
Why chosen: 0 competitor ads 30+ days in this format; trend signal 0.00; product page has the facts it needs; no own results yet for this format; already picked for 3 earlier product(s) in this run (variety penalty); Transformation fits a sales objective moderately
Risk: Severe — AI-generated skin/result/before-after: banned by ASCI's synthetic-content guideline even when labelled, and misleading under ASCI 1.4. Internal test only — replace with real, unretouched study photos before any publication. · Real timeline photos would lower the risk (none in the asset library for this SKU). Any AI-generated person/skin/result must carry the visible "AI-GENERATED — ILLUSTRATIVE" mark.

## Blend these proven competitor winners (structure only, never their wording)
A. Chemist at Play · 74 days · id 27546140265006255 · #12 Before / after
   What it is: Stacked labelled Before/After skin crops beside the pack, with a timed-result headline and clinical footnote.
   Headline: Take Control of Pigmentation with Vitamin C✨ | On image: Chemist at Play with essential Ceramides | Dermat Recommended. Clinically Certified. | Visible reduction in dark spots within 7 Days* | Before | After | *Based 
B. Re'equil · 66 days · id 3961263437511522 · #13 Split-screen transformation
   What it is: Split macro skin texture (greasy vs balanced) with an arrow, above a 'From X to Y' headline and the pack.
   Headline:  | On image: From Greasy Finish to Balanced Hydration Stay Fresh All Day
C. Dr. Sheth's · 37 days · id 1550169393471299 · #12 Before / after
   What it is: Huge 'fades X in 15 days' headline over unlabelled before/after face crops, pack centred, two molecule ingredient callouts and struck price.
   Headline: Price Drop: ₹1,199 → ₹839 | On image: DR. SHETH'S | Fades Dark Spots in 15 Days | Argireline® Reduces excess melanin production | Copper Peptide Fades dark spots & acne marks | @ ₹1199 ₹839 | Use Co
Blend rule: take ONE element from each — e.g. the hook device from one, the layout/visual arrangement from another, the proof device from the third. The concept must not match any single reference. Record it in "blend_sources": [{"id","brand","took"}].

## Angle (balanced across the run): transformation
Transformation journey (Progress / timeline): 3 progress frames of the same AI-illustrated skin area. Frame labels may ONLY use timeframes and outcomes stated in the page's own study lines (cite them); if the page has no timed study, label frames by routine stage (e.g. 'Day 1 · first use', 'Week 2 · daily habit', 'Week 4 · still in the routine') with NO result wording. Set ai_label_required: true; risk is Severe (AI-illustrated results; not exportable until real study photos replace the frames). Put a one-paragraph description of the 3 frames in frames_prompt (same person, same framing; no product, no text).
Record "angle": "transformation" in the brief, and "hook_type": one of question | stat | situation | offer | social_proof | contrast | ingredient | statement (the device the headline opens with — used to score our own results by hook).

## Social proof (automatic where it fits)
If the layout has a badge, footnote or CTA-band slot, add the RATING fact verbatim (e.g. "4.0★ from 1,491 reviews") citing RATING — never round up, never 'top rated'. Quote a REV* review only in review/social-proof layouts or when the angle is social_proof; quote exactly (trim with … only), with name + 'verified buyer'.

## Product facts: Salicylic Acid + LHA 2% Cleanser (main product, handle "salicylic-lha-2-cleanser")
Hero shown by the layout: 2% Salicylic Acid + LHA
F1 [name] (Product name) Salicylic Acid + LHA 2% Cleanser
F2 [claim] (Tagline / description) Reduces Sebum & Prevents Breakout Without Drying Skin
F3 [claim] (Tagline / description) A daily, gentle exfoliating, acne fighting face cleanser. It combines BHA + LHA (Salicylic Acid + Capryloyl Salicylic Acid) in 2% concentration, which provides deep cleansing, pore decongestion & sebum reduction without drying out the skin.
F5 [claim] (What Makes It Potent?) Contains Salicylic Acid (BHA) that penetrates deep into the skin & scoops out the dirt, debris, and sebum, hence reducing the oily look of the skin
F6 [claim] (What Makes It Potent?) Formulated with Capryloyl Salicylic Acid (LHA), which unlike Salicylic Acid, stays on outer layer of skin and provides gentle exfoliation, revealing soft skin. The combination provides multi-level cleansing
F7 [claim] (What Makes It Potent?) Boosted with anti-bacterial Zinc and several hydrating & soothing ingredients like Xylitylglucoside, Panthenol (Vitamin B5), Allantoin, Pentyle Glycol for hydrating overall after-feel
F8 [claim] (What Makes It Potent?) Formulated with 2 very mild sulfate-free surfactants (cleansers) that provide optimum cleaning without stripping skin lipids or proteins
F9 [claim] (What Makes It Potent?) All our ingredients are sourced from leading global supplier. Our Salicylic Acid is a high purity grade ingredient
F10 [suitability] (Ideal For) Skin type: Oily/Combination, Acne-Prone
F11 [suitability] (Ideal For) Concerns: Acne, Breakouts & Oiliness
F12 [suitability] (Ideal For) Suitable for: 15+ years of age
F13 [usage] (How to Use) Apply on wet face. Pour an appropriate quantity into wet hands, rub together into a light lather, and massage into face. Rinse thoroughly.
F14 [usage] (How to Use) When to use: AM & PM. Everyday.
F15 [study] (Consumer Studies) Balanced combination of mild surfactants with BHA & LHA gives gentle cleansing and multi-level exfoliation without irritating & drying the skin
F16 [study] (Consumer Studies) 90% subjects agreed significant reduction in skin oiliness after 6 washes
F17 [study] (Consumer Studies) 87% subjects agreed acne occurrences reduced after 6 weeks
F18 [study] (Consumer Studies) 90% subjects agreed skin felt smoother & brighter after 4 weeks
F19 [study] (Consumer Studies) Note: The product has been evaluated for safety through patch testing under the supervision of a Dermatologist.
F20 [ingredient_note] (Oat Extract) Oat extract has excellent skin soothing properties and it also repairs damaged skin barrier function
F21 [ingredient_note] (Zinc) It normalizes sebum production and because of its anti-bacterial properties, Zinc limits the proliferation of acne-causing bacteria
F22 [ingredient_note] (Allantoin) Infused with Allantoin, renowned for its soothing and anti-irritating properties, this ingredient helps calm delicate skin
F24 [faq] (Which skin types is this suitable for?) This cleanser is most suitable for oily / combination or acne prone skin. The combination of actives helps to reduce the excess sebum and also reduces the occurrence of acne. For combination skin, while cleansing, focus more on the oily t-zone by massaging more there and be gentle on the drier parts of the face ensuring thorough and consistent cleansing.
F25 [faq] (Can this product be used for men & women both?) Yes. This face cleanser works equally well for both men and women.
F26 [faq] (What is the recommended age for using this cleanser?) Anyone over 15 years of age can use this cleanser.
F27 [faq] (Is the product pregnancy safe?) Pregnant or breastfeeding individuals should not use this product without consulting their healthcare provider first.
PRICE1 [price] (price (website)) 100ml: Rs. 269 (MRP Rs. 299; 10% below MRP, both prices shown on the page) — beminimalist.co, captured 2026-10-02
PRICE2 [price] (price (website)) 250ml: Rs. 539 (MRP Rs. 599; 10% below MRP, both prices shown on the page) — beminimalist.co, captured 2026-10-02
PRICE_AMZ [price] (price (Amazon.in)) Amazon.in: Rs. 275 (8% off as shown) — search result, captured 2026-10-02 (verify it is the brand's own listing)
OFFER1 [offer] (sitewide offer (website banner)) "Build Your Own Bundle — Save an additional up to 15% off" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/apps/gbb/easybundle/1
OFFER2 [offer] (sitewide offer (website banner)) "Upto 33% OFF + Freebies" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/pages/minimalist-b2g3rdfree-one-product-free
OFFER3 [offer] (sitewide offer (website banner)) "Buy 2, Get 3rd Free" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/pages/minimalist-b2g3rdfree-one-product-free
OFFER4 [offer] (sitewide offer (website banner)) "Get Additional Free Gifts on orders above ₹1199" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/apps/gbb/easybundle/1
RATING [rating] (reviews (Yotpo, website)) 4.1 out of 5 stars from 2,732 reviews on beminimalist.co, captured 2026-10-02
REV1 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Salicylic Acid + LHA 2% Cleanser. This cleanser works really well for daily use, especially if you have oily or acne-prone skin. You only need a very small amount as it foams up nicely, which makes it last longer. It gives a deep clean and helps with oil control without making the skin feel dry or tight after washing. Post-wash, the skin feels fresh, clean, and balanced. Overall, a gentle yet effective cleanser that does a great job at cleansing pores and controlling excess oil without stripping the skin." — Shruti J., verified buyer, 5★, 2026-04-17 (beminimalist.co, captured 2026-10-02)
REV2 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "good product. Works well to reduce sebum and blackheads. Worth trying." — Anjani .., verified buyer, 5★, 2025-02-23 (beminimalist.co, captured 2026-10-02)
REV3 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "I love minimalist Brand. I like the products" — Abhi A., verified buyer, 5★, 2025-05-20 (beminimalist.co, captured 2026-10-02)
REV4 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "After using it for 4 months. It works well on my skin and I recommend it for those who have oily skin. Also, make sure to apply moisturizer after using it for maximum results. Otherwise, this cleanser can make your skin more oily or just use it once a day." — Paresh P., verified buyer, 5★, 2026-06-20 (beminimalist.co, captured 2026-10-02)
REV5 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Superb. . . It cleanses amazingly. . . My. Superb. . . It cleanses amazingly. . . My skin feels fresh after use for many hours. . . The product acts directly on my acne. . I use minimalist serum and moisturizer afterwards. . keep providing such product. . . I hv bcm a fan. Thank u" — Kan, verified buyer, 5★, 2026-04-09 (beminimalist.co, captured 2026-10-02)
REV6 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Worthy. Works very well for my acne ." — Rashi .., verified buyer, 5★, 2025-12-16 (beminimalist.co, captured 2026-10-02)

## Companion product: Niacinamide 10% Face Serum (handle "niacinamide-10-with-matmarine"; cite as "niacinamide-10-with-matmarine:F<n>"; journey/range layouts only)
niacinamide-10-with-matmarine:F1 [name] (Product name) Niacinamide 10% Face Serum
niacinamide-10-with-matmarine:F2 [claim] (Tagline / description) For reducing sebum & pores, and even skin tone
niacinamide-10-with-matmarine:F3 [claim] (Tagline / description) A daily serum formulated with pure Vitamin B3 (Niacinamide) and Matmarine. Niacinamide reduces the sebum level of the skin, improves the barrier & evens our skin tone. Matmarine is a perfect biotechnological ingredient to reduce excess sebum, shine, pores & spots.
niacinamide-10-with-matmarine:F5 [claim] (What Makes It Potent?) Unique blend of highly effective ingredients - Niacinamide, Matmarine, Zinc and Acetyl Glucosamine
niacinamide-10-with-matmarine:F6 [claim] (What Makes It Potent?) Pure 10% Niacinamide is clinically proven to promote protein synthesis, reduce melanin concentration & improve skin complexion in 2 weeks
niacinamide-10-with-matmarine:F7 [claim] (What Makes It Potent?) Matmarine is one of the biotechnological extract derive from a marine microorganism, helps regulate oiliness regardless of skin type and reduces sebum and appearance of pores, support hydration
niacinamide-10-with-matmarine:F8 [claim] (What Makes It Potent?) Lightweight serum coupled with Zinc that balances sebum activity and reduces inflammation, leaving smooth textured skin with no sticky residue
niacinamide-10-with-matmarine:F9 [claim] (What Makes It Potent?) Formulated with best ingredients sourced from leading global suppliers. Our Niacinamide comes from Lonza, Switzerland and Matmarine is sourced from Lipotec USA, USA
niacinamide-10-with-matmarine:F10 [suitability] (Ideal For) Concerns: Acne Marks, Acne Prone & Oily Skin
niacinamide-10-with-matmarine:F11 [suitability] (Ideal For) Suitable for: 16+ years of age
niacinamide-10-with-matmarine:F12 [suitability] (Ideal For) Pregnancy/Lactation: Safe
niacinamide-10-with-matmarine:F13 [usage] (How to Use) Apply 2-3 drops after cleansing & toning. Let the serum absorb fully into the skin before moving on to the next step of your routine.

## Companion product: SPF 50 Sunscreen (handle "multi-vitamin-spf-50"; cite as "multi-vitamin-spf-50:F<n>"; journey/range layouts only)
multi-vitamin-spf-50:F1 [name] (Product name) SPF 50 Sunscreen
multi-vitamin-spf-50:F2 [claim] (Tagline / description) Broad Spectrum SPF 50, PA++++
multi-vitamin-spf-50:F3 [claim] (Tagline / description) A light weight, moisturiser-meets-sunscreen. This broad spectrum SPF 50 with PA++++ rating, has a very light texture that spreads easily & disappears leaving behind a natural, moisturised, non-shiny look. Loaded with Vitamins B, E & F that help repair skin and minimise damage caused by UV exposure.
multi-vitamin-spf-50:F5 [claim] (What Makes It Potent?) This sunscreen is formulated with 4 very effective UV-filters, namely, Uvinul T 150, Avobenzone, Octocrylene and Titanium Dioxide to provide protection from UVA & UVB
multi-vitamin-spf-50:F6 [claim] (What Makes It Potent?) Boosted with Vitamin B3, B5, E and F that not only repairs skin after sun exposure, but also soothes, nourishes and hydrates skin
multi-vitamin-spf-50:F7 [claim] (What Makes It Potent?) Thoroughly tested by an independent lab and confirmed SPF of 50 was obtained
multi-vitamin-spf-50:F8 [claim] (What Makes It Potent?) It is a Photostable & Acne safe sunscreen that does not leave any white cast on application. Also, it spreads easily like a lightweight moisturiser and does not leave behind unwated residue or heavy feeling
multi-vitamin-spf-50:F9 [claim] (What Makes It Potent?) The primary filters are sourced from BASF, Germany and Royal DSM, Netherlands
multi-vitamin-spf-50:F10 [suitability] (Ideal For) Skin type: Dry/Normal, Sensitive, Oily/Combination, Acne-Prone
multi-vitamin-spf-50:F11 [suitability] (Ideal For) Concerns: Sun protection, UV exposure / damage
multi-vitamin-spf-50:F12 [suitability] (Ideal For) Suitable for: 16+ years of age
multi-vitamin-spf-50:F13 [study] (Clinical Results) This sunscreen is tested in an independent third party lab to confirm the level of protection it provides. Below is the lab report and the data points