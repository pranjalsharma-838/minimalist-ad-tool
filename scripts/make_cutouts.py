"""Asset library, step 3: transparent cut-out PNGs of pack shots (no AI, no retouching of the product).

Method: the website pack shots sit on a plain light studio background. Starting from the image border,
flood-fill every pixel within a colour tolerance of the sampled background, make it transparent, and
soften the edge by 1px. The product pixels are untouched. The soft cast shadow is mostly kept as a
semi-transparent shadow, so the pack still "sits" on whatever background it is placed over.

Usage: python scripts/make_cutouts.py            (uses assets/index.json pack_shot labels, else image 01 of each SKU)
Writes brand_packs/minimalist/assets/cutouts/<handle>_<nn>.png and updates assets/cutouts/manifest.json.
"""
import json
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

BASE = Path("brand_packs/minimalist/assets")
OUT = BASE / "cutouts"
OUT.mkdir(parents=True, exist_ok=True)
TOL = 7  # max per-channel distance from the background colour (was 26 in v1: ate white labels)


def border_colour(img):
    w, h = img.size
    px = img.load()
    samples = [px[x, 0] for x in range(0, w, max(1, w // 40))] + [px[x, h - 1] for x in range(0, w, max(1, w // 40))]
    samples += [px[0, y] for y in range(0, h, max(1, h // 40))] + [px[w - 1, y] for y in range(0, h, max(1, h // 40))]
    samples.sort(key=lambda c: sum(c[:3]))
    mid = samples[len(samples) // 2]
    return mid[:3]


def cutout(src: Path, dst: Path):
    img = Image.open(src).convert("RGBA")
    img.thumbnail((1400, 1400))
    w, h = img.size
    px = img.load()
    bg = border_colour(img)
    bgl = sum(bg) / 3

    # v1 used a loose tolerance (26) and erased white labels and white tubes (seen on a black contact
    # sheet). Minimalist's white packaging is BRIGHTER than the grey studio sweep, so:
    #   - background = very close to the sampled grey (<= TOL per channel)
    #   - shadow     = darker than the grey, neutral (low channel spread), and not near-black (bottles)
    #   - anything lighter than the grey + 4 stops the fill (that's the product)
    def near(c):
        lum = sum(c[:3]) / 3
        if lum > bgl + 4:
            return False
        if all(abs(c[i] - bg[i]) <= TOL for i in range(3)):
            return True
        spread = max(c[:3]) - min(c[:3])
        return 0 < bgl - lum < 70 and spread <= 14
    mask = Image.new("L", (w, h), 255)
    mp = mask.load()
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if seen[i]:
            continue
        seen[i] = 1
        c = px[x, y]
        if not near(c):
            continue
        # keep darker near-background pixels (soft shadow) as partial alpha instead of deleting them
        d = (sum(bg) - sum(c[:3])) / 3
        mp[x, y] = 0 if d < 8 else min(160, int(d * 6))
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                q.append((nx, ny))
    mask = mask.filter(ImageFilter.GaussianBlur(0.8))
    img.putalpha(mask)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.save(dst)
    kept = sum(1 for a in mask.getdata() if a > 200) / (w * h)
    return {"bg": bg, "kept_fraction": round(kept, 3), "size": img.size}


index = BASE / "index.json"
targets = []
if index.exists():
    data = json.loads(index.read_text(encoding="utf-8"))
    targets = [a for a in data["assets"] if a.get("type") == "pack_shot" and a.get("background") in ("plain_light", None)]
if not targets:
    raw = json.loads((BASE / "raw" / "manifest.json").read_text(encoding="utf-8"))
    targets = [a for a in raw if a["n"] == 1]

manifest = []
for a in targets:
    src = Path(a["file"])
    dst = OUT / f"{a['product_handle']}_{src.stem}.png"
    info = cutout(src, dst)
    flag = "CHECK" if not (0.08 <= info["kept_fraction"] <= 0.75) else "ok"
    manifest.append({"product_handle": a["product_handle"], "source_file": str(src).replace("\\", "/"), "cutout": str(dst).replace("\\", "/"), **info, "auto_check": flag})
    print(f"{flag:5} {dst.name}  product kept {info['kept_fraction']:.0%}  bg {info['bg']}")
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=1), encoding="utf-8")
print(f"{len(manifest)} cut-outs")
