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
// 'Nirmala UI' (ships with Windows) + Noto fallbacks cover Devanagari, Tamil, Telugu, Bengali for language versions.
const FONT = "'Helvetica Neue', Helvetica, Arial, 'Nirmala UI', 'Noto Sans Devanagari', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Bengali', sans-serif";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Visual length in "Latin character" units. Eye-check (Tamil pilot, 2026-10-03): Tamil/Telugu/Bengali glyph
// clusters are wider than Latin letters, so counting code points overflowed headlines, pills and the CTA.
export function vlen(text) {
  let n = 0;
  for (const ch of String(text || "")) {
    const c = ch.codePointAt(0);
    n += c >= 0x0b80 && c <= 0x0d7f ? 1.3 /* Tamil, Telugu, Kannada, Malayalam */ : c >= 0x0980 && c <= 0x09ff ? 1.15 /* Bengali */ : c >= 0x0900 && c <= 0x097f ? 1.0 : 1;
  }
  return n;
}

// Greedy wrap using an average glyph width; good enough for a sans at these sizes.
export function wrap(text, fontPx, maxPx, avg = 0.52) {
  const maxChars = Math.max(4, Math.floor(maxPx / (fontPx * avg)));
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if (vlen(cur + " " + w) <= maxChars) cur += " " + w;
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
const FOOT_PX = 26;

// spec: { hero: {pct, name}, headline, subhead, proofPoints[], footnote, cta, imageHref, productName }
// Text is laid out at scale 1, then shrunk in steps until the column fits above the bottom band.
// If it still doesn't fit at the minimum scale, the overflow is reported (layoutProblems) — the
// first render test (v1) showed proof points running into the CTA, and that must never export.
// spec.layout picks the format (research/ad_format_library.md): hero (default), actives, journey, stat,
// callouts, spec, range, offer, before_after. All share the same chrome: wordmark, CTA band, 26px
// footnote, internal-test mark — so the legal furniture is identical whichever format is used.
export const LAYOUTS = { hero: (spec, s) => layout(spec, s) };

function pick(spec) {
  return LAYOUTS[spec.layout || "hero"] || LAYOUTS.hero;
}

export function renderAdSvg(spec) {
  const fn = pick(spec);
  for (let s = 1; s >= 0.7; s -= 0.05) {
    const out = fn(spec, s);
    if (out.bottom <= BAND_Y - 24) return out.svg;
  }
  return fn(spec, 0.7).svg;
}

export function measure(spec) {
  const fn = pick(spec);
  for (let s = 1; s >= 0.7; s -= 0.05) {
    const out = fn(spec, s);
    if (out.bottom <= BAND_Y - 24) return { fits: true, scale: +s.toFixed(2), bottom: out.bottom };
  }
  return { fits: false, scale: 0.7, bottom: fn(spec, 0.7).bottom };
}

function layout(spec, s) {
  const { w, h } = SIZE;
  const pad = 72;
  const leftW = 500; // text column
  const parts = [];
  const px = (n) => Math.round(n * s);

  parts.push(`<rect width="${w}" height="${h}" fill="${C.bg}"/>`);

  // Optional generated BACKGROUND (scene only — lib/image_prompt_check.js forbids product, text, skin).
  // A translucent panel keeps the copy legible whatever the scene looks like.
  if (spec.backgroundHref) {
    parts.push(`<image href="${esc(spec.backgroundHref)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`);
    parts.push(`<rect x="40" y="40" width="540" height="${BAND_Y - 40}" rx="8" fill="${C.bg}" fill-opacity="0.9"/>`);
    parts.push(`<rect x="40" y="${BAND_Y + 8}" width="${w - 80}" height="${h - BAND_Y - 32}" rx="8" fill="${C.bg}" fill-opacity="0.92"/>`);
  }

  // Product photo: right side, aspect preserved, never cropped or retouched. No frame: the
  // Shopify pack shots carry their own studio background (v1 showed a white card clashing with it).
  if (spec.imageHref) {
    // Over a generated background the pack shot's own studio backdrop shows as a pasted rectangle.
    // Tried mix-blend-mode:multiply (2026-10-02): it greyed the white tube — that changes how the real
    // product looks, so it was reverted. Until a cut-out (transparent) pack shot is supplied, the photo
    // sits in a deliberate white frame so it reads as a product card, not a paste error.
    // 2026-10-03: with a clean cut-out the bottle stands in the scene with a shadow (see pack()); with an AI person
    // image the person fills the zone and the pack is an inset (see productVisual()).
    parts.push(productVisual(spec, 590, 110, 430, 660));
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
  // Bold glyphs are wider; 0.52 let "Reduces Acne, Blackheads" run into the photo (app test, Salicylic 2%).
  const head = wrap(spec.headline, hs, leftW, 0.58);
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
      `<text x="${pad + 130}" y="${bandY + 76}" text-anchor="middle" font-family="${FONT}" font-size="${Math.min(26, Math.floor(220 / Math.max(1, vlen(spec.cta) * 0.56)))}" font-weight="600" fill="#FFFFFF">${esc(spec.cta)}</text>`
    );
  }
  if (spec.productName) {
    parts.push(
      textBlock(wrap(spec.productName, 22, 560), 372, bandY + 74, 22, 28, `font-family="${FONT}" fill="${C.muted}"`)
    );
  }
  // Footnote at 26px: ASCI's disclaimer guideline sets >= 26px lower-case text in a 1080 raster for
  // video; applied here to static by analogy (research/regulatory_sources.md, ASCI-G-DISC).
  if (spec.footnote) {
    const fn = wrap(spec.footnote, FOOT_PX, w - 2 * pad, 0.5).slice(0, 3);
    parts.push(textBlock(fn, pad, bandY + 140, FOOT_PX, 32, `font-family="${FONT}" fill="${C.muted}"`));
  }

  // Internal-test watermark (Minimalist is the test brand for this pipeline: never run these).
  if (spec.testMark) {
    parts.push(`<text x="${w - 24}" y="${h - 14}" text-anchor="end" font-family="${FONT}" font-size="16" fill="#B42318" fill-opacity="0.85">${esc(spec.testMark)}</text>`);
  }
  // Bug fix (eye-check 2026-10-03): this hero layout builds its own SVG and skipped the AI label that chromeEnd()
  // draws, so hero ads with AI people (product-in-use, product-in-hand) showed no mark. Same label, same rule.
  if (spec.aiLabel) parts.push(aiBadge(w));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs(spec)}${parts.join("")}</svg>`;
  return { svg, bottom };
}

// ---------------- format library layouts ----------------

const PAD = 72;
const T = (lines, x, y, size, lh, attrs) => textBlock(lines, x, y, size, lh, `font-family="${FONT}" ${attrs}`);

// Background, panels (left column or full width) and wordmark.
function chromeStart(spec, panel) {
  const { w, h } = SIZE;
  const parts = [`<rect width="${w}" height="${h}" fill="${C.bg}"/>`];
  if (spec.backgroundHref) {
    parts.push(`<image href="${esc(spec.backgroundHref)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>`);
    const pw = panel === "full" ? w - 80 : 540;
    parts.push(`<rect x="40" y="40" width="${pw}" height="${BAND_Y - 40}" rx="8" fill="${C.bg}" fill-opacity="0.9"/>`);
    parts.push(`<rect x="40" y="${BAND_Y + 8}" width="${w - 80}" height="${h - BAND_Y - 32}" rx="8" fill="${C.bg}" fill-opacity="0.92"/>`);
  }
  parts.push(`<text x="${PAD}" y="${PAD + 18}" font-family="${FONT}" font-size="26" font-weight="700" letter-spacing="1" fill="${C.ink}">Minimalist</text>`);
  return parts;
}

