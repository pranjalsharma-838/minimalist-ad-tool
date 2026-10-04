# Retry round 1 of 3 — brief niacinamide-10-with-matmarine__t24

Rewrite the brief so that every flag below is resolved. These are HARD constraints:
- A flagged claim must be REMOVED or REPLACED with a different cited fact. Never reword it to keep the same meaning (e.g. 'anti-bacterial' -> 'fights bacteria' is not a fix).
- Keep the layout and everything that wasn't flagged unchanged.
- Every line still cites its facts; numbers must be in the cited facts.

## Flags from the scorer
- [fix] CLM-07 "in 2 weeks": A time-bound result needs a study of that duration, with the qualifier shown on the creative. Suggested: Keep the timeframe only if it comes from a study you can cite, and put the qualifier in the footnote (e.g. '*Consumer perception study, 4 weeks'). Otherwise remove the timeframe.

## Current brief (JSON)
```json
{
  "ad_type": "expert_authority",
  "layout": "spec",
  "source_ad_id": "niacinamide-10-with-matmarine__t24",
  "product_title": "Niacinamide 10% Face Serum",
  "subhead": "",
  "proof_points": [],
  "actives": [],
  "steps": [],
  "stat": null,
  "callouts": [],
  "specs": [
    {
      "label": "Strength",
      "value": "10% pure Niacinamide",
      "cites": [
        "F6"
      ]
    },
    {
      "label": "Complexion",
      "value": "Improved in 2 weeks, per page",
      "cites": [
        "F6"
      ]
    },
    {
      "label": "Safety",
      "value": "Patch tested, Dermatologist-supervised",
      "cites": [
        "F15"
      ]
    }
  ],
  "range": [],
  "offer": null,
  "cta": "Shop now",
  "image_prompt": "Empty background scene only: a pure white seamless studio surface with a very faint soft floor shadow, evenly lit by soft daylight, very quiet and low contrast. Off-white, few props, clinical minimal style. Square 1080x1080. Keep the right 45% of the frame as an empty clear space, evenly lit and the left 50% calm and low-detail. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.",
  "needs_real_photography": false,
  "photography_needed": "",
  "angle": "ingredient_science",
  "hook_type": "stat",
  "blend_sources": [],
  "headline": "Niacinamide 10%: what the page states",
  "footnote": "As stated on the product page; study size and method are not published there.",
  "citations": {
    "headline": [
      "F6"
    ],
    "subhead": [],
    "proof_points": [],
    "footnote": [
      "F6"
    ]
  },
  "layout_description": "Spec sheet: headline over three label and value rows separated by hairlines at the left; real pack shot in the right 45%; study basis as the footnote below.",
  "adaptation_notes": "Proof run: a clean science visual built from page-stated study, test or dermatologist facts, with the study basis in the footnote.",
  "product_handle": "niacinamide-10-with-matmarine"
}
```

## Original input (facts you may cite)
# Brief input — niacinamide-10-with-matmarine__t24
source_ad_id: niacinamide-10-with-matmarine__t24
Format (from the archetype skill): #24 Clinical / science visual · family Education · layout "spec" (if "new", use the closest built layout and describe the intended design in layout_description) · image source LAYOUT
Why chosen: 4 competitor ads 30+ days in this format (1 in this category); trend signal 0.65; product page has the facts it needs; no own results yet for this format; already picked for 3 earlier product(s) in this run (variety penalty); Education fits a sales objective weakly
Risk: Low — Real asset available in the library (brand_packs/minimalist/assets/raw/niacinamide-10-with-matmarine/01.png).

## Blend these proven competitor winners (structure only, never their wording)
A. Re'equil · 66 days · id 1593356795737812 · #24 Clinical / science visual
   What it is: 'Nutrition facts'-style spec label of product metrics with the tube overlapping it and cream dripping over the top.
   Headline: Oil Free Aqua Gel Sunscreen | On image: Sunscreen Facts | Serving Size 50ml | SPF level - SPF 60.82 | PA++++ | Greasy shine - 0% | Water resistant - 80 mins + | Hydration Level - 100% | White Cast: Ze
B. Foxtale · 227 days · id 1957996591744819 · #23 Infographic
   What it is: 'What does <ingredient> do?' question with a four-point icon benefit list beside a model wearing the mask on half her face holding the jar.
   Headline: Cherry-Infused Collagen Magic | On image: What does collagen do? | Reduces wrinkles | Firms skin | Improves skin elasticity | Hydrates | [pack: foxtale MON CHÉRI Cherry-Collagen Whipped Clay Mask, Plump
C. Chemist at Play · 74 days · id 27546140265006255 · #12 Before / after
   What it is: Stacked labelled Before/After skin crops beside the pack, with a timed-result headline and clinical footnote.
   Headline: Take Control of Pigmentation with Vitamin C✨ | On image: Chemist at Play with essential Ceramides | Dermat Recommended. Clinically Certified. | Visible reduction in dark spots within 7 Days* | Before | After | *Based 
Blend rule: take ONE element from each — e.g. the hook device from one, the layout/visual arrangement from another, the proof device from the third. The concept must not match any single reference. Record it in "blend_sources": [{"id","brand","took"}].

## Angle (balanced across the run): concern_solved
Concerns customers raise for this product type (real reviews; scripts/mine_customer_language.js). Use ONLY a concern that has an 'answered by' fact, cite that fact, and you may echo the customer's words (not quoted as a testimonial):
- sticky greasy: competitors 10 mentions (0 in ≤3★) · answered by F8 "Lightweight serum coupled with Zinc that balances sebum activity and reduces inflammation, leaving smooth textured skin " · customer words: "Bahut hi lightweight aur non-sticky serum hai jo skin me turant absorb ho jata hai." (Amazon.in · Pilgrim, 5★) / "Overall, it’s good for improving glow and skin texture, but the oily finish may not suit everyone for day
- dryness: competitors 3 mentions (0 in ≤3★) · answered by F3 "A daily serum formulated with pure Vitamin B3 (Niacinamide) and Matmarine. Niacinamide reduces the sebum level of the sk" · customer words: "I apply 2–3 drops on a clean, dry face, gently spread it over the skin, and then follow it with a moisturizer." (Amazon.in · Pilgrim, 4★) / "This is the best lighting serum, I have black spots on my face due to pimples 
- texture: competitors 11 mentions (0 in ≤3★) · answered by F8 "Lightweight serum coupled with Zinc that balances sebum activity and reduces inflammation, leaving smooth textured skin " · customer words: "Good Glow & Skin Texture Improvement, But Feels Oily on Face." (Amazon.in · Pilgrim, 4★) / "I especially liked its smooth texture and glow-boosting effect." (Amazon.in · Pilgrim, 5★)
Concern solved: name a common cosmetic concern customers voice (sticky feel, heavy texture, white cast, greasiness, complicated routines) and answer it ONLY with a page fact that addresses it. Never name a competitor; no medical conditions.
Record "angle": "concern_solved" in the brief, and "hook_type": one of question | stat | situation | offer | social_proof | contrast | ingredient | statement (the device the headline opens with — used to score our own results by hook).

## Social proof (automatic where it fits)
If the layout has a badge, footnote or CTA-band slot, add the RATING fact verbatim (e.g. "4.0★ from 1,491 reviews") citing RATING — never round up, never 'top rated'. Quote a REV* review only in review/social-proof layouts or when the angle is social_proof; quote exactly (trim with … only), with name + 'verified buyer'.

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