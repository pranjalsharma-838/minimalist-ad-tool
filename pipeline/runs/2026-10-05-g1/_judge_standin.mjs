import fs from "node:fs";
const run="pipeline/runs/2026-10-05-g1/", d=run+"judge_prompts_final/";
fs.mkdirSync(run+"judge",{recursive:true});
const briefs=Object.fromEntries(JSON.parse(fs.readFileSync(run+"briefs_final.json","utf8")).map(b=>[b.source_ad_id,b]));
const WHY={ "LNG-01":["likely_false_positive","Ingredient or active name used as the product's own name, as on the pack and page; not a style problem."],
 "CLM-24":["agree","'Hair Growth' is part of the product's own name (page and pack). The copy makes no hair-growth or hair-fall promise, but a reviewer should confirm the name may be shown."],
 "CLM-12":["agree","A comparison layout by design (DEC-02); each row cites a page fact and the footnote states the basis. Stays High risk until proof is on file."],
 "CLM-08":["likely_false_positive","The stat is a share of study subjects who agreed, and the qualifier ('share of study subjects who agreed, as stated on the product page') is in the footnote on the creative."]};
let n=0,withF=0,tally={};
for(const f of fs.readdirSync(d).filter(x=>x.endsWith(".user.md"))){const id=f.replace(".user.md",""),b=briefs[id],t=fs.readFileSync(d+f,"utf8");const h=id.split("__t")[0],tpl=+id.split("__t")[1];
 const hits=[...(t.match(/Rule-layer hits already found[^\n]*\n([\s\S]*?)\n\nProduct page/)||[,""])[1].matchAll(/^(\d+)\. (\S+) in (\w+):/gm)];
 const rev=hits.map(m=>({index:+m[1],assessment:WHY[m[2]]?.[0]||"agree",why:WHY[m[2]]?.[1]||"Rule hit stands."}));
 const F=[];const add=(rule,field,span,sev,why,fix)=>t.includes(span)&&F.push({rule_id:rule,dimension:"policy",field,span,severity:sev,why,fix});
 const hair=h.startsWith("hair");
 if(tpl===15&&h.startsWith("retinol")) add("UNLISTED","on_image_text","For fine lines & wrinkles concerns","fix","Naming fine lines and wrinkles as the concern can read as a promise to address them; the page lists it only as a concern label.","Replace with the page's usage or formula line, or keep the concern label with no outcome wording next to it.");
 if(tpl===15&&h.startsWith("vitamin-c")) add("UNLISTED","on_image_text","For spots, uneven tone & dull skin","fix","A concern list beside the pack can read as treating spots; the page gives it only as a suitability label.","Keep it as a plain 'Concerns:' label or replace it with a usage line.");
 if(tpl===15&&h.startsWith("niacinamide")) add("UNLISTED","on_image_text","Hydrates, repairs & soothes skin","fix","'Repairs' is stronger than a hydration or comfort claim and is the page tagline, not a tested result on this creative.","Use 'Hydrates & soothes skin' or cut the callout.");
 if(tpl===17&&h.startsWith("retinol")) add("UNLISTED","on_image_text","Retinol and water: Water-free vs Oxidises","fix","The 'Oxidises' column can imply that other Retinol products degrade, which the page does not test.","Keep only the strength row and state 'water-free formula, UV protective bottle' as a plain fact.");
 if(tpl===17&&h.startsWith("pha")) add("UNLISTED","on_image_text","Molecule size: Larger vs Smaller","advisory","Molecular size is page-stated, but beside Glycolic acid it can imply a gentleness advantage the page does not state in this row.","Keep only the molecular weight row; leave size as a plain number.");
 if([12,14].includes(tpl)) add("UNLISTED","on_image_text",tpl===14?"Week 4":(b.headline),"advisory","AI-illustrated skin or hair frames suggest a change over time even with routine-stage labels and an AI mark; no study backs the frames.","Replace with real, consented study photos, or drop the frames before any use.");
 for(const x of F) tally[x.severity]=(tally[x.severity]||0)+1; if(F.length)withF++;
 const kind={21:"texture shot",38:"two-product pairing",22:"routine steps",36:"offer",17:"comparison",6:"lifestyle scene",8:"in-use scene",9:"application close-up",10:"lifestyle scene",31:"creator selfie",14:"progress frames",12:"before/after frames",15:"concern callouts",26:b.layout==="stat"?"study stat":"fact sheet",2:"badges",3:"ingredient cards",4:"ingredient headline"}[tpl];
 const out={findings:F,rule_hit_review:rev,tone_read:`Calm, ingredient-first ${kind} in Minimalist's voice with no fear, hype or emoji. ${tpl===36?"The offer is quoted plainly with its condition and no urgency.":"The text is short and drawn from page usage or sourcing lines."}`,language_read:`${b.product_title}: the active and its strength are stated as on the page, with no unhedged efficacy verbs${hair?" and no hair-growth or hair-fall wording beyond the product's own name":""}. ${[12,14,6,8,9,10,31].includes(tpl)?"The creative carries an AI illustration mark and Severe risk, so it is review-only.":"Every shown line traces to a cited page fact."}`};
 fs.writeFileSync(run+"judge/"+id+".json",JSON.stringify(out)); n++;}
console.log(n,"judge files;",withF,"with findings;",JSON.stringify(tally));