const aiBadge = (w) => `<rect x="${w - 372}" y="16" width="352" height="40" rx="6" fill="#B42318"/><text x="${w - 196}" y="43" text-anchor="middle" font-family="${FONT}" font-size="18" font-weight="700" fill="#FFFFFF">AI-GENERATED — ILLUSTRATIVE</text>`;

// CTA band, product name, footnote, test mark -> svg.
function chromeEnd(spec, parts, bottom) {
  const { w, h } = SIZE;
  parts.push(`<line x1="${PAD}" y1="${BAND_Y}" x2="${w - PAD}" y2="${BAND_Y}" stroke="${C.rule}" stroke-width="2"/>`);
  if (spec.cta) {
    parts.push(`<rect x="${PAD}" y="${BAND_Y + 32}" width="260" height="68" rx="34" fill="${C.ink}"/>`);
    parts.push(`<text x="${PAD + 130}" y="${BAND_Y + 76}" text-anchor="middle" font-family="${FONT}" font-size="${Math.min(26, Math.floor(220 / Math.max(1, vlen(spec.cta) * 0.56)))}" font-weight="600" fill="#FFFFFF">${esc(spec.cta)}</text>`);
  }
  if (spec.productName) parts.push(T(wrap(spec.productName, 22, 560), 372, BAND_Y + 74, 22, 28, `fill="${C.muted}"`));
  if (spec.footnote) parts.push(T(wrap(spec.footnote, FOOT_PX, w - 2 * PAD, 0.5).slice(0, 3), PAD, BAND_Y + 140, FOOT_PX, 32, `fill="${C.muted}"`));
  // Visible AI label whenever generated people/skin/results are in the creative (user decision 2026-10-03).
  if (spec.aiLabel) parts.push(aiBadge(w));
  if (spec.testMark) parts.push(`<text x="${w - 24}" y="${h - 14}" text-anchor="end" font-family="${FONT}" font-size="16" fill="#B42318" fill-opacity="0.85">${esc(spec.testMark)}</text>`);
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs(spec)}${parts.join("")}</svg>`, bottom };
}

// A real pack shot, aspect kept. On a generated background:
//  - clean transparent cut-out (spec.cutoutHrefs, from the asset library) → no frame; a soft shadow that follows
//    the bottle's silhouette, falling away from the light (spec.shadowDx: + = light from the left), plus a contact
//    shadow ellipse at the base, so it stands IN the scene. Pixels of the product itself are untouched.
//  - studio photo with its own backdrop → deliberate white frame (multiply blend greyed white packs; reverted).
// Contact-shadow base: the photo is "meet"-fitted, so the visible bottom is approximated by the box bottom.
function pack(spec, href, x, y, w, h) {
  if (!href) return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="${C.rule}" stroke-dasharray="6 6"/>`;
  const img = `<image href="${esc(href)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"`;
  if (spec.backgroundHref && (spec.cutoutHrefs || []).includes(href)) {
    const dx = spec.shadowDx ?? 12;
    return `<ellipse cx="${x + w / 2 + dx}" cy="${y + h - 4}" rx="${w * 0.32}" ry="${Math.max(8, h * 0.025)}" fill="#000" fill-opacity="0.28" filter="url(#contactBlur)"/>${img} filter="url(#packShadow)"/>`;
  }
  const frame = spec.backgroundHref ? `<rect x="${x - 10}" y="${y - 10}" width="${w + 20}" height="${h + 20}" rx="10" fill="#FFFFFF"/>` : "";
  return `${frame}${img}/>`;
}
// The product zone. With an AI-generated person image (spec.personHref, angle-matrix fill 2026-10-03) the person is
// the main visual — a rounded photo card filling the zone — and the REAL pack shot sits in front as an inset at the
// lower left (the product is never part of the AI image). Without one, the zone holds the pack shot as before.
function productVisual(spec, x, y, w, h) {
  if (!spec.personHref) return pack(spec, spec.imageHref, x, y, w, h);
  const card = `<clipPath id="personClip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/></clipPath>` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#FFFFFF"/>` +
    `<image href="${esc(spec.personHref)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#personClip)"/>`;
  const iw = Math.round(w * 0.36), ih = Math.round(h * 0.42);
  return card + pack(spec, spec.imageHref, x + 18, y + h - ih - 18, iw, ih);
}
const defs = (spec) => `<defs><filter id="packShadow" x="-20%" y="-10%" width="140%" height="130%"><feDropShadow dx="${spec.shadowDx ?? 12}" dy="14" stdDeviation="12" flood-color="#000" flood-opacity="0.22"/></filter><filter id="contactBlur" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="9"/></filter></defs>`;

