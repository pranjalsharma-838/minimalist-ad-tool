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
| 10-03 15:56 | Hero-layout ads with AI people showed **no AI mark** (that layout built its own SVG) | Checking the SVGs after a contact sheet looked right at a glance | Mark drawn by every layout + regression test across all layouts | 05183a0 |
| 10-03 15:56 | Compliance re-computed risk and dropped the AI flag: AI-people ads came out "low, no AI label" | The writer agent noticed the mismatch | Risk can only go up: the format's own risk and the AI flag are floors | 05183a0 |
| 10-03 16:03 | Catalog checks fired on *other brands'* products (5/12 over-blocks on the unseen-brand test) | Out-of-distribution eval, scored once | Catalog checks scoped to Minimalist's own ads; post-fix re-run reported separately | 506adce |
| 10-03 20:39 | On creator/UGC ads the product inset covered the person's face | Contact-sheet eye-check | Person card + product beside it on that layout | 4cb0d6d |
| 10-04 00:25 | The rule layer missed comparisons worded "unlike salicylic acid" / "higher than other derivatives" | Rules-only gate on the Us vs Them run | CLM-12 extended ("vs", "unlike X", "higher than"); eval re-run, unchanged | ab5f8f2 |
| 10-04 00:50 | Two creatives lost the end of their footnote, one an AI-illustration note: the creative drew 2 lines but the overflow check allowed 3 | The new style check | Check matches what's drawn; footnote shortened with its own words | ab5f8f2 |
| 10-04 01:20 | On the new white canvas, white packs showed in grey boxes / white frames, and overlapped person photos | Contact-sheet eye-check | Canvas takes the pack photo's studio grey; no frame; pack beside the photo when it has no cut-out | ab5f8f2 |
| 10-04 01:35 | The caption split moved two Us vs Them ads' basis-of-comparison lines off the creative | Contact-sheet eye-check | Comparison bases, "results may vary" and perception qualifiers always stay on the creative | ab5f8f2 |
| 10-04 01:45 | The transcript export had silently dropped 40 messages the user typed mid-task (since 10-01) | Preparing grammar corrections for the newest messages | Mid-task messages exported and marked; corrections added | 1ffd766 |

**The human pushed back, and the build changed**

| When (UTC) | What the user said | What changed |
|---|---|---|
| 10-01 20:00 | "we cant install things on this laptop" | SDK removed; zero-dependency Node build |
| 10-02 20:37 | "ignore this i dont think it is useful" (voice editor, pixel re-check, selection stage, loop ledger) | Those layers cut from the architecture |
| 10-02 21:07 | "wait i dont understand the issue is it spf 50 or 56?" | House rule: the labelled SPF is the claim, lab value only in the footnote |
| 10-02 | "pick more this is very less, more rigorous scraping" | Deeper competitor collection; 74 ads tagged to 48 formats |
| 10-02 21:30 | "use script based scraping wherever possible" | Offers, reviews and competitor data moved from browser agents to scripts |
| 10-03 | External review: "is 92% a generalisation test or a self-consistency check?" | Unseen-brand, unseen-channel eval set, labelled blind and scored once (eval/README.md) |
| 10-03 15:20 | "A lot of them are missing human images… one for each product… the different angles" | AI people filled in for every placeholder; every product × every angle (23 new ads) |
| 10-03 19:45 | "Clear product and CTA is missing… human usage, journey and lifestyle are very limited… Indian audience, male and female" | Larger product + action CTA on every ad; a people pack (lifestyle, usage, routine journey) per product with balanced Indian casting; existing AI people recast |
| 10-03 18:12 | "The images are a bit too text-heavy; fetch Minimalist's long-running ads and compare" | Style guide from the brand's own top runners; details moved to the caption |
| 10-03 18:37 | "Us vs them is missing; the Hide Nothing tg is missing" | Us vs Them format (7 ads; the judge flagged all 7, so they stay High/Severe); "Hide Nothing." sign-off on every ad |
| 10-03 18:54 | "From Meta we were supposed to scrape statics and not videos, for competitors as well as ours" | Video ads ignored as evidence in code; the brand reference re-scraped as 8 statics; 3 briefs re-sourced |
| 10-03 19:04 | "Much cleaner than what we are building… whenever models are used the risk is severe… the design should be minimalistic" | Minimal house design on every ad (median 15 words on the image); any model makes an ad Severe (kept, never exported) |

About 23 of the ~95 commits are fixes to something the agent got wrong (a few more sit inside feature commits and are listed in their messages); the rest add features or docs.

---
`;
const redact = (t) => String(t)
  .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
  .replace(/\b(sk-ant-[\w-]{10,}|sk-[\w-]{16,}|AIza[\w-]{20,}|ghp_[\w]{20,})/g, "[key]")
  // "pass it to …", "pass on …" are verbs, not credentials (2026-10-04: "pass it to it" was shown as "pass [redacted]").
  .replace(/\b(password|passwd|pwd|pass ?code|passcode|pass|otp|pin)\b(\s*(is|:|=|-)?\s*(is|:|=)?\s*)(?!(?:it|on|to|the|this|that|them|through|along|over)\b)(\S+)/gi, "$1$2[redacted]")
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
    // Bug fix (2026-10-04): messages the user typed while a turn was running are logged as "queued_command"
    // attachments, not user turns, so the export left out instructions such as "us vs them is missing". They are
    // included now, marked as sent mid-task. Keys use "#q" and don't advance n, so earlier correction keys stay valid.
    if (e.type === "attachment" && e.attachment?.type === "queued_command" && e.attachment?.origin?.kind === "human") {
      const ts = e.attachment.timestamp || e.timestamp, key = `${ts}#q`;
      let q = neutralise(String(e.attachment.prompt || "").trim());
      if (!q) continue;
      if (DUMP) DUMP.push({ key, text: redact(q) });
      const c = CORR[key];
      if (c && c.length <= Math.max(redact(q).length * 1.15, redact(q).length + 25)) q = c;
      else if (c) console.warn(`correction for ${key} rejected: longer than a grammar fix allows`);
      out.push(`### User (sent while the assistant was working)${ts ? ` · ${ts.slice(0, 16).replace("T", " ")}` : ""}`, "", redact(q), "");
      continue;
    }
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
