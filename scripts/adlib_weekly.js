// Weekly "Trending now" refresh. User, 2026-10-04: "the live check runs in a browser by hand. It should run weekly."
// Runs unattended (Windows Task Scheduler: scripts/schedule_weekly.ps1), or by hand.
//   1. Opens each competitor's active-ads list in the Meta Ad Library (India) in a hidden browser with a throwaway
//      profile (lib/cdp.js: no login, nothing to install). Competitors = the pages in research/competitor_ads/.
//      Statics only: video cards are skipped (user rule 2026-10-04).
//   2. Still running? Every captured static that started inside the trend window is marked active or inactive. One
//      missing from its brand's list (Meta groups versions under one card) is opened on its own page first.
//   3. New launches: statics started inside the window that aren't captured yet are saved (text + image) to
//      research/competitor_ads_weekly.json. With a Claude key they're sorted into the 48 formats
//      (prompts/trend_tagger.md); without one they're listed as untagged for a person to sort.
//   4. Writes research/competitor_status_<date>.json, rebuilds research/trending.json (scripts/build_trending.js) and
//      writes research/adlib_weekly/<date>.md: what changed since the last check, and any trending format the ad
//      library hasn't recreated yet (recreating one is a pipeline run: RUNBOOK step 0b).
// Usage: node scripts/adlib_weekly.js [--brands "Foxtale,Plum"] [--no-tag]
// Env: TREND_DAYS (default 60), TAG_MODEL (default claude-sonnet-5-5), BROWSER.
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { launch, sleep } from "../lib/cdp.js";
import { structuredCall, loadPrompt, llmAvailable } from "../lib/llm.js";

