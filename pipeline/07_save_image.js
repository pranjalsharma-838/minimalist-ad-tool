// Stage 7 helper: turn image data URL(s) captured from the browser (backgrounds/<id>.dataurl.txt; several
// joined by "\n|||\n" are allowed) into backgrounds/<id>.png|jpg|webp, then delete the text dump.
// When several images are captured, the one whose bytes match NO already-saved background is kept: the
// ChatGPT page can keep a previous chat's image in the DOM (prompt 4 capture held background 3's exact
// bytes), so "take the last image" is not safe.
// Usage: node pipeline/07_save_image.js <YYYY-MM-DD> <id>
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const [date, id] = process.argv.slice(2);
const dir = path.join("pipeline", "runs", date, "backgrounds");
const txt = path.join(dir, `${id}.dataurl.txt`);
let raw = fs.readFileSync(txt, "utf8").trim();
if (raw.startsWith('"')) raw = JSON.parse(raw); // the browser tool may save the result as a JSON string
const hash = (b) => crypto.createHash("sha256").update(b).digest("hex");
const existing = new Set(fs.readdirSync(dir).filter((f) => /\.(png|jpg|webp)$/.test(f) && !f.startsWith(id)).map((f) => hash(fs.readFileSync(path.join(dir, f)))));

const candidates = raw.split("\n|||\n").map((d) => {
  const m = d.trim().match(/^data:image\/(png|jpeg|webp);base64,(.+)$/s);
  if (!m) throw new Error(`not an image data URL (starts: ${d.slice(0, 40)})`);
  const buf = Buffer.from(m[2], "base64");
  return { ext: m[1] === "jpeg" ? "jpg" : m[1], buf, dup: existing.has(hash(buf)) };
});
const fresh = candidates.filter((c) => !c.dup);
if (fresh.length !== 1) throw new Error(`expected exactly 1 new image, found ${fresh.length} new of ${candidates.length} captured — check the page`);
fs.writeFileSync(path.join(dir, `${id}.${fresh[0].ext}`), fresh[0].buf);
fs.unlinkSync(txt);
console.log(`${id}.${fresh[0].ext} saved (${Math.round(fresh[0].buf.length / 1024)} KB; ${candidates.length - 1} older image(s) on the page ignored)`);
