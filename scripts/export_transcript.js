// Deliverable: the build transcript, REDACTED. Reads the Claude Code session log (JSONL), keeps the user's
// messages and the assistant's visible replies (no tool output, no hidden reasoning), and redacts anything
// credential-like before writing docs/TRANSCRIPT.md.
// Redaction (credentials were pasted into the chat at one point, deliberately never used):
//   - every email address → [email]
//   - "password/pwd/pass/passcode/otp: <x>" and the line after a "password" mention → [redacted]
//   - API-key-like tokens (sk-…, sk-ant-…, long base64/hex strings) → [key]
// Usage: node scripts/export_transcript.js <path-to-session.jsonl> [more.jsonl ...]
import fs from "node:fs";

const files = process.argv.slice(2);
if (!files.length) { console.error("Usage: node scripts/export_transcript.js <session.jsonl> [...]"); process.exit(1); }
const redact = (t) => String(t)
  .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
  .replace(/\b(sk-ant-[\w-]{10,}|sk-[\w-]{16,}|AIza[\w-]{20,}|ghp_[\w]{20,})/g, "[key]")
  .replace(/\b(password|passwd|pwd|pass ?code|passcode|pass|otp|pin)\b(\s*(is|:|=|-)?\s*(is|:|=)?\s*)(\S+)/gi, "$1$2[redacted]")
  // First export leaked a bare password typed right after an email address, and a "letters@digits" style
  // password: redact a non-word token after [email], and any letters+symbol+digits token anywhere.
  .replace(/\[email\](\s+)(?!USE\b|and\b|or\b|for\b)(\S*[\d@#$%!&*]\S*)/g, "[email]$1[redacted]")
  .replace(/\b[A-Za-z]{3,}[@#$%!&*][0-9]{2,}\b/g, "[redacted]")
  // The client brand behind the test is not named in the submission (user decision 2026-10-03); the name is
  // stored encoded so it doesn't appear in the repo as plain text.
  .replace(new RegExp(`\\b${Buffer.from("YW52ZXlh", "base64").toString()}(us)?\\b`, "gi"), "[client brand]")
  .replace(/\b(id|user(name)?|login)\s*[:=]\s*\S+\s+(and\s+)?(pw|password|pass)\s*[:=]?\s*\S+/gi, "[credentials redacted]")
  .replace(/\b[A-Za-z0-9+/]{40,}={0,2}\b/g, "[long-token]");
const textOf = (c) => typeof c === "string" ? c : Array.isArray(c) ? c.filter((p) => p.type === "text").map((p) => p.text).join("\n") : "";
const out = ["# Build transcript (redacted)", "", "Exported from the Claude Code session log by `scripts/export_transcript.js`. It contains the user's messages and the assistant's visible replies only (no tool output, no hidden reasoning). Email addresses, passwords and key-like strings are redacted. Credentials pasted during the build were never used.", ""];
let n = 0;
for (const f of files) {
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    if (!line.trim()) continue;
    let e; try { e = JSON.parse(line); } catch { continue; }
    const role = e.message?.role || e.type;
    if (!["user", "assistant"].includes(role) || e.isMeta || e.isCompactSummary) continue;
    let t = textOf(e.message?.content).trim();
    if (!t || /^<(command|local-command|system-reminder|task-notification)/.test(t) || t.startsWith("[SYSTEM NOTIFICATION")) continue;
    t = t.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "").trim();
    if (!t) continue;
    out.push(`### ${role === "user" ? "User" : "Assistant"}${e.timestamp ? ` · ${e.timestamp.slice(0, 16).replace("T", " ")}` : ""}`, "", redact(t), "");
    n++;
  }
}
fs.writeFileSync("docs/TRANSCRIPT.md", out.join("\n"));
console.log(`${n} messages → docs/TRANSCRIPT.md`);
