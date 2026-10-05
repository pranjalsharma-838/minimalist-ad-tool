# Writes <render>_white.png next to each preferred (label-verified) pack render: a levels curve lifts the 240-254
# studio backdrop to pure white so the render sits on the ad's white canvas with no faint box. Pack colours below 240
# are unchanged. Run after scripts/register_render.py. Usage: python scripts/whiten_renders.py
import json, numpy as np
from PIL import Image
idx = json.load(open("brand_packs/minimalist/assets/index.json", encoding="utf-8-sig"))
items = idx if isinstance(idx, list) else idx.get("assets", [])
# Levels curve: unchanged up to 240, then 240..252 ramps to 240..255, and 252+ is pure white.
lut = np.arange(256, dtype=np.float32)
r = (lut > 240); lut[r] = 240 + (lut[r] - 240) * (15 / 12.0)
lut = np.clip(lut, 0, 255).astype(np.uint8)
for a in items:
    if not a.get("preferred"): continue
    im = np.array(Image.open(a["file"]).convert("RGB"))
    Image.fromarray(lut[im]).save(a["file"].replace(".png", "_white.png"))
    print(a["product_handle"])

