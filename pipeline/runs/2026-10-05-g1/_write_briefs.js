// Stand-in brief writer for run 2026-10-05-g1 (prompts/pipeline_brief_writer.md): per-product page facts -> 102 briefs.
import fs from "node:fs";
const RUN = "pipeline/runs/2026-10-05-g1/";
const IP = "Empty background scene only: a pure white seamless paper backdrop, soft daylight from the upper left, a faint grey contact-shadow area on the right. Square 1080x1080. Keep the right 45% of the frame as an empty space, evenly lit, for a pack photo placed later, and keep the left half as a calm empty area for copy. No product, no bottle, no packaging, no text, no letters, no logos, no people, no faces, no skin, no hands.";
const EXC = " No product, bottle, dropper, tube, jar or packaging anywhere in frame; no text, no letters, no logos, no brand names.";
const WRITER = "stand-in (Claude orchestrator agent) following prompts/pipeline_brief_writer.md; user rules 2026-10-05 (active + strength, basis in footnote, no exaggeration, nothing pending)";
const AIFOOT = "AI illustrations, not real results. Individual results vary.";
const SPF = "multi-vitamin-spf-50", CLN = "salicylic-lha-2-cleanser", NIA = "niacinamide-10-with-matmarine";
// reused image numbers -> descriptions (existing AI images, see reuse_map.json)
const PD = {
 1: "An Indian woman in her early 30s with medium-brown skin, winding down in the evening on a sofa beside a tall window in her apartment, cotton throw over her knees, one hand relaxed in her lap, calm expression. Warm lamp light from the upper left, shallow depth of field, she sits slightly left of centre with calm space to her right.",
 2: "An Indian man in his early 40s with deep-brown skin and a short greying beard, at a bathroom basin in the morning, waist up in a plain white vest, one hand held out open and empty at chest height. Soft daylight from a frosted window at the upper left, he sits slightly left of centre with calm space to his right.",
 3: "An Indian man in his early 30s with medium-brown skin beside a parked scooter on a quiet Mumbai side street in bright morning daylight, helmet in one hand, light cotton shirt, small backpack. He sits slightly left of centre with calm space to his right.",
 4: "An Indian woman in her late 20s with deep-brown skin on a sunny apartment balcony in the morning, a slow smoothing gesture across her cheek with her fingertips (nothing visible on them), light cotton kurta top. Soft morning light from the upper left, she sits slightly left of centre with calm space to her right.",
 5: "An Indian woman in her late 20s with medium-brown skin at a desk by a floor-to-ceiling window in a Gurugram office, laptop screen turned away, ceramic mug, hazy towers out of focus behind her. She sits slightly left of centre with calm space to her right.",
 6: "An Indian man in his mid 20s with medium-brown skin just after a gym session at a bright bathroom mirror, sleeveless training vest, towel round his neck, fingertips pressed lightly against his cheek (nothing visible on them). Soft daylight from the upper left.",
 7: "An Indian man around 21 with light-brown skin in a small college hostel room in the evening, sitting cross-legged on a single bed, study desk behind him. Warm light from the upper left, slightly left of centre with calm space to his right.",
 8: "Close, softly lit crop of an Indian woman in her early 20s with medium-brown skin from just below her eyes to her chin, fingertips of one hand pressed lightly against her cheek (nothing visible on them). Soft daylight from the upper left.",
 9: "An Indian man in his early 30s with deep-brown skin back home after a morning run, just inside the front door, sweat-darkened running t-shirt, towel over one shoulder, calm satisfied expression. Soft daylight from the upper left.",
 10: "An Indian woman in her late 20s with light-brown skin at a bathroom basin in the morning, waist up in a plain cotton top, hair clipped back, one hand held out open and empty at chest height. Soft daylight from a frosted window at the upper left.",
 11: "An Indian woman in her early 40s with medium-brown skin working from home at a small wooden desk by a window, laptop screen turned away, ceramic cup, money plant on the sill, sheer curtains. Soft daylight from the upper left, slightly left of centre with calm space to her right.",
 12: "An Indian man in his mid 30s with deep-brown skin at a bathroom mirror in the morning, chest up in a white cotton t-shirt, both hands raised to his face and neck in slow upward strokes (nothing visible on his hands). Soft daylight from the upper left.",
 13: "An Indian woman in her early 30s with light-brown skin on a morning metro commute, holding the overhead handrail, canvas tote, hair tied back, looking calmly through the window. Soft daylight from the upper left.",
 14: "An Indian man in his early 30s with medium-brown skin by a bedroom window in morning light, chest up in a cotton t-shirt, fingertips held together just below his chin as if about to press a few drops onto his cheek (nothing visible on them).",
 15: "Close, softly lit crop of a woman in her late 20s with medium-brown skin from just below the eyes to the chin at a sunlit bathroom counter, fingertips spreading a few clear drops across her cheek in a slow circular motion (nothing visible on her fingers).",
 16: "Macro-style close-up of a man in his early 30s with light-brown skin and short stubble from the nose to the jaw in a bright bathroom, two fingertips pressing a few clear drops into his cheek (nothing visible on them).",
 17: "A man in his late 20s with medium-brown skin at a bathroom basin in the evening, plain grey t-shirt, damp hair pushed back, pressing a few clear drops onto his cheek with his fingertips, relaxed expression. Warm soft lamp light from the upper left.",
 18: "A woman in her early 30s with medium-brown skin at a bathroom basin on a weekday morning, hair clipped up, wet hands lathering a light white foam between her palms before washing her face. Bright soft daylight from the upper left.",
 19: "Close-up of a young woman in her early 20s with a wheatish skin tone from the cheekbones to the chin at a bathroom basin, both wet hands working a light white lather in small circles over her cheeks, a few water drops on her wrists.",
 21: "A casual, natural front-camera selfie of an Indian man in his late 20s with medium-brown skin on a sunny apartment balcony in the morning, plain cotton t-shirt, relaxed half-smile, phone held at arm's length, nothing on his face or in his hands.",
 22: "A casual, natural front-camera selfie of a smiling Indian woman in her early 40s with light-brown skin in a bright bedroom in the morning, simple cotton kurta, phone held at arm's length, nothing on her face or in her hands.",
 23: "An Indian woman in her early 40s with medium-brown skin smoothing a light lotion onto her face and neck by a window in the morning, simple cotton kurta, relaxed expression. Soft daylight from the upper left.",
};
const NEWP = {
 t8: "An Indian man in his early 30s with medium-brown skin and short dark hair in a bright bathroom in the morning, chest up in a plain cotton t-shirt, the fingertips of one hand parting his hair at the crown and pressing lightly on the scalp (nothing visible on his fingertips), his other hand relaxed. Soft daylight from the upper left, shallow depth of field, he sits slightly left of centre with calm space to his right. Natural, unretouched skin and scalp with visible pores, nothing implying a result, no hair-growth or hair-loss imagery.",
 t9: "Close, softly lit crop of an Indian woman in her early 30s with medium-brown skin and thick dark hair, seen from the side at the crown of her head, the fingertips of one hand parting her hair and gently massaging the scalp in small circles (nothing visible on her fingertips), the other hand out of frame. Soft daylight from the upper left, shallow depth of field, calm space to the right. Natural, unretouched skin and scalp, nothing implying a result, no hair-growth or hair-loss imagery.",
};
// slot -> reused image number (user-approved reuse of existing AI images; see reuse_map.json)
const SLOT = {
 "niacinamide-5-hyaluronic-acid-1": { 6: 5, 8: 14, 9: 8, 10: 1, 31: 10 },
 "vitamin-c-e-ferulic-16": { 6: 13, 8: 6, 9: 16, 10: 3, 31: 21 },
 "hair-growth-actives-18": { 6: 7, 8: "new", 9: "new", 10: 11, 31: 2 },
 "oat-extract-06-gentle-cleanser": { 6: 23, 8: 18, 9: 19, 10: 7, 31: 22 },
 "retinol-0-3-q10": { 6: 1, 8: 17, 9: 15, 10: 11, 31: 22 },
 "pha-3-biotic-toner": { 6: 3, 8: 4, 9: 12, 10: 5, 31: 2 },
};
const FR = {
 "niacinamide-5-hyaluronic-acid-1": ["multi-vitamin-spf-50", "multi-vitamin-spf-50"],
 "vitamin-c-e-ferulic-16": ["vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1", "vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1"],
 "oat-extract-06-gentle-cleanser": ["vitamin-b5-10-moisturizer", "vitamin-b5-10-moisturizer"],
 "pha-3-biotic-toner": ["salicylic-lha-2-cleanser", "niacinamide-10-with-matmarine"],
};
const NEWFR = {
 "hair-growth-actives-18": ["the same Indian woman in her early 30s with medium-brown skin and dark hair, identical close crop of the crown parting, framing, angle and soft daylight from the upper left. Left panel: hair at the parting looks slightly flat; right panel: the same parting looks very slightly fuller. The difference is small and realistic, never dramatic; natural scalp and hair texture.", "Concern: hair looking slightly flat at the parting. Panel 1: as it is; panels 2 and 3: very slightly fuller-looking each time. The change is small and realistic, never dramatic. Same Indian woman in her early 30s with medium-brown skin and dark hair, an identical close crop of the crown parting in every panel."],
 "retinol-0-3-q10": ["the same Indian woman in her early 40s with medium-brown skin, identical close crop of the forehead and temple (no eyes), framing, angle and soft daylight from the upper left. Left panel: a few faint fine lines across the forehead; right panel: the same lines only very slightly softer-looking, none disappearing. The difference is small and realistic, never dramatic; skin keeps natural pores and texture.", "Concern: a few faint fine lines across the forehead. Panel 1: as they are; panels 2 and 3: the same lines only very slightly softer-looking each time, none disappearing. The change is small and realistic, never dramatic. Same Indian woman in her early 40s with medium-brown skin, an identical close crop of the forehead and temple (no eyes) in every panel."],
};
const P = {
"niacinamide-5-hyaluronic-acid-1": { title: "Niacinamide 5% Face Serum", lock: "5% Niacinamide", art: "a", u: ["2-3 drops after cleansing & toning", ["F18"]], when: ["AM & PM", ["F19"]], tex: "a clear, lightweight serum", srcH: ["Niacinamide from Lonza, Switzerland", ["F8"]], subH: ["With Bifida Ferment Lysate and Oat extract", ["F5", "F6"]],
 badges: [["Niacinamide from Lonza", "F8"], ["Suitable for 16+ years", "F10"]],
 actives: [["5%", "Niacinamide", "Sourced from Lonza, Switzerland", "F8"], ["", "Bifida Ferment Lysate", "A probiotic ingredient", "F21"], ["", "Oat extract", "Skin-soothing properties, per the page", "F22"]],
 stat: ["F16", "90%", "subjects said skin felt more healthy & less dehydrated after 3 weeks", "X"],
 callouts: [["For dry, normal or sensitive skin", "F9"], ["Suitable for 16+ years", "F10"]], callH: ["5% Niacinamide for dry, sensitive skin", ["F1", "F9"]],
 cmp: { h: "Strength, stated on the pack", c: "F1", rows: [["Strength of the active", "5%", "Not stated", "F1"]], foot: "Compared with a label that names the active but not its strength.", cap: "Niacinamide 5% Face Serum states its strength in the title; 5% is the Niacinamide strength on the page." },
 step2: ["Step 2 Â· Serum", "2-3 drops after cleansing & toning, AM & PM", ["F18", "F19"]], steps: "std", rolePair: [SPF, "Sunscreen: SPF 50, PA++++"], rpC: [SPF + ":F2"] },
"vitamin-c-e-ferulic-16": { title: "Vitamin C + E + Ferulic 16% Face Serum", lock: "16% Vitamin C + E + Ferulic", art: "a", u: ["2-3 drops after cleansing & toning", ["F13"]], when: ["AM & PM", ["F14"]], tex: "a clear, lightweight serum", srcH: ["Ethyl Ascorbic Acid from Corum Inc, Taiwan", ["F9"]], subH: ["With Vitamin E, Ferulic Acid and Fullerenes", ["F6", "F7"]],
 badges: [["ET-VC from Corum, Taiwan", "F9"], ["Suitable for all skin types", "F10"]],
 actives: [["", "Ethyl Ascorbic Acid", "A stabilised Vitamin C derivative", "F5"], ["", "Vitamin E + Ferulic Acid", "A blend of 2 antioxidants", "F6"], ["", "Fullerenes (C60)", "A new generation antioxidant", "F7"]],
 stat: ["F17", "87%", "subjects agreed skin felt more even looking after 6 weeks", "X"],
 callouts: [["Suitable for all skin types", "F10"], ["Stable Vitamin C with Vitamin E & Ferulic Acid", "F3"]], callH: ["16% Vitamin C + E + Ferulic", ["F1"]],
 cmp: { h: "Strength, stated on the pack", c: "F1", rows: [["Strength of the active", "16%", "Not stated", "F1"]], foot: "Compared with a label that names the active but not its strength.", cap: "Vitamin C + E + Ferulic 16% Face Serum names its form (Ethyl Ascorbic Acid, F5) and states the strength in its title." },
 step2: ["Step 2 Â· Serum", "2-3 drops after cleansing & toning, AM & PM", ["F13", "F14"]], steps: "std", rolePair: [SPF, "Sunscreen: SPF 50, PA++++"], rpC: [SPF + ":F2"] },
"hair-growth-actives-18": { title: "Hair Growth Actives 18% Hair Serum", lock: "18% Hair Serum", art: "an", u: ["A few drops on a clean, dry scalp", ["F11"]], when: ["PM, every day", ["F12"]], tex: "a clear, lightweight serum", srcH: ["5 named actives from leading suppliers", ["F3", "F8"]], subH: ["Capixyl, Redensyl, Procapil, Anagain, Baicapil", ["F3"]],
 badges: [["Leading-supplier sourcing", "F8"], ["Suitable for 18+ years", "F10"]],
 actives: [["5%", "Capixyl", "From Lucas Meyer, Canada", "F5"], ["3%", "Redensyl", "From Givaudan, Switzerland", "F5"], ["3%", "Procapil", "From Sederma, UK", "F5"]],
 stat: ["F16", "97%", "subjects agreed scalp feels & stays hydrated", "X"],
 callouts: [["Suitable for men & women", "F6"], ["Suitable for 18+ years", "F10"]], callH: ["18% Hair Serum, 5 named actives", ["F1", "F3"]],
 cmp: { h: "Every active, stated", c: "F5", rows: [["Strength of the actives", "18% blend", "Not stated", "F5"], ["Each active named", "Yes", "No", "F5"]], foot: "Compared with a label that does not state the actives or their strengths. Per product page.", cap: "Hair Growth Actives 18% Hair Serum names its five actives with their strengths (F5)." },
 step2: null, steps: "hair", rolePair: null },
"oat-extract-06-gentle-cleanser": { title: "B12 + Oat Extract 6.5% Gentle Cleanser", lock: "6.5% B12 + Oat Extract", art: "a", u: ["Massage onto wet skin, then rinse off", ["F13"]], when: ["AM & PM", ["F14"]], tex: "a small mound of light, low-foaming cushiony lather", srcH: ["Oat Extract with Vitamin B12", ["F8"]], subH: ["Hyaluronic Acid, Vitamin B5 and Glycerin", ["F7"]],
 badges: [["Suitable for 15+ years", "F11"], ["Gentle, low-foaming", "F2"]],
 actives: [["", "Oat Extract", "An oat-based mild cleansing agent", "F6"], ["", "Vitamin B12", "Works alongside Oat Extract", "F8"], ["", "Hyaluronic Acid", "With Vitamin B5 and Glycerin as hydrators", "F7"]],
 stat: null, specs: [["Strength", "6.5% B12 + Oat Extract", "F1"], ["Skin types", "Dry/Normal, Sensitive, Oily/Combination, Acne-Prone", "F9"], ["Suitable for", "15+ years of age", "F11"]],
 callouts: [["For dry, dehydrated & sensitive skin", "F10"], ["Gentle, low-foaming cleanser", "F2"]], callH: ["6.5% B12 + Oat Extract Cleanser", ["F1"]],
 cmp: { h: "Strength, stated on the pack", c: "F1", rows: [["Strength of the active", "6.5%", "Not stated", "F1"]], foot: "Compared with a label that names the active but not its strength.", cap: "B12 + Oat Extract 6.5% Gentle Cleanser states its strength in the title." },
 step1: ["Step 1 Â· Cleanse", "Massage onto wet skin, then rinse off", ["F13"], true], steps: "cleanser", rolePair: [SPF, "Sunscreen: SPF 50, PA++++"], rpC: [SPF + ":F2"] },
"retinol-0-3-q10": { title: "Retinol 0.3% Face Serum", lock: "0.3% Retinol", art: "a", u: ["Apply on a cleansed face, in the PM", ["F12", "F13"]], when: ["PM", ["F13"]], tex: "a clear, lightweight oil-based serum", srcH: ["Retinol from BASF, Germany", ["F8"]], subH: ["With Coenzyme Q10 and Bakuchiol Oil", ["F5", "F6"]],
 badges: [["Retinol from BASF, Germany", "F8"], ["Water-free formula", "F7"]],
 actives: [["0.3%", "Retinol", "From BASF, Germany", "F8"], ["", "Coenzyme Q10", "From Selco, Germany", "F8"], ["1%", "Bakuchiol Oil", "Pure Bakuchiol Oil", "F6"]],
 stat: null, specs: [["Strength", "0.3% Retinol", "F1"], ["Formula", "Water-free, in a UV protective bottle", "F7"], ["Retinol source", "BASF, Germany", "F8"]],
 callouts: [["Suitable for 18+ years", "F10"], ["Water-free formula, UV protective bottle", "F7"]], callH: ["0.3% Retinol, used in the PM", ["F1", "F13"]],
 cmp: { h: "Water-free Retinol", c: "F7", rows: [["Strength of the active", "0.3%", "Not stated", "F1"]], foot: "Compared with a label that names the active but not its strength.", cap: "Retinol 0.3% Face Serum is water-free and sold in a UV protective bottle because, per the page, Retinol oxidises in the presence of water or light." },
 step2: ["Step 2 Â· Retinol", "On a cleansed face, PM; start every alternate day", ["F12", "F13"]], steps: "night", rolePair: null },
"pha-3-biotic-toner": { title: "Polyhydroxy Acid (PHA) 3% Face Toner", lock: "Polyhydroxy Acid (PHA) 3%", art: "a", u: ["A few drops into palms, pressed in", ["F17"]], when: ["AM & PM", ["F18"]], tex: "a thin, watery toner", srcH: ["PHA from Jungbunzlauer, Switzerland", ["F6", "F8"]], subH: ["With prebiotics and probiotics", ["F7"]],
 badges: [["Prebiotics + probiotics", "F7"], ["Suitable for 18+ years", "F10"]],
 actives: [["3%", "Polyhydroxy Acid (PHA)", "Gluconolactone from Jungbunzlauer, Switzerland", "F8"], ["", "Prebiotics + Probiotics", "Added to balance skin microbiome", "F7"], ["", "Humectants", "For multi-level hydration", "F7"]],
 stat: ["F15", "90%", "subjects agreed skin texture felt smoother after 3 weeks", "X"],
 callouts: [["For enlarged pores or uneven texture", "F11"], ["Gentle exfoliating, pH balancing toner", "F3"]], callH: ["Polyhydroxy Acid (PHA) 3% toner", ["F1"]],
 cmp: { h: "PHA, side by side", c: "F19", rows: [["Molecular weight", "178 (PHA)", "76 (Glycolic)", "F19"]], foot: "Molecular weights as stated on the product page: PHA 178, Glycolic acid 76.", cap: "Per the product page, PHAs have a larger molecule size than Glycolic acid (molecular weight 178 vs 76)." },
 step2: ["Step 2 Â· Toner", "A few drops into palms, pressed into face & neck", ["F17", "F18"]], steps: "std2", rolePair: [SPF, "Sunscreen: SPF 50, PA++++"], rpC: [SPF + ":F2"] },
};
const TPL = JSON.parse(fs.readFileSync("config/templates.json", "utf8")).templates;
const cit = (o = {}) => ({ headline: [], subhead: [], tag: [], proof_points: [], footnote: [], caption: [], ...o });
const LD = { texture: "White canvas; headline top-left with the active + strength lockup beneath it; texture swatch beside the real pack (approved ChatGPT texture shot, pack unchanged); black tagline tag; quiet Shop now.", range: "White canvas; short headline across the top; two real packs side by side with active + strength lockups and one short label each; footnote band states the basis.", journey: "Headline across the top; real pack shots in a row under 'Step N' labels with one usage line each, arrows between; CTA bottom-left.", offer: "Offer line as the large block top-left with its condition beneath; usage line below; real pack on the right 45%; footnote with capture date and T&C.", usvsthem: "White canvas; headline across the top; real pack large on the left; a small comparison table on the right; footnote states the basis.", person: "Left column: headline and subhead; the AI-generated person photo in a rounded card on the right with the AI-GENERATED mark; the real pack large in front; tagline tag; quiet Shop now.", timeline: "Headline top; three progress frames of the same AI-illustrated area left to right, the real pack small in the lower-right of EVERY frame; AI-GENERATED mark; footnote states the labels are routine stages.", before_after: "White canvas; BEFORE and AFTER frames stacked on the left (AI illustrations with the AI mark); the real pack on the right; headline names the active, strength and routine only.", callouts: "Headline top-left naming the strength; two short callout labels connected to the large pack on the right.", stat: "Large study figure with its label on the left, the study qualifier in the footnote; the real pack on the right.", spec: "Headline top-left; a short sheet of 3 labelled page facts; the real pack large on the right.", badges: "White canvas; headline naming the active and strength with two outlined badges stacked on the left; real pack large on the right.", actives: "Headline top-left; up to three ingredient cards stacked down the left; the real pack large on the right.", hero: "White canvas; two-line headline and one supporting line on the left with the active + strength lockup beneath; the real pack large on the right.", native: "Plain native feel: casual headline and one supporting line on the left; the AI-generated selfie-style photo card on the right with the AI-GENERATED mark; the real pack beside it." };
const refsOf = (id) => { try { const t = fs.readFileSync(RUN + "brief_inputs/" + id + ".md", "utf8"); return [...t.matchAll(/^([A-C])\. (.+?) Â· \d+ days Â· id (\d+) Â·/gm)].map((m) => ({ id: m[3], brand: m[2], took: "structure only (hook, layout or proof device)" })); } catch { return []; } };
const out = [];
const PAIRS = JSON.parse(fs.readFileSync("pipeline/pairs_2026-10-05-g1.json", "utf8"));
for (const pr of PAIRS) {
  const h = pr.handle, t = pr.template_id, p = P[h], id = `${h}__t${t}`;
  const T = TPL.find((x) => x.id === t);
  const [uh, uc] = p.u, [wh, wc] = p.when;
  const lockWhen = `${p.lock}: ${wh}`;
  let b = { ad_type: "product_hero", layout: "hero", source_ad_id: id, product_title: p.title, headline: "", subhead: "", tag: "", proof_points: [], actives: [], steps: [], stat: null, callouts: [], specs: [], range: [], offer: null, footnote: "", cta: "Shop now", image_prompt: IP, needs_real_photography: false, photography_needed: "", angle: "ingredient_science", ai_label_required: false, hook_type: "ingredient", caption: "", citations: cit(), layout_description: "", adaptation_notes: "", blend_sources: refsOf(id), writer: WRITER };
  const cap = (txt, c) => { b.caption = txt; b.citations.caption = c; };
  const notes = (n) => (b.adaptation_notes = `Format #${t} ${T.name}: ${n} Minimal house look (white canvas, real pack as the hero, active + strength shown, basis in the footnote or caption); competitor wording, claims, emoji and urgency dropped.`);
  const usageCap = `${p.title}: ${uh.charAt(0).toLowerCase() + uh.slice(1)}; use ${wh === "PM" ? "in the PM" : wh}.`;
  const slot = SLOT[h][t];
  if (t === 21) {
    Object.assign(b, { layout: "texture", headline: uh, tag: "Skin Science", footnote: "Texture shown is an AI illustration.", ai_label_required: true, angle: "situation", hook_type: "situation", photography_needed: "A real macro photo of this product's texture should replace the AI texture swatch before any publication.", layout_description: LD.texture });
    b.citations.headline = uc; b.citations.footnote = uc; cap(usageCap, ["F1", ...uc, ...wc]);
    notes("approved ChatGPT texture shot of this product (pack label verified word for word, DEC-04), active + strength in the lockup, tagline tag (DEC-03). Texture wording only from the usage facts.");
  } else if (t === 38) {
    const rp = p.rolePair;
    b.layout = "range"; b.angle = "routine"; b.hook_type = "statement"; b.layout_description = LD.range;
    if (rp) { b.headline = `${p.lock} and SPF 50`; b.citations.headline = ["F1", rp[0] + ":F2"]; b.range = [{ product_handle: h, label: (h.startsWith("oat") ? "Cleanser" : h.startsWith("pha") ? "Toner" : "Serum") + ": " + wh, cites: wc }, { product_handle: rp[0], label: rp[1], cites: rp[0] === SPF ? [SPF + ":F2"] : [] }]; b.footnote = "Steps and strengths as stated on each product's own page."; b.citations.footnote = ["F1", SPF + ":F2"]; cap(usageCap + " Companion: SPF 50 Sunscreen, Broad Spectrum SPF 50, PA++++.", ["F1", ...uc, ...wc, SPF + ":F2"]); }
    else if (h.startsWith("retinol")) { b.headline = "Cleanse, then Retinol 0.3% in the PM"; b.citations.headline = ["F13", CLN + ":F13"]; b.range = [{ product_handle: CLN, label: "Cleanser: light lather on a wet face", cites: [CLN + ":F13"] }, { product_handle: h, label: "Serum: PM, every alternate day at first", cites: ["F13"] }]; b.footnote = "Steps and strengths as stated on each product's own page."; b.citations.footnote = ["F13", CLN + ":F13"]; cap(usageCap, ["F1", "F12", "F13", CLN + ":F13"]); }
    else { b.headline = "Cleanser, then 18% Hair Serum"; b.citations.headline = ["F1", CLN + ":F13"]; b.range = [{ product_handle: CLN, label: "Face cleanser: light lather", cites: [CLN + ":F13"] }, { product_handle: h, label: "Hair serum: PM, on a clean, dry scalp", cites: ["F11", "F12"] }]; b.footnote = "Steps and strengths as stated on each product's own page."; b.citations.footnote = ["F1", CLN + ":F13"]; cap(usageCap, ["F1", "F11", "F12"]); }
    notes("two-product pairing built only from each page's own usage lines; offer, props and result wording dropped.");
    if (!rp) b.adaptation_notes += " The pairing is a cleanse-then-treat order from the usage lines, not a claim.";
  } else if (t === 22) {
    b.layout = "journey"; b.angle = "routine"; b.hook_type = "statement"; b.layout_description = LD.journey; b.footnote = "";
    const S = (label, ph, line, c) => ({ label, product_handle: ph, line, cites: c });
    if (p.steps === "std") { b.headline = "Wash, then serum, then sunscreen"; b.steps = [S("Step 1 Â· Cleanse", CLN, "Light lather on a wet face, then rinse", [CLN + ":F13"]), S("Step 2 Â· Serum", h, "2-3 drops after cleansing & toning, AM & PM", p.step2[2]), S("Step 3 Â· Sunscreen", SPF, "Broad Spectrum SPF 50, PA++++", [SPF + ":F2"])]; b.citations.headline = [CLN + ":F13", ...p.step2[2], SPF + ":F2"]; }
    else if (p.steps === "std2") { b.headline = "Wash, then toner, then sunscreen"; b.steps = [S("Step 1 Â· Cleanse", CLN, "Light lather on a wet face, then rinse", [CLN + ":F13"]), S("Step 2 Â· Toner", h, "A few drops into palms, pressed into face & neck", p.step2[2]), S("Step 3 Â· Sunscreen", SPF, "Broad Spectrum SPF 50, PA++++", [SPF + ":F2"])]; b.citations.headline = [CLN + ":F13", ...p.step2[2], SPF + ":F2"]; }
    else if (p.steps === "cleanser") { b.headline = "Cleanse, then serum, then sunscreen"; b.steps = [S("Step 1 Â· Cleanse", h, "Massage onto wet skin, then rinse off", ["F13"]), S("Step 2 Â· Serum", NIA, "2-3 drops after cleansing & toning", [NIA + ":F13"]), S("Step 3 Â· Sunscreen", SPF, "Broad Spectrum SPF 50, PA++++", [SPF + ":F2"])]; b.citations.headline = ["F13", NIA + ":F13", SPF + ":F2"]; }
    else if (p.steps === "night") { b.headline = "A night routine with Retinol 0.3%"; b.steps = [S("Step 1 Â· Cleanse", CLN, "Light lather on a wet face, then rinse", [CLN + ":F13"]), S("Step 2 Â· Retinol", h, "On a cleansed face, PM; start every alternate day", ["F12", "F13"])]; b.citations.headline = [CLN + ":F13", "F1", "F13"]; }
    else { b.headline = "Three steps with 18% Hair Serum"; b.steps = [S("Step 1 Â· Prepare", h, "A clean, dry scalp", ["F11"]), S("Step 2 Â· Apply", h, "A few drops with the dropper", ["F11"]), S("Step 3 Â· Massage", h, "Massage thoroughly; do not rinse", ["F11"])]; b.citations.headline = ["F1", "F11"]; }
    cap(usageCap, ["F1", ...uc, ...wc]);
    notes("routine shown as ordered usage steps from the pages' own usage lines; no result or time-to-result wording.");
  } else if (t === 36) {
    Object.assign(b, { layout: "offer", headline: p.lock, subhead: "", angle: "offer_value", hook_type: "offer", offer: { line: "Buy 2, Get 3rd Free", condition: "The 3rd product is free when you buy 2. T&C apply.", valid_till: "", cites: ["OFFER3"] }, footnote: "As on beminimalist.co, 2026-10-02. T&C apply.", layout_description: LD.offer });
    b.citations.headline = ["F1"]; b.citations.footnote = ["OFFER3"]; cap(usageCap + ' Offer: "Buy 2, Get 3rd Free", beminimalist.co homepage, captured 2026-10-02; terms on the offer page.', ["F1", ...uc, ...wc, "OFFER3"]);
    notes("quotes the captured sitewide offer exactly with its date and T&C. No price shown: no price was captured for this product, so none is invented. No urgency or end date (none shown).");
  } else if (t === 17) {
    const c = p.cmp;
    Object.assign(b, { layout: "usvsthem", angle: "comparison", hook_type: "contrast", headline: c.h, footnote: c.foot, layout_description: LD.usvsthem });
    const them = h.startsWith("pha") ? "Glycolic acid" : h.startsWith("retinol") ? "Retinol in water or light" : h.startsWith("hair") ? "Label without the strengths" : h.startsWith("vitamin-c") ? "Label without the %" : "Label without the %";
    b.compare = { us: p.title.length > 38 ? p.lock : p.title, them, cites: [c.c], rows: c.rows.map((r) => ({ label: r[0], us: r[1], them: r[2], cites: [r[3]] })) };
    if (h.startsWith("pha")) b.compare.us = "PHA (this toner)";
    b.citations.headline = [c.c]; b.citations.footnote = [c.c]; cap(c.cap, [c.c, "F1"]);
    notes("honest Us vs Them. " + (h.startsWith("pha") || h.startsWith("retinol") ? "'Them' is a benchmark the product page itself names (an ingredient or condition), never a brand." : "The page names no comparison, so this is the TRANSPARENCY version: what this pack states vs a label type that does not; 'them' is a label type, never a brand.") + " Substitution made because no page-named rival benchmark exists.");
  } else if ([6, 8, 9, 10, 31].includes(t)) {
    const isNative = t === 31;
    Object.assign(b, { layout: isNative ? "native" : "hero", ai_label_required: true, needs_real_photography: true, tag: isNative ? "" : "Skin Science", angle: { 6: "lifestyle", 8: "human_usage", 9: "human_usage", 10: "situation", 31: "routine" }[t], hook_type: "situation", layout_description: isNative ? LD.native : LD.person });
    if (t === 6) { b.headline = lockWhen; b.citations.headline = ["F1", ...wc]; b.subhead = uh; b.citations.subhead = uc; }
    if (t === 8) { b.headline = uh; b.citations.headline = uc; b.subhead = wh; b.citations.subhead = wc; }
    if (t === 9) { b.headline = `How to use ${p.lock}`; b.citations.headline = ["F1", ...uc]; b.subhead = uh; b.citations.subhead = uc; }
    if (t === 10) { b.headline = p.srcH[0]; b.citations.headline = p.srcH[1]; b.subhead = wh; b.citations.subhead = wc; }
    if (t === 31) { b.headline = uh; b.citations.headline = uc; b.subhead = lockWhen; b.citations.subhead = ["F1", ...wc]; }
    b.photography_needed = "A real photo (consenting person, natural light) would replace the AI person.";
    const desc = slot === "new" ? NEWP["t" + t] : PD[slot];
    b.person_prompt = desc + EXC;
    cap(usageCap, ["F1", ...uc, ...wc]);
    notes((t === 10 ? "the skin-problem close-up is dropped (fear framing, needs real photos); rebuilt as a lifestyle shot with the brand tagline. " : "") + "headline and subhead are page usage / sourcing lines only; nothing implies a result. The person is AI-generated: Severe, labelled." + (slot === "new" ? " New ChatGPT image needed (no existing image fits a scalp scene)." : ` Reuses an existing AI image (reuse_map.json, image ${slot}).`));
    if (h.startsWith("hair")) b.adaptation_notes += " Hair product: no hair-growth or hair-fall wording anywhere; cosmetic usage wording only (CLM-02).";
  } else if (t === 14 || t === 12) {
    const nf = NEWFR[h];
    const fp = nf ? (t === 12 ? nf[0] : nf[1]) : "Reused existing AI frames (reuse_map.json); no product, no text.";
    if (t === 14) Object.assign(b, { layout: "timeline", ad_type: "before_after", headline: `${p.lock} in a daily routine`, footnote: "Day and week labels mark routine stages, not study timings. AI illustrations, not real results.", frames: [{ label: "Day 1" }, { label: "Week 2" }, { label: "Week 4" }], frames_prompt: fp + (nf ? " In every panel the lower-right corner (about 30% of the panel width and 40% of its height) is a plain, softly lit area that is intentionally empty, reserved for the real pack to be placed later." : ""), pack_in_frames: true, layout_description: LD.timeline, angle: "transformation" });
    else Object.assign(b, { layout: "before_after", ad_type: "before_after", headline: `${p.lock}, ${wh}`, footnote: AIFOOT, frames_prompt: fp, layout_description: LD.before_after, angle: "concern_solved" });
    b.hook_type = "statement"; b.ai_label_required = true; b.needs_real_photography = true; b.photography_needed = "Real, consented, unretouched progress photos from a documented study of this product (same person, same light, with the claim and duration on file) to replace the AI frames before any use.";
    b.citations.headline = ["F1", ...(t === 12 ? wc : [])]; b.citations.footnote = ["F1"];
    cap(`${p.title}: ${p.lock.replace(/^[\d.]+%\s*/, "")} strength as stated on the page; ${wh}. The frames are AI illustrations, not results.`, ["F1", ...wc]);
    notes((t === 14 ? "REMAKE: subtle, the real pack in every frame (pack_in_frames), small realistic change only. Labels are routine stages with no result wording. " : "kept the labelled before/after frames beside the pack; every result claim and time frame dropped (page has no before/after study). ") + (nf ? "New AI frames needed." : "Reuses existing AI frames (reuse_map.json).") + " Severe, AI-labelled, not exportable until real study photos replace them." + (h.startsWith("hair") ? " Hair product: images show only a very slight fuller-looking parting, no hair-growth or hair-fall wording (CLM-02)." : ""));
  } else if (t === 15) {
    Object.assign(b, { layout: "callouts", headline: p.callH[0], angle: "concern_solved", hook_type: "statement", layout_description: LD.callouts, callouts: p.callouts.map((c) => ({ text: c[0], cites: [c[1]] })) });
    b.citations.headline = p.callH[1]; cap(usageCap, ["F1", ...uc, ...wc]); notes("the 'problem' is the page's own concern or suitability line as plain text; at most 2 callouts; no skin close-up or fear framing.");
  } else if (t === 26) {
    b.angle = "social_proof"; b.hook_type = "stat";
    if (p.stat) { const s = p.stat; Object.assign(b, { layout: "stat", ad_type: "testimonial_ugc", headline: p.lock, stat: { value: s[1], label: s[2].replace(/ after \d+ weeks/, ""), cites: [s[0]] }, footnote: "Share of study subjects who agreed, as stated on the product page.", layout_description: LD.stat }); b.citations.headline = ["F1", s[0]]; b.citations.footnote = [s[0]]; cap(`${p.title}: ${s[2].replace(/ after \d+ weeks/, "")} (consumer study on the product page): the share of study subjects who agreed, a perception stat and not a measured result.`, ["F1", s[0]]); notes("HONEST SUBSTITUTION: no customer review or rating was captured for this product, so the review card is replaced by the page's own consumer-study stat as the proof element, with its qualifier in the footnote. No review or rating is invented."); }
    else { Object.assign(b, { layout: "spec", headline: `${p.lock}: facts from the page`, specs: p.specs.map((s) => ({ label: s[0], value: s[1], cites: [s[2]] })), hook_type: "statement", layout_description: LD.spec, footnote: "Strength and details as stated on the product page." }); b.citations.headline = ["F1"]; b.citations.footnote = ["F1"]; cap(`${p.title}: strength and details as stated on the product page.`, ["F1"]); notes("HONEST SUBSTITUTION: no customer review or rating was captured and the page has no consumer-study stat for this product, so the proof element is a short sheet of page-stated facts. Nothing is invented."); }
  } else if (t === 2) {
    Object.assign(b, { layout: "badges", headline: `${p.lock} serum`.replace("serum", h.startsWith("oat") ? "cleanser" : h.startsWith("pha") ? "toner" : h.startsWith("hair") ? "hair serum" : "serum").replace("Hair Serum hair serum", "Hair Serum"), angle: "concern_solved", layout_description: LD.badges, badges: p.badges.map((x) => ({ text: x[0], cites: [x[1]] })) });
    if (h.startsWith("hair")) b.headline = "18% Hair Serum, 5 named actives";
    b.citations.headline = h.startsWith("hair") ? ["F1", "F3"] : ["F1"]; cap(usageCap, ["F1", ...uc, ...wc]); notes("two outlined badges stating verifiable page facts (source, suitability, form), not benefits.");
  } else if (t === 3) {
    Object.assign(b, { layout: "actives", headline: "Named actives, stated strength", angle: "ingredient_science", layout_description: LD.actives, actives: p.actives.map((a) => ({ pct: a[0], name: a[1], line: a[2], cites: [a[3]] })) });
    b.citations.headline = ["F1"]; cap(`${p.title}: ${p.srcH[0]}. ${uh}.`, ["F1", ...p.srcH[1], ...uc]); notes("ingredient cards with strength where the page states one; lines are sourcing or form only.");
  } else if (t === 4) {
    Object.assign(b, { layout: "hero", headline: p.srcH[0], subhead: p.subH[0], angle: "situation", layout_description: LD.hero });
    b.citations.headline = p.srcH[1]; b.citations.subhead = p.subH[1]; cap(`${p.title}: ${p.srcH[0]}. ${p.subH[0]}.`, ["F1", ...p.srcH[1], ...p.subH[1]]); notes("the minimal look draws no prop scene, so the ingredient cue is the named ingredient and its sourcing from the page.");
  }
  if (b.layout === "hero" && !b.tag && ![4].includes(t) && t !== 6 && t !== 8 && t !== 9 && t !== 10) { /* none */ }
  out.push(b);
}
fs.mkdirSync(RUN + "briefs_draft", { recursive: true });
for (const b of out) fs.writeFileSync(RUN + "briefs_draft/" + b.source_ad_id + ".json", JSON.stringify(b, null, 2));
// reuse map + chatgpt jobs
const PF = { 1: "10-03-people/alpha-arbutin-2__t6", 2: "10-03-people/alpha-arbutin-2__t7", 3: "10-03-people/multi-vitamin-spf-50__t6", 4: "10-03-people/multi-vitamin-spf-50__t8", 5: "10-03-people/niacinamide-10-with-matmarine__t6", 6: "10-03-people/niacinamide-10-with-matmarine__t8", 7: "10-03-people/salicylic-acid-2__t6", 8: "10-03-people/salicylic-acid-2__t9", 9: "10-03-people/salicylic-lha-2-cleanser__t6", 10: "10-03-people/salicylic-lha-2-cleanser__t7", 11: "10-03-people/vitamin-b5-10-moisturizer__t6", 12: "10-03-people/vitamin-b5-10-moisturizer__t9", 13: "10-03-people/vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1__t6", 14: "10-03-people/vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1__t8", 15: "10-03-angles/alpha-arbutin-2__t9", 16: "10-03-angles/niacinamide-10-with-matmarine__t9", 17: "10-03-angles/salicylic-acid-2__t8", 18: "10-03-angles/salicylic-lha-2-cleanser__t8", 19: "10-03-angles/salicylic-lha-2-cleanser__t9", 21: "10-05-formats/multi-vitamin-spf-50__t31", 22: "10-05-formats/vitamin-c-ethyl-ascorbic-acid-10-acetyl-glucosamine-1__t31", 23: "10-05-marula/marula-05-moisturizer__t8" };
const reuse = [], jobs = [];
const EXCL = "Do not include: any product, bottle, tube, jar, dropper or packaging, any text, letters, labels, logos or brand names.";
for (const b of out) {
  const h = b.source_ad_id.split("__t")[0], t = +b.source_ad_id.split("__t")[1], id = b.source_ad_id;
  if (b.person_prompt) { const s = SLOT[h][t]; if (s === "new") jobs.push({ h: id, kind: "person", image: "", prompt: `Create a photorealistic photo: ${b.person_prompt} Natural, unretouched skin texture. ${EXCL} Square 1:1.`, out: `${process.cwd()}\\pipeline\\runs\\2026-10-05-g1\\backgrounds\\${id}.person.png` }); else reuse.push([`pipeline/runs/2026-${PF[s]}`.replace("2026-10", "2026-10").replace(/\/([^/]*)$/, "/backgrounds/$1") + ".person.png", `${id}.person.png`]); }
  if (b.frames_prompt) {
    if (NEWFR[h]) { const n = b.layout === "timeline" ? 3 : 2; jobs.push({ h: id, kind: "frames", image: "", prompt: `Create a photorealistic wide image made of ${n === 3 ? "three" : "two"} equal side-by-side panels separated by thin white gaps, the SAME adult with identical framing, angle and soft daylight from the upper left in every panel. ${b.frames_prompt} Natural skin texture with visible pores, not airbrushed. ${EXCL} No eyes or lips if the panels are skin close-ups. Wide 3:2 image.`, out: `${process.cwd()}\\pipeline\\runs\\2026-10-05-g1\\backgrounds\\${id}.frames.png` }); }
    else { const src = FR[h][t === 14 ? 1 : 0]; const sh = h.startsWith("pha") ? (t === 14 ? NIA : CLN) : src; const sr = h.startsWith("pha") && t === 12 ? "10-05-formats/" + CLN + "__t12" : `10-05-formats/${sh}__t${t}`; for (const k of ["frame1", "frame2", "frame3", "frames"]) { const f = `pipeline/runs/2026-${sr.replace("/", "/backgrounds/")}.${k}.png`; if (fs.existsSync(f)) reuse.push([f, `${id}.${k}.png`]); } }
  }
}
fs.writeFileSync(RUN + "reuse_map.json", JSON.stringify(reuse, null, 1));
fs.writeFileSync(RUN + "chatgpt_jobs.json", JSON.stringify(jobs, null, 1));
console.log(out.length, "briefs;", reuse.length, "reuse files;", jobs.length, "jobs");








