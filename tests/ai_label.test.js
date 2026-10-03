import test from "node:test";
import assert from "node:assert/strict";
import { renderAdSvg, LAYOUTS } from "../public/render.js";

// Regression (eye-check 2026-10-03): the hero layout built its own SVG and dropped the AI mark, so hero ads with
// AI-generated people showed none. Every layout must draw the mark whenever the spec says AI imagery is present.
test("every layout draws the AI-GENERATED mark when aiLabel is set", () => {
  const base = {
    headline: "Test headline", subhead: "Sub", proofPoints: ["Point"], footnote: "Footnote", cta: "Learn more",
    productName: "Test Product", hero: { pct: "10%", name: "Niacinamide" }, aiLabel: true, personHref: "data:image/png;base64,AA==",
    imageHref: "", steps: [], range: [], actives: [], callouts: [], specs: [], photos: [], badges: [{ text: "A" }],
    frames: [{ label: "Day 1" }, { label: "Week 2" }, { label: "Week 4" }], offer: { line: "Offer", condition: "Condition" },
    stat: { value: "4.0", label: "stars" }, proof: { value: "4.0", label: "stars", source: "src" }, review: { quote: "q", source: "s" },
  };
  const layouts = ["hero", ...Object.keys(LAYOUTS || {})];
  for (const layout of [...new Set(layouts)]) {
    const svg = renderAdSvg({ ...base, layout });
    assert.ok(svg.includes("AI-GENERATED"), `layout ${layout} is missing the AI mark`);
  }
});
