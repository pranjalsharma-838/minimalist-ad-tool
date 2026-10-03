"""Studio background colour of each SKU's main pack shot (border median of the asset library's pack_shot image).
Used when a pack has no clean cut-out (white packs on the grey sweep, see scripts/mark_cutouts.py): the ad's canvas
takes the photo's own studio grey, so the pack shot blends in instead of showing as a grey box on white.
Usage: python scripts/studio_bg.py  -> brand_packs/minimalist/assets/studio_bg.json"""
import json, statistics as st
from PIL import Image
assets = json.load(open("brand_packs/minimalist/assets/index.json", encoding="utf-8"))["assets"]
out = {}
for a in assets:
    if a.get("type") != "pack_shot" or a["product_handle"] in out:
        continue
    im = Image.open(a["file"]).convert("RGB"); w, h = im.size; px = im.load()
    border = [px[x, 0] for x in range(0, w, 8)] + [px[0, y] for y in range(0, h, 8)] + [px[w - 1, y] for y in range(0, h, 8)]
    out[a["product_handle"]] = "#%02X%02X%02X" % tuple(int(st.median([c[i] for c in border])) for i in range(3))
json.dump(out, open("brand_packs/minimalist/assets/studio_bg.json", "w"), indent=1)
print(len(out), "SKUs;", {k: v for k, v in out.items() if k in ("multi-vitamin-spf-50", "salicylic-lha-2-cleanser", "vitamin-b5-10-moisturizer")})