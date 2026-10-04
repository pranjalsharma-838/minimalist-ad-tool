"""Clean cut-outs for white packs on the brand's light-grey studio backdrop.

User, 2026-10-04: "White tubes have no clean cut-out". The first cut-out pass removed every pixel close to the
backdrop's grey, so it also removed the shaded side of white tubes and bottles (manifest: "shaded side eaten").
This pass removes only backdrop that is CONNECTED to the photo's border, and treats the product's outline (edges
found in the photo) as a wall, so grey shading inside the product is never reachable. The soft floor shadow has
no hard edges, so it goes with the backdrop. The product's own pixels are never changed: only the alpha channel
is written.

    python scripts/cutout_edges.py <handle> [<handle> ...]     # writes cutouts/<handle>_01.png + a check sheet
    python scripts/cutout_edges.py --all-unusable              # every manifest entry marked unusable

Needs: Python 3, Pillow, numpy, opencv-python (already used by scripts/studio_bg.py's environment).
"""
import json
import os
import re
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "brand_packs", "minimalist", "assets")
MANIFEST = os.path.join(ASSETS, "cutouts", "manifest.json")


def cut(src_path, shape="other"):
    bgr = cv2.imread(src_path, cv2.IMREAD_COLOR)
    h, w = bgr.shape[:2]
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    # Backdrop colour: median of the top and side borders (the bottom can hold the floor shadow).
    band = max(4, min(h, w) // 100)
    border = np.concatenate([lab[:band].reshape(-1, 3), lab[:, :band].reshape(-1, 3), lab[:, -band:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    de = np.sqrt(((lab - bg) ** 2).sum(axis=2)) * (100.0 / 255.0)  # roughly CIE ΔE

    # Walls: the product outline. Low thresholds catch a white tube's faint edge against light grey; the soft
    # floor shadow has no step, so it stays open.
    gray = cv2.GaussianBlur(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY), (3, 3), 0)
    edges = cv2.Canny(gray, 8, 24, L2gradient=True)
    walls = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    # A white tube can be the backdrop's exact grey (the SPF 50 photo: ΔE ≈ 0 inside the body), so its outline is the
    # only thing between them and a gap in it lets the backdrop flood in. Tube and bottle sides run close to vertical:
    # a tall, thin closing bridges breaks along them without joining unrelated edges sideways.
    walls = cv2.morphologyEx(walls, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(15, h // 40))))
    walls = cv2.dilate(walls, np.ones((3, 3), np.uint8)) > 0

    # Open ground: not a wall, and backdrop-coloured or a floor shadow (neutral and darker than the backdrop, but
    # nowhere near a black cap's darkness).
    a, b = lab[..., 1] - 128, lab[..., 2] - 128
    chroma = np.sqrt(a * a + b * b)
    lightness = lab[..., 0] * (100.0 / 255.0)
    bg_l = bg[0] * (100.0 / 255.0)
    shadow_like = (chroma < 8) & (lightness < bg_l + 1.5) & (lightness > 35)
    open_ground = (~walls) & (shadow_like | (de < 6))
    # Backdrop = open ground connected to the border.
    n, labels = cv2.connectedComponents(open_ground.astype(np.uint8), connectivity=4)
    edge_ids = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    backdrop = np.isin(labels, edge_ids[edge_ids != 0])
    # Wall pixels sitting in the backdrop (the outline itself is 2–3 px thick after dilation) are split back by
    # colour: a wall pixel that looks like backdrop and touches backdrop joins it.
    near_bg = cv2.dilate(backdrop.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    backdrop |= walls & near_bg & (de < 5)

    fg = ~backdrop
    # The shadow's sharp upper edge survives as a thin streak off the base: keep only what lies within a few pixels of
    # the solid body (a 15 px opening finds the body; the crimp, cap and edges within 5 px of it come back).
    core = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    fg = fg & (cv2.dilate(core, np.ones((5, 5), np.uint8)) > 0)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(fg.astype(np.uint8), connectivity=8)
    if n <= 1:
        raise RuntimeError("nothing found")
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    if os.environ.get("CUT_DEBUG"):
        Image.fromarray((fg * 255).astype(np.uint8)).save(os.path.join(os.environ["CUT_DEBUG"], os.path.basename(os.path.dirname(src_path)) + "_fg.png"))
    if shape == "tube":
        # A squeeze tube runs straight from its crimped top to its cap, so its silhouette is the convex outline of its
        # solid parts. This rebuilds a body that is the backdrop's own grey (the parts kept: crimp, cap, print).
        bx, by, bw, bh = stats[big, :4]

        def shadow_piece(i):
            # A leftover piece of floor shadow is neutral grey and clearly darker than the backdrop; a pack part is
            # white, black or coloured. One stray piece would drag the outline out into a wedge (eye-check 2026-10-04).
            sel = labels == i
            return float(np.median(chroma[sel])) < 8 and 35 < float(np.median(lightness[sel])) < bg_l - 6

        keep = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= fg.size * 0.0005 and bx - bw * 0.3 <= stats[i, 0] + stats[i, 2] / 2 <= bx + bw * 1.3 and (i == big or not shadow_piece(i))]
        parts = np.isin(labels, keep)

        def outline(mask):
            pts = np.column_stack(np.where(mask))[:, ::-1].astype(np.int32)
            out = np.zeros(fg.shape, np.uint8)
            cv2.fillConvexPoly(out, cv2.convexHull(pts), 1)
            return out > 0

        hull = outline(parts)
        # A thin, hard floor shadow fused to the base (Light Fluid, eye cream) pulls the outline out into a wedge that
        # runs from the top corner to the shadow's far end. The tube's sides are straight: fit each side on the middle
        # of the tube (no shadow reaches there), drop the parts outside the two lines in the bottom fifth (where a
        # floor shadow lies), then draw the outline again. Where the body is solid the fit uses the body's own edge;
        # where the body was the backdrop's grey (SPF 50) it uses the outline rebuilt from the crimp and cap.
        rows = np.where(parts.any(axis=1))[0]
        top, bot = int(rows.min()), int(rows.max())
        mids = range(top + int(0.15 * (bot - top)), top + int(0.70 * (bot - top)))
        spans = []
        for y in mids:
            xs = np.where(parts[y])[0]
            filled = xs.size and xs.size >= 0.9 * (xs.max() - xs.min() + 1)
            spans.append((y, xs.min(), xs.max()) if filled else None)
        widest = max([s[2] - s[1] for s in spans if s] or [0])
        body = [s for s in spans if s and s[2] - s[1] >= 0.6 * widest]
        solid_body = bool(widest) and len(body) >= 0.6 * len(spans)
        if solid_body:
            # The body came through solid: fit its own sides (a lone line of print is filled but narrow, so it never
            # counts).
            ys = [s[0] for s in body]
            fl, fr = np.polyfit(ys, [s[1] for s in body], 1), np.polyfit(ys, [s[2] for s in body], 1)
        else:
            # The body was the backdrop's grey (SPF 50): the outline from crimp, print and cap gives the sides.
            ys = list(mids)
            fl = np.polyfit(ys, [np.where(hull[y])[0].min() for y in ys], 1)
            fr = np.polyfit(ys, [np.where(hull[y])[0].max() for y in ys], 1)
        # Drop parts outside the sides in the bottom fifth, where a floor shadow lies.
        yy = np.arange(fg.shape[0])[:, None]
        xx = np.arange(fg.shape[1])[None, :]
        inside = (xx >= np.polyval(fl, yy) - 4) & (xx <= np.polyval(fr, yy) + 4)
        shadow_zone = yy >= bot - int(0.2 * (bot - top))
        trimmed = parts & (inside | ~shadow_zone)
        # A solid body keeps its own exact edge (the convex outline would fill the small step where body meets cap
        # with backdrop); only a body that was the backdrop's grey is rebuilt from the outline.
        fg = trimmed if solid_body else outline(trimmed)
    else:
        # Keep the product: the largest component (a cap with a seam is joined by the walls). Then drop shadow-grey
        # pixels in the bottom 8% (the thin contact shadow under a bottle's base) and keep the main piece again.
        fg = labels == big
        rows = np.where(fg.any(axis=1))[0]
        top, bot = int(rows.min()), int(rows.max())
        base = np.zeros_like(fg)
        base[bot - int(0.08 * (bot - top)):] = True
        fg = fg & ~(base & (chroma < 8) & (lightness > 35) & (lightness < bg_l - 4))
        n, labels, stats, _ = cv2.connectedComponentsWithStats(fg.astype(np.uint8), connectivity=8)
        fg = labels == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    # Fill holes (labels and highlights that look like backdrop but are enclosed by the pack).
    inv = (~fg).astype(np.uint8)
    n, labels = cv2.connectedComponents(inv, connectivity=4)
    outside = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    fg = ~np.isin(labels, outside[outside != 0])  # label 0 is the pack itself, which may touch the frame edge
    # The outline sits on the edge line, which was thickened to make it a wall, so it lies ~2 px outside the pack and
    # left a light halo (eye-check 2026-10-04): pull it in 2 px. Then smooth a touch and anti-alias (alpha only).
    fg = cv2.erode(fg.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=2)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    alpha = cv2.GaussianBlur((fg * 255).astype(np.uint8), (3, 3), 0)
    rgba = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGBA)
    rgba[..., 3] = alpha
    ys, xs = np.where(alpha > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    return Image.fromarray(rgba[y0:y1, x0:x1]), float(fg.mean()), [int(v) for v in bg]


def check_sheet(items, path):
    """Each cut-out on black, on the brand grey and on white, beside its source: the eye-check."""
    cells = []
    for src, out in items:
        s = Image.open(src).convert("RGB")
        s.thumbnail((260, 340))
        row = [s]
        for col in [(20, 20, 20), (229, 233, 234), (255, 255, 255)]:
            c = Image.new("RGBA", out.size, col + (255,))
            c.alpha_composite(out)
            c = c.convert("RGB")
            c.thumbnail((260, 340))
            row.append(c)
        cells.append(row)
    sheet = Image.new("RGB", (4 * 270, len(cells) * 350), (255, 255, 255))
    for r, row in enumerate(cells):
        for k, im in enumerate(row):
            sheet.paste(im, (k * 270, r * 350))
    sheet.save(path)


def main(args):
    manifest = json.load(open(MANIFEST, encoding="utf-8"))
    if args == ["--all-unusable"]:
        args = [m["product_handle"] for m in manifest if m.get("visual_check") == "unusable"]
    # Pack shape from the asset library's own description of the photo ("50g tube standing on light grey seamless").
    index = json.load(open(os.path.join(ASSETS, "index.json"), encoding="utf-8"))["assets"]
    done = []
    for handle in args:
        m = next(x for x in manifest if x["product_handle"] == handle)
        src = os.path.join(ROOT, m["source_file"])
        rel = m["source_file"].replace("\\", "/")
        note = next((a.get("notes", "") for a in index if a.get("file", "").replace("\\", "/").endswith(rel.split("assets/")[-1])), "")
        shape = "tube" if re.search(r"\btube\b", note, re.I) else "other"
        out, kept, bg = cut(src, shape)
        dest = os.path.join(ROOT, m["cutout"])
        out.save(dest)
        m.update({"method": f"edge-walled backdrop removal, shape {shape} (scripts/cutout_edges.py)", "kept_fraction": round(kept, 3), "bg": bg, "size": list(out.size), "visual_check": "pending", "visual_note": "re-cut 2026-10-04; check the sheet before use"})
        done.append((src, out))
        print(f"{handle} ({shape}): kept {kept:.3f} of the photo, {out.size[0]}x{out.size[1]}")
    json.dump(manifest, open(MANIFEST, "w", encoding="utf-8"), indent=1)
    sheet = os.path.join(ASSETS, "cutouts", "check_white_packs.png")
    check_sheet(done, sheet)
    print("check sheet:", os.path.relpath(sheet, ROOT))


if __name__ == "__main__":
    main(sys.argv[1:])
