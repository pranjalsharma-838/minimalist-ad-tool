# Retry round 2 of 3 — brief multi-vitamin-spf-50__t36

Rewrite the brief so that every flag below is resolved. These are HARD constraints:
- A flagged claim must be REMOVED or REPLACED with a different cited fact. Never reword it to keep the same meaning (e.g. 'anti-bacterial' -> 'fights bacteria' is not a fix).
- Keep the layout and everything that wasn't flagged unchanged.
- Every line still cites its facts; numbers must be in the cited facts.

## Flags from the scorer
- [fix] CLM-03 "no white cast": An unqualified 'no white cast' reads as an absolute for everyone. The page scopes it to application. Suggested: Light texture that spreads easily, with no visible white cast on application.

## Current brief (JSON)
```json
{
  "ad_type": "offer_promo",
  "layout": "offer",
  "source_ad_id": "multi-vitamin-spf-50__t36",
  "product_title": "SPF 50 Sunscreen",
  "main_theme": "",
  "headline": "Broad spectrum SPF 50, PA++++ for every day",
  "subhead": "Light texture that spreads easily, with no white cast.",
  "proof_points": [
    "50g: Rs. 359, MRP Rs. 399"
  ],
  "actives": [],
  "steps": [],
  "stat": null,
  "callouts": [],
  "specs": [],
  "range": [],
  "offer": {
    "line": "Buy 2, Get 3rd Free",
    "condition": "The 3rd product is free when you buy 2. T&C apply.",
    "valid_till": "",
    "cites": [
      "OFFER3"
    ]
  },
  "footnote": "Offers as on beminimalist.co, 2026-10-02. T&C apply. 3rd product free on buying 2. Price shown for 50g.",
  "cta": "Shop now",
  "citations": {
    "headline": [
      "F2",
      "F21"
    ],
    "subhead": [
      "F3",
      "F8"
    ],
    "proof_points": [
      [
        "PRICE1"
      ]
    ],
    "footnote": [
      "OFFER3",
      "PRICE1"
    ]
  },
  "layout_description": "Square 1080x1080. Offer line 'Buy 2, Get 3rd Free' as the large block top-left, with its condition directly beneath in readable size. Product headline and subhead below on the left. Price line: sale price Rs. 359 in bold with 'MRP Rs. 399' beside it struck through, size (50g) in small type. Real pack shot on the right 45%, standing on top of a low block. CTA bottom-left; footnote along the bottom edge. No end date or countdown (none shown on site).",
  "image_prompt": "Square 1080x1080 background plate only. A minimal studio set of three low, smooth geometric blocks in off-white and pale warm grey, arranged on the right side at different heights, with a seamless off-white backdrop. Soft natural light from the left, gentle soft shadows, clinical and uncluttered, a quiet echo of a colourful promo set but in a restrained neutral palette. Keep the right 45% of the frame as clear, evenly lit empty space on top of the blocks, reserved for a photo composited later. Keep the left 50% calm and low-detail as empty space for copy added later. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.",
  "needs_real_photography": false,
  "photography_needed": "",
  "adaptation_notes": "Kept: the competitor's offer-led structure (big offer line, product on display blocks, Shop now CTA). Offer quoted exactly from the live sitewide banner OFFER3 (beminimalist.co, captured 2026-10-02); price is the main size from PRICE1, sale price with MRP struck through. Dropped: the competitor's bundle price and discount code, all urgency ('limited time', 'hurry'; no end date shown on site), emoji, the youthful-skin promise. Other live offers (OFFER1/2/4) not used, to keep one clear offer; OFFER2 'Freebies' has no stated condition on the capture.",
  "product_handle": "multi-vitamin-spf-50"
}
```

