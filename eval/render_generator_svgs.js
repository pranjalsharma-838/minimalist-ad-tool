// Renders the stand-in generator copy to SVG files with the real pack shot inlined, for visual review.
// Output: eval/gen/<handle>.svg
import fs from "node:fs";
import { specFromCopy } from "../lib/generate.js";
import { renderAdSvg } from "../public/render.js";

for (const f of fs.readdirSync("eval/gen").filter((f) => f.endsWith(".copy.json"))) {
  const handle = f.replace(".copy.json", "");
  const sheet = JSON.parse(fs.readFileSync(`eval/gen/${handle}.sheet.json`, "utf8"));
  const copy = JSON.parse(fs.readFileSync(`eval/gen/${f}`, "utf8"));
  const spec = specFromCopy(copy, sheet);
  let imageHref = "";
  if (spec.imageSrc) {
    const r = await fetch(spec.imageSrc, { headers: { "user-agent": "Mozilla/5.0" } });
    if (r.ok) imageHref = `data:${r.headers.get("content-type") || "image/png"};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
  }
  fs.writeFileSync(`eval/gen/${handle}.svg`, renderAdSvg({ ...spec, imageHref }));
  console.log(handle, imageHref ? "with photo" : "NO PHOTO");
}
