// Image Studio worker: makes the images people ask for in the app, with no Claude in the loop.
//   npm run studio        (leave it running; sign in to ChatGPT once in the window it opens)
// The app writes image_requests/<id>.json with status "queued". Every 10 s this worker takes the oldest queued request,
// drives the user's own ChatGPT in a visible Edge window (its own saved profile, so the sign-in is remembered), attaches the
// real pack photo, types the prompt, waits for the image, saves it to image_requests/<id>.png, then checks the pack label
// against the real pack with scripts/verify_pack.py. A failed check is sent back to ChatGPT in the same chat with a short
// correction, up to 3 rounds in all. Result: image_requests/<id>.result.json  { status: done | needs_review | failed, ... }.
// It never types a password: sign-in is done by the person, in the window.
// Test switches: STUDIO_DRY=1 makes no browser and copies the base image as the result; STUDIO_DRY_VERDICT="REVIEW,PASS"
// sets the fake check verdict per round; STUDIO_QUEUE_DIR points at another queue folder; STUDIO_DRY_VERIFY=1 runs the real
// pack check in a dry run.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launch, sleep } from "../lib/cdp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const Q = () => (process.env.STUDIO_QUEUE_DIR ? path.resolve(process.env.STUDIO_QUEUE_DIR) : path.join(ROOT, "image_requests"));
const DRY = () => process.env.STUDIO_DRY === "1";
const PROFILE = process.env.STUDIO_PROFILE || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), ".config"), "MinimalistImageStudio");
const POLL_MS = Number(process.env.STUDIO_POLL_MS || 10000);
const IMAGE_WAIT_MS = Number(process.env.STUDIO_IMAGE_WAIT_MS || 4 * 60 * 1000);
const ROUNDS = 3;

export const SUFFIX = "Use the attached photo as the exact product: the pack must stay identical (shape, cap, colours, label layout and every word exactly as printed). Do not add, remove or change any text or logo on the pack.";
export const CORRECTION = `The pack changed — keep the pack exactly as in the photo: ${SUFFIX}`;
const SIGN_IN_MSG = "Sign in to ChatGPT in the window that opened, then leave it running";

