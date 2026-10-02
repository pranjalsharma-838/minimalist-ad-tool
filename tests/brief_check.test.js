import { test } from "node:test";
import assert from "node:assert/strict";
import { checkBrief } from "../lib/brief_check.js";

const nia = { title: "Niacinamide 10% Face Serum", actives: [{ name: "Niacinamide", pct: "10%" }], images: ["x"], facts: [
  { id: "F1", kind: "name", text: "Niacinamide 10% Face Serum" },
  { id: "F3", kind: "claim", text: "Niacinamide reduces the sebum level of the skin" },
  { id: "F4", kind: "testimonial", text: "\"Amazing, my scars are gone\" -A. B." },
] };
const cl = { title: "Salicylic Acid + LHA 2% Cleanser", actives: [{ name: "Salicylic Acid + LHA", pct: "2%" }], images: ["y"], facts: [
  { id: "F13", kind: "usage", text: "Apply on wet face. AM & PM. Everyday." },
] };
const sheets = { nia, "salicylic-lha-2-cleanser": cl };

test("actives layout: cited numbers pass, uncited or invented ones fail", () => {
  const ok = { layout: "actives", headline: "What's inside", citations: { headline: ["F1"] }, actives: [{ pct: "10%", name: "Niacinamide", line: "Reduces the sebum level", cites: ["F1", "F3"] }], footnote: "" };
  assert.deepEqual(checkBrief(ok, sheets, "nia"), []);
  const bad = { ...ok, actives: [{ pct: "12%", name: "Niacinamide", line: "Reduces sebum by 40%", cites: ["F3"] }] };
  assert.ok(checkBrief(bad, sheets, "nia").some((p) => /12, 40/.test(p)));
});

test("journey layout: cross-product citations resolve; missing products are reported", () => {
  const j = { layout: "journey", headline: "Two steps", citations: { headline: ["F1"] }, steps: [
    { label: "Step 1", product_handle: "salicylic-lha-2-cleanser", line: "Apply on wet face, AM & PM", cites: ["salicylic-lha-2-cleanser:F13"] },
    { label: "Step 2", product_handle: "nia", line: "Reduces the sebum level", cites: ["F3"] },
  ] };
  assert.deepEqual(checkBrief(j, sheets, "nia"), []);
  const missing = { ...j, steps: [...j.steps, { label: "Step 3", product_handle: "spf-50", line: "Protect", cites: ["spf-50:F2"] }] };
  const p = checkBrief(missing, sheets, "nia");
  assert.ok(p.some((x) => /spf-50/.test(x)));
});

test("testimonials can't be cited, in any layout", () => {
  const s = { layout: "stat", headline: "x", citations: { headline: ["F1"] }, stat: { value: "", label: "scars gone", cites: ["F4"] } };
  assert.ok(checkBrief(s, sheets, "nia").some((p) => /testimonial/.test(p)));
});

test("offer layout needs its condition", () => {
  const o = { layout: "offer", headline: "", offer: { line: "Get the 3rd free", condition: "" } };
  assert.ok(checkBrief(o, sheets, "nia").some((p) => /condition/.test(p)));
});
