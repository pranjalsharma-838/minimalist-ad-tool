# Retry round 2 of 3 — brief niacinamide-10-with-matmarine__t1

Rewrite the brief so that every flag below is resolved. These are HARD constraints:
- A flagged claim must be REMOVED or REPLACED with a different cited fact. Never reword it to keep the same meaning (e.g. 'anti-bacterial' -> 'fights bacteria' is not a fix).
- Keep the layout and everything that wasn't flagged unchanged.
- Every line still cites its facts; numbers must be in the cited facts.

## Flags from the scorer
- [fix] CLM-24 "Zinc balances sebum activity": A body-process claim (sebum activity) sits in the structure/function grey area. The 'helps regulate oiliness' wording on Matmarine is milder but the same concern. Legal should confirm. Suggested: Zinc, used with Niacinamide, for oily, acne-prone skin

## Current brief (JSON)
```json
{
  "ad_type": "product_hero",
  "layout": "hero",
  "source_ad_id": "niacinamide-10-with-matmarine__t1",
  "product_title": "Niacinamide 10% Face Serum",
  "main_theme": "",
  "headline": "Niacinamide 10% for sebum, pores and even tone",
  "subhead": "With Matmarine, Zinc and Acetyl Glucosamine in a lightweight serum with no sticky residue.",
  "proof_points": [
    "Matmarine helps regulate oiliness and the appearance of pores",
    "Zinc balances sebum activity",
    "For daily use, AM & PM"
  ],
  "actives": [],
  "steps": [],
  "stat": null,
  "callouts": [],
  "specs": [],
  "range": [],
  "offer": null,
  "footnote": "Evaluated for safety through patch testing. Suitable for 16+ years of age.",
  "cta": "Shop now",
  "citations": {
    "headline": [
      "F1",
      "F2"
    ],
    "subhead": [
      "F5",
      "F8"
    ],
    "proof_points": [
      [
        "F7"
      ],
      [
        "F8"
      ],
      [
        "F14"
      ]
    ],
    "footnote": [
      "F15",
      "F11"
    ]
  },
  "layout_description": "Square 1080x1080. Hero line '10% Niacinamide' and headline top-left. Subhead below. Three short proof points stacked down the left half with thin check-style line markers (the competitor's tick list, rebuilt calmly). Real pack shot (library 01.png) on the right 45%, standing on the surface. CTA bottom-left; footnote along the bottom edge.",
  "image_prompt": "Square 1080x1080 background plate only. A clean off-white studio surface meeting a soft matte wall, soft natural daylight from the upper left, a single soft diagonal window-light shadow and a faint cool reflection, giving a fresh, bright, open-air mood in Minimalist's restrained style. Palette of off-white, pale grey and a hint of soft aqua. Keep the right 45% of the frame as clear, evenly lit empty space on the surface, reserved for a photo composited later. Keep the left 50% calm and low-detail as empty space for copy added later. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.",
  "needs_real_photography": false,
  "photography_needed": "",
  "adaptation_notes": "Kept: the product-hero structure (one benefit headline, short tick-list of benefits, pack as hero) and the bright open mood, rebuilt as a calm studio. Dropped: the lifestyle model and oversized bottle (no people/skin), the 'In-Vivo Tested' sticker (no in-vivo test on this product's page), 'Dermatologically Tested' / 'Non-Comedogenic' (not on page), the time-bound '2 weeks' clinical claim in F6 (kept out to avoid a time-bound result promise), emoji and the question hook.",
  "product_handle": "niacinamide-10-with-matmarine"
}
```

## Original input (facts you may cite)
# Brief input — niacinamide-10-with-matmarine__t1
source_ad_id: niacinamide-10-with-matmarine__t1
Format (from the archetype skill): #1 Clean product hero · family Product · layout "hero" (if "new", use the closest built layout and describe the intended design in layout_description) · image source PACK+BG
Why chosen: 7 competitor ads 30+ days in this format (2 in this category); trend signal 0.75; product page has the facts it needs; Product fits a sales objective well
Risk: Low — Real asset available in the library (brand_packs/minimalist/assets/raw/niacinamide-10-with-matmarine/01.png).

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

