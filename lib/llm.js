// Thin wrapper around the Anthropic SDK: one structured-output call, with refusal fallback.
// Prompts live in prompts/*.md and are loaded from disk on every call (no prompt text in code).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const here = path.dirname(fileURLToPath(import.meta.url));
export const MODEL = process.env.MODEL || "claude-opus-5-5";

export const llmAvailable = () => Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);

export function loadPrompt(name, vars = {}) {
  let text = fs.readFileSync(path.join(here, "..", "prompts", name), "utf8");
  for (const [k, v] of Object.entries(vars)) text = text.split(`{{${k}}}`).join(v);
  return text;
}

let client = null;

// Returns { data, usage, model } or throws with a readable message.
export async function structuredCall({ system, user, schema, effort = "medium", maxTokens = 16000 }) {
  if (!llmAvailable()) throw new Error("No ANTHROPIC_API_KEY set");
  client ??= new Anthropic();
  const content = Array.isArray(user) ? user : [{ type: "text", text: user }];
  const res = await client.beta.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    // System prompt (rulebook) is identical across calls -> cache it.
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content }],
    output_config: { effort, format: { type: "json_schema", schema } },
  });
  if (res.stop_reason === "refusal") {
    throw new Error(`Model declined (${res.stop_details?.category ?? "unspecified"}). Treat as not assessed.`);
  }
  if (res.stop_reason === "max_tokens") throw new Error("Model output was cut off (max_tokens).");
  const text = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return { data: JSON.parse(text), usage: res.usage, model: res.model };
}
