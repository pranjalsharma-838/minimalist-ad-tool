# Retry round 2 of 3 — brief multi-vitamin-spf-50__t28

Rewrite the brief so that every flag below is resolved. These are HARD constraints:
- A flagged claim must be REMOVED or REPLACED with a different cited fact. Never reword it to keep the same meaning (e.g. 'anti-bacterial' -> 'fights bacteria' is not a fix).
- Keep the layout and everything that wasn't flagged unchanged.
- Every line still cites its facts; numbers must be in the cited facts.

## Flags from the scorer
- [fix] CLM-13 "Rated by 1,890 customers": The source shows 1,890 reviews on beminimalist.co, not 1,890 customers; reviews are not necessarily distinct or verified buyers, so the headline states the social proof more strongly than its source does. The rating and source line on the image are fine; only this wording needs to match them. Suggested: Rated 3.9 out of 5 from 1,890 reviews

## Current brief (JSON)
```json
{
  "ad_type": "testimonial_ugc",
  "layout": "socialproof",
  "source_ad_id": "multi-vitamin-spf-50__t28",
  "product_title": "SPF 50 Sunscreen",
  "subhead": "",
  "tag": "",
  "proof_points": [],
  "actives": [],
  "steps": [],
  "stat": null,
  "callouts": [],
  "specs": [],
  "range": [],
  "offer": null,
  "footnote": "",
  "cta": "Shop now",
  "image_prompt": "Empty background scene only: a pure white seamless paper backdrop, soft daylight from the upper left, a faint grey contact-shadow area on the right. Square 1080x1080. Keep the right 45% of the frame as an empty space, evenly lit, for a pack photo placed later, and keep the left half as a calm empty area for copy. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.",
  "needs_real_photography": false,
  "photography_needed": "",
  "angle": "trend",
  "hook_type": "social_proof",
  "headline": "Rated by 1,890 customers",
  "proof": {
    "value": "3.9★",
    "label": "out of 5, from 1,890 reviews",
    "source": "beminimalist.co, captured 2 Oct 2026"
  },
  "caption": "SPF 50 Sunscreen: broad spectrum SPF 50, PA++++, with a light texture that spreads easily. Rated 3.9 out of 5 from 1,890 reviews on beminimalist.co (captured 2 Oct 2026).",
  "citations": {
    "subhead": [],
    "tag": [],
    "proof_points": [],
    "footnote": [],
    "headline": [
      "RATING"
    ],
    "caption": [
      "F2",
      "F3",
      "RATING"
    ]
  },
  "blend_sources": [
    {
      "id": "2274657823309888",
      "brand": "Re'equil",
      "took": "the star rating and customer count under a single pack; its 'India's most loved' headline and award badges dropped (superlative, no basis)"
    },
    {
      "id": "1418542033483616",
      "brand": "Foxtale",
      "took": "the rating as the hero of the ad; its 'Our #1' and 'sold every 30 seconds' claims dropped (no source), and the hand dropped (a model)"
    }
  ],
  "layout_description": "White or studio-grey canvas; the rating set large (3.9★), its count and source beneath; the real tube on the right.",
  "adaptation_notes": "Trending format (#28 Social-proof creative): 2 brands. Real rating quoted exactly (RATING), never rounded up; superlatives, velocity claims and award badges dropped.",
  "product_handle": "multi-vitamin-spf-50"
}
```

## Original input (facts you may cite)
# Brief input — multi-vitamin-spf-50__t28
source_ad_id: multi-vitamin-spf-50__t28
Format (from the archetype skill): #28 Social-proof creative · family Proof · layout "socialproof" (if "new", use the closest built layout and describe the intended design in layout_description) · image source MARKETER
Why chosen: Trending now: 2 brands launched this format in the last 60 days and still run it (2 ads; checked in the Meta Ad Library (competitor_status_2026-10-04.json))
Risk: Medium — Needs numbers/terms a marketer must supply and source (offer, sales count, prices). · Offer terms / numbers must come from the marketer with a source and date.

## Blend these proven competitor winners (structure only, never their wording)
A. Re'equil · 27 days · id 2274657823309888 · #28 Social-proof creative
   What it is: 'India's most loved' headline with award badges above and a star rating + customer count + retailer logos below a single tube.
   Headline: Buy Ultra Matte Dry Touch Sunscreen Gel SPF 50 PA++++ – Re'equil | On image: India's Most Loved Matte Sunscreen | ★★★★½ Rated 4.4 by 40,000+ CUSTOMERS ON [Re' / Myntra / Amazon / Nykaa icons] | award badges: Nykaa Femina Beauty Awards, G
B. Foxtale · 33 days · id 1418542033483616 · #28 Social-proof creative
   What it is: 'Our #1' headline with a 'sold every 30 seconds' velocity oval, hand lifting a tube from an overflowing basket, quick-commerce footer.
   Headline: Our #1 Glow Sunscreen | On image: Our #1 Sunscreen. | 1 SOLD EVERY 30 SECONDS | GLOW SUNSCREEN SPF 50 PA++++ | blinkit India's Last Minute App | Delivered in 10 minutes | [pack: foxtale GOLDEN H
Blend rule: take ONE element from each — e.g. the hook device from one, the layout/visual arrangement from another, the proof device from the third. The concept must not match any single reference. Record it in "blend_sources": [{"id","brand","took"}].

## Angle (balanced across the run): trend
Trending now: several brands launched this format in the last 60 days and still run it (the references below are those ads). Recreate the FORMAT for Minimalist in its minimal house style: white canvas, the real pack as the hero, 0-15 words on the image, details in the caption. Take one element from each reference (hook device, layout or proof device), never their wording. Use only what the product page supports. If a reference relies on a skin-problem close-up, a fear hook or a result photo, keep the structure and drop that element (say so in adaptation_notes).
Record "angle": "trend" in the brief, and "hook_type": one of question | stat | situation | offer | social_proof | contrast | ingredient | statement (the device the headline opens with — used to score our own results by hook).

## Social proof (automatic where it fits)
If the layout has a badge, footnote or CTA-band slot, add the RATING fact verbatim (e.g. "4.0★ from 1,491 reviews") citing RATING — never round up, never 'top rated'. Quote a REV* review only in review/social-proof layouts or when the angle is social_proof; quote exactly (trim with … only), with name + 'verified buyer'.

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