## Product facts: Niacinamide 10% Face Serum (main product, handle "niacinamide-10-with-matmarine")
Hero shown by the layout: 10% Niacinamide
F1 [name] (Product name) Niacinamide 10% Face Serum
F2 [claim] (Tagline / description) For reducing sebum & pores, and even skin tone
F3 [claim] (Tagline / description) A daily serum formulated with pure Vitamin B3 (Niacinamide) and Matmarine. Niacinamide reduces the sebum level of the skin, improves the barrier & evens our skin tone. Matmarine is a perfect biotechnological ingredient to reduce excess sebum, shine, pores & spots.
F5 [claim] (What Makes It Potent?) Unique blend of highly effective ingredients - Niacinamide, Matmarine, Zinc and Acetyl Glucosamine
F6 [claim] (What Makes It Potent?) Pure 10% Niacinamide is clinically proven to promote protein synthesis, reduce melanin concentration & improve skin complexion in 2 weeks
F7 [claim] (What Makes It Potent?) Matmarine is one of the biotechnological extract derive from a marine microorganism, helps regulate oiliness regardless of skin type and reduces sebum and appearance of pores, support hydration
F8 [claim] (What Makes It Potent?) Lightweight serum coupled with Zinc that balances sebum activity and reduces inflammation, leaving smooth textured skin with no sticky residue
F9 [claim] (What Makes It Potent?) Formulated with best ingredients sourced from leading global suppliers. Our Niacinamide comes from Lonza, Switzerland and Matmarine is sourced from Lipotec USA, USA
F10 [suitability] (Ideal For) Concerns: Acne Marks, Acne Prone & Oily Skin
F11 [suitability] (Ideal For) Suitable for: 16+ years of age
F12 [suitability] (Ideal For) Pregnancy/Lactation: Safe
F13 [usage] (How to Use) Apply 2-3 drops after cleansing & toning. Let the serum absorb fully into the skin before moving on to the next step of your routine.
F14 [usage] (How to Use) When to use: AM & PM. Everyday
F15 [study] (Consumer Studies) The product has been evaluated for safety through patch testing under the supervision of a Dermatologist.
F16 [ingredient_note] (Niacinamide) A form of vitamin B3, Niacinamide is a superstar ingredient that repairs skin, reduces occurrence of acne, and fades blemishes. This formula uses Niacinamide in a high concentration of 10%
F17 [ingredient_note] (Matmarine) Matmarine is a perfect biotechnological ingredient to reduce excess sebum, shine, pores & spots.
F18 [ingredient_note] (Zinc) It regulates sebum production and has anti-bacterial properties as well, making it highly suitable for oily / acne-prone skin
PRICE1 [price] (price (website)) 30ml: Rs. 539 (MRP Rs. 599; 10% below MRP, both prices shown on the page) — beminimalist.co, captured 2026-10-02
PRICE2 [price] (price (website)) 60ml: Rs. 899 (MRP Rs. 999; 10% below MRP, both prices shown on the page) — beminimalist.co, captured 2026-10-02
PRICE3 [price] (price (website)) 10ml: Rs. 237 (MRP Rs. 249; 5% below MRP, both prices shown on the page) — beminimalist.co, captured 2026-10-02
PRICE4 [price] (price (website)) 20ml: Rs. 499 (no MRP shown) — beminimalist.co, captured 2026-10-02
PRICE_AMZ [price] (price (Amazon.in)) Amazon.in: Rs. 999 — search result, captured 2026-10-02 (verify it is the brand's own listing)
OFFER1 [offer] (sitewide offer (website banner)) "Build Your Own Bundle — Save an additional up to 15% off" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/apps/gbb/easybundle/1
OFFER2 [offer] (sitewide offer (website banner)) "Upto 33% OFF + Freebies" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/pages/minimalist-b2g3rdfree-one-product-free
OFFER3 [offer] (sitewide offer (website banner)) "Buy 2, Get 3rd Free" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/pages/minimalist-b2g3rdfree-one-product-free
OFFER4 [offer] (sitewide offer (website banner)) "Get Additional Free Gifts on orders above ₹1199" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/apps/gbb/easybundle/1
RATING [rating] (reviews (Yotpo, website)) 4 out of 5 stars from 1,491 reviews on beminimalist.co, captured 2026-10-02
REV1 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Awesome product Niacinamide 10%. this is my 2nd purchase of Niacinamide Serum, first one was 5% and now I use 10%. after using of Niacinamide 10% oilyness reduced from my skin, acne marks start fading and pores are start reducing. Just love this product." — Sidipto R., verified buyer, 5★, 2025-02-23 (beminimalist.co, captured 2026-10-02)
REV2 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Great products. Your products are absolutely amazing. . i already have good skin and adding ur products in my regime made it even better. It provides good hydration and makes my skin more light and yes the variety of your products truly deserves a thumbs up" — Manish S., verified buyer, 5★, 2026-03-07 (beminimalist.co, captured 2026-10-02)
REV3 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Totally recommend Just start with. Totally recommend Just start with 0. 2 % and then increases the concentration You will definitely get the good result Minimised pores, smooth texture and lesson pigmentation Definitely go for it" — Smita K., verified buyer, 5★, 2026-07-16 (beminimalist.co, captured 2026-10-02)
REV4 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Worth it!. I hav been using it since a month, and tbh its good, from day 4 I started seeing results. although you need to understand I maintained a good diet, and my skincare routine was like this -> salicylic acid foaming face wash ->niacinamide serum ->vitamin b5 moisturizer . with all the culmination of process I got my pimples away got bright skin tone and good skin. Although the marks are still there, so its okay. worth it!" — Rajveer K., verified buyer, 4★, 2026-04-05 (beminimalist.co, captured 2026-10-02)
REV5 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Amazing product. I have been using your product since 1 & halfyear, and I definitely say I don't want to change my any skincare product, your product was amazing, I recommend to everyone just try once. . . 👍" — Pratika B., verified buyer, 5★, 2025-09-27 (beminimalist.co, captured 2026-10-02)
REV6 [review] (customer review (verbatim; quote exactly, no edits beyond trimming with …)) "Help me a lot!!!. My skin is very clean than before" — Deepanshu L., verified buyer, 5★, 2025-04-13 (beminimalist.co, captured 2026-10-02)

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