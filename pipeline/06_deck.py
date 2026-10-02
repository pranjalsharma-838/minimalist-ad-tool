"""Stage 6 - Assemble: one PPTX deck for the run + a paste-ready prompt file for the image step.

Usage: python pipeline/06_deck.py <YYYY-MM-DD>
Reads pipeline/runs/<date>/briefs_final.json (+ pool.json for source images).
Writes  pipeline/runs/<date>/Ad_Briefs_<date>.pptx  and  chatgpt_prompts.md (approved briefs only).
Layout follows the existing brief-deck format: 13.33x7.5in, Blank layout, 24pt bold title, 15pt body,
12pt grey notes. Uses python-pptx, already installed on the build laptop (nothing new installed).
"""
import json
import sys
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.util import Inches, Pt

date = sys.argv[1]
run = Path("pipeline/runs") / date
briefs = json.loads((run / "briefs_final.json").read_text(encoding="utf-8"))
pool = {a["id"]: a for a in json.loads((run / "pool.json").read_text(encoding="utf-8"))}

STATUS = {
    "approved_for_image_step": ("READY FOR IMAGE STEP", RGBColor(0x1E, 0x6B, 0x3A)),
    "flagged": ("FIX BEFORE IMAGE STEP", RGBColor(0x9A, 0x5B, 0x00)),
    "blocked": ("BLOCKED", RGBColor(0xB4, 0x23, 0x18)),
}

prs = Presentation()
prs.slide_width, prs.slide_height = Inches(13.33), Inches(7.5)
blank = prs.slide_layouts[6]


def box(slide, x, y, w, h, lines, size=15, bold_first=False, color=None):
    tf = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h)).text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line
        p.font.size = Pt(size)
        p.font.bold = bold_first and i == 0
        if color is not None:
            p.font.color.rgb = color
    return tf


s = prs.slides.add_slide(blank)
box(s, 0.6, 2.4, 12, 1, [f"Static ad briefs - {date}"], size=32, bold_first=True)
box(s, 0.6, 3.4, 12, 2, [
    "Test brand: Minimalist (the test brand for this pipeline). INTERNAL TEST - not for publication.",
    f"{len(briefs)} briefs from competitor Meta ads running 14+ days. Each keeps the source's structure, "
    "uses only the product page's own facts, and passed a compliance gate before the image step.",
    "The image model makes the BACKGROUND only. The real pack shot and the checked copy are placed by the tool.",
], size=15, color=RGBColor(0x55, 0x55, 0x55))

order = {"approved_for_image_step": 0, "flagged": 1, "blocked": 2}
for b in sorted(briefs, key=lambda b: order[b["status"]]):
    s = prs.slides.add_slide(blank)
    label, col = STATUS[b["status"]]
    box(s, 0.5, 0.3, 9.5, 0.6, [f"{(b.get('layout') or 'hero').replace('_', ' ').title()} ({b['ad_type'].replace('_', ' ')}) - {b['product_title']}"], size=22, bold_first=True)
    box(s, 10.0, 0.35, 3.0, 0.5, [label], size=14, bold_first=True, color=col)

    src = pool.get(b["source_ad_id"], {})
    img = src.get("image_file") or ""
    if img and Path(img).exists():
        s.shapes.add_picture(img, Inches(0.5), Inches(1.1), height=Inches(3.6))
    box(s, 0.5, 4.8, 3.8, 2.4, [
        f"Source: {b.get('source_brand', '')} ({src.get('days_running', '?')} days running)",
        src.get("ad_library_url", ""),
        f"Kept/dropped: {b.get('adaptation_notes', '')}",
    ], size=11, color=RGBColor(0x66, 0x66, 0x66))

    fmt = b.get("layout") or "hero"
    body = [f"- {p}" for p in b.get("proof_points") or []]
    body += [f"- {a.get('pct', '')} {a.get('name', '')}: {a.get('line', '')}".replace("-  ", "- ") for a in b.get("actives") or []]
    body += [f"- {s.get('label', '')}: {s.get('line', '')} [{s.get('product_handle', '')}]" for s in b.get("steps") or []]
    if b.get("stat"):
        body.append(f"- STAT {b['stat'].get('value', '')} {b['stat'].get('label', '')}")
    body += [f"- {c.get('text', '')}" for c in b.get("callouts") or []]
    body += [f"- {r.get('label', '')}: {r.get('value', '')}" for r in b.get("specs") or []]
    body += [f"- {r.get('label', '')} [{r.get('product_handle', '')}]" for r in b.get("range") or []]
    if b.get("offer"):
        o = b["offer"]
        body.append(f"- OFFER {o.get('line', '')} | {o.get('condition', '')} | till {o.get('valid_till', '')} (marketer to confirm)")
    lines = [
        f"Format: {fmt}",
        f"Headline: {b.get('headline', '')}",
        *([f"Subhead: {b['subhead']}"] if b.get("subhead") else []),
        *body,
        f"Footnote: {b.get('footnote', '')}",
        f"CTA: {b.get('cta', '')}",
        "",
        f"Layout: {b.get('layout_description', '')}",
    ]
    if b.get("needs_real_photography"):
        lines += ["", f"REAL PHOTOGRAPHY REQUIRED: {b.get('photography_needed', '')}"]
    box(s, 4.6, 1.1, 8.3, 3.6, lines, size=15)

    issues = b.get("hard_failures", []) + [f"[{f['severity']}] {f['rule_id']} \"{f['span']}\": {f['fix']}" for f in b.get("findings", []) if f["severity"] != "advisory"]
    box(s, 4.6, 4.8, 8.3, 1.3, ["Compliance: " + (b["verdict"]["label"] if not b.get("hard_failures") else "blocked by code checks")] + issues[:4], size=12, color=col)
    box(s, 4.6, 6.1, 8.3, 1.2, [f"Image prompt (background only): {b.get('image_prompt', '')}"], size=11, color=RGBColor(0x66, 0x66, 0x66))

out = run / f"Ad_Briefs_{date}.pptx"
prs.save(out)

ready = [b for b in briefs if b["status"] == "approved_for_image_step"]
md = [f"# Image prompts - {date}", "", "Background only. Paste one prompt per new chat. Do not add product, text or people.", ""]
for b in ready:
    md += [f"## {b['source_ad_id']} - {b['ad_type']} - {b['product_title']}", "", b["image_prompt"], ""]
(run / "chatgpt_prompts.md").write_text("\n".join(md), encoding="utf-8")
print(f"deck: {out} ({len(briefs) + 1} slides) | prompts ready for image step: {len(ready)}")