## Original input (facts you may cite)
# Brief input — multi-vitamin-spf-50__t36
source_ad_id: multi-vitamin-spf-50__t36
Format (from the archetype skill): #36 Offer creative · family Commercial · layout "offer" (if "new", use the closest built layout and describe the intended design in layout_description) · image source MARKETER
Why chosen: 18 competitor ads 30+ days in this format (9 in this category); trend signal 0.89; product page has the facts it needs; already picked for 1 earlier product(s) in this run (variety penalty); Commercial fits a sales objective well
Risk: Medium — Needs numbers/terms a marketer must supply and source (offer, sales count, prices). · Offer terms / numbers must come from the marketer with a source and date.

## Reference competitor ad for this format (structure only, never its wording)
Chemist at Play · 303 days · offer_promo
Headline: Your One-Stop Skin Solution: BYOB! Buy 3 Skincare Products @799
Text: 👋Say Hello to Youthful Skin😍
BYOB: Buy any of your 3 Favourite Skincare Products @799 only😱
Shop now and embrace the beauty of healthy and rejuvenated skin with skin care that’s tailored to your skin type.
Limited time offer, don’t miss out🤑
Hurry🏃
On image: Chemist at Play | BUY ANY 3@799 | Use Code : SKINBOX | SHOP NOW | Daily Exfoliating Body Wash 4% Lactic Acid + Salicylic Acid + Vitamin E | 2% Salicylic Acid + Azelaic Acid + Cica OIL & ACNE CONTROL FACE WASH | UNDERARM ROLL ON 5% AHA (product labels)
Visual: Square studio product shot: body wash, salicylic face wash and underarm roll-on on colourful acrylic blocks against cyan/purple, 'BUY ANY 3@799' sticker headline; no people.