function headlineBlock(parts, text, x, y, maxW, s, size = 44) {
  const hs = Math.round(size * s), hl = Math.round(size * 1.18 * s);
  const lines = wrap(text, hs, maxW, 0.58);
  parts.push(T(lines, x, y + hs, hs, hl, `font-weight="600" fill="${C.ink}"`));
  return y + hs + (lines.length - 1) * hl;
}

// Ingredient explainer -> each active with its %, name and one cited line on what it does.
LAYOUTS.actives = (spec, s) => {
  const parts = chromeStart(spec, "left");
  parts.push(pack(spec, spec.imageHref, 590, 110, 430, 660));
  let y = headlineBlock(parts, spec.headline, PAD, 140, 490, s, 42) + Math.round(24 * s);
  for (const a of (spec.actives || []).slice(0, 3)) {
    const lines = wrap(a.line, Math.round(22 * s), 470);
    const ch = Math.round(70 * s) + lines.length * Math.round(28 * s);
    parts.push(`<rect x="${PAD}" y="${y}" width="490" height="${ch}" rx="8" fill="${C.card}" fill-opacity="0.85"/>`);
    parts.push(`<text x="${PAD + 18}" y="${y + Math.round(48 * s)}" font-family="${FONT}" font-size="${Math.round(44 * s)}" font-weight="300" fill="${C.ink}">${esc(a.pct || "")}</text>`);
    parts.push(`<text x="${PAD + 18 + (a.pct ? Math.round((a.pct.length * 26 + 20) * s) : 0)}" y="${y + Math.round(44 * s)}" font-family="${FONT}" font-size="${Math.round(26 * s)}" font-weight="600" fill="${C.ink}">${esc(a.name)}</text>`);
    parts.push(T(lines, PAD + 18, y + Math.round(80 * s), Math.round(22 * s), Math.round(28 * s), `fill="${C.muted}"`));
    y += ch + Math.round(14 * s);
  }
  return chromeEnd(spec, parts, y);
};

// Routine / product journey -> 2–3 steps, each a real pack shot of one of our products.
LAYOUTS.journey = (spec, s) => {
  const { w } = SIZE;
  const parts = chromeStart(spec, "full");
  let y = headlineBlock(parts, spec.headline, PAD, 130, w - 2 * PAD, s, 40) + Math.round(26 * s);
  const steps = (spec.steps || []).slice(0, 3);
  const n = Math.max(1, steps.length), gap = 28, colW = Math.floor((w - 2 * PAD - (n - 1) * gap) / n);
  let bottom = y;
  steps.forEach((st, i) => {
    const x = PAD + i * (colW + gap);
    // Labels wrap inside their column (first render: "STEP 2 · TREAT THE LOOK OF OIL" ran into step 3).
    const lab = wrap((st.label || `STEP ${i + 1}`).toUpperCase(), 18, colW, 0.66).slice(0, 2);
    parts.push(T(lab, x, y + 18, 18, 22, `font-weight="700" letter-spacing="1.2" fill="${C.muted}"`));
    const top = y + 18 + lab.length * 22;
    const imgH = Math.round(290 * s);
    parts.push(pack(spec, st.imageHref, x, top, colW, imgH));
    let ty = top + imgH + Math.round(34 * s);
    const nm = wrap(st.productName || "", Math.round(21 * s), colW, 0.56);
    parts.push(T(nm, x, ty, Math.round(21 * s), Math.round(26 * s), `font-weight="600" fill="${C.ink}"`));
    ty += nm.length * Math.round(26 * s) + Math.round(4 * s);
    const ln = wrap(st.line, Math.round(20 * s), colW);
    parts.push(T(ln, x, ty, Math.round(20 * s), Math.round(26 * s), `fill="${C.muted}"`));
    bottom = Math.max(bottom, ty + (ln.length - 1) * Math.round(26 * s));
    if (i < n - 1) parts.push(`<text x="${x + colW + gap / 2}" y="${y + 36 + imgH / 2}" text-anchor="middle" font-family="${FONT}" font-size="28" fill="${C.muted}">→</text>`);
  });
  return chromeEnd(spec, parts, bottom);
};