const DAYS = Number(process.env.TREND_DAYS || 60);
const TAG_MODEL = process.env.TAG_MODEL || "claude-sonnet-5-5";
const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const ONLY = (arg("--brands") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const NO_TAG = process.argv.includes("--no-tag");

const pad = (n) => String(n).padStart(2, "0");
const isoLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = isoLocal(new Date());
const daysAgo = (iso) => Math.round((new Date(`${TODAY}T00:00:00`) - new Date(`${iso}T00:00:00`)) / 864e5);
// "Sep 11, 2026" or "11 Sep 2026" -> "2026-09-11" (local date, so IST doesn't shift it a day).
const toIso = (s) => { const d = new Date(String(s || "").replace(/^(\d{1,2}) (\w{3}) (\d{4})$/, "$2 $1, $3")); return isNaN(d) ? "" : isoLocal(d); };
const readJson = (f, dflt) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8").replace(/^\uFEFF/, "")) : dflt);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ---- what we already have ----
const original = fs.readdirSync("research/competitor_ads").filter((f) => f.endsWith(".json")).flatMap((f) => readJson(`research/competitor_ads/${f}`, []));
const WEEKLY_FILE = "research/competitor_ads_weekly.json";
const weekly = readJson(WEEKLY_FILE, []);
const known = new Map([...original, ...weekly].map((a) => [String(a.id), a]));
const brands = [...new Map(original.map((a) => [a.page_id, a.brand])).entries()]
  .map(([page_id, brand]) => ({ page_id, brand }))
  .filter((b) => !ONLY.length || ONLY.some((o) => b.brand.toLowerCase().includes(o)));
const inWindow = (a) => a.format !== "video" && a.started_running && daysAgo(a.started_running) <= DAYS;
// The last check before this one (scripted or by hand), to report what changed.
const prevStatusFile = fs.readdirSync("research").filter((f) => /^competitor_status_\d{4}-\d{2}-\d{2}(_manual)?\.json$/.test(f) && f !== `competitor_status_${TODAY}.json`).sort().pop();
const prevStatus = new Map((readJson(prevStatusFile ? `research/${prevStatusFile}` : "", { ads: [] }).ads || []).map((s) => [String(s.id), s]));
const prevTrending = readJson("research/trending.json", { trends: [] });

// ---- browser helpers (run inside the page) ----
function readCards() {
  const idNodes = [...document.querySelectorAll("span, div")].filter((e) => e.childElementCount === 0 && /^Library ID: \d+$/.test(e.textContent.trim()));
  const out = [], seen = new Set();
  for (const n of idNodes) {
    const id = n.textContent.match(/\d+/)[0];
    if (seen.has(id)) continue;
    // Climb to the largest box that still holds exactly one ad.
    let c = n;
    while (c.parentElement && (c.parentElement.innerText || "").match(/Library ID: \d+/g)?.length === 1) c = c.parentElement;
    seen.add(id);
    const txt = c.innerText || "";
    const sm = txt.match(/Started running on (\d{1,2} \w{3} \d{4}|\w{3} \d{1,2}, \d{4})/);
    const imgs = [...new Set([...c.querySelectorAll("img")].filter((im) => /scontent|fbcdn/.test(im.src) && (im.naturalWidth || im.width) >= 200).map((im) => im.src))];
    const lines = txt.split("\n").map((l) => l.trim()).filter((l) => l && l !== "​" && !/^(Library ID|Started running|Platforms|See ad details|See summary details|Active|Inactive|Sponsored|Open Dropdown|See more|This ad has multiple versions|\d+ ads? use this creative|0:00)/.test(l));
    out.push({ id, started: sm ? sm[1] : "", status: /(^|\n)Inactive(\n|$)/.test(txt) ? "inactive" : /(^|\n)Active(\n|$)/.test(txt) ? "active" : "unknown", video: Boolean(c.querySelector("video")), imgs, lines: lines.slice(0, 14) });
  }
  return out;
}

function readOneAd(id) {
  const lines = (document.body.innerText || "").split("\n").map((l) => l.trim()).filter((l) => l && l !== "​");
  const i = lines.indexOf(`Library ID: ${id}`);
  if (i < 0) return null;
  const status = lines[i - 1] === "Active" ? "active" : lines[i - 1] === "Inactive" ? "inactive" : "unknown";
  const sm = (lines[i + 1] || "").match(/Started running on (.+)$/);
  const range = (lines[i + 1] || "").match(/^(.+?) - (.+)$/);
  return { status, started: sm ? sm[1] : range ? range[1] : "", stopped: range ? range[2] : "" };
}

async function brandList(page, b) {
  const url = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=IN&is_targeted_country=false&media_type=all&search_type=page&view_all_page_id=${b.page_id}`;
  await page.goto(url);
  const ok = await page.waitFor(() => /Library ID: \d+|No ads match/.test(document.body?.innerText || ""), { timeout: 45000 });
  if (!ok) throw new Error("the ad list did not load (login wall, block or timeout)");
  let last = -1, same = 0;
  for (let i = 0; i < 30 && same < 3; i++) {
    await page.eval(() => window.scrollTo(0, document.scrollingElement.scrollHeight));
    await sleep(2000);
    const n = await page.eval(() => (document.body.innerText.match(/Library ID: \d+/g) || []).length);
    if (n === last) same++; else { same = 0; last = n; }
  }
  return page.eval(readCards);
}

async function oneAd(page, id) {
  await page.goto(`https://www.facebook.com/ads/library/?id=${id}`);
  await page.waitFor(`(document.body?.innerText || "").includes("Library ID: ${id}")`, { timeout: 30000 });
  return page.eval(readOneAd, id);
}

async function saveImage(page, src, file) {
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch {
    // Fall back to the page's own copy (same image, already loaded there), with its own 20-second limit.
    const b64 = await page.eval(async (u) => { const r = await fetch(u, { signal: AbortSignal.timeout(20000) }); const buf = new Uint8Array(await r.arrayBuffer()); let s = ""; for (const x of buf) s += String.fromCharCode(x); return btoa(s); }, src).catch(() => null);
    if (!b64) return false;
    fs.writeFileSync(file, Buffer.from(b64, "base64"));
    return true;
  }
}

const TEMPLATES = readJson("config/templates.json", { templates: [] }).templates;
const TAG_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["is_static_skincare_ad", "template_id", "secondary_template_ids", "one_line"],
  properties: {
    is_static_skincare_ad: { type: "boolean" },
    template_id: { type: "integer", enum: TEMPLATES.map((t) => t.id) },
    secondary_template_ids: { type: "array", items: { type: "integer", enum: TEMPLATES.map((t) => t.id) } },
    one_line: { type: "string" },
  },
};
async function tag(ad) {
  const system = loadPrompt("trend_tagger.md", { TEMPLATES: TEMPLATES.map((t) => `${t.id}: ${t.name} (${t.family})`).join("\n") });
  const user = [
    { type: "image", source: { type: "base64", media_type: "image/jpeg", data: fs.readFileSync(ad.image_file).toString("base64") } },
    { type: "text", text: `Brand: ${ad.brand}\nCaptured text from the Ad Library card:\n${ad.text_lines.join("\n")}` },
  ];
  const { data, model } = await structuredCall({ system, user, schema: TAG_SCHEMA, effort: "low", maxTokens: 2000, model: TAG_MODEL });
  return { ...data, secondary_template_ids: (data.secondary_template_ids || []).filter((x) => x !== data.template_id).slice(0, 2), tagged_by: model };
}

