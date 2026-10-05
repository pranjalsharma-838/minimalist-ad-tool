// End-to-end check of the Claude-key route without a real key (run: node scripts/check_claude_route.mjs <handle>).
// globalThis.fetch is replaced for api.anthropic.com only: the "model" answers the copy call with page-sourced copy
// (the verbatim writer's output, with its citations) and the judge call with no findings. Everything else (the
// request shape, the code checks on the copy, the rules, the verdict in code) runs for real. Writes logs/claude_route_check.json.
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
process.env.STUDIO_QUEUE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "claude-route-")); process.env.ANTHROPIC_API_KEY = "sk-ant-test-not-real";
const handle = process.argv[2] || "kojic-mandelic-body-lotion";
const sheet = JSON.parse(fs.readFileSync(`cache/sheets/${handle}.json`, "utf8")).sheet;
const G = await import("../lib/generate.js"), { scoreAd } = await import("../lib/score.js");
const calls = []; const real = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (!String(url).includes("api.anthropic.com")) return real(url, init);
  const body = JSON.parse(init.body); calls.push({ model: body.model, has_schema: Boolean(body.output_config?.format?.schema), system_chars: body.system?.[0]?.text?.length || 0 });
  const props = Object.keys(body.output_config.format.schema.properties || {});
  const answer = props.includes("headline") ? G.verbatimCopy(sheet, 1) : { findings: [], rule_hit_review: [], tone_read: "Calm and factual.", language_read: "Concentrations stated exactly." };
  return new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify(answer) }], stop_reason: "end_turn", usage: { input_tokens: 1, output_tokens: 1 }, model: body.model }), { status: 200 });
};
const log = { product: handle, started: new Date().toISOString() };
const out = await G.generateAd(sheet, { mode: "model", queue: false });
log.copy_mode = out.mode; log.copy_log = out.log; log.headline = out.copy.headline; log.formats_ready = out.formats.filter((f) => f.status === "ready").length; log.audiences = out.audiences.map((a) => a.label);
const first = out.formats.find((f) => f.status === "ready").id;
const judged = await scoreAd(out.items[first].report.ad, { sheet });
log.judge = { format: first, coverage_model: judged.coverage.model, verdict: judged.verdict.code };
log.api_calls = calls;
fs.mkdirSync("logs", { recursive: true }); fs.writeFileSync("logs/claude_route_check.json", JSON.stringify(log, null, 2));
console.log(JSON.stringify(log, null, 2));