// ---------- small helpers ----------
export function log(msg) {
  const line = `${new Date().toISOString()} ${msg}`;
  console.log(line);
  try { fs.mkdirSync(Q(), { recursive: true }); fs.appendFileSync(path.join(Q(), "worker.log"), line + "\n"); } catch { /* the log must never stop the worker */ }
}
const readJson = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
function writeJson(f, obj) {
  const tmp = `${f}.tmp`;
  try { fs.writeFileSync(tmp, JSON.stringify(obj, null, 2)); fs.renameSync(tmp, f); } catch { fs.writeFileSync(f, JSON.stringify(obj, null, 2)); }
}
const reqFile = (id) => path.join(Q(), `${id}.json`);
export function setRequest(id, patch) {
  const r = readJson(reqFile(id));
  if (!r) return null;
  const next = { ...r, ...patch };
  for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
  writeJson(reqFile(id), next);
  return next;
}
const withTimeout = (p, ms, what) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${what} timed out after ${Math.round(ms / 1000)}s`)), ms).unref())]);

// ---------- the queue ----------
export function listQueued() {
  const dir = Q();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => /^\d.*\.json$/.test(f) && !/\.(result|progress)\.json$/.test(f))
    .map((f) => readJson(path.join(dir, f)))
    .filter((r) => r?.id && r.status === "queued" && !fs.existsSync(path.join(dir, `${r.id}.result.json`)))
    // A request that waits for the product render ("after") is held until that render has a result (user, 2026-10-05:
    // "after the product image is rendered correctly we send the request for rest of the images").
    .filter((r) => !r.after || !fs.existsSync(path.join(dir, `${r.after}.json`)) || fs.existsSync(path.join(dir, `${r.after}.result.json`)))
    // Newest first: the Build the user is looking at right now gets its images before older, abandoned builds.
    .sort((a, b) => String(b.requested_at).localeCompare(String(a.requested_at)));
}
// A request this worker marked "working" before it was stopped goes back to the queue (one worker, one request at a time).
export function resetStale() {
  const dir = Q();
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(dir).filter((x) => /^\d.*\.json$/.test(x) && !/\.result\.json$/.test(x))) {
    const r = readJson(path.join(dir, f));
    if (r?.status === "working" && r.worker === "studio" && !fs.existsSync(path.join(dir, `${r.id}.result.json`))) { setRequest(r.id, { status: "queued", worker: undefined, progress: undefined }); n++; }
  }
  return n;
}

const absPath = (p) => (path.isAbsolute(p) ? p : path.join(ROOT, p));
// The photo to attach: a project file, or (when the product photo was a web address) a downloaded copy.
async function baseFile(req) {
  // Built on the product render this request waited for, when that render passed its label check.
  if (req.after) {
    const r = readJson(path.join(Q(), `${req.after}.result.json`));
    if (r?.status === "done" && r.image && fs.existsSync(absPath(r.image))) return absPath(r.image);
  }
  const b = req.base_image || "";
  if (!b) return "";
  if (/^https?:/i.test(b)) {
    const r = await fetch(b, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw Object.assign(new Error(`Could not download the product photo (HTTP ${r.status})`), { noRetry: true });
    const ext = /png/.test(r.headers.get("content-type") || "") ? "png" : "jpg";
    const f = path.join(Q(), `${req.id}.base.${ext}`);
    fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
    return f;
  }
  const f = absPath(b);
  if (!fs.existsSync(f)) throw Object.assign(new Error(`Base image not found: ${b}`), { noRetry: true });
  return f;
}
// The real pack to compare against: the cut-out of the verified render if there is one, else the base photo.
const refFor = (req, base) => {
  const cut = path.join(ROOT, "brand_packs/minimalist/assets/cutouts", `${req.handle}_render.png`);
  return fs.existsSync(cut) ? cut : base;
};

// ---------- the label check (scripts/verify_pack.py) ----------
export function verifyPack(ref, img, checkOut, round = 1) {
  if (DRY() && process.env.STUDIO_DRY_VERIFY !== "1") {
    const seq = (process.env.STUDIO_DRY_VERDICT || "PASS candidate (dry run, no real check)").split(",");
    const v = seq[Math.min(round - 1, seq.length - 1)].trim();
    return Promise.resolve({ verdict_hint: v, label_similarity: /^PASS/.test(v) ? 0.9 : 0.3, dry: true });
  }
  return new Promise((resolve) => {
    execFile(process.env.PYTHON || "python", [path.join(ROOT, "scripts/verify_pack.py"), ref, img, checkOut], { timeout: 120000, maxBuffer: 8 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
      const json = String(stdout || "").split(/\r?\n/).reverse().find((l) => l.trim().startsWith("{"));
      try { if (json) return resolve(JSON.parse(json)); } catch { /* fall through */ }
      resolve({ verdict_hint: `check failed: ${(err?.message || stderr || "no output").toString().slice(0, 120)}`, error: true });
    });
  });
}

// ---------- one request: up to 3 rounds, then the result file ----------
export function fullPrompt(prompt, textOnly = false) {
  let p = String(prompt || "").replace(/\s+/g, " ").trim();
  // ChatGPT sometimes answers a bare description with words; an explicit "create an image" makes it draw.
  if (!/^(create|generate|make|draw|render|edit|show|produce|design)\b/i.test(p)) p = `Create an image: ${p}`;
  return textOnly ? p : `${p} ${SUFFIX}`;
}

export async function processRequest(req, studio) {
  const id = req.id, dir = Q();
  setRequest(id, { status: "working", worker: "studio", working_since: new Date().toISOString(), progress: "Starting" });
  log(`[${id}] start (${DRY() ? "dry run" : "ChatGPT"})`);
  const textOnly = Boolean(req.text_only);
  const base = textOnly ? "" : await baseFile(req);
  const ref = textOnly ? "" : refFor(req, base);
  const rounds = [];
  let finalCheck = null;
  for (let round = 1; round <= ROUNDS; round++) {
    const out = path.join(dir, `${id}_r${round}.png`), checkOut = path.join(dir, `${id}_r${round}_check.png`);
    setRequest(id, { progress: `Round ${round} of ${ROUNDS}: drawing the image` });
    if (round === 1) await studio.generate({ prompt: fullPrompt(req.prompt, textOnly), baseFile: base, outFile: out });
    else await studio.correct({ text: CORRECTION, outFile: out });
    setRequest(id, { progress: `Round ${round} of ${ROUNDS}: checking the pack label against the real pack` });
    const check = textOnly ? { verdict_hint: "PASS (scene only: no pack in the image, nothing to label-check)", label_similarity: null } : await verifyPack(ref, out, checkOut, round);
    const pass = /^PASS/i.test(check.verdict_hint || "");
    rounds.push({ round, out, checkOut: fs.existsSync(checkOut) ? checkOut : "", check, pass, sim: typeof check.label_similarity === "number" ? check.label_similarity : -1 });
    log(`[${id}] round ${round}: ${check.verdict_hint} (similarity ${check.label_similarity ?? "n/a"})`);
    // Show the best image so far to the app while the later rounds run.
    const best = rounds.filter((r) => r.pass).pop() || [...rounds].sort((a, b) => b.sim - a.sim)[0];
    fs.copyFileSync(best.out, path.join(dir, `${id}.png`));
    if (pass || check.error) break; // a broken check can't be fixed by asking ChatGPT again
  }
  const best = rounds.filter((r) => r.pass).pop() || [...rounds].sort((a, b) => b.sim - a.sim)[0];
  fs.copyFileSync(best.out, path.join(dir, `${id}.png`));
  if (best.checkOut) fs.copyFileSync(best.checkOut, path.join(dir, `${id}_check.png`));
  for (const r of rounds) for (const f of [r.out, r.checkOut]) if (f) try { fs.unlinkSync(f); } catch { /* leave it */ }
  finalCheck = best.check;
  const status = best.pass ? "done" : "needs_review";
  const inRoot = path.resolve(dir).startsWith(ROOT + path.sep);
  const imgRef = inRoot ? path.relative(ROOT, path.join(dir, `${id}.png`)).replace(/\\/g, "/") : path.join(dir, `${id}.png`);
  const notes = status === "done"
    ? `${textOnly ? "Scene only: no pack in this image, so there was no label to check; the real pack is placed by the app. Any person in it is an AI model: Severe, AI mark." : ""}Label check passed (similarity ${finalCheck.label_similarity ?? "?"}, ${rounds.length} round(s)). Automatic check only: still read the label by eye. Any person in the image is an AI model: Severe, AI mark.${best.check.dry ? " (Dry run: nothing was drawn.)" : ""}`
    : `Pack label did NOT pass after ${rounds.length} round(s): ${finalCheck.verdict_hint} (similarity ${finalCheck.label_similarity ?? "?"}). Not offered for ads: check the label by eye or ask again.`;
  writeJson(path.join(dir, `${id}.result.json`), { status, image: imgRef, rounds: rounds.length, similarity: finalCheck.label_similarity ?? null, verdict: finalCheck.verdict_hint, notes, finished_at: new Date().toISOString() });
  setRequest(id, { status, progress: undefined, worker: undefined });
  log(`[${id}] ${status}`);
  return status;
}

function failRequest(req, why) {
  writeJson(path.join(Q(), `${req.id}.result.json`), { status: "failed", image: "", rounds: 0, notes: `Could not make this image: ${why}. Ask again from the app.`, finished_at: new Date().toISOString() });
  setRequest(req.id, { status: "failed", progress: undefined, worker: undefined });
  log(`[${req.id}] failed: ${why}`);
}

// A request gets two attempts; between them the browser tab (or window) is restarted. Never throws.
export async function handleRequest(req, studio) {
  let last = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try { return await withTimeout(processRequest(req, studio), 20 * 60 * 1000, "the request"); }
    catch (e) {
      last = e.message || String(e);
      log(`[${req.id}] attempt ${attempt} failed: ${last}`);
      if (e.notSignedIn) { setRequest(req.id, { status: "queued", worker: undefined, progress: undefined }); return "waiting for sign-in"; }
      if (e.noRetry) break;
      try { await studio.restart?.(); } catch (e2) { log(`restart failed: ${e2.message}`); }
    }
  }
  failRequest(req, last);
  return "failed";
}

// ---------- dry-run studio: no browser, the base image stands in for ChatGPT's image ----------
export function createDryStudio() {
  let base = "";
  return {
    async generate({ baseFile, outFile }) { base = baseFile; if (!base) { fs.writeFileSync(outFile, Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64")); base = outFile; return; } fs.copyFileSync(base, outFile); },
    async correct({ outFile }) { if (base !== outFile) fs.copyFileSync(base, outFile); },
  };
}

// ---------- the real studio: ChatGPT in a visible Edge window, driven over DevTools ----------
const SEL = {
  composer: '#prompt-textarea, [contenteditable="true"][role="textbox"], textarea',
  send: 'button[data-testid="send-button"]:not([disabled]), #composer-submit-button:not([disabled]), button[aria-label*="Send" i]:not([disabled])',
  stop: 'button[data-testid="stop-button"]',
  addFiles: 'button[aria-label="Add files and more"]:not([disabled])',
};

export function createStudio(opts = {}) {
  let page = null;
  const ensure = async () => {
    if (page?.alive) return page;
    try { await page?.close(); } catch { /* already gone */ }
    page = await launch({ headless: false, profileDir: PROFILE, attachPort: opts.attachPort?.() || 0 });
    await page.goto("https://chatgpt.com/");
    return page;
  };
  const key = async (p, k, code) => { for (const type of ["keyDown", "keyUp"]) await p.send("Input.dispatchKeyEvent", { type, key: k, code, windowsVirtualKeyCode: 27 }); };
  // A real mouse click at the centre of the first match (fall back to element.click()).
  const click = async (p, sel) => {
    const r = await p.eval((s) => { const el = document.querySelector(s); if (!el) return null; el.scrollIntoView({ block: "center" }); const b = el.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, sel);
    if (!r) return false;
    try {
      await p.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: r.x, y: r.y });
      await p.send("Input.dispatchMouseEvent", { type: "mousePressed", x: r.x, y: r.y, button: "left", clickCount: 1 });
      await p.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: r.x, y: r.y, button: "left", clickCount: 1 });
    } catch { await p.eval((s) => document.querySelector(s)?.click(), sel); }
    return true;
  };
  const state = (p) => p.eval((composer) => ({
    url: location.href,
    composer: Boolean(document.querySelector(composer)),
    login: Boolean(document.querySelector('[data-testid="login-button"], [data-testid="welcome-login-button"], a[href*="/auth/login"]') || [...document.querySelectorAll("button,a")].find((b) => /^(log in|sign up|sign in|sign up for free)$/i.test((b.textContent || "").trim()))),
  }), SEL.composer);

  const api = {
    // Opens the window and reports whether ChatGPT is signed in.
    async open() { await ensure(); await sleep(3000); return api.signedIn(); },
    async signedIn() {
      const p = await ensure();
      let s = await state(p).catch(() => null);
      // Mid-login the window is on auth.openai.com / a Google or Apple sign-in page: never pull it back (user, 2026-10-05: "it refreshes before i enter details").
      if (s && /openai\.com|accounts\.google|appleid\.apple|login\.live|microsoftonline/.test(s.url)) return false;
      if (!s || !/chatgpt\.com/.test(s.url)) { await p.goto("https://chatgpt.com/"); await sleep(4000); s = await state(p).catch(() => null); }
      return Boolean(s && s.composer && !s.login && !/auth\.|\/auth\//.test(s.url));
    },
    async ready() {
      const ok = await api.signedIn();
      if (!ok) { try { await (await ensure()).send("Page.bringToFront"); } catch { /* ignore */ } }
      return ok;
    },
    async restart() { try { await page?.close(); } catch { /* ignore */ } page = null; },
    async close() { await api.restart(); },
    get port() { return page?.port || 0; },

    async generate({ prompt, baseFile: file, outFile }) {
      const p = await ensure();
      if (!(await api.signedIn())) throw Object.assign(new Error("not signed in to ChatGPT"), { notSignedIn: true });
      await p.goto("https://chatgpt.com/");
      await sleep(2000);
      const readyExpr = `Boolean(document.querySelector(${JSON.stringify(SEL.addFiles)}) && document.querySelector(${JSON.stringify(SEL.composer)}))`;
      if (!(await p.waitFor(readyExpr, { timeout: 45000 }))) throw new Error("the ChatGPT page did not become ready");
      for (let i = 0; i < 3; i++) await key(p, "Escape", "Escape");
      if (file) {
        // The real pack photo must be attached, or the request is not sent (user, 2026-10-05: "the original image is
        // missing, this shouldn't happen"). ChatGPT's page has several file inputs; each is tried until an attachment
        // preview shows in the composer.
        const attached = `(() => { const f = document.querySelector(${JSON.stringify(SEL.composer)})?.closest("form") || document; return f.querySelectorAll('img[src^="blob:"], img[src^="data:"], [data-testid*="attachment"], [aria-label*="Remove file" i], [aria-label*="remove attachment" i]').length; })()`;
        let n = 0;
        for (let i = 0; i < 15 && !n; i++) { n = (await p.send("Runtime.evaluate", { expression: "document.querySelectorAll('input[type=\"file\"]').length", returnByValue: true })).result?.value || 0; if (!n) await sleep(1000); }
        if (!n) throw new Error("ChatGPT has no file box to attach the photo to");
        let ok = false;
        for (let k = 0; k < n && !ok; k++) {
          const r = await p.send("Runtime.evaluate", { expression: `document.querySelectorAll('input[type="file"]')[${k}]`, returnByValue: false });
          if (!r.result?.objectId) continue;
          await p.send("DOM.setFileInputFiles", { objectId: r.result.objectId, files: [path.resolve(file)] });
          for (let w = 0; w < 10 && !ok; w++) { await sleep(1000); ok = (await p.send("Runtime.evaluate", { expression: attached, returnByValue: true })).result?.value > 0; }
        }
        if (!ok) throw new Error("the product photo did not attach in ChatGPT, so the request was not sent");
        await sleep(2000);
      }
      await typeText(p, prompt);
      await clickSend(p);
      await collect(p, outFile, 0);
    },
    async correct({ text, outFile }) {
      if (!page?.alive) throw new Error("the ChatGPT window closed in the middle of a request");
      const before = await page.eval(() => document.querySelectorAll('img[alt^="Generated image"]').length);
      await typeText(page, text);
      await clickSend(page);
      await collect(page, outFile, before);
    },
  };

  async function typeText(p, text) {
      const focused = await p.eval((c) => { const el = document.querySelector(c); if (!el) return false; el.focus(); return true; }, SEL.composer);
      if (!focused) throw new Error("could not find the ChatGPT message box");
      await p.send("Input.insertText", { text: String(text).replace(/\s+/g, " ").trim() });
      await sleep(800);
      const has = await p.eval((c) => { const el = document.querySelector(c); return ((el.value ?? el.innerText) || "").trim().length; }, SEL.composer);
      if (!has) throw new Error("the prompt did not appear in the ChatGPT message box");
  }
  // The send button stays disabled while the photo uploads; wait for it (up to 90 s).
  async function clickSend(p) {
      for (let i = 0; i < 45; i++) {
        if (await p.eval((s) => Boolean(document.querySelector(s)), SEL.send)) {
          await click(p, SEL.send);
          // ChatGPT's 2026 layout can swallow the positional click (the prompt then sits unsent until the 4-minute
          // timeout). If the text is still in the box, press the button directly, then submit the form.
          await sleep(2500);
          const stillThere = () => p.eval((c) => { const el = document.querySelector(c); return Boolean(el && ((el.value ?? el.innerText) || "").trim().length); }, SEL.composer);
          if (await stillThere()) await p.eval((s) => document.querySelector(s)?.click(), SEL.send);
          await sleep(2500);
          if (await stillThere()) await p.eval((s) => { const b = document.querySelector(s); (b?.form || b?.closest("form"))?.requestSubmit?.(b); }, SEL.send);
          return;
        }
        await sleep(2000);
      }
      throw new Error("the send button never became available");
  }
  // Waits (up to 4 min) for a NEW finished generated image, then saves it by fetching its blob inside the page.
  async function collect(p, outFile, before) {
      const end = Date.now() + IMAGE_WAIT_MS;
      let lastText = "", textSince = 0;
      while (Date.now() < end) {
        await sleep(4000);
        const s = await p.eval((stop) => {
          const imgs = [...document.querySelectorAll('img[alt^="Generated image"]')], last = imgs[imgs.length - 1];
          const msgs = document.querySelectorAll('[data-message-author-role="assistant"]');
          return { n: imgs.length, stopping: Boolean(document.querySelector(stop)), ready: Boolean(last && last.complete && last.naturalWidth > 400), text: msgs.length ? msgs[msgs.length - 1].innerText.slice(0, 300) : "" };
        }, SEL.stop);
        if (s.n > before && !s.stopping && s.ready) {
          const b64 = await p.eval(async (idx) => {
            const im = [...document.querySelectorAll('img[alt^="Generated image"]')][idx];
            const blob = await (await fetch(im.src)).blob();
            return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(",")[1]); fr.readAsDataURL(blob); });
          }, s.n - 1);
          const buf = Buffer.from(b64 || "", "base64");
          if (buf.length < 5000) throw new Error("the saved image was empty");
          fs.writeFileSync(outFile, buf);
          return;
        }
        // ChatGPT answered in words and stopped (a refusal, a question or a usage limit): give up early.
        if (!s.stopping && s.n <= before && s.text) {
          if (s.text === lastText) { if (Date.now() - textSince > 20000) throw Object.assign(new Error(`ChatGPT replied without an image: "${s.text.slice(0, 160)}"`), { noRetry: true }); }
          else { lastText = s.text; textSince = Date.now(); }
        }
      }
      throw new Error("no image arrived within 4 minutes");
  }
  return api;
}

// ---------- the loop ----------
let lastSignInNote = 0;
export async function tick(studio) {
  const next = listQueued()[0];
  if (!next) return null;
  if (!DRY() && !(await studio.ready())) {
    if (Date.now() - lastSignInNote > 60000) { log(SIGN_IN_MSG); lastSignInNote = Date.now(); }
    return "waiting for sign-in";
  }
  return handleRequest(next, studio);
}

async function main() {
  log(`Image Studio worker started. Queue: ${Q()}${DRY() ? " (DRY RUN: no browser, the base image stands in for ChatGPT)" : ""}`);
  const n = resetStale();
  if (n) log(`${n} unfinished request(s) put back in the queue`);
  const studio = DRY() ? createDryStudio() : createStudio();
  if (!DRY()) {
    try {
      const ok = await studio.open();
      log(ok ? "ChatGPT is signed in. Waiting for requests from the app." : SIGN_IN_MSG);
      if (!ok) lastSignInNote = Date.now();
    } catch (e) { log(`Could not open the browser: ${e.message}`); }
  }
  // Heartbeat: the app shows "needs the Image Studio" unless this file was touched in the last 90 s.
  const beat = () => { try { fs.mkdirSync(Q(), { recursive: true }); fs.writeFileSync(path.join(Q(), "worker.heartbeat"), new Date().toISOString()); } catch { /* never stop the worker */ } };
  beat(); setInterval(beat, 30000).unref();
  let stop = false;
  process.on("SIGINT", async () => { stop = true; log("Stopping."); try { await studio.close?.(); } catch { /* ignore */ } process.exit(0); });
  // Several images at once (user, 2026-10-05: "all shoot parallely"): up to STUDIO_PARALLEL requests run side by side,
  // each in its own ChatGPT tab of the same signed-in browser. The product render still goes first: the other images
  // of a build are held in the queue until it has a result (listQueued, "after").
  const MAX = DRY() ? 1 : Math.max(1, Number(process.env.STUDIO_PARALLEL || 3));
  const tabs = [studio], busy = new Set(), taken = new Set();
  const slot = () => { for (let i = 0; i < MAX; i++) if (!busy.has(i)) return i; return -1; };
  while (!stop) {
    try {
      let i;
      while ((i = slot()) >= 0) {
        const next = listQueued().find((r) => !taken.has(r.id));
        if (!next) break;
        if (!tabs[i]) { tabs[i] = createStudio({ attachPort: () => studio.port }); try { await withTimeout(tabs[i].open(), 60000, "opening a ChatGPT tab"); } catch (e) { log(`could not open tab ${i + 1}: ${e.message}`); tabs[i] = null; break; } }
        if (!DRY() && !(await withTimeout(tabs[i].ready(), 45000, "checking the ChatGPT tab").catch(() => false))) { if (Date.now() - lastSignInNote > 60000) { log(SIGN_IN_MSG); lastSignInNote = Date.now(); } break; }
        busy.add(i); taken.add(next.id);
        handleRequest(next, tabs[i]).catch((e) => log(`[${next.id}] error: ${e.message}`)).finally(() => { busy.delete(i); });
        await sleep(1500); // stagger the tabs a little so the uploads don't collide
      }
    } catch (e) { log(`loop error (continuing): ${e.message}`); }
    await sleep(POLL_MS);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
