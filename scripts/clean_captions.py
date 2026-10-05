# Removes internal source-capture notes that leaked into ad captions (primary text), across every run's briefs_final.json.
# The source stays recorded in the brief's citations; the shopper only sees plain wording. (Stand-in judge, 2026-10-05:
# "internal capture text sitting in the live primary text".) Usage: python scripts/clean_captions.py [--dry]
import json, glob, re, sys
DATE = r"(?:\d{4}-\d{2}-\d{2}|\d{1,2} \w{3,9} \d{4})"
SUBS = [
    (r"rating and review are from beminimalist\.co, captured " + DATE + r"; the review is quoted verbatim(?: \(trimmed with an ellipsis\))? with the buyer's name and date\.", "Rating and review from beminimalist.co. One customer's experience; results vary."),
    (r"\s*\(offer as captured on " + DATE + r"; (T&C apply)\)", r" (\1)"),
    (r",? ?beminimalist\.co homepage, captured " + DATE + r";?", ","),
    (r"\s*As on beminimalist\.co,? " + DATE + r"\.", ""),
    (r",? captured (?:on )?" + DATE, ""),
    (r":? ?strength and details as stated on the product page\.", "."),
    (r"(\d+(?:\.\d+)?%) is the ([\w +()-]+?) strength stated on the page", r"\2 \1"),
    (r"[\w +()%.-]+? strength as stated on the page;\s*(?:use\s+)?", "use "),
    (r" strength as stated on the page", ""),
    (r"^…[^.]*\.\s*", ""),
    (r",? as stated on the (?:product )?page", ""),
    (r"(T&C apply\.)(.*?)\s*T&C apply\.", r"\1\2"),
    (r",\s*;", ";"), (r",\s*\.", "."), (r"\s{2,}", " "), (r":\s*\.", "."),
]
dry = "--dry" in sys.argv; n = 0
for f in glob.glob("pipeline/runs/*/briefs_final.json"):
    briefs = json.load(open(f, encoding="utf-8-sig")); changed = False
    for b in briefs:
        c = b.get("caption") or ""; new = c
        for rx, rep in SUBS: new = re.sub(rx, rep, new, flags=re.I)
        new = new.strip()
        if new != c:
            n += 1; changed = True; b["caption"] = new
            if dry or n <= 12: print(b["source_ad_id"], "|", new[:200])
    if changed and not dry: json.dump(briefs, open(f, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(n, "captions cleaned", "(dry run)" if dry else "")
