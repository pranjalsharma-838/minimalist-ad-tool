// Image generation through the OpenAI Images API (layer 7), when OPENAI_API_KEY is in .env.
// Without a key the pipeline falls back to pasting prompts into ChatGPT in the browser.
// Every prompt is checked first (lib/image_prompt_check.js); the result is a BACKGROUND or scene only —
// the real pack shot and checked copy are composited afterwards by public/render.js.
// NOTE: written 2026-10-03 without a key to test against — first live call must be verified by eye.
import "./env.js";
import { checkImagePrompt } from "./image_prompt_check.js";

export const imageApiAvailable = () => Boolean(process.env.OPENAI_API_KEY);

export async function generateBackground(prompt, { size = "1024x1024", model = process.env.IMAGE_MODEL || "gpt-image-1" } = {}) {
  if (!imageApiAvailable()) throw new Error("No OPENAI_API_KEY in .env — use the browser image step instead.");
  const check = checkImagePrompt(prompt);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, prompt, size, n: 1 }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Image API ${res.status}: ${body?.error?.message || "unknown error"}`);
  const b64 = body?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Image API returned no image data.");
  return { png: Buffer.from(b64, "base64"), prompt_check: check, model };
}
