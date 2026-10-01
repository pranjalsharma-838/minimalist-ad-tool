// Splits research/ad_corpus.json into a TUNING set (read while writing rules/prompts) and a
// HOLDOUT set (not read until the rules are frozen; then labeled blind and scored once).
// Deterministic: hash of the ad id, so the split can't be nudged after seeing results.
// Prints only ids and counts — never holdout text — so it doesn't leak into the build session.
import fs from "node:fs";
import crypto from "node:crypto";

const ads = JSON.parse(fs.readFileSync("research/ad_corpus.json", "utf8"));
const bucket = (id) => parseInt(crypto.createHash("sha256").update(String(id)).digest("hex").slice(0, 8), 16) % 100;
const tuning = [], holdout = [];
for (const ad of ads) (bucket(ad.id) < 45 ? holdout : tuning).push(ad);
fs.mkdirSync("eval", { recursive: true });
fs.writeFileSync("eval/corpus_tuning.json", JSON.stringify(tuning, null, 2));
fs.writeFileSync("eval/corpus_holdout.json", JSON.stringify(holdout, null, 2));
const count = (xs) => `${xs.length} (${xs.filter((a) => a.is_minimalist).length} Minimalist, ${xs.filter((a) => !a.is_minimalist).length} other)`;
console.log("tuning:", count(tuning));
console.log("holdout:", count(holdout), "ids:", holdout.map((a) => a.id).join(", "));
