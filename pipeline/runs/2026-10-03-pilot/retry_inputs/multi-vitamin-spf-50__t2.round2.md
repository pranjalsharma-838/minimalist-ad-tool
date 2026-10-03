# Retry round 2 of 3 — brief multi-vitamin-spf-50__t2

Rewrite the brief so that every flag below is resolved. These are HARD constraints:
- A flagged claim must be REMOVED or REPLACED with a different cited fact. Never reword it to keep the same meaning (e.g. 'anti-bacterial' -> 'fights bacteria' is not a fix).
- Keep the layout and everything that wasn't flagged unchanged.
- Every line still cites its facts; numbers must be in the cited facts.

## Flags from the scorer
- [fix] CLM-03 "No white cast": A flat 'no white cast' reads as an absolute for every skin tone. The page scopes it to application. Suggested: No visible white cast on application

## Current brief (JSON)
```json
{
  "ad_type": "product_hero",
  "layout": "badges",
  "source_ad_id": "multi-vitamin-spf-50__t2",
  "product_title": "SPF 50 Sunscreen",
  "main_theme": "",
  "headline": "SPF 50, PA++++ with a light, moisturiser feel",
  "subhead": "",
  "proof_points": [],
  "actives": [],
  "steps": [],
  "stat": null,
  "callouts": [],
  "specs": [],
  "range": [],
  "badges": [
    {
      "text": "Broad spectrum SPF 50",
      "cites": [
        "F2"
      ]
    },
    {
      "text": "PA++++ rated",
      "cites": [
        "F2"
      ]
    },
    {
      "text": "No white cast",
      "cites": [
        "F8"
      ]
    },
    {
      "text": "Photostable & acne safe",
      "cites": [
        "F8"
      ]
    }
  ],
  "offer": null,
  "footnote": "Labelled SPF 50. In-vivo test (ISO 24444:2019) by an independent third-party lab obtained SPF 56.6.",
  "cta": "Shop now",
  "citations": {
    "headline": [
      "F2",
      "F3"
    ],
    "subhead": [],
    "proof_points": [],
    "footnote": [
      "F7",
      "F14",
      "F16",
      "F18"
    ]
  },
  "layout_description": "Square 1080x1080. Headline top-left across the left half. Four badges stacked in a single column down the left half below the headline, each a small rounded pill with a thin line icon. Real pack shot (library 01.jpg) on the right 45%, standing on the surface, softly shadowed. Footnote in small type along the bottom edge; CTA button bottom-left above the footnote.",
  "image_prompt": "Square 1080x1080 background plate only. A calm off-white studio surface meeting a soft matte plaster wall, lit by soft natural daylight from the upper left, with one faint diagonal leaf shadow and a gentle warm patch of sunlight that hints at a bright summer day. Palette of off-white, pale sand and a whisper of soft sky blue, very few props. Keep the right 45% of the frame as clear, evenly lit empty space on the surface, reserved for a photo composited later. Keep the left 50% calm and low-detail as empty space for copy added later. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.",
  "needs_real_photography": false,
  "photography_needed": "",
  "adaptation_notes": "Kept: the competitor's product-hero-plus-benefit-checklist structure (one claim headline, a short row of verifiable benefit ticks, pack prominent) and its sunny mood, rebuilt as a calm daylight studio. Replaced every line with Minimalist page facts. Dropped: the lifestyle model hugging an oversized bottle (no people/skin allowed), the 'In-Vivo Tested' sticker on the main image (lab result moved to the footnote per house rule; labelled SPF 50 is the claim), 'Dermatologically Tested' and 'Non-Comedogenic' (not on our page as claims), the 2-in-1 hydration angle beyond what F3 states, emoji and the excited question hook.",
  "product_handle": "multi-vitamin-spf-50"
}
```

## Original input (facts you may cite)
# Brief input — multi-vitamin-spf-50__t2
source_ad_id: multi-vitamin-spf-50__t2
Format (from the archetype skill): #2 Product + benefit badges · family Product · layout "badges" (if "new", use the closest built layout and describe the intended design in layout_description) · image source PACK+BG
Why chosen: 6 competitor ads 30+ days in this format (3 in this category); trend signal 0.60; product page has the facts it needs; Product fits a sales objective well
Risk: Low — Real asset available in the library (brand_packs/minimalist/assets/raw/multi-vitamin-spf-50/01.jpg).

## Reference competitor ad for this format (structure only, never its wording)
Dot & Key · 234 days · product_hero
Headline: In-vivo Tested Hydrating Sunscreen
Text: Sun-protection + Hydration, just in 1? 😱
SPF 50+ Barrier Repair Sunscreen that's  In-Vivo Tested 

🫐 2-in-1: Sunscreen + Moisturizer
🫐 Provides broad spectrum protection
🫐 Lightweight texture
🫐 Infused with hyaluronic & ceramides

Why Dot & Key Sunscreens?
✅ No White Cast
✅ Dermatologically Tested
✅ Lightweight
✅ Non-Comedogenic
On image: DOT & KEY | SPF 50+ hydrating Sunscreen | In-Vivo Tested | (pack) BLUEBERRY HYDRATE BARRIER REPAIR SUNSCREEN long-lasting moisture SPF 50+ PA++++ HYALURONIC & 5 CERAMIDES 80g
Visual: Vertical beach shot of a laughing woman kneeling in the sea hugging an oversized inflatable-style sunscreen bottle under a blue sky, with an 'In-Vivo Tested' sticker badge.

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