// ---- run ----
fs.mkdirSync("research/adlib_weekly", { recursive: true });
fs.mkdirSync("research/competitor_ads/images", { recursive: true });
const report = { run: TODAY, started_at: new Date().toISOString(), window_days: DAYS, brands: [], status_changes: [], new_ads: [], errors: [] };
const statusById = new Map();
// Unattended safety net: the whole run gets MAX_MINUTES (default 25); past that it stops and exits with an error.
const MAX_MINUTES = Number(process.env.MAX_MINUTES || 25);
setTimeout(() => { console.error(`Stopped: the run took longer than ${MAX_MINUTES} minutes.`); process.exit(1); }, MAX_MINUTES * 60000).unref();
let page = await launch();
// A dropped browser connection costs one brand (or one ad), not the run: start a fresh browser and carry on.
const fresh = async () => { if (!page.alive) { log("browser connection lost; starting a fresh browser"); await page.close(); page = await launch(); } return page; };
try {
  for (const b of brands) {
    await fresh();
    const row = { brand: b.brand, page_id: b.page_id, ok: false, cards: 0, statics: 0, videos: 0, new_statics: 0 };
    try {
      const cards = await brandList(page, b);
      Object.assign(row, { ok: true, cards: cards.length, videos: cards.filter((c) => c.video).length, statics: cards.filter((c) => !c.video && c.imgs.length).length });
      for (const c of cards) {
        const started = toIso(c.started);
        if (known.has(c.id)) { statusById.set(c.id, { id: c.id, status: "active", started: c.started, how: "in the brand's active list" }); continue; }
        if (c.video || !c.imgs.length || !started || daysAgo(started) > DAYS) continue;
        // A new static launched inside the window.
        const files = [];
        for (const [k, src] of c.imgs.slice(0, 5).entries()) {
          const f = `research/competitor_ads/images/${c.id}${k ? `_${k + 1}` : ""}.jpg`;
          if (await saveImage(page, src, f)) files.push(f);
        }
        if (!files.length) { report.errors.push(`${b.brand} ${c.id}: image could not be saved; skipped`); continue; }
        const ad = { id: c.id, brand: b.brand, page_id: b.page_id, ad_library_url: `https://www.facebook.com/ads/library/?id=${c.id}`, started_running: started, format: c.imgs.length > 1 ? "carousel" : "image", text_lines: c.lines, image_file: files[0], image_files: files, captured: TODAY, source: "scripts/adlib_weekly.js", template_id: null, secondary_template_ids: [], one_line: "", tagged_by: null };
        weekly.push(ad);
        known.set(c.id, ad);
        statusById.set(c.id, { id: c.id, status: "active", started: c.started, how: "in the brand's active list (new)" });
        report.new_ads.push(c.id);
        row.new_statics++;
      }
    } catch (e) {
      row.error = e.message;
      report.errors.push(`${b.brand}: ${e.message}`);
    }
    report.brands.push(row);
    log(`${b.brand}: ${row.ok ? `${row.cards} ads (${row.statics} statics, ${row.videos} videos), ${row.new_statics} new statics` : `FAILED: ${row.error}`}`);
    await sleep(2500);
  }

  // Captured statics inside the window that weren't in their brand's list: open each one's own page.
  const okBrands = new Set(report.brands.filter((r) => r.ok).map((r) => r.page_id));
  for (const a of [...known.values()].filter(inWindow)) {
    const id = String(a.id);
    if (statusById.has(id)) continue;
    if (!okBrands.has(a.page_id)) {
      const prev = prevStatus.get(id);
      statusById.set(id, { id, status: prev?.status || "unknown", started: prev?.started || "", how: `not checked (brand list failed); carried from ${prevStatusFile || "nothing"}` });
      continue;
    }
    try {
      await fresh();
      const r = await oneAd(page, id);
      statusById.set(id, { id, status: r?.status || "unknown", started: r?.started || "", stopped: r?.stopped || undefined, how: "own Ad Library page" });
    } catch (e) {
      statusById.set(id, { id, status: "unknown", started: "", how: `own page failed: ${e.message}` });
    }
    await sleep(2000);
  }
} finally {
  await page.close();
}

for (const [id, s] of statusById) {
  const before = prevStatus.get(id)?.status;
  if (before && before !== s.status) report.status_changes.push({ id, brand: known.get(id)?.brand, from: before, to: s.status });
}

// Sort the new statics into formats (needs a Claude key; otherwise they wait for a person).
const untagged = weekly.filter((a) => a.template_id == null && a.is_static_skincare_ad !== false && daysAgo(a.started_running) <= DAYS);
if (untagged.length && llmAvailable() && !NO_TAG) {
  for (const a of untagged) {
    try { Object.assign(a, await tag(a)); } catch (e) { report.errors.push(`tagging ${a.id}: ${e.message}`); }
  }
}
fs.writeFileSync(WEEKLY_FILE, JSON.stringify(weekly, null, 2));

