"""Side-by-side style check: Minimalist's own top-running statics (top) vs a sample of our ads (below).
User request 2026-10-03/04: make sure the brand's tone and style are followed; "the design should be minimalistic".
Usage: python scripts/style_compare_sheet.py [out.png]  -> research/style_compare.png (default)
Sample: one ad per layout across the library runs, people formats included, so every format is compared."""
import glob, json, os, sys
from PIL import Image, ImageDraw

OUT = sys.argv[1] if len(sys.argv) > 1 else "research/style_compare.png"
TOP = "research/minimalist_top_ads/"
RUNS = ["2026-10-03-pilot", "2026-10-03-scale", "2026-10-03-transformation", "2026-10-03-angles", "2026-10-03-people", "2026-10-04-usvsthem"]
W, COLS, LABEL = 270, 6, 22

statics = [(f"{a['days_running']}d · Minimalist", TOP + f) for a in json.load(open(TOP + "index.json")) if a.get("format") != "video" for f in a.get("files", [a.get("file")])[:1] if f]
ours, seen = [], set()
for run in RUNS:
    briefs = json.load(open(f"pipeline/runs/{run}/briefs_final.json", encoding="utf-8"))
    for b in briefs:
        key = (b.get("layout"), bool(b.get("person_prompt") or b.get("frames_prompt")))
        png = f"pipeline/runs/{run}/finals/{b['source_ad_id']}.png"
        if key in seen or not os.path.exists(png):
            continue
        seen.add(key)
        ours.append((f"ours · {b.get('layout')}{' · model (Severe)' if key[1] else ''}", png))

def grid(items, title):
    rows = (len(items) + COLS - 1) // COLS
    img = Image.new("RGB", (COLS * W, 40 + rows * (W + LABEL)), "white")
    d = ImageDraw.Draw(img)
    d.text((10, 12), title, fill="black")
    for i, (label, f) in enumerate(items):
        im = Image.open(f).convert("RGB"); im.thumbnail((W - 8, W - 8))
        x, y = (i % COLS) * W, 40 + (i // COLS) * (W + LABEL)
        img.paste(im, (x + 4 + (W - 8 - im.width) // 2, y + 4 + (W - 8 - im.height) // 2))
        d.text((x + 6, y + W + 4), label[:44], fill=(60, 60, 60))
    return img

a = grid(statics, f"MINIMALIST'S TOP-RUNNING STATIC ADS ({len(statics)}, 52-98 days running; videos excluded)")
b = grid(ours, f"OUR ADS, one per layout ({len(ours)}), minimal house look")
sheet = Image.new("RGB", (COLS * W, a.height + b.height + 20), (225, 225, 225))
sheet.paste(a, (0, 0)); sheet.paste(b, (0, a.height + 20))
sheet.save(OUT)
print(OUT, len(statics), "statics +", len(ours), "of ours")
