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
const CLIENT = Buffer.from("YW52ZXlh", "base64").toString();
// User decision (2026-10-03): the three messages that framed the work around the internal client brand are shown
// as neutral restatements (same meaning, no client), visibly marked. Nothing else in the conversation is edited.
const EDITED = " *(edited for the submission: client framing replaced with a neutral restatement; meaning unchanged)*";
const NEUTRAL = [
  [new RegExp(`^this is for ${CLIENT} only we are testing it[\\s\\S]*`, "i"), "Context: Minimalist is a test brand. We're proving the pipeline on a well-known brand first, so the same pipeline can later be reused for other brands." + EDITED],
  [new RegExp(`^i m just testing for a known br[a-z]*d the loop i want to build for ${CLIENT}\\s*$`, "i"), "I'm testing the loop on a well-known brand first; the goal is a pipeline that can be reused for other brands." + EDITED],
  [new RegExp(`^okay i am suggesting n architecture for this which we will test on this well knwon brnad nad then we will lter replicate for our rband ${CLIENT}: that is:`, "i"), "Okay, I'm suggesting an architecture for this, which we'll test on this well-known brand and then reuse for other brands. That is:" + EDITED],
];
const neutralise = (t) => NEUTRAL.reduce((s, [rx, rep]) => s.replace(rx, rep), t);
// Spelling/grammar corrections of the user's own messages (user decision 2026-10-03), disclosed in the header.
// docs/transcript_corrections.json maps "<timestamp>#<n>" → corrected text. Corrections may fix spelling, grammar
// and punctuation only — no added goals, facts or instructions (checked by length ratio below).
const CORR = fs.existsSync("docs/transcript_corrections.json") ? JSON.parse(fs.readFileSync("docs/transcript_corrections.json", "utf8")) : {};
const DUMP = process.env.DUMP_USER ? [] : null;
// "Start here": the moments the brief says matter most — where an output was wrong, how it was caught, the fix.
const START_HERE = `## Start here: where things went wrong, and how they were caught

The parts that went badly are kept in full; this index points to them. Each fix is a separate commit (\`git show <hash>\`). Times below are local (IST); transcript headers are UTC.

**The agent's output was wrong, and a check or the eye-check caught it**

| When | What went wrong | How it was caught | Fix | Commit |
|---|---|---|---|---|
| 10-02 01:09 | Renderer v1 let text overflow into the CTA band | Rendered test ads | Measured auto-fit of every text block | 786a0e2 |
| 10-02 01:21 | Rulebook draft: 3 false positives, 3 misses on the tuning ads | Tuning pass vs. human-style labels | Rules fixed and pinned as regression tests | 1c1a5c3 |
| 10-02 01:42 | The AI judge could raise code-only checks and escalate severity | Stand-in eval run 1 | Judge can't raise computed checks; severity = min(judge, rulebook) | aab9cf7 |
| 10-02 02:19 | Matcher paired competitor ads with the wrong product formats | 3 manual review passes | Body-vs-face penalty, function words, texture, active > format | ac6729b |
| 10-02 02:26 | First compliance gate blocked 12/12 briefs, all false blocks | Reading every block | 6 checker bugs fixed (product name citable, "space for a product photo", …) | 94c0be9 |
| 10-02 20:50 | ChatGPT page returned a *previous* chat's image; multiply blend greyed the white tube | Hash comparison; eye-check | De-duplicate by hash; blend reverted to a framed pack shot | fb80989 |
| 10-03 02:54 | Trend scores all flat at 0.5 (the two metrics were complements); format picks repetitive | Looking at the ranked output | New trend score; product-fit and variety penalty | 4ce29cb |
| 10-03 03:08 | ₹224 treated as MRP (it was the smallest size's sale price); a 5★ "review" was a complaint | Live offer capture; spot-check of reviews | Prices per size from the feed; negative-wording filter | 186441e |
| 10-03 11:37 | "Free" rule flagged "3rd product free on buying 2" (didn't know "buying") | Debugging the flag on the brief | Rule exemption extended + regression test | bb7cf88 |
| 10-03 11:53 | "Keep the best version" brought back a claim the AI judge had flagged | Eye-check of a composed final | Versions compared only at equal checking depth | a3c7dca |
| 10-03 11:53 | Badges ran off the panel; 9:16 version showed a seam | Eye-check | Width cap + wrap; inset-card layout | a3c7dca |
| 10-03 12:08 | Offer ads got a non-offer angle label (family-name mismatch) | Counting angles in the run | Offer detected by layout; labels corrected | 86b2082 |
| 10-03 12:31 | Offer ads didn't show the price; Tamil text overflowed | Contact-sheet eye-check | Price line drawn; script-aware text fitting | 7b5623c |
| 10-03 13:34 | Offer box showed raw "Source: … https://…" text; rating numbers overflowed | Contact-sheet eye-check | Sourcing moved to the footnote; value fits its box | b90930d |
| 10-03 12:36 | First transcript export leaked a pasted password | Leak check run before commit (never committed) | Stronger redaction, verified 0 left | (pre-commit) |
| 10-03 13:35 | Library files from two runs overwrote each other (same ad ids) | Index row count 32, not 36 | Run-tagged file names, library rebuilt | 69a1075 |

**The human pushed back, and the build changed**

| When (UTC) | What the user said | What changed |
|---|---|---|
| 10-01 20:00 | "we cant install things on this laptop" | SDK removed; zero-dependency Node build |
| 10-02 20:37 | "ignore this i dont think it is useful" (voice editor, pixel re-check, selection stage, loop ledger) | Those layers cut from the architecture |
| 10-02 21:07 | "wait i dont understand the issue is it spf 50 or 56?" | House rule: the labelled SPF is the claim, lab value only in the footnote |
| 10-02 | "pick more this is very less, more rigorous scraping" | Deeper competitor collection; 74 ads tagged to 48 formats |
| 10-02 21:30 | "use script based scraping wherever possible" | Offers, reviews and competitor data moved from browser agents to scripts |
| 10-03 | External review: "is 92% a generalisation test or a self-consistency check?" | Unseen-brand, unseen-channel eval set, labelled blind and scored once (eval/README.md) |

About 20 of the ~80 commits are fixes to something the agent got wrong; the rest add features or docs.

---
`;
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
  .replace(new RegExp(`\\b${CLIENT}(us)?\\b`, "gi"), "the target brand")
  .replace(/\b(id|user(name)?|login)\s*[:=]\s*\S+\s+(and\s+)?(pw|password|pass)\s*[:=]?\s*\S+/gi, "[credentials redacted]")
  .replace(/\b[A-Za-z0-9+/]{40,}={0,2}\b/g, "[long-token]");