// Testimonial -> consumer-study stat card (a review is not a claim; a qualified study stat is).
LAYOUTS.stat = (spec, s) => {
  const parts = chromeStart(spec, "left");
  parts.push(pack(spec, spec.imageHref, 590, 110, 430, 660));
  let y = headlineBlock(parts, spec.headline, PAD, 140, 490, s, 38) + Math.round(30 * s);
  const st = spec.stat || {};
  // Eye-check fix (scale run): long values ("3.9 out of 5 stars") overflowed under the pack; shrink to fit 490px.
  const vs = Math.min(Math.round(150 * s), Math.floor(490 / Math.max(1, vlen(st.value || "") * 0.5)));
  parts.push(`<text x="${PAD - 6}" y="${y + vs}" font-family="${FONT}" font-size="${vs}" font-weight="300" letter-spacing="-4" fill="${C.ink}">${esc(st.value || "")}</text>`);
  y += vs + Math.round(16 * s);
  const ls = wrap(st.label, Math.round(28 * s), 490);
  parts.push(T(ls, PAD, y + Math.round(28 * s), Math.round(28 * s), Math.round(36 * s), `fill="${C.ink}"`));
  y += Math.round(28 * s) + (ls.length - 1) * Math.round(36 * s);
  if (spec.subhead) {
    const sub = wrap(spec.subhead, Math.round(23 * s), 490);
    parts.push(T(sub, PAD, y + Math.round(44 * s), Math.round(23 * s), Math.round(30 * s), `fill="${C.muted}"`));
    y += Math.round(44 * s) + (sub.length - 1) * Math.round(30 * s);
  }
  return chromeEnd(spec, parts, y);
};

// Problem/solution or authority -> labelled callouts pointing at the product (no skin imagery).
LAYOUTS.callouts = (spec, s) => {
  const { w } = SIZE;
  const parts = chromeStart(spec, "full");
  const y0 = headlineBlock(parts, spec.headline, PAD, 130, w - 2 * PAD, s, 40) + Math.round(30 * s);
  const px0 = 400, pw = 280, ph = Math.min(470, BAND_Y - 40 - y0);
  parts.push(pack(spec, spec.imageHref, px0, y0, pw, ph));
  const slots = [[PAD, y0 + 40, "L"], [PAD, y0 + ph * 0.55, "L"], [px0 + pw + 40, y0 + 40, "R"], [px0 + pw + 40, y0 + ph * 0.55, "R"]];
  let bottom = y0 + ph;
  (spec.callouts || []).slice(0, 4).forEach((c, i) => {
    const [x, y, side] = slots[i];
    const lines = wrap(c.text, Math.round(22 * s), 250);
    parts.push(T(lines, x, y + 22, Math.round(22 * s), Math.round(28 * s), `font-weight="500" fill="${C.ink}"`));
    const ly = y + 12;
    parts.push(side === "L"
      ? `<line x1="${x + 262}" y1="${ly}" x2="${px0 - 6}" y2="${ly + 30}" stroke="${C.ink}" stroke-width="1.5"/><circle cx="${px0 - 6}" cy="${ly + 30}" r="4" fill="${C.ink}"/>`
      : `<line x1="${x - 12}" y1="${ly}" x2="${px0 + pw + 6}" y2="${ly + 30}" stroke="${C.ink}" stroke-width="1.5"/><circle cx="${px0 + pw + 6}" cy="${ly + 30}" r="4" fill="${C.ink}"/>`);
    bottom = Math.max(bottom, y + 22 + (lines.length - 1) * 28);
  });
  return chromeEnd(spec, parts, bottom);
};

// Comparison -> spec sheet of OUR tested facts (no rival comparison without like-for-like data).
LAYOUTS.spec = (spec, s) => {
  const parts = chromeStart(spec, "left");
  parts.push(pack(spec, spec.imageHref, 590, 110, 430, 660));
  let y = headlineBlock(parts, spec.headline, PAD, 140, 490, s, 40) + Math.round(26 * s);
  for (const r of (spec.specs || []).slice(0, 5)) {
    parts.push(`<line x1="${PAD}" y1="${y}" x2="${PAD + 490}" y2="${y}" stroke="${C.rule}" stroke-width="1.5"/>`);
    parts.push(`<text x="${PAD}" y="${y + Math.round(30 * s)}" font-family="${FONT}" font-size="${Math.round(17 * s)}" font-weight="700" letter-spacing="1.2" fill="${C.muted}">${esc((r.label || "").toUpperCase())}</text>`);
    const v = wrap(r.value, Math.round(24 * s), 490);
    parts.push(T(v, PAD, y + Math.round(62 * s), Math.round(24 * s), Math.round(30 * s), `fill="${C.ink}"`));
    y += Math.round(78 * s) + (v.length - 1) * Math.round(30 * s);
  }
  return chromeEnd(spec, parts, y);
};