const okCount = report.brands.filter((r) => r.ok).length;
const statusOut = {
  checked: TODAY,
  method: "Scripted, unattended (scripts/adlib_weekly.js): headless Edge with a throwaway profile reads each competitor's active-ads list in the Meta Ad Library (India); an ad missing from its brand's list is opened on its own page.",
  brands: report.brands,
  ads: [...statusById.values()],
};
fs.writeFileSync(`research/competitor_status_${TODAY}.json`, JSON.stringify(statusOut, null, 2));
execFileSync(process.execPath, ["scripts/build_trending.js"], { stdio: "inherit" });
// The gallery's "Trending now" section reads trending.json when it's built, so rebuild it too.
try { execFileSync(process.execPath, ["scripts/make_library_gallery.js"], { stdio: "inherit" }); } catch (e) { report.errors.push(`gallery rebuild: ${e.message}`); }

// ---- weekly report ----
const nowTrending = readJson("research/trending.json", { trends: [] });
const ids = (t) => new Set(t.trends.map((x) => x.template_id));
const before = ids(prevTrending), after = ids(nowTrending);
const recreated = new Set(fs.readdirSync("pipeline/runs").filter((r) => /trending/.test(r)).flatMap((r) => readJson(`pipeline/runs/${r}/match.json`, []).map((m) => m.template_id)));
const name = (id) => TEMPLATES.find((t) => t.id === id)?.name || `#${id}`;
const stillUntagged = weekly.filter((a) => a.template_id == null && a.is_static_skincare_ad !== false && daysAgo(a.started_running) <= DAYS);
const windowed = [...statusById.values()].filter((s) => known.has(s.id) && inWindow(known.get(s.id)));
const md = [
  `# Weekly Ad Library check, ${TODAY}`,
  "",
  okCount === brands.length ? `All ${brands.length} competitor pages checked.` : `**${brands.length - okCount} of ${brands.length} competitor pages could not be checked** (${report.errors.filter((e) => !/^tagging/.test(e)).join("; ")}). Their ads keep last week's status.`,
  "",
  `- Competitor statics started in the last ${DAYS} days: ${windowed.length}; still running: ${windowed.filter((s) => s.status === "active").length}${windowed.some((s) => s.status === "unknown") ? `; status unknown: ${windowed.filter((s) => s.status === "unknown").length}` : ""}.`,
  `- Stopped since the last check${prevStatusFile ? ` (${prevStatusFile})` : ""}: ${report.status_changes.filter((c) => c.to === "inactive").map((c) => `${c.brand} ${c.id}`).join(", ") || "none"}.`,
  `- New statics found this week: ${report.new_ads.length}${report.new_ads.length ? ` (${report.brands.filter((r) => r.new_statics).map((r) => `${r.brand} ${r.new_statics}`).join(", ")})` : ""}.`,
  stillUntagged.length ? `- **${stillUntagged.length} new statics are not sorted into a format yet** (${llmAvailable() ? "tagging failed, see errors" : "no Claude key in .env"}). They don't count toward trends until they are: add a key and re-run, or set \`template_id\` in \`${WEEKLY_FILE}\` by hand.` : "- Every new static is sorted into a format.",
  "",
  "## Trending formats",
  "",
  `Now ${after.size}: ${nowTrending.trends.map((t) => `#${t.template_id} ${t.name} (${t.brands.length} brands)`).join("; ") || "none"}.`,
  `- New this week: ${[...after].filter((x) => !before.has(x)).map((x) => `#${x} ${name(x)}`).join(", ") || "none"}.`,
  `- Dropped this week: ${[...before].filter((x) => !after.has(x)).map((x) => `#${x} ${name(x)}`).join(", ") || "none"}.`,
  `- **Not recreated in the ad library yet:** ${[...after].filter((x) => !recreated.has(x)).map((x) => `#${x} ${name(x)}`).join(", ") || "none"}${[...after].some((x) => !recreated.has(x)) ? " (RUNBOOK step 0b makes the Minimalist versions)" : ""}.`,
  "",
  report.errors.length ? `## Errors\n\n${report.errors.map((e) => `- ${e}`).join("\n")}\n` : "",
  `Details: \`research/competitor_status_${TODAY}.json\`, \`research/trending.md\`, \`${WEEKLY_FILE}\`.`,
].join("\n");
report.finished_at = new Date().toISOString();
fs.writeFileSync(`research/adlib_weekly/${TODAY}.md`, md + "\n");
fs.writeFileSync(`research/adlib_weekly/${TODAY}.json`, JSON.stringify(report, null, 2));
log(`report: research/adlib_weekly/${TODAY}.md`);
process.exit(okCount ? 0 : 1);
