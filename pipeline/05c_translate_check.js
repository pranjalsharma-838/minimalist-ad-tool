// Stage 5c — language versions (add-on g). For each approved brief with translations/<id>.<lang>.json
// (written by the translator agent with prompts/translator.md), run lib/lang_check.js and write
// translations/check_summary.json. Approved versions can then be composed by 08_compose with --lang <code>.
// Usage: node pipeline/05c_translate_check.js <run>
import fs from "node:fs";
import path from "node:path";
import { adFromBrief } from "../lib/brief_check.js";
import { checkTranslation } from "../lib/lang_check.js";

const run = process.argv[2];
const runDir = path.join("pipeline", "runs", run);
const tdir = path.join(runDir, "translations");
const briefs = new Map(JSON.parse(fs.readFileSync(path.join(runDir, "briefs_final.json"), "utf8")).map((b) => [b.source_ad_id, b]));
const sheets = Object.fromEntries(fs.readdirSync(path.join(runDir, "products")).map((f) => [f.replace(/\.json$/, ""), JSON.parse(fs.readFileSync(path.join(runDir, "products", f), "utf8"))]));
const summary = [];
for (const f of fs.existsSync(tdir) ? fs.readdirSync(tdir).filter((x) => /^.+\.[a-z]{2}\.json$/.test(x)) : []) {
  const [id, lang] = f.replace(/\.json$/, "").split(/\.(?=[a-z]{2}$)/);
  const b = briefs.get(id);
  if (!b) { console.log(`${f}: no brief ${id}`); continue; }
  const v = JSON.parse(fs.readFileSync(path.join(tdir, f), "utf8"));
  const res = checkTranslation(adFromBrief(b, sheets, b.product_handle), { ...v, lang }, { sheet: sheets[b.product_handle] });
  summary.push({ id, lang, verdict: res.verdict, findings: res.findings });
  console.log(`${id} [${lang}]: ${res.verdict}${res.findings.length ? " — " + res.findings.map((x) => `${x.check}${x.span ? ` "${x.span}"` : ""} (${x.field})`).join("; ") : ""}`);
}
fs.mkdirSync(tdir, { recursive: true });
fs.writeFileSync(path.join(tdir, "check_summary.json"), JSON.stringify(summary, null, 2));
console.log(`${summary.length} language versions checked`);
