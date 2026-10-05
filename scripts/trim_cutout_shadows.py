# Trims the hard cast shadow that the original product photo left in each cut-out (it shows as a grey "shelf" beside
# the pack when the cut-out stands in front of a lifestyle photo). The pack's own left/right edges are measured on the
# body (median over rows 40-65%, above the cast shadow); anything opaque outside that span in the bottom 30% is made transparent.
# Originals are kept as <name>_orig.png. Usage: python scripts/trim_cutout_shadows.py
import glob, os, numpy as np
from PIL import Image
for f in sorted(glob.glob("brand_packs/minimalist/assets/cutouts/*_01.png")):
    orig = f.replace(".png", "_orig.png")
    src = orig if os.path.exists(orig) else f
    im = np.array(Image.open(src).convert("RGBA")); h, w = im.shape[:2]; a = im[..., 3]
    cols = [np.where(a[y] > 128)[0] for y in range(int(h * .40), int(h * .65))]
    cols = [c for c in cols if len(c)]
    if not cols: continue
    L = int(np.median([c[0] for c in cols])) - 4; R = int(np.median([c[-1] for c in cols])) + 4
    y0 = int(h * .70); before = int((a[y0:, :max(L,0)] > 0).sum() + (a[y0:, R+1:] > 0).sum())
    if before == 0: continue
    if not os.path.exists(orig): Image.fromarray(im).save(orig)
    a[y0:, :max(L, 0)] = 0; a[y0:, R+1:] = 0; im[..., 3] = a
    Image.fromarray(im).save(f)
    print(os.path.basename(f), f"body x {L}-{R} of {w}, {before} shadow px removed")