// Range guide -> 2–4 of our products, each labelled (skin type / use).
LAYOUTS.range = (spec, s) => {
  const { w } = SIZE;
  const parts = chromeStart(spec, "full");
  const y = headlineBlock(parts, spec.headline, PAD, 130, w - 2 * PAD, s, 40) + Math.round(30 * s);
  const items = (spec.range || []).slice(0, 4);
  const n = Math.max(1, items.length), gap = 24, colW = Math.floor((w - 2 * PAD - (n - 1) * gap) / n);
  let bottom = y;
  items.forEach((it, i) => {
    const x = PAD + i * (colW + gap), imgH = Math.round(340 * s);
    parts.push(pack(spec, it.imageHref, x, y, colW, imgH));
    const lb = wrap(it.label, Math.round(22 * s), colW, 0.56);
    parts.push(T(lb, x, y + imgH + Math.round(38 * s), Math.round(22 * s), Math.round(28 * s), `font-weight="600" fill="${C.ink}"`));
    const nm = wrap(it.productName || "", Math.round(18 * s), colW);
    const ny = y + imgH + Math.round(38 * s) + lb.length * Math.round(28 * s);
    parts.push(T(nm, x, ny, Math.round(18 * s), Math.round(23 * s), `fill="${C.muted}"`));
    bottom = Math.max(bottom, ny + (nm.length - 1) * Math.round(23 * s));
  });
  return chromeEnd(spec, parts, bottom);
};

// Offer -> offer line with its condition directly underneath, same block (CCPA 7 / ASCI 1.5(a)).
LAYOUTS.offer = (spec, s) => {
  const parts = chromeStart(spec, "left");
  parts.push(pack(spec, spec.imageHref, 590, 110, 430, 660));
  const o = spec.offer || {};
  let y = headlineBlock(parts, o.line || spec.headline, PAD, 150, 490, s, 58) + Math.round(26 * s);
  // Eye-check fix (scale run): sourcing text and URLs belong in the footnote, not the offer block.
  const cleanCond = String(o.condition || "").replace(/Source:[^;]*;?\s*/i, "").replace(/terms:\s*\S+/i, "").replace(/https?:\/\/\S+/g, "").replace(/\s{2,}/g, " ").trim();
  const cond = wrap(cleanCond, Math.round(28 * s), 490);
  parts.push(T(cond, PAD, y + Math.round(28 * s), Math.round(28 * s), Math.round(36 * s), `font-weight="500" fill="${C.ink}"`));
  y += Math.round(28 * s) + (cond.length - 1) * Math.round(36 * s);
  if (o.valid_till && !/no end date/i.test(o.valid_till)) {
    parts.push(T([`Valid till ${o.valid_till}`], PAD, y + Math.round(40 * s), Math.round(22 * s), 28, `fill="${C.muted}"`));
    y += Math.round(40 * s);
  }
  // Eye-check fix (pilot): the price (sale price + MRP, in proof_points) wasn't drawn although the footnote
  // referred to it. Price lines are shown bold, right under the offer and its condition.
  for (const pp of (spec.proofPoints || []).filter((p) => /\b(Rs\.?|₹|MRP)\s?\d/i.test(p))) {
    const pl = wrap(pp.replace(/,?\s*(beminimalist\.co|website)?,?\s*captured \d{4}-\d{2}-\d{2}/i, "").replace(/,\s*beminimalist\.co\s*$/i, "").trim(), Math.round(30 * s), 490);
    parts.push(T(pl, PAD, y + Math.round(52 * s), Math.round(30 * s), Math.round(38 * s), `font-weight="700" fill="${C.ink}"`));
    y += Math.round(52 * s) + (pl.length - 1) * Math.round(38 * s);
  }
  if (spec.subhead) {
    const sub = wrap(spec.subhead, Math.round(23 * s), 490);
    parts.push(T(sub, PAD, y + Math.round(48 * s), Math.round(23 * s), Math.round(30 * s), `fill="${C.muted}"`));
    y += Math.round(48 * s) + (sub.length - 1) * Math.round(30 * s);
  }
  return chromeEnd(spec, parts, y);
};

// Before/after -> two frames that only ever hold REAL, unretouched study photos (never generated).
LAYOUTS.before_after = (spec, s) => {
  const parts = chromeStart(spec, "left");
  parts.push(pack(spec, spec.imageHref, 640, 200, 360, 560));
  let y = headlineBlock(parts, spec.headline, PAD, 130, 500, s, 36) + Math.round(24 * s);
  const fh = Math.round(250 * s);
  ["BEFORE", "AFTER"].forEach((lab, i) => {
    const photo = (spec.photos || [])[i];
    if (photo) parts.push(`<image href="${esc(photo)}" x="${PAD}" y="${y}" width="500" height="${fh}" preserveAspectRatio="xMidYMid slice"/>`);
    else {
      parts.push(`<rect x="${PAD}" y="${y}" width="500" height="${fh}" fill="#FFFFFF" stroke="${C.muted}" stroke-dasharray="8 6"/>`);
      parts.push(`<text x="${PAD + 250}" y="${y + fh / 2 + 8}" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="700" fill="#B42318">REAL STUDY PHOTO REQUIRED</text>`);
    }
    parts.push(`<text x="${PAD + 12}" y="${y + 30}" font-family="${FONT}" font-size="18" font-weight="700" fill="${C.ink}">${lab}</text>`);
    y += fh + Math.round(16 * s);
  });
  return chromeEnd(spec, parts, y);
};

