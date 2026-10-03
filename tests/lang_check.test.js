import test from "node:test";
import assert from "node:assert/strict";
import { checkTranslation } from "../lib/lang_check.js";

const sheet = { actives: [{ name: "Niacinamide", pct: "10" }], facts: [{ id: "PRICE1", kind: "price", text: "30ml: Rs. 539 (MRP Rs. 599)" }] };
const en = { ad_type: "brand", headline: "10% Niacinamide for oily skin", on_image_text: "30ml: Rs. 539, MRP Rs. 599", footnote: "Offers as on beminimalist.co. T&C apply.", cta: "Shop now" };
const line = (text, back_translation) => ({ text, back_translation });

test("faithful Hindi version passes", () => {
  const r = checkTranslation(en, { lang: "hi", lines: { headline: line("ऑयली स्किन के लिए 10% Niacinamide", "10% Niacinamide for oily skin"), on_image_text: line("30ml: Rs. 539, MRP Rs. 599", "30ml: Rs. 539, MRP Rs. 599"), footnote: line("ऑफ़र beminimalist.co के अनुसार। नियम व शर्तें लागू (T&C)।", "Offers as per beminimalist.co. Terms and conditions apply (T&C)."), cta: line("अभी खरीदें", "Buy now") } }, { sheet });
  assert.equal(r.verdict, "pass", JSON.stringify(r.findings));
});

test("changed number, drug word, English footnote and a drifted claim are all caught", () => {
  const r = checkTranslation(en, { lang: "hi", lines: { headline: line("मुहांसों का इलाज, 12% Niacinamide", "Treatment of pimples, 12% Niacinamide"), on_image_text: line("30ml: Rs. 539, MRP Rs. 599", "30ml: Rs. 539, MRP Rs. 599"), footnote: line("Offers as on beminimalist.co. T&C apply.", "Offers as on beminimalist.co. T&C apply."), cta: line("अभी खरीदें", "Buy now") } }, { sheet });
  const checks = new Set(r.findings.map((f) => f.check));
  assert.equal(r.verdict, "block");
  for (const c of ["numbers_lock", "native_risk_word", "disclaimer_language", "rules_on_back_translation"]) assert.ok(checks.has(c), c);
});

test("native-script digits count as the same number", () => {
  const r = checkTranslation({ ad_type: "brand", headline: "SPF 50 daily" }, { lang: "hi", lines: { headline: line("रोज़ के लिए SPF ५०", "SPF 50 for daily") } }, {});
  assert.ok(!r.findings.some((f) => f.check === "numbers_lock"));
});
