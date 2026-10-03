# Retry round 1 of 3 — brief alpha-arbutin-2__t15

Rewrite the brief so that every flag below is resolved. These are HARD constraints:
- A flagged claim must be REMOVED or REPLACED with a different cited fact. Never reword it to keep the same meaning (e.g. 'anti-bacterial' -> 'fights bacteria' is not a fix).
- Keep the layout and everything that wasn't flagged unchanged.
- Every line still cites its facts; numbers must be in the cited facts.

## Flags from the scorer
- [fix] CLM-05 "Dry/normal, sensitive, oily/combination, acne-prone skin": Under a headline about irritation, listing "sensitive" skin beside a patch-test line reads as a promise that the serum won't irritate sensitive skin. The page's own FAQ (F33) says people with extra sensitive skin should consult a dermatologist first, and the ad drops that caveat. Suggested: Keep the page's suitability wording and add its caveat: "Dry/normal, sensitive, oily/combination, acne-prone skin. Extra-sensitive skin: consult a dermatologist first." Or keep the headline neutral so the line does not read as an irritation reassurance.

## Current brief (JSON)
```json
{
  "ad_type": "problem_solution",
  "layout": "callouts",
  "source_ad_id": "alpha-arbutin-2__t15",
  "product_title": "Alpha Arbutin 2% Face Serum",
  "headline": "Questions on irritation? Our notes on Alpha Arbutin 2%",
  "subhead": "",
  "proof_points": [],
  "actives": [],
  "steps": [],
  "stat": null,
  "callouts": [
    {
      "text": "Patch tested for safety under a Dermatologist's supervision",
      "cites": [
        "F25"
      ]
    },
    {
      "text": "Dry/normal, sensitive, oily/combination, acne-prone skin",
      "cites": [
        "F9"
      ]
    },
    {
      "text": "2-3 drops after cleansing & toning",
      "cites": [
        "F19"
      ]
    },
    {
      "text": "Use sunscreen during the day for best results",
      "cites": [
        "F19"
      ]
    }
  ],
  "specs": [],
  "range": [],
  "offer": null,
  "footnote": "3.9 out of 5 stars from 1,800 reviews on beminimalist.co, captured 2026-10-02",
  "cta": "Learn more",
  "citations": {
    "headline": [
      "F25"
    ],
    "subhead": [],
    "proof_points": [],
    "footnote": [
      "RATING"
    ]
  },
  "layout_description": "Headline across the top; the real pack shot centred; two short labels on each side, each wired to the pack by a thin line (patch-test note, skin types, how to apply, sunscreen reminder); no skin close-ups; rating line in the footnote band, CTA bottom-left.",
  "image_prompt": "Empty background scene only: a pale terrazzo tabletop seen from directly above, off-white with very faint grey flecks, even soft daylight and no shadows. Off-white, soft natural light, few props, clinical minimal style. Square 1080x1080. Keep the middle 80% of the frame as an empty clear space, evenly lit and calm, reserved for pack photos and copy placed later, with any props only at the extreme edges. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.",
  "needs_real_photography": false,
  "photography_needed": "",
  "adaptation_notes": "Concern: irritation (customer words such as 'no irritation or breakout', 'did not face any major skin sensitivity'), answered only by what the page states: the supervised patch-test note (F25), the skin types it lists (F9) and how to apply (F19). The page makes no 'will not irritate' claim, so none is made, and the label only restates its own wording. The 'extra sensitive skin should consult a dermatologist' FAQ (F33) is not citable here, so no sensitive-skin promise is added. The dryness concern (answered-by is the INCI list) and texture concern (F5 is not about texture) were not used. Kept: concern-first headline order (Re'equil), labels wired to a centred pack (Deconstruct), one detail per label (The Derma Co). Dropped: skin close-ups, '4 problems, 1 solution' count, #1 best-seller strip, line-art concern icons.",
  "angle": "concern_solved",
  "hook_type": "question",
  "blend_sources": [
    {
      "id": "1386072156792745",
      "brand": "Re'equil",
      "took": "concern named first, product second"
    },
    {
      "id": "1739037801557913",
      "brand": "Deconstruct",
      "took": "labels wired by thin lines to a centred pack"
    },
    {
      "id": "2307135286779864",
      "brand": "The Derma Co",
      "took": "one page detail paired with each label"
    }
  ],
  "product_handle": "alpha-arbutin-2"
}
```