// ---------------- 9 layouts added 2026-10-03 (no new photography needed) ----------------

// Eye-check fix (2026-10-03): pills had no width cap, so long badges ran past the panel edge or over the pack.
// Now capped at maxW; long text wraps to 2 lines, then the font shrinks until it fits.
const pill = (x, y, text, s, maxW = 440) => {
  let fs_ = Math.round(22 * s), lines = [text];
  const width = (t) => Math.round(vlen(t) * fs_ * 0.56) + 44;
  if (width(text) > maxW) {
    const words = text.split(/\s+/);
    let best = null;
    for (let k = 1; k < words.length; k++) { const a = words.slice(0, k).join(" "), b = words.slice(k).join(" "); const m = Math.max(a.length, b.length); if (!best || m < best.m) best = { a, b, m }; }
    if (best) lines = [best.a, best.b];
    while (Math.max(...lines.map(width)) > maxW && fs_ > 14) fs_--;
  }
  const lh = Math.round(fs_ * 1.25), hgt = Math.round(52 * s) + (lines.length - 1) * lh, w = Math.min(maxW, Math.max(...lines.map(width)));
  return `<rect x="${x}" y="${y}" width="${w}" height="${hgt}" rx="${Math.min(Math.round(26 * s), hgt / 2)}" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.5"/>` +
    lines.map((l, i) => `<text x="${x + 22}" y="${y + Math.round(34 * s) + i * lh}" font-family="${FONT}" font-size="${fs_}" font-weight="500" fill="${C.ink}">${esc(l)}</text>`).join("");
};

// #2 Product + benefit badges: pack centred, 3–4 pills around it.
LAYOUTS.badges = (spec, s) => {
  const { w } = SIZE;
  const parts = chromeStart(spec, "full");
  const y0 = headlineBlock(parts, spec.headline, PAD, 130, w - 2 * PAD, s, 40) + Math.round(24 * s);
  parts.push(pack(spec, spec.imageHref, 360, y0, 360, BAND_Y - 40 - y0));
  const pos = [[PAD, y0 + 30], [PAD, y0 + 230], [740, y0 + 30], [740, y0 + 230]];
  // Left column ends before the pack frame (x 350); right column ends at the panel edge (x 1040).
  (spec.badges || []).slice(0, 4).forEach((b, i) => parts.push(pill(pos[i][0], pos[i][1], b.text, s, i < 2 ? 350 - 12 - PAD : 1040 - 740 - 12)));
  return chromeEnd(spec, parts, BAND_Y - 40);
};

function twoColumns(spec, s, left, right, rightHasPack) {
  const { w } = SIZE;
  const parts = chromeStart(spec, "full");
  const y0 = headlineBlock(parts, spec.headline, PAD, 130, w - 2 * PAD, s, 40) + Math.round(30 * s);
  const colW = (w - 2 * PAD - 40) / 2;
  let bottom = y0;
  [[left, PAD, false], [right, PAD + colW + 40, rightHasPack]].forEach(([col, x, hasPack]) => {
    parts.push(`<rect x="${x}" y="${y0}" width="${colW}" height="${BAND_Y - 40 - y0}" rx="10" fill="${hasPack ? "#FFFFFF" : C.bg}" stroke="${C.rule}" stroke-width="1.5"/>`);
    parts.push(`<text x="${x + 24}" y="${y0 + 44}" font-family="${FONT}" font-size="${Math.round(24 * s)}" font-weight="700" fill="${hasPack ? C.ink : C.muted}">${esc((col?.title || "").toUpperCase())}</text>`);
    let y = y0 + 70;
    for (const it of (col?.items || []).slice(0, 4)) {
      const ln = wrap(it, Math.round(22 * s), colW - 60);
      parts.push(`<text x="${x + 24}" y="${y + 22}" font-family="${FONT}" font-size="22" fill="${hasPack ? C.ink : C.muted}">${hasPack ? "✓" : "–"}</text>`);
      parts.push(T(ln, x + 52, y + 22, Math.round(22 * s), Math.round(28 * s), `fill="${hasPack ? C.ink : C.muted}"`));
      y += ln.length * Math.round(28 * s) + Math.round(14 * s);
    }
    if (hasPack) parts.push(pack(spec, spec.imageHref, x + colW / 2 - 90, Math.max(y + 10, BAND_Y - 300), 180, Math.min(250, BAND_Y - 50 - Math.max(y + 10, BAND_Y - 300))));
    bottom = Math.max(bottom, y);
  });
  return chromeEnd(spec, parts, Math.min(bottom, BAND_Y - 40));
}

// #18 Old way / new way (the old way is a routine or habit, never another brand).
LAYOUTS.oldnew = (spec, s) => twoColumns(spec, s, spec.old, spec.new, true);
// #19 This vs that (two approaches, e.g. scrub vs acid exfoliant).
LAYOUTS.thisvsthat = (spec, s) => twoColumns(spec, s, (spec.columns || [])[0], (spec.columns || [])[1], true);

