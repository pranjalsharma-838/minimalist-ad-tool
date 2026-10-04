import fs from "node:fs";import path from "node:path";
import { adFromBrief } from "../../../lib/brief_check.js";
import { buildJudgePrompt } from "../../../lib/judge.js";
import { runRules } from "../../../lib/rules.js";
const run="pipeline/runs/2026-10-05-g1/";
const sheets=Object.fromEntries(fs.readdirSync(run+"products").map(f=>[f.replace(/\.json$/,""),JSON.parse(fs.readFileSync(run+"products/"+f,"utf8"))]));
const bs=JSON.parse(fs.readFileSync(run+"briefs_final.json","utf8"));
fs.mkdirSync(run+"judge_prompts_final",{recursive:true});
for(const b of bs){const h=b.source_ad_id.split("__t")[0];const sheet=sheets[h];const ad=adFromBrief(b,sheets,h);
 const extra=[...(b.steps||[]),...(b.range||[])].map(x=>sheets[x.product_handle]).filter(s=>s&&s!==sheet);
 const jp=buildJudgePrompt(ad,runRules(ad,{sheet,extraSheets:extra}),{sheet});
 fs.writeFileSync(run+"judge_prompts_final/"+b.source_ad_id+".user.md",jp.user);}
console.log(bs.length);
