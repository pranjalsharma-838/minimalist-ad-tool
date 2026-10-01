// Builds eval/cases.json (all eval cases, one schema) and eval/labeling_input.json (the same ads with
// author notes stripped, for the independent labeler — so "CLEAN" notes can't leak the answer).
import fs from "node:fs";

const fromCorpus = (file, split) =>
  JSON.parse(fs.readFileSync(file, "utf8")).map((a) => ({
    id: a.id,
    split,
    source: a.source_url,
    advertiser: a.advertiser,
    is_minimalist: a.is_minimalist,
    ad_type: /\swith\s/i.test(a.advertiser) ? "creator" : "brand",
    headline: a.headline || "",
    primary_text: a.primary_text || "",
    on_image_text: a.on_image_text || "",
    footnote: "",
    cta: a.cta || "",
  }));

const synthetic = JSON.parse(fs.readFileSync("eval/cases_synthetic.json", "utf8")).map((c) => ({
  split: "synthetic",
  source: "author-written",
  advertiser: "synthetic",
  is_minimalist: true,
  ...c,
}));

const cases = [...fromCorpus("eval/corpus_tuning.json", "tuning"), ...fromCorpus("eval/corpus_holdout.json", "holdout"), ...synthetic];
fs.writeFileSync("eval/cases.json", JSON.stringify(cases, null, 2));
const blind = cases.map(({ note, split, source, ...rest }) => rest);
fs.writeFileSync("eval/labeling_input.json", JSON.stringify(blind, null, 2));
console.log(`cases: ${cases.length} (tuning ${cases.filter((c) => c.split === "tuning").length}, holdout ${cases.filter((c) => c.split === "holdout").length}, synthetic ${synthetic.length})`);
