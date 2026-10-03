"""Split multi-panel AI images into frames for the frame layouts.

One generation produces all panels side by side, so the same person, framing and light carry across frames.
backgrounds/<id>.frames.png  ->  backgrounds/<id>.frame1.png ... frameN.png
N comes from the ad's layout: timeline = 3 panels, splitscreen / before_after = 2.

Usage: python scripts/split_frames.py <run>
"""
import json
import sys
from pathlib import Path

from PIL import Image

run = Path("pipeline/runs") / sys.argv[1]
briefs = {b["source_ad_id"]: b for b in json.loads((run / "briefs_final.json").read_text(encoding="utf-8"))}
PANELS = {"timeline": 3, "splitscreen": 2, "before_after": 2}

for src in sorted((run / "backgrounds").glob("*.frames.png")):
    ad_id = src.name[: -len(".frames.png")]
    layout = briefs.get(ad_id, {}).get("layout", "timeline")
    n = PANELS.get(layout, 3)
    im = Image.open(src).convert("RGB")
    w, h = im.size
    inset = max(4, w // 200)  # trim the thin white gutters between panels
    for i in range(n):
        x0, x1 = round(i * w / n), round((i + 1) * w / n)
        im.crop((x0 + inset, 0, x1 - inset, h)).save(run / "backgrounds" / f"{ad_id}.frame{i + 1}.png")
    print(f"{ad_id}: {n} frames from {w}x{h} ({layout})")
