// Asset library, step 1: download every website gallery image for the top-20 sellers.
// Source: the store's own product data (/products/<handle>.js lists the full gallery).
// Writes brand_packs/minimalist/assets/raw/<handle>/<nn>.<ext> and assets/raw/manifest.json.
// Step 2 (labelling each image) is done by the asset-library agent; step 3 (cut-outs) by scripts/make_cutouts.py.
import fs from "node:fs";
import path from "node:path";

const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130" };
const base = "brand_packs/minimalist/assets/raw";
const top = JSON.parse(fs.readFileSync("brand_packs/minimalist/raw/top20.json", "utf8"));
const manifest = [];
for (const p of top) {
  const r = await fetch(`https://beminimalist.co/products/${p.handle}.js`, { headers: UA });
  if (!r.ok) { console.log("skip", p.handle, r.status); continue; }
  const prod = await r.json();
  fs.mkdirSync(path.join(base, p.handle), { recursive: true });
  let i = 0;
  for (const src0 of prod.images || []) {
    i++;
    const src = (src0.startsWith("//") ? "https:" + src0 : src0).replace(/(\?|$)/, (m) => m);
    const ext = (src.split("?")[0].match(/\.(png|jpe?g|webp)$/i) || [, "jpg"])[1].toLowerCase().replace("jpeg", "jpg");
    const file = path.join(base, p.handle, `${String(i).padStart(2, "0")}.${ext}`);
    if (!fs.existsSync(file)) {
      const ir = await fetch(src, { headers: UA });
      if (!ir.ok) { console.log("  img fail", src, ir.status); continue; }
      fs.writeFileSync(file, Buffer.from(await ir.arrayBuffer()));
      await new Promise((r) => setTimeout(r, 300));
    }
    manifest.push({ product_handle: p.handle, product_title: p.title, rank: p.rank, n: i, file: file.replace(/\\/g, "/"), source_url: src, source: "beminimalist.co gallery" });
  }
  console.log(p.rank, p.handle, i, "images");
  await new Promise((r) => setTimeout(r, 800));
}
fs.writeFileSync(path.join(base, "manifest.json"), JSON.stringify(manifest, null, 1));
console.log(`total ${manifest.length} images`);