## Product facts: SPF 50 Sunscreen (main product, handle "multi-vitamin-spf-50")
Hero shown by the layout: SPF 50
F1 [name] (Product name) SPF 50 Sunscreen
F2 [claim] (Tagline / description) Broad Spectrum SPF 50, PA++++
F3 [claim] (Tagline / description) A light weight, moisturiser-meets-sunscreen. This broad spectrum SPF 50 with PA++++ rating, has a very light texture that spreads easily & disappears leaving behind a natural, moisturised, non-shiny look. Loaded with Vitamins B, E & F that help repair skin and minimise damage caused by UV exposure.
F5 [claim] (What Makes It Potent?) This sunscreen is formulated with 4 very effective UV-filters, namely, Uvinul T 150, Avobenzone, Octocrylene and Titanium Dioxide to provide protection from UVA & UVB
F6 [claim] (What Makes It Potent?) Boosted with Vitamin B3, B5, E and F that not only repairs skin after sun exposure, but also soothes, nourishes and hydrates skin
F7 [claim] (What Makes It Potent?) Thoroughly tested by an independent lab and confirmed SPF of 50 was obtained
F8 [claim] (What Makes It Potent?) It is a Photostable & Acne safe sunscreen that does not leave any white cast on application. Also, it spreads easily like a lightweight moisturiser and does not leave behind unwated residue or heavy feeling
F9 [claim] (What Makes It Potent?) The primary filters are sourced from BASF, Germany and Royal DSM, Netherlands
F10 [suitability] (Ideal For) Skin type: Dry/Normal, Sensitive, Oily/Combination, Acne-Prone
F11 [suitability] (Ideal For) Concerns: Sun protection, UV exposure / damage
F12 [suitability] (Ideal For) Suitable for: 16+ years of age
F13 [study] (Clinical Results) This sunscreen is tested in an independent third party lab to confirm the level of protection it provides. Below is the lab report and the data points
F14 [study] (Clinical Results) Test type: IN-VIVO Evaluation of sun protection by International Standards - ISO 24444:2019
F15 [study] (Clinical Results) Study Number: MS22.SPF.A1015.UPPL.ISO24444.ST15.REP.REV
F16 [study] (Clinical Results) SPF value obtained: 56.6
F17 [study] (Clinical Results) PA rating: ++++
F18 [study] (Clinical Results) (Data based on in-vivo tests conducted by Advanced Science Laboratories, an independent third party product testing lab)
F19 [study] (Clinical Results) Note: The product has been evaluated for safety through patch testing under the supervision of a Dermatologist.
F20 [usage] (How to Use) Apply on cleansed face after all your serums and moisturisers. Apply generously & evenly on your face and neck. Apply sunscreen at least 15 minutes before sun exposure. For added protection, reapply in case of continued sun exposure, swimming, perspiring or towel drying.
F21 [usage] (How to Use) When to use: AM. Everyday.
F22 [ingredient_note] (Avobenzone) The most popular UVA filter across the world and provides proper UVA protection
F23 [ingredient_note] (Octocrylene) Protects the skin primarily from the UVB. Octocrylene is a very photostable filter and it further stabilizes Avobenzone
F24 [ingredient_note] (Uvinul T 150) A highly effective UVB filter with exceptionally high absorptivity
F26 [faq] (Does this sunscreen leave a white cast?) No. It does not leave any white cast or unwanted residue behind, after application.
F27 [faq] (Is it safe for all skin types?) Yes. This is a light-weight sunscreen suitable for all skin types.
F28 [faq] (Can pregnant or lactating women use this sunscreen?) No. This sunscreen uses Octocrylene as one of the filters and while it's a safe, photostable filter, we recommend avoiding sunscreens formulated with this filter during pregnancy or the lactation period.
PRICE1 [price] (price (website)) 50g: Rs. 359 (MRP Rs. 399; 10% below MRP, both prices shown on the page) — beminimalist.co, captured 2026-10-02
PRICE2 [price] (price (website)) 100g: Rs. 629 (MRP Rs. 699; 10% below MRP, both prices shown on the page) — beminimalist.co, captured 2026-10-02
PRICE3 [price] (price (website)) 30g: Rs. 224 (MRP Rs. 249.1; 10% below MRP, both prices shown on the page) — beminimalist.co, captured 2026-10-02
PRICE_AMZ [price] (price (Amazon.in)) Amazon.in: Rs. 628 (16% off as shown); Save 10% with coupon — search result, captured 2026-10-02 (verify it is the brand's own listing)
OFFER1 [offer] (sitewide offer (website banner)) "Build Your Own Bundle — Save an additional up to 15% off" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/apps/gbb/easybundle/1
OFFER2 [offer] (sitewide offer (website banner)) "Upto 33% OFF + Freebies" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/pages/minimalist-b2g3rdfree-one-product-free
OFFER3 [offer] (sitewide offer (website banner)) "Buy 2, Get 3rd Free" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/pages/minimalist-b2g3rdfree-one-product-free
OFFER4 [offer] (sitewide offer (website banner)) "Get Additional Free Gifts on orders above ₹1199" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/apps/gbb/easybundle/1
RATING [rating] (reviews (Yotpo, website)) 3.9 out of 5 stars from 1,890 reviews on beminimalist.co, captured 2026-10-02
REV1 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "It was an amazing product. It was an amazing product especially for oily skin no white casting and protecting the skin very good and also my skin has started reducing dark spots as well as pigmentation" — Anusha J., verified buyer, 5★, 2025-12-17 (beminimalist.co, captured 2026-10-02)
REV2 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Sunscreen actually works.. It works for me with combination skin type, without white shade and its oil free. Also, sweat resistance so last longer." — Parth, verified buyer, 5★, 2025-10-09 (beminimalist.co, captured 2026-10-02)
REV3 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Good. I like it's working on my skin" — Sneha C., verified buyer, 4★, 2025-12-18 (beminimalist.co, captured 2026-10-02)
REV4 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Matte finish. like the matte finish and how it blends with my skin tone" — Pushkar V., verified buyer, 4★, 2025-07-15 (beminimalist.co, captured 2026-10-02)
REV5 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Super cool. This product was really helpful in our sunny climate helps to reduce sun tan" — Adhila P., verified buyer, 5★, 2024-05-09 (beminimalist.co, captured 2026-10-02)
REV6 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Value for money. Great product and great results." — Reena R., verified buyer, 5★, 2025-12-14 (beminimalist.co, captured 2026-10-02)

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