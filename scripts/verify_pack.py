"""Checks an AI-rendered product image against the real pack photo (user decision 2026-10-04: ChatGPT may re-render
the product from the real photo, but only if the pack comes out unchanged; Claude reviews, re-prompts, 3 rounds max).

It finds the real pack inside the AI image (feature matching + a perspective fit), lays the real label over the
AI one, and scores how alike they are. It also writes a side-by-side sheet (real | AI, aligned | difference) for the
visual read of every word on the label, which the score alone can't do.

    python scripts/verify_pack.py <real_cutout_or_photo> <ai_image> <out_sheet.png>
Prints JSON: matches, inliers, label_similarity (0-1), scale, verdict hint.
"""
import json
import sys

import cv2
import numpy as np
from PIL import Image


def load_rgba(path):
    im = Image.open(path).convert("RGBA")
    return np.array(im)


def main(real_path, ai_path, out_path):
    real = load_rgba(real_path)
    ai = cv2.cvtColor(np.array(Image.open(ai_path).convert("RGB")), cv2.COLOR_RGB2BGR)
    real_bgr = cv2.cvtColor(real[..., :3], cv2.COLOR_RGB2BGR)
    mask = (real[..., 3] > 128).astype(np.uint8) * 255 if real[..., 3].min() < 250 else None

    sift = cv2.SIFT_create(nfeatures=6000)
    g1, g2 = cv2.cvtColor(real_bgr, cv2.COLOR_BGR2GRAY), cv2.cvtColor(ai, cv2.COLOR_BGR2GRAY)
    k1, d1 = sift.detectAndCompute(g1, mask)
    k2, d2 = sift.detectAndCompute(g2, None)
    out = {"real_keypoints": len(k1), "ai_keypoints": len(k2)}
    if d1 is None or d2 is None or len(k1) < 10 or len(k2) < 10:
        out.update(verdict_hint="FAIL: too few features to align")
        print(json.dumps(out))
        return
    pairs = cv2.BFMatcher().knnMatch(d1, d2, k=2)
    good = [m for m, n in (p for p in pairs if len(p) == 2) if m.distance < 0.75 * n.distance]
    out["matches"] = len(good)
    if len(good) < 12:
        out.update(verdict_hint="FAIL: the AI pack doesn't match the real one (too few matching details)")
        print(json.dumps(out))
        return
    src = np.float32([k1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst = np.float32([k2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    H, inl = cv2.findHomography(src, dst, cv2.RANSAC, 4.0)
    out["inliers"] = int(inl.sum()) if inl is not None else 0
    if H is None:
        out.update(verdict_hint="FAIL: could not align")
        print(json.dumps(out))
        return
    h, w = ai.shape[:2]
    warped = cv2.warpPerspective(real_bgr, H, (w, h))
    wmask = cv2.warpPerspective(mask if mask is not None else np.full(g1.shape, 255, np.uint8), H, (w, h)) > 0
    wmask = cv2.erode(wmask.astype(np.uint8), np.ones((9, 9), np.uint8)) > 0
    # Label likeness: correlation of fine detail (edges) inside the aligned pack. Lighting differences are allowed;
    # changed or garbled letters lower it.
    def detail(img):
        g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
        return cv2.Laplacian(cv2.GaussianBlur(g, (3, 3), 0), cv2.CV_32F)
    a, b = detail(warped)[wmask], detail(ai)[wmask]
    sim = float(np.corrcoef(a, b)[0, 1]) if a.size > 100 else 0.0
    out["label_similarity"] = round(sim, 3)
    out["scale"] = round(float(np.sqrt(abs(np.linalg.det(H[:2, :2])))), 3)
    out["verdict_hint"] = "PASS candidate (read every word on the sheet)" if sim >= 0.6 and out["inliers"] >= 40 else "REVIEW: label detail differs; read the sheet"

    ys, xs = np.where(wmask)
    y0, y1, x0, x1 = max(0, ys.min() - 20), min(h, ys.max() + 20), max(0, xs.min() - 20), min(w, xs.max() + 20)
    crop_ai, crop_real = ai[y0:y1, x0:x1], warped[y0:y1, x0:x1]
    diff = cv2.absdiff(cv2.cvtColor(crop_ai, cv2.COLOR_BGR2GRAY), cv2.cvtColor(crop_real, cv2.COLOR_BGR2GRAY))
    diff = cv2.applyColorMap(cv2.normalize(diff, None, 0, 255, cv2.NORM_MINMAX), cv2.COLORMAP_INFERNO)
    sheet = np.hstack([crop_real, crop_ai, diff])
    scale = 1500 / sheet.shape[1]
    sheet = cv2.resize(sheet, (1500, int(sheet.shape[0] * scale)))
    cv2.imwrite(out_path, sheet)
    out["sheet"] = out_path
    print(json.dumps(out))


if __name__ == "__main__":
    main(*sys.argv[1:4])
