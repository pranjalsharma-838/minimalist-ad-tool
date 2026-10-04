# Retry round 1 of 3 — brief 2-hyaluronic-acid__t17

Rewrite the brief so that every flag below is resolved. These are HARD constraints:
- A flagged claim must be REMOVED or REPLACED with a different cited fact. Never reword it to keep the same meaning (e.g. 'anti-bacterial' -> 'fights bacteria' is not a fix).
- Keep the layout and everything that wasn't flagged unchanged.
- Every line still cites its facts; numbers must be in the cited facts.

## Flags from the scorer
- [fix] CLM-12 "vs": Comparative claims need like-for-like substantiation and mustn't disparage others. Suggested: Drop the comparison, or state exactly what was compared and how (test, model, report number) in the footnote.
- [fix] CLM-12 "Benchmark": Comparative claims need like-for-like substantiation and mustn't disparage others. Suggested: Drop the comparison, or state exactly what was compared and how (test, model, report number) in the footnote.
- [fix] CLM-12 "vs": Comparative claims need like-for-like substantiation and mustn't disparage others. Suggested: Drop the comparison, or state exactly what was compared and how (test, model, report number) in the footnote.
- [fix] CLM-12 "Benchmark": Comparative claims need like-for-like substantiation and mustn't disparage others. Suggested: Drop the comparison, or state exactly what was compared and how (test, model, report number) in the footnote.
- [fix] CLM-12 "vs": Comparative claims need like-for-like substantiation and mustn't disparage others. Suggested: Drop the comparison, or state exactly what was compared and how (test, model, report number) in the footnote.
- [fix] CLM-12 "benchmark": Comparative claims need like-for-like substantiation and mustn't disparage others. Suggested: Drop the comparison, or state exactly what was compared and how (test, model, report number) in the footnote.

## Current brief (JSON)
```json
{
  "ad_type": "other",
  "layout": "usvsthem",
  "source_ad_id": "2-hyaluronic-acid__t17",
  "product_title": "Hyaluronic + PGA 2% Face Serum",
  "headline": "Hydration, side by side",
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
  "footnote": "Comparative forearm study vs an international brand's Hyaluronic Acid serum (benchmark), 8-hour window, MS Clinical Research Lab.",
  "cta": "Shop now",
  "image_prompt": "Empty background scene only: a pure white seamless paper backdrop, soft daylight from the upper left, a faint grey contact-shadow area on the right. Square 1080x1080. Keep the right 45% of the frame as an empty space, evenly lit, for a pack photo placed later, and keep the left half as a calm empty area for copy. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.",
  "needs_real_photography": false,
  "photography_needed": "",
  "angle": "comparison",
  "hook_type": "contrast",
  "caption": "Take a pea-sized amount on your fingertips and apply on the face and neck, AM & PM everyday; follow with a moisturiser to lock in the hydration.",
  "citations": {
    "headline": [
      "F14"
    ],
    "subhead": [],
    "tag": [],
    "proof_points": [],
    "footnote": [
      "F13",
      "F15",
      "F18"
    ],
    "caption": [
      "F19",
      "F20"
    ]
  },
  "layout_description": "",
  "adaptation_notes": "Format #17 Us vs Them: the page itself names a benchmark (an international brand's serum, unnamed) in a published comparative study; row values and basis are the page's own.",
  "blend_sources": [
    {
      "id": "4500111383646459",
      "brand": "Deconstruct",
      "took": "layout / proof device (structure only)"
    }
  ],
  "writer": "stand-in (Claude agent) following prompts/pipeline_brief_writer.md; user rules 2026-10-05 (active + strength shown, basis in footnote, no exaggeration, nothing pending)",
  "compare": {
    "us": "Hyaluronic + PGA 2%",
    "them": "Benchmark HA serum",
    "cites": [
      "F13"
    ],
    "rows": [
      {
        "label": "Hydration over 8 hours",
        "us": "~26% more",
        "them": "Benchmark",
        "cites": [
          "F14"
        ]
      }
    ]
  },
  "main_theme": "lab_results",
  "product_handle": "2-hyaluronic-acid"
}
```

## Original input (facts you may cite)
# Brief input — 2-hyaluronic-acid__t17
source_ad_id: 2-hyaluronic-acid__t17
Format (from the archetype skill): #17 Comparison image (Us vs Them) · family Comparison · layout "usvsthem" (if "new", use the closest built layout and describe the intended design in layout_description) · image source LAYOUT
Why chosen: 1 competitor ads 30+ days in this format; trend signal 0.00; product page has the facts it needs; no own results yet for this format; already picked for 1 earlier product(s) in this run (variety penalty); Comparison fits a sales objective moderately
Risk: High — Comparative claim (ASCI Chapter IV): 'them' must be an unnamed benchmark, ingredient or product type the brand's page itself names, compared like-for-like with the basis on the creative; a reviewer confirms the proof is on file before use. Brand team confirmed comparison ads are in scope (DEC-02, 2026-10-04); the risk stays High because each comparison still needs its proof on file.

## Reference competitor ad for this format (structure only, never its wording)
Deconstruct · 129 days · comparison
Headline: 100% Photostable Sunscreen
Text: Sick of sticky, heavy sunscreens? 

Switch to our lightweight gel formula that absorbs fast, feels like nothing on the skin, and keeps you protected every day.
On image: de construct | EUROPEAN Sunscreens Long-lasting Protection | v/s | KOREAN Sunscreens Lightweight Texture | INDIA'S 1ST BEST OF BOTH WORLDS | • Long-lasting • Lightweight | Why Choose? Get Both | [pack: Lightweight GEL SUNSCREEN Broad Spectrum Protection SPF 50 PA++++, For all skin types, Non-comedogenic & non-greasy gel texture, Sweat Resistant, Blue Light Protection, Invivo & Invitro Tested]
Visual: Vertical ad on a graph-paper background with a 'European v/s Korean sunscreens' header comparison, the yellow gel-sunscreen tube on a grey plinth and a black 'Why Choose? Get Both' banner; no people.