## Original input (facts you may cite)
# Brief input — alpha-arbutin-2__t15
source_ad_id: alpha-arbutin-2__t15
Format (from the archetype skill): #15 Problem → product · family Problem · layout "callouts" (if "new", use the closest built layout and describe the intended design in layout_description) · image source LAYOUT
Why chosen: 3 competitor ads 30+ days in this format (2 in this category); trend signal 0.70; product page has the facts it needs; no own results yet for this format; Problem fits a sales objective moderately
Risk: Low — Real asset available in the library (brand_packs/minimalist/assets/raw/alpha-arbutin-2/01.png).

## Blend these proven competitor winners (structure only, never their wording)
A. Re'equil · 66 days · id 1386072156792745 · #15 Problem → product
   What it is: '4 problems, 1 solution' with four line-art concern icons around a tube balanced on an open palm, #1 best-seller strip below.
   Headline:  | On image: 4 Problems, 1 Solution | Dark spots | Acne & acne scars | Uneven skin texture | Early signs of ageing | Re'equil 0.1% Retinol | India's #1 Best-Selling Night Cr
B. Deconstruct · 53 days · id 1739037801557913 · #15 Problem → product
   What it is: '4 problems, 1 solution' headline with four labelled skin-concern thumbnails wired by callout lines to a central pack.
   Headline: Powered by Liposomal Technology | On image: de construct | 4 Problems. 1 Solution! | Acne Marks | Hyperpigmentation | Dark Spots | Tanning | SHOP NOW | [pack: DARK SPOT CLEARING SERUM 2% Liposomal Alpha A
C. The Derma Co · 36 days · id 2307135286779864 · #13 Split-screen transformation
   What it is: '2 problems, 2 actives, 1 product' headline over an unlabelled split face, with two ingredient-to-benefit callouts below.
   Headline: One Wash. Two Fixes. | On image: THE derma co | 2 PROBLEMS | 2 ACTIVES | 1 Face Wash | 2% Salicylic Acid Fights acne at the root | 2% Niacinamide Fades acne marks | [pack: 80 mL 2% Sali-Cinamid
Blend rule: take ONE element from each — e.g. the hook device from one, the layout/visual arrangement from another, the proof device from the third. The concept must not match any single reference. Record it in "blend_sources": [{"id","brand","took"}].

## Angle (balanced across the run): concern_solved
Concerns customers raise for this product type (real reviews; scripts/mine_customer_language.js). Use ONLY a concern that has an 'answered by' fact, cite that fact, and you may echo the customer's words (not quoted as a testimonial):
- irritation: competitors 8 mentions (0 in ≤3★) · answered by F19 "Apply after cleansing & toning. Apply 2-3 drops. With gentle circular motion, spread it all over your face. Use sunscree" · customer words: "Isse skin par koi irritation ya breakout nahi hua." (Amazon.in · Pilgrim, 5★) / "The product felt gentle on my skin, and I did not face any major skin sensitivity or irritation issues while using it." (Amazon.in · Pilgr
- dryness: competitors 3 mentions (0 in ≤3★) · answered by F29 "Water/Aqua, Dimethyl Isosorbide, Alpha Arbutin, Ethoxydiglycol, Pentylene Glycol, PEG-40 Hydrogenated Castor Oil, Feruli" · customer words: "I apply 2–3 drops on a clean, dry face, gently spread it over the skin, and then follow it with a moisturizer." (Amazon.in · Pilgrim, 4★) / "This is the best lighting serum, I have black spots on my face due to pimples 
- texture: competitors 13 mentions (0 in ≤3★) · answered by F5 "A skin tone enhancing serum with a potent & safe skin lightening active Alpha Arbutin (9 times more effective than Beta " · customer words: "Good Glow & Skin Texture Improvement, But Feels Oily on Face." (Amazon.in · Pilgrim, 4★) / "I especially liked its smooth texture and glow-boosting effect." (Amazon.in · Pilgrim, 5★)
Concern solved: name a common cosmetic concern customers voice (sticky feel, heavy texture, white cast, greasiness, complicated routines) and answer it ONLY with a page fact that addresses it. Never name a competitor; no medical conditions.
Record "angle": "concern_solved" in the brief, and "hook_type": one of question | stat | situation | offer | social_proof | contrast | ingredient | statement (the device the headline opens with — used to score our own results by hook).

## Social proof (automatic where it fits)
If the layout has a badge, footnote or CTA-band slot, add the RATING fact verbatim (e.g. "4.0★ from 1,491 reviews") citing RATING — never round up, never 'top rated'. Quote a REV* review only in review/social-proof layouts or when the angle is social_proof; quote exactly (trim with … only), with name + 'verified buyer'.

## Product facts: Alpha Arbutin 2% Face Serum (main product, handle "alpha-arbutin-2")
Hero shown by the layout: 2% Alpha Arbutin
F1 [name] (Product name) Alpha Arbutin 2% Face Serum
F2 [claim] (Tagline / description) Reduces Dark Spots, Marks & Evens Skin Tone
F3 [claim] (Tagline / description) An anti-pigmentation daily serum with high purity Alpha Arbutin along with Butylresorcinol for dramatically reducing dark spots and blemishes for brighter, even-looking skin.
F5 [claim] (What Makes It Potent?) A skin tone enhancing serum with a potent & safe skin lightening active Alpha Arbutin (9 times more effective than Beta Arbutin) that ensures even tone in 5 weeks
F6 [claim] (What Makes It Potent?) Butylresorcinol can strongly inhibit the activity of tyrosinase, resulting in reduction of hyperpigmentation & age spots. Found to have 20 times more potent inhibitory activity than Kojic Acid in a clinical study
F7 [claim] (What Makes It Potent?) Ferulic acid is a powerful antioxidant and can neutralize several different types of free radical. Helps in protecting & also reversing damage caused by UV rays
F8 [claim] (What Makes It Potent?) Formulated with the most effective Alpha Arbutin, sourced from Alfa Aesar, USA
F9 [suitability] (Ideal For) Skin type: Dry/Normal, Sensitive, Oily/Combination, Acne-Prone
F10 [suitability] (Ideal For) Concerns: Hyperpigmentation, Acne Marks, Tanning & Sunspot
F11 [suitability] (Ideal For) Suitable for: 18+ years of age
F12 [study] (Clinical Results) We conducted in-vitro test (lab test) on skin identical model to evaluate the efficacy of this product in comparison to an Alpha Arbutin 2% serum from an international brand that offers active based products (called benchmark here).
F13 [study] (Clinical Results) Minimalist Alpha Arbutin 2% Serum reduced melanin concentration significantly higher than the benchmark product. While the benchmark product reduced melanin by 56%, Minimalist Alpha Arbutin 2% reduced melanin concentration by 70%. That is 25% more reduction than the benchmark product.
F14 [study] (Clinical Results) Study objective: To assess the skin depigmentation efficacy of test products on Melanoderma skin 3D model.
F15 [study] (Clinical Results) Tissue kit: MEL-312/300B, 12/24
F16 [study] (Clinical Results) Pigment: Black skin
F17 [study] (Clinical Results) Study report no: PREC/USSL/SR/2021-144
F18 [study] (Clinical Results) (Based on an in-vitro study conducted by MS Clinical Research Lab - an independent testing lab)
F19 [usage] (How to Use) Apply after cleansing & toning. Apply 2-3 drops. With gentle circular motion, spread it all over your face. Use sunscreen during the day for best results.
F20 [usage] (How to Use) When to use: AM & PM. Everyday
F21 [study] (Consumer Studies) Alpha Arbutin and Butylresorcinol together are potent & safe tyrosinase inhibitors and reduce melanin synthesis, making them very effective for reducing hyperpigmentation
F22 [study] (Consumer Studies) 90% subjects noticed reduction in hyperpigmentation marks in 8 weeks
F23 [study] (Consumer Studies) 90% subjects said skin became clear & even looking in 8 weeks
F24 [study] (Consumer Studies) 93% subjects said it reduced sun tanning after 4 weeks of use
F25 [study] (Consumer Studies) Note: The product has been evaluated for safety through patch testing under the supervision of a Dermatologist.
F26 [ingredient_note] (Alpha Arbutin) It helps treat hyperpigmentation by effectively reducing the production of melanin
F27 [ingredient_note] (Butylresorcinol) A highly effective tyrosinase inhibitor used for depigmentation purpose. In a study, Butyresorcinol exhibited 20 times more potent inhibitory activity than Kojic Acid
F28 [ingredient_note] (Ferulic Acid) Potent antioxidant that reverses signs of sun damage (UV exposure), and makes skin look even & healthier overall
F30 [faq] (Can Alpha Arbutin be used on dark or brown skin?) Alpha Arbutin can be used by all skin tones as it does not change your skin color but evens out your complexion. It lightens the areas that are darker such as age spots, sun damage, hyperpigmentation, etc. due to excessive melanin production, resulting in a natural even skin tone.
F31 [faq] (Can Alpha Arbutin be used on dark or brown skin?) Alpha Arbutin is an advanced molecule and does not cause cell cytotoxicity; thus it is a safe skin lightening active suitable for all skin tones.
F32 [faq] (What is the recommended age, and who can use this product?) The early-20s is a suitable age for using Alpha Arbutin, as that's when the first signs of age spots & sun damage in the form of pigmentation might start showing.
F33 [faq] (What is the recommended age, and who can use this product?) Alpha Arbutin is a milder alternative to other agents like Kojic Acid (which has high cytotoxicity) and is safe to use. However, people with extra sensitive skin should consult a dermatologist before considering incorporating Alpha Arbutin into their skincare.
F34 [faq] (What is the recommended age, and who can use this product?) Both males and females with skin concerns like blemishes, acne scars, dark spots, and uneven skin tone can benefit from Alpha Arbutin.
F35 [faq] (Is the product pregnancy safe?) Pregnant or breastfeeding individuals should not use this product without consulting their healthcare provider first.
PRICE1 [price] (price (website)) 30ml: Rs. 494 (MRP Rs. 549; 10% below MRP, both prices shown on the page) — beminimalist.co, captured 2026-10-02
PRICE2 [price] (price (website)) 10ml: Rs. 237 (MRP Rs. 249; 5% below MRP, both prices shown on the page) — beminimalist.co, captured 2026-10-02
PRICE_AMZ [price] (price (Amazon.in)) Amazon.in: Rs. 616 (18% off as shown); Save 10% with coupon — search result, captured 2026-10-02 (verify it is the brand's own listing)
OFFER1 [offer] (sitewide offer (website banner)) "Build Your Own Bundle — Save an additional up to 15% off" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/apps/gbb/easybundle/1
OFFER2 [offer] (sitewide offer (website banner)) "Upto 33% OFF + Freebies" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/pages/minimalist-b2g3rdfree-one-product-free
OFFER3 [offer] (sitewide offer (website banner)) "Buy 2, Get 3rd Free" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/pages/minimalist-b2g3rdfree-one-product-free
OFFER4 [offer] (sitewide offer (website banner)) "Get Additional Free Gifts on orders above ₹1199" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/apps/gbb/easybundle/1
RATING [rating] (reviews (Yotpo, website)) 3.9 out of 5 stars from 1,800 reviews on beminimalist.co, captured 2026-10-02
REV1 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Sach a good serums. . .. Sach a good serums. . ." — Anamika M., verified buyer, 5★, 2025-10-02 (beminimalist.co, captured 2026-10-02)
REV2 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "very useful. It’s Makes my skin healthy, glowing. . reduce my acne spot & pigmentation" — Books m., verified buyer, 5★, 2025-02-25 (beminimalist.co, captured 2026-10-02)
REV3 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Like the texture. I like the texture of the serum.....I haven't seen much effect on my pigmentation And acne scars yet hopefully I'll get to see it soon." — Anusuya R., verified buyer, 4★, 2024-09-08 (beminimalist.co, captured 2026-10-02)
REV4 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Amazing. I bought this for my mom and I can see a significant reduction in her hyperpigmentation. . . It's also restoring the skin nice." — Shanice B., verified buyer, 5★, 2026-06-14 (beminimalist.co, captured 2026-10-02)
REV5 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Small broken. Top was broken while i am receive and some liquid gone other then that all good" — Sreeram K., verified buyer, 4★, 2025-06-03 (beminimalist.co, captured 2026-10-02)
REV6 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Very effective product for reducing hyperpigmentation. I have been using it for last 3 weeks and I am able to see significant changes in my pigmentation" — Smriti B., verified buyer, 4★, 2025-05-31 (beminimalist.co, captured 2026-10-02)

## Companion product: Salicylic Acid + LHA 2% Cleanser (handle "salicylic-lha-2-cleanser"; cite as "salicylic-lha-2-cleanser:F<n>"; journey/range layouts only)
salicylic-lha-2-cleanser:F1 [name] (Product name) Salicylic Acid + LHA 2% Cleanser
salicylic-lha-2-cleanser:F2 [claim] (Tagline / description) Reduces Sebum & Prevents Breakout Without Drying Skin
salicylic-lha-2-cleanser:F3 [claim] (Tagline / description) A daily, gentle exfoliating, acne fighting face cleanser. It combines BHA + LHA (Salicylic Acid + Capryloyl Salicylic Acid) in 2% concentration, which provides deep cleansing, pore decongestion & sebum reduction without drying out the skin.
salicylic-lha-2-cleanser:F5 [claim] (What Makes It Potent?) Contains Salicylic Acid (BHA) that penetrates deep into the skin & scoops out the dirt, debris, and sebum, hence reducing the oily look of the skin
salicylic-lha-2-cleanser:F6 [claim] (What Makes It Potent?) Formulated with Capryloyl Salicylic Acid (LHA), which unlike Salicylic Acid, stays on outer layer of skin and provides gentle exfoliation, revealing soft skin. The combination provides multi-level cleansing
salicylic-lha-2-cleanser:F7 [claim] (What Makes It Potent?) Boosted with anti-bacterial Zinc and several hydrating & soothing ingredients like Xylitylglucoside, Panthenol (Vitamin B5), Allantoin, Pentyle Glycol for hydrating overall after-feel
salicylic-lha-2-cleanser:F8 [claim] (What Makes It Potent?) Formulated with 2 very mild sulfate-free surfactants (cleansers) that provide optimum cleaning without stripping skin lipids or proteins
salicylic-lha-2-cleanser:F9 [claim] (What Makes It Potent?) All our ingredients are sourced from leading global supplier. Our Salicylic Acid is a high purity grade ingredient
salicylic-lha-2-cleanser:F10 [suitability] (Ideal For) Skin type: Oily/Combination, Acne-Prone
salicylic-lha-2-cleanser:F11 [suitability] (Ideal For) Concerns: Acne, Breakouts & Oiliness
salicylic-lha-2-cleanser:F12 [suitability] (Ideal For) Suitable for: 15+ years of age
salicylic-lha-2-cleanser:F13 [usage] (How to Use) Apply on wet face. Pour an appropriate quantity into wet hands, rub together into a light lather, and massage into face. Rinse thoroughly.

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