// #26 Review card: one genuine review (source + date required), small pack shot.
LAYOUTS.review = (spec, s) => {
  const parts = chromeStart(spec, "left");
  parts.push(pack(spec, spec.imageHref, 640, 200, 360, 540));
  const r = spec.review || {};
  let y = headlineBlock(parts, spec.headline, PAD, 140, 500, s, 34) + Math.round(30 * s);
  parts.push(`<rect x="${PAD}" y="${y}" width="510" height="${Math.round(330 * s)}" rx="12" fill="#FFFFFF" stroke="${C.rule}"/>`);
  parts.push(`<text x="${PAD + 28}" y="${y + 52}" font-family="${FONT}" font-size="30" fill="${C.ink}">${"★".repeat(Math.max(0, Math.min(5, r.stars || 5)))}</text>`);
  const q = wrap(`“${r.quote || ""}”`, Math.round(26 * s), 450);
  parts.push(T(q.slice(0, 5), PAD + 28, y + 100, Math.round(26 * s), Math.round(34 * s), `fill="${C.ink}"`));
  parts.push(T([r.source || "[review source + date]"], PAD + 28, y + Math.round(300 * s), 18, 22, `fill="${C.muted}"`));
  return chromeEnd(spec, parts, y + Math.round(330 * s));
};

// #28 Social proof: one big sourced number.
LAYOUTS.socialproof = (spec, s) => {
  const parts = chromeStart(spec, "left");
  parts.push(productVisual(spec, 590, 110, 430, 660));
  const p = spec.proof || {};
  let y = headlineBlock(parts, spec.headline, PAD, 140, 490, s, 34) + Math.round(24 * s);
  const vs = Math.min(Math.round(130 * s), Math.floor(490 / Math.max(1, vlen(p.value || "") * 0.5)));
  parts.push(`<text x="${PAD - 4}" y="${y + vs}" font-family="${FONT}" font-size="${vs}" font-weight="300" letter-spacing="-3" fill="${C.ink}">${esc(p.value || "")}</text>`);
  y += vs + Math.round(20 * s);
  const l = wrap(p.label, Math.round(28 * s), 490);
  parts.push(T(l, PAD, y + 28, Math.round(28 * s), Math.round(36 * s), `fill="${C.ink}"`));
  y += 28 + (l.length - 1) * 36;
  parts.push(T([p.source || "[source + date]"], PAD, y + 44, 18, 22, `fill="${C.muted}"`));
  return chromeEnd(spec, parts, y + 44);
};

function qa(spec, s, q, a, bubble) {
  const parts = chromeStart(spec, "left");
  parts.push(pack(spec, spec.imageHref, 640, 200, 360, 540));
  let y = 140;
  const ql = wrap(q, Math.round(bubble ? 30 : 46 * s), bubble ? 440 : 500, 0.58);
  if (bubble) {
    const h = ql.length * 40 + 40;
    parts.push(`<rect x="${PAD}" y="${y}" width="500" height="${h}" rx="22" fill="#FFFFFF" stroke="${C.rule}"/>`);
    parts.push(T(ql, PAD + 28, y + 50, 30, 40, `font-weight="600" fill="${C.ink}"`));
    y += h + 30;
  } else {
    const hs = Math.round(46 * s);
    parts.push(T(ql, PAD, y + hs, hs, Math.round(54 * s), `font-weight="700" fill="${C.ink}"`));
    y += hs + (ql.length - 1) * Math.round(54 * s) + 40;
  }
  const al = wrap(a, Math.round(25 * s), 500);
  parts.push(T(al, PAD, y + 25, Math.round(25 * s), Math.round(33 * s), `fill="${C.ink}"`));
  return chromeEnd(spec, parts, y + al.length * Math.round(33 * s));
}
// #32 Comment / FAQ: question bubble answered from the product page's own FAQ.
LAYOUTS.faq = (spec, s) => qa(spec, s, spec.faq?.question || "", spec.faq?.answer || "", true);
// #35 Question-led: big neutral question (never "do YOU have…").
LAYOUTS.question = (spec, s) => qa(spec, s, spec.question || spec.headline || "", spec.answer || spec.subhead || "", false);

// #33 Native social: big casual headline, small pack, plain feel (still labelled as an ad by the platform).
LAYOUTS.native = (spec, s) => {
  const { w } = SIZE;
  const parts = chromeStart(spec, "full");
  const hs = Math.round(58 * s);
  const hl = wrap(spec.headline, hs, w - 2 * PAD, 0.55);
  parts.push(T(hl.slice(0, 4), PAD, 170 + hs, hs, Math.round(68 * s), `font-weight="800" fill="${C.ink}"`));
  let y = 170 + hs + (Math.min(4, hl.length) - 1) * Math.round(68 * s) + 30;
  if (spec.subhead) {
    const sl = wrap(spec.subhead, Math.round(26 * s), 560);
    parts.push(T(sl, PAD, y + 26, Math.round(26 * s), Math.round(34 * s), `fill="${C.muted}"`));
    y += sl.length * Math.round(34 * s);
  }
  // With an AI creator/UGC image the photo card takes the lower right and the pack becomes its inset.
  parts.push(spec.personHref ? productVisual(spec, 640, Math.max(y + 20, BAND_Y - 470), 368, Math.min(450, BAND_Y - 30 - Math.max(y + 20, BAND_Y - 470))) : pack(spec, spec.imageHref, 760, BAND_Y - 330, 220, 300));
  return chromeEnd(spec, parts, y);
};