## Angle (balanced across the run): routine
Routine: where the product sits in a simple AM/PM routine (companion products allowed in journey/range layouts).
Record "angle": "routine" in the brief, and "hook_type": one of question | stat | situation | offer | social_proof | contrast | ingredient | statement (the device the headline opens with — used to score our own results by hook).

## Social proof (automatic where it fits)
No rating captured for this product — no social proof.

## Product facts: Hyaluronic + PGA 2% Face Serum (main product, handle "2-hyaluronic-acid")
Hero shown by the layout: 2% Hyaluronic + PGA
F1 [name] (Product name) Hyaluronic + PGA 2% Face Serum
F2 [claim] (Tagline / description) Intense, Multi-Level Hydration without the Oily Feel
F3 [claim] (Tagline / description) A hydrating booster with 4 different types of Hyaluronic Acid Molecules along with super hydrator Polyglutamic Acid (PGA). Provides multi-level hydration throughout the day.
F4 [claim] (What Makes It Potent?) This fast absorbing formula contains a blend of 2 highly powerful hydrators - Hyaluronic Acid & Polyglutamic Acid. Together they provide multi-level hydration & instant plump look
F5 [claim] (What Makes It Potent?) Contains 4 different types of Hyaluronic Acid molecules of varying molecular weight & properties for providing surface level as well as deeper hydration. The smallest molecule has molecular weight of just 6kDa (smaller the molecule, deeper its penetration in the skin)
F6 [claim] (What Makes It Potent?) Highly concentrated Glyceryl Glucoside for stimulating the formation of Aquaporin water channels in skin cells. This in turn improves transportation of water between cells
F7 [claim] (What Makes It Potent?) Copper Ferment improves osmose level of dermal external fluid and keeps hydration level high. Natto & Biosaccharide gum prevents TEWL (Transepidermal Water Loss)
F8 [claim] (What Makes It Potent?) Formulated with best ingredients sourced from leading global suppliers. Our Hyaluronic comes from Jan Dekker, Netherlands and Glyceryl Glucoside from BASF, Germany
F9 [suitability] (Ideal For) Skin type: Dry/Normal, Sensitive, Oily/Combination, Acne-Prone
F10 [suitability] (Ideal For) Concerns: Dry, Dehydrated & Skin Tightness
F11 [suitability] (Ideal For) Suitable for: 16+ years of age
F12 [suitability] (Ideal For) Pregnancy/Lactation: Safe
F13 [study] (Clinical Results) To evaluate the efficacy of this new formulation, we conducted a clinical study in an independent third party testing lab and tested this serum against Hyaluronic Acid serum of an international brand that creates active ingredient based products (called Benchmark here). Results of the study are shared below.
F14 [study] (Clinical Results) Minimalist Hyaluronic + PGA 2% serum provided significantly higher hydration than the benchmark product. Throughout the 8 hours testing window, our serum provided ~26% more hydration than the benchmark product.
F15 [study] (Clinical Results) Study objective: To evaluate and compare hydration benefit up to 8 hours post product application in comparison to baseline, benchmark and untreated control
F16 [study] (Clinical Results) Instrument used: Corneometer & Tewameter
F17 [study] (Clinical Results) Study report no: SKIN/USHS/SR/2021-147
F18 [study] (Clinical Results) (Based on a monocentric, double blinded, comparative, forearm study-evaluation conducted by MS Clinical Research Lab - an independent testing lab)
F19 [usage] (How to Use) Take a pea-sized amount on your fingertips, and apply on the face and neck. For best results, follow it with a moisturiser to lock in the hydration within the skin.
F20 [usage] (How to Use) When to use: AM & PM everyday
F21 [study] (Consumer Studies) Hyaluronic Acid & Polyglutamic Acid are potent hydrators & we got the product's efficacy evaluated through a consumer study.
F22 [study] (Consumer Studies) 93% subjects noticed less dryness & hydrated skin in 4 weeks
F23 [study] (Consumer Studies) 90% subjects said skin stayed hydrated throughout the day
F24 [study] (Consumer Studies) 97% subjects felt skin felt soft & plump immediately upon application
F25 [study] (Consumer Studies) Note: The product has been evaluated for safety through patch testing under the supervision of a Dermatologist.
F26 [ingredient_note] (Hyaluronic Acid) 4 different types of Hyaluronic Acid molecules
F27 [ingredient_note] (Polyglutamic Acid) A potent humectant that holds 4 times more water than hyaluronic acid and is one of the most hydrating ingredient in industry right now
F28 [ingredient_note] (Glyceryl Glucoside) Highly purified molecule that stimulates Aquaporin channels in epidermis
OFFER1 [offer] (sitewide offer (website banner)) "Build Your Own Bundle — Save an additional up to 15% off" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/apps/gbb/easybundle/1
OFFER2 [offer] (sitewide offer (website banner)) "Upto 33% OFF + Freebies" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/pages/minimalist-b2g3rdfree-one-product-free
OFFER3 [offer] (sitewide offer (website banner)) "Buy 2, Get 3rd Free" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/pages/minimalist-b2g3rdfree-one-product-free
OFFER4 [offer] (sitewide offer (website banner)) "Get Additional Free Gifts on orders above ₹1199" — beminimalist.co homepage, captured 2026-10-02, no end date shown; terms: https://beminimalist.co/apps/gbb/easybundle/1

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