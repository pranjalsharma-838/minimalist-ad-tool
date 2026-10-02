"""Records the visual check of the cut-outs (contact sheet on black, 2026-10-03) in the cut-out manifest.
White packaging on the light-grey studio sweep cannot be separated by colour: those SKUs are marked
unusable, and compositing falls back to the framed pack shot (or a gallery image on a contrasting background).
"""
import json
from pathlib import Path

UNUSABLE = {
    "light-fluid-spf-50-sunscreen": "white tube: shaded side matches the background grey, edge eaten",
    "marula-05-moisturizer": "white tube: shaded side eaten",
    "multi-vitamin-spf-50": "white tube: shaded side and label eaten",
    "salicylic-lha-2-cleanser": "white bottle: body and label eaten",
    "spf-60-silymarin": "white tube: shaded side eaten",
    "vitamin-b5-10-moisturizer": "white tube: shaded side eaten",
    "vitamin-k-retinal-01-eye-cream": "pale tube: label partly eaten",
}
p = Path("brand_packs/minimalist/assets/cutouts/manifest.json")
m = json.loads(p.read_text(encoding="utf-8"))
for c in m:
    bad = UNUSABLE.get(c["product_handle"])
    c["visual_check"] = "unusable" if bad else "clean"
    c["visual_note"] = bad or "checked on black: edges and labels intact"
p.write_text(json.dumps(m, indent=1), encoding="utf-8")
print(sum(c["visual_check"] == "clean" for c in m), "clean,", sum(c["visual_check"] == "unusable" for c in m), "unusable")
