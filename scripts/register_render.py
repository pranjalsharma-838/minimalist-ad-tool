"""Registers a verified AI render as the product's preferred pack image (user decision 2026-10-05: ChatGPT
re-renders the real pack, Claude reads every label word and runs scripts/verify_pack.py, 3 rounds max; accepted
renders are used everywhere). Cuts it out with the same method as scripts/cutout_edges.py and adds an asset entry
marked "preferred", which pipeline/08_compose.js and the app use before any other photo.

    python scripts/register_render.py <handle> [<handle> ...]
Needs brand_packs/minimalist/assets/ai_renders/<handle>/verification.json with "accepted" and status "approved".
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cutout_edges import ASSETS, ROOT, cut  # noqa: E402

INDEX = os.path.join(ASSETS, "index.json")


def main(handles):
    index = json.load(open(INDEX, encoding="utf-8"))
    for h in handles:
        d = os.path.join(ASSETS, "ai_renders", h)
        v = json.load(open(os.path.join(d, "verification.json"), encoding="utf-8-sig"))
        if v.get("status") != "approved":
            print(f"{h}: not approved ({v.get('status')}), skipped")
            continue
        src = os.path.join(d, v["accepted"])
        shape = "tube" if "tube" in v.get("shape", "") else "other"
        out, kept, _ = cut(src, shape)
        rel_cut = f"brand_packs/minimalist/assets/cutouts/{h}_render.png"
        out.save(os.path.join(ROOT, rel_cut))
        rel_src = os.path.relpath(src, ROOT).replace("\\", "/")
        index["assets"] = [a for a in index["assets"] if a.get("file") != rel_src]
        for a in index["assets"]:
            if a.get("product_handle") == h:
                a.pop("preferred", None)
        index["assets"].append({
            "product_handle": h, "file": rel_src, "type": "pack_shot", "background": "plain_white", "people": "none",
            "source": "AI re-render of the brand's own pack photo (ChatGPT, label verified word by word + scripts/verify_pack.py)",
            "preferred": True, "cutout": rel_cut, "cutout_status": "clean (render on white)",
            "notes": f"Verified render: {v.get('visual_read', '')} Rounds: {v.get('rounds')}.",
        })
        print(f"{h}: registered, cut-out {out.size[0]}x{out.size[1]}")
    json.dump(index, open(INDEX, "w", encoding="utf-8"), indent=2)


if __name__ == "__main__":
    main(sys.argv[1:])
