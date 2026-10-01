// Composes the ad as an SVG string. Pure function, no DOM — runs in the browser and in Node tests.
//
// Layout decisions (see docs/DECISIONS.md):
//  - One placement: 1080x1080 (1:1). Works in Meta feed (FB/IG) and as a square asset for Google
//    Demand Gen / responsive display. More sizes = more layouts where the footnote can be cropped.
//  - The hero number (e.g. "10%" + "Niacinamide") is taken from the pack title, never from the model.
//  - The real product photo is used as-is (no generation, no retouching).
//  - Footnote is part of the creative, sized to stay legible (>= 20px at 1080) — a qualifier that
//    can't be read in feed is the same as no qualifier.

export const SIZE = { w: 1080, h: 1080 };

const C = {
  bg: "#F4F2EE",
  ink: "#111111",
  muted: "#5B5B5B",
  rule: "#D6D2CB",
  card: "#FFFFFF",
};
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Greedy wrap using an average glyph width; good enough for a sans at these sizes.
export function wrap(text, fontPx, maxPx, avg = 0.52) {
  const maxChars = Math.max(4, Math.floor(maxPx / (fontPx * avg)));
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function textBlock(lines, x, y, size, lh, attrs) {
  return lines
    .map((l, i) => `<text x="${x}" y="${y + i * lh}" font-size="${size}" ${attrs}>${esc(l)}</text>`)
    .join("");
}

const BAND_Y = 820; // everything in the text column must end above this line

// spec: { hero: {pct, name}, headline, subhead, proofPoints[], footnote, cta, imageHref, productName }
// Text is laid out at scale 1, then shrunk in steps until the column fits above the bottom band.
// If it still doesn't fit at the minimum scale, the overflow is reported (layoutProblems) — the
// first render test (v1) showed proof points running into the CTA, and that must never export.
export function renderAdSvg(spec) {
  for (let s = 1; s >= 0.7; s -= 0.05) {
    const out = layout(spec, s);
    if (out.bottom <= BAND_Y - 24) return out.svg;
  }
  return layout(spec, 0.7).svg;
}

export function measure(spec) {
  for (let s = 1; s >= 0.7; s -= 0.05) {
    const out = layout(spec, s);
    if (out.bottom <= BAND_Y - 24) return { fits: true, scale: +s.toFixed(2), bottom: out.bottom };
  }
  return { fits: false, scale: 0.7, bottom: layout(spec, 0.7).bottom };
}

function layout(spec, s) {
  const { w, h } = SIZE;
  const pad = 72;
  const leftW = 500; // text column
  const parts = [];
  const px = (n) => Math.round(n * s);

  parts.push(`<rect width="${w}" height="${h}" fill="${C.bg}"/>`);

  // Product photo: right side, aspect preserved, never cropped or retouched. No frame: the
  // Shopify pack shots carry their own studio background (v1 showed a white card clashing with it).
  if (spec.imageHref) {
    parts.push(
      `<image href="${esc(spec.imageHref)}" x="590" y="110" width="430" height="660" preserveAspectRatio="xMidYMid meet"/>`
    );
  }

  // Wordmark (text, not the logo file).
  parts.push(
    `<text x="${pad}" y="${pad + 18}" font-family="${FONT}" font-size="26" font-weight="700" letter-spacing="1" fill="${C.ink}">Minimalist</text>`
  );

  let y = 150;
  if (spec.hero && spec.hero.pct) {
    const isSpf = /spf/i.test(spec.hero.name);
    const big = isSpf ? `SPF ${spec.hero.pct}` : spec.hero.pct;
    const bigPx = px(isSpf ? 104 : 132);
    parts.push(
      `<text x="${pad - 4}" y="${y + bigPx}" font-family="${FONT}" font-size="${bigPx}" font-weight="300" fill="${C.ink}" letter-spacing="-3">${esc(big)}</text>`
    );
    y += bigPx + px(14);
    if (!isSpf) {
      const nl = wrap(spec.hero.name, px(36), leftW);
      parts.push(textBlock(nl, pad, y + px(36), px(36), px(42), `font-family="${FONT}" font-weight="500" fill="${C.ink}"`));
      y += px(36) + (nl.length - 1) * px(42);
    }
    y += px(28);
    parts.push(`<line x1="${pad}" y1="${y}" x2="${pad + 80}" y2="${y}" stroke="${C.ink}" stroke-width="3"/>`);
    y += px(20);
  }

  const hs = px(40), hl = px(48);
  const head = wrap(spec.headline, hs, leftW);
  parts.push(textBlock(head, pad, y + hs, hs, hl, `font-family="${FONT}" font-weight="600" fill="${C.ink}"`));
  y += hs + (head.length - 1) * hl + px(10);

  if (spec.subhead) {
    const ss = px(25), sl = px(33);
    const sub = wrap(spec.subhead, ss, leftW);
    parts.push(textBlock(sub, pad, y + sl, ss, sl, `font-family="${FONT}" fill="${C.muted}"`));
    y += sl * sub.length + px(6);
  }

  (spec.proofPoints || []).slice(0, 3).forEach((p) => {
    const ps = px(23), pl = px(30);
    const lines = wrap(p, ps, leftW - 28);
    y += px(18);
    parts.push(`<rect x="${pad}" y="${y + pl - ps + 2}" width="${px(10)}" height="${px(10)}" fill="${C.ink}"/>`);
    parts.push(textBlock(lines, pad + 28, y + pl, ps, pl, `font-family="${FONT}" fill="${C.ink}"`));
    y += lines.length * pl;
  });
  const bottom = y;

  // Bottom band: CTA left, product name right of it, footnote across full width.
  const bandY = BAND_Y;
  parts.push(`<line x1="${pad}" y1="${bandY}" x2="${w - pad}" y2="${bandY}" stroke="${C.rule}" stroke-width="2"/>`);
  if (spec.cta) {
    parts.push(`<rect x="${pad}" y="${bandY + 32}" width="260" height="68" rx="34" fill="${C.ink}"/>`);
    parts.push(
      `<text x="${pad + 130}" y="${bandY + 76}" text-anchor="middle" font-family="${FONT}" font-size="26" font-weight="600" fill="#FFFFFF">${esc(spec.cta)}</text>`
    );
  }
  if (spec.productName) {
    parts.push(
      textBlock(wrap(spec.productName, 22, 560), 372, bandY + 74, 22, 28, `font-family="${FONT}" fill="${C.muted}"`)
    );
  }
  if (spec.footnote) {
    const fn = wrap(spec.footnote, 20, w - 2 * pad, 0.5).slice(0, 3);
    parts.push(textBlock(fn, pad, bandY + 150, 20, 26, `font-family="${FONT}" fill="${C.muted}"`));
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join("")}</svg>`;
  return { svg, bottom };
}

// Overflow check used by the generator: returns problems instead of silently clipping text.
export function layoutProblems(spec) {
  const problems = [];
  const m = measure(spec);
  if (!m.fits) problems.push("Copy does not fit the 1080x1080 layout even at 70% text size — shorten it.");
  if (spec.footnote && wrap(spec.footnote, 20, SIZE.w - 144, 0.5).length > 3) problems.push("Footnote longer than 3 lines would be cut off.");
  const lim = (label, text, max) => {
    if (text && text.length > max) problems.push(`${label} is ${text.length} chars (max ${max})`);
  };
  lim("Headline", spec.headline, 60);
  lim("Subhead", spec.subhead, 120);
  (spec.proofPoints || []).forEach((p, i) => lim(`Proof point ${i + 1}`, p, 70));
  lim("Footnote", spec.footnote, 240);
  if ((spec.proofPoints || []).length > 3) problems.push("More than 3 proof points");
  return problems;
}