// #37 Price comparison: every price with its source and date (marketer-supplied, shown as [placeholders] if absent).
LAYOUTS.pricecompare = (spec, s) => {
  const parts = chromeStart(spec, "left");
  parts.push(pack(spec, spec.imageHref, 590, 110, 430, 660));
  let y = headlineBlock(parts, spec.headline, PAD, 140, 490, s, 38) + Math.round(30 * s);
  for (const p of (spec.prices || []).slice(0, 3)) {
    parts.push(`<line x1="${PAD}" y1="${y}" x2="${PAD + 490}" y2="${y}" stroke="${C.rule}" stroke-width="1.5"/>`);
    parts.push(`<text x="${PAD}" y="${y + 40}" font-family="${FONT}" font-size="${Math.round(24 * s)}" fill="${C.ink}">${esc(p.label)}</text>`);
    parts.push(`<text x="${PAD + 490}" y="${y + 40}" text-anchor="end" font-family="${FONT}" font-size="${Math.round(30 * s)}" font-weight="700" fill="${C.ink}">${esc(p.value)}</text>`);
    parts.push(T([p.note || ""], PAD, y + 66, 17, 20, `fill="${C.muted}"`));
    y += Math.round(86 * s);
  }
  return chromeEnd(spec, parts, y);
};

// #14 Progress / timeline: 3–4 frames (real study photos, or AI-generated with the mark + Severe risk).
LAYOUTS.timeline = (spec, s) => {
  const { w } = SIZE;
  const parts = chromeStart(spec, "full");
  const y0 = headlineBlock(parts, spec.headline, PAD, 130, w - 2 * PAD, s, 38) + Math.round(26 * s);
  const frames = (spec.frames || []).slice(0, 4);
  const n = Math.max(1, frames.length), gap = 16, fw = Math.floor((w - 2 * PAD - (n - 1) * gap) / n), fh = Math.min(fw * 1.25, BAND_Y - 90 - y0);
  frames.forEach((f, i) => {
    const x = PAD + i * (fw + gap);
    if (f.imageHref) parts.push(`<image href="${esc(f.imageHref)}" x="${x}" y="${y0}" width="${fw}" height="${fh}" preserveAspectRatio="xMidYMid slice"/>`);
    else parts.push(`<rect x="${x}" y="${y0}" width="${fw}" height="${fh}" fill="#FFFFFF" stroke="${C.muted}" stroke-dasharray="8 6"/><text x="${x + fw / 2}" y="${y0 + fh / 2}" text-anchor="middle" font-family="${FONT}" font-size="16" font-weight="700" fill="#B42318">PHOTO REQUIRED</text>`);
    parts.push(`<rect x="${x}" y="${y0 + fh - 40}" width="${fw}" height="40" fill="${C.ink}" fill-opacity="0.75"/><text x="${x + fw / 2}" y="${y0 + fh - 13}" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="700" fill="#FFFFFF">${esc(f.label || "")}</text>`);
  });
  parts.push(pack(spec, spec.imageHref, w - PAD - 130, BAND_Y - 190, 120, 170));
  return chromeEnd(spec, parts, y0 + fh);
};

// #13 Split-screen: one image, divided, labelled sides (same rules as timeline).
LAYOUTS.splitscreen = (spec, s) => LAYOUTS.timeline({ ...spec, frames: (spec.frames || []).slice(0, 2) }, s);

// Overflow check used by the generator: returns problems instead of silently clipping text.
export function layoutProblems(spec) {
  const problems = [];
  const m = measure(spec);
  if (!m.fits) problems.push("Copy does not fit the 1080x1080 layout even at 70% text size — shorten it.");
  if (spec.footnote && wrap(spec.footnote, FOOT_PX, SIZE.w - 144, 0.5).length > 3) problems.push("Footnote longer than 3 lines would be cut off.");
  const lim = (label, text, max) => {
    if (text && text.length > max) problems.push(`${label} is ${text.length} chars (max ${max})`);
  };
  lim("Headline", spec.headline, 60);
  lim("Subhead", spec.subhead, 120);
  (spec.proofPoints || []).forEach((p, i) => lim(`Proof point ${i + 1}`, p, 70));
  lim("Footnote", spec.footnote, 200);
  if ((spec.proofPoints || []).length > 3) problems.push("More than 3 proof points");
  (spec.actives || []).forEach((a, i) => lim(`Active ${i + 1} line`, a.line, 90));
  (spec.steps || []).forEach((st, i) => lim(`Step ${i + 1} line`, st.line, 70));
  (spec.callouts || []).forEach((c, i) => lim(`Callout ${i + 1}`, c.text, 60));
  (spec.specs || []).forEach((r, i) => lim(`Spec ${i + 1}`, r.value, 70));
  (spec.range || []).forEach((r, i) => lim(`Range label ${i + 1}`, r.label, 40));
  if (spec.layout === "offer" && spec.offer && !String(spec.offer.condition || "").trim()) problems.push("Offer has no condition: 'free' / discount terms must sit with the offer (CCPA 7).");
  if (spec.layout === "before_after" && !(spec.photos || []).length) problems.push("Before/after has no real study photos attached — export stays blocked.");
  if (["journey", "range"].includes(spec.layout) && (spec.steps || spec.range || []).some((x) => !x.imageHref && !x.imageSrc)) problems.push("A product in the journey/range has no pack shot.");
  return problems;
}
