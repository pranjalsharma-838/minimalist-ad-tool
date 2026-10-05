// Writes the exact prompts the app would send to Claude, for a Claude agent to answer when no API key is set
// (user, 2026-10-05). Step 1 (no copy yet): the generator prompt -> stand_in/prompts/<handle>/copy.{system,user}.md
// and the copy JSON schema. Step 2 (after stand_in/copy/<handle>.json exists): one AI-judge prompt per ready format
// -> stand_in/prompts/<handle>/judge__<format>.user.md + judge.system.md. Answers go to stand_in/copy/<handle>.json and
// stand_in/judge/<handle>__<format>.json; the app picks them up on the next Build.
// Usage: node scripts/stand_in_prompts.mjs <handle>
import fs from "node:fs"; import path from "node:path";
const handle = process.argv[2];
const sheet = JSON.parse(fs.readFileSync(`cache/sheets/${handle}.json`, "utf8")).sheet;
const G = await import("../lib/generate.js"), { loadPrompt } = await import("../lib/llm.js"), { buildJudgePrompt } = await import("../lib/judge.js"), { runRules } = await import("../lib/rules.js");
const out = path.join("stand_in", "prompts", handle); fs.mkdirSync(out, { recursive: true });
const copyFile = path.join("stand_in", "copy", `${handle}.json`);
if (!fs.existsSync(copyFile)) {
  fs.writeFileSync(path.join(out, "copy.system.md"), loadPrompt("generator_system.md"));
  fs.writeFileSync(path.join(out, "copy.user.md"), G.generatorUserPrompt(sheet));
  fs.writeFileSync(path.join(out, "copy.schema.json"), JSON.stringify(G.COPY_SCHEMA, null, 2));
  console.log(`copy prompt written to ${out}; answer into ${copyFile}`);
} else {
  const copy = JSON.parse(fs.readFileSync(copyFile, "utf8").replace(/^﻿/, ""));
  const all = await G.allFormats(copy, sheet, {});
  let n = 0;
  for (const f of all.formats.filter((f) => f.status === "ready")) {
    const ad = all.items[f.id].report.ad;
    const jp = buildJudgePrompt(ad, runRules(ad, { sheet }), { sheet });
    if (!n) fs.writeFileSync(path.join(out, "judge.system.md"), `${jp.system}\n\n## Output format (JSON, exactly this schema)\n\n\`\`\`json\n${JSON.stringify(jp.schema, null, 2)}\n\`\`\`\n`);
    fs.writeFileSync(path.join(out, `judge__${f.id}.user.md`), jp.user); n++;
  }
  console.log(`${n} judge prompts written to ${out}; answers go to stand_in/judge/${handle}__<format>.json`);
}
