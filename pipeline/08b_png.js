// Stage 9b — render finals/<id>.svg to finals/<id>.png with headless Microsoft Edge (ships with Windows;
// no install, no browser agent, no model tokens). Size comes from the SVG's own width/height.
// Usage: node pipeline/08b_png.js <run>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const run = process.argv[2];
const dir = path.resolve("pipeline", "runs", run, "finals");
const browser = [`${process.env["ProgramFiles(x86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`, `${process.env.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe`, `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`].find((p) => fs.existsSync(p));
if (!browser) throw new Error("No Edge/Chrome found for headless rendering.");
let n = 0;
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  const svg = path.join(dir, f), png = svg.replace(/\.svg$/, ".png");
  const head = fs.readFileSync(svg, "utf8").slice(0, 300);
  const w = Number((head.match(/width="(\d+)"/) || [, 1080])[1]), h = Number((head.match(/height="(\d+)"/) || [, 1080])[1]);
  // A tiny HTML wrapper removes the default page margin so the PNG is exactly the creative.
  const html = svg.replace(/\.svg$/, ".wrap.html");
  fs.writeFileSync(html, `<!doctype html><html><body style="margin:0;background:#fff"><img src="${path.basename(svg)}" width="${w}" height="${h}" style="display:block"></body></html>`);
  try {
    execFileSync(browser, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${w},${h}`, `--screenshot=${png}`, "file:///" + html.replace(/\\/g, "/")], { stdio: "ignore", timeout: 60000 });
    n++;
  } finally { fs.rmSync(html, { force: true }); }
  console.log(`${f} → ${path.basename(png)} (${w}x${h})`);
}
console.log(`${n} PNGs rendered`);