const textOf = (c) => typeof c === "string" ? c : Array.isArray(c) ? c.filter((p) => p.type === "text").map((p) => p.text).join("\n") : "";
const out = ["# Build transcript", "", "Exported from the Claude Code session log by `scripts/export_transcript.js`. It contains the user's messages and the assistant's visible replies (no tool output, no hidden reasoning; some narration that sat between tool calls isn't in the log export). **What was removed:** email addresses, passwords and key-like strings (credentials pasted during the build were never used), and the internal client's name (shown as \"the target brand\"; three framing messages are neutral restatements, marked where they appear). **Nothing else was removed**, including the parts that went badly.", "", START_HERE];
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
    if (role === "user") {
      t = neutralise(t);
      const key = `${e.timestamp}#${n}`;
      if (DUMP) DUMP.push({ key, text: redact(t) });
      const c = CORR[key];
      // Guard: a correction may not grow the message by more than 15% (spelling/grammar only, no padding).
      if (c && c.length <= Math.max(redact(t).length * 1.15, redact(t).length + 25)) t = c;
      else if (c) console.warn(`correction for ${key} rejected: longer than a grammar fix allows`);
    }
    out.push(`### ${role === "user" ? "User" : "Assistant"}${e.timestamp ? ` · ${e.timestamp.slice(0, 16).replace("T", " ")}` : ""}`, "", redact(t), "");
    n++;
  }
}
if (DUMP) { fs.writeFileSync(process.env.DUMP_USER, JSON.stringify(DUMP, null, 1)); console.log(`${DUMP.length} user messages dumped to ${process.env.DUMP_USER}`); }
if (Object.keys(CORR).length) out[2] = out[2].replace("**Nothing else was removed**", "The user's messages have had **spelling and grammar corrected; wording and content are otherwise unchanged** (nothing added). **Nothing else was removed**");
fs.writeFileSync("docs/TRANSCRIPT.md", out.join("\n"));
console.log(`${n} messages → docs/TRANSCRIPT.md`);
