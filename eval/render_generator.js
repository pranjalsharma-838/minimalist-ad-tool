// Renders the exact generator prompt for a few real products (fact sheets fetched live and saved),
// so model-written copy can be produced by a stand-in and then run through the app's real checks.
// Output: eval/gen/<handle>.sheet.json, eval/gen/system.md, eval/gen/<handle>.user.md
import fs from "node:fs";
import { extractFromUrl } from "../lib/extract.js";
import { loadPrompt } from "../lib/llm.js";

const URLS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "https://beminimalist.co/products/niacinamide-10-with-matmarine",
      "https://beminimalist.co/products/salicylic-acid-2",
      "https://beminimalist.co/products/light-fluid-spf-50-sunscreen",
    ];
fs.mkdirSync("eval/gen", { recursive: true });
fs.writeFileSync("eval/gen/system.md", loadPrompt("generator_system.md"));
for (const url of URLS) {
  const sheet = await extractFromUrl(url);
  const handle = url.split("/products/")[1];
  fs.writeFileSync(`eval/gen/${handle}.sheet.json`, JSON.stringify(sheet, null, 2));
  const hero = sheet.actives[0];
  const user = loadPrompt("generator_user.md", {
    TITLE: sheet.title,
    HERO: hero ? `${hero.pct} ${hero.name}` : "(none — no concentration in the title)",
    URL: sheet.url,
    FACTS: sheet.facts.filter((f) => f.kind !== "inci").map((f) => `${f.id} [${f.kind}] (${f.section}) ${f.text}`).join("\n"),
    REVISION: "",
  });
  fs.writeFileSync(`eval/gen/${handle}.user.md`, user);
  console.log(handle, sheet.facts.length, "facts");
}
