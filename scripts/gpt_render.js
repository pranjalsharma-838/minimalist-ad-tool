// Image studio runner for the user's own web ChatGPT (Playwright MCP: browser_run_code_unsafe with filename=this file).
// User decision 2026-10-05: ChatGPT re-renders the real pack photo; Claude reads every label word and runs
// scripts/verify_pack.py, re-prompting with exact fixes for at most 3 rounds.
// Jobs come from http://127.0.0.1:8765/ai_renders/jobs.json (serve brand_packs/minimalist/assets with
// `python -m http.server 8765 --bind 127.0.0.1`), so no prompt text passes through the tool call:
//   [{ "h": "<handle>", "image": "<abs path of the photo to attach>", "prompt": "...", "out": "<abs path to save>" }]
// Each job runs in a fresh chat; jobs whose "out" already exists are skipped. Returns a short status per job.
async (shared) => {
  // Its own tab: other tasks driving the same browser can't navigate it away mid-job.
  const page = await shared.context().newPage();
  const jobs = await (await page.request.get("http://127.0.0.1:8765/ai_renders/jobs.json")).json();
  const results = [];
  for (const j of jobs) {
    // Outputs under the served assets folder can be checked for "already done"; queue outputs (image_requests/) can't.
    const rel = j.out.split("assets\\")[1];
    const exists = rel ? (await page.request.get(`http://127.0.0.1:8765/${rel.replace(/\\/g, "/")}`)).ok() : false;
    if (exists) { results.push({ h: j.h, skipped: "exists" }); continue; }
    await page.goto("https://chatgpt.com/");
    await page.waitForSelector('button[aria-label="Add files and more"]:not([disabled])', { timeout: 40000 });
    await page.waitForTimeout(1500);
    for (let i = 0; i < 3; i++) await page.keyboard.press("Escape");
    // Scene and frame jobs are text-only; only pack-based jobs attach a photo.
    if (j.image) { await page.locator('input[type="file"]').nth(0).setInputFiles(j.image); await page.waitForTimeout(4000); }
    const box = page.getByRole("textbox").first();
    await box.click();
    await box.fill(j.prompt);
    // The send button stays disabled while the photo uploads; its label has varied between UI versions.
    const send = page.locator('button[data-testid="send-button"]:not([disabled]), #composer-submit-button:not([disabled]), button[aria-label*="Send" i]:not([disabled])').first();
    let sent = false;
    for (let i = 0; i < 30 && !sent; i++) {
      if (await send.count()) { await send.click(); sent = true; } else await page.waitForTimeout(2000);
    }
    if (!sent) { results.push({ h: j.h, failed: "send button never enabled" }); continue; }
    let saved = false;
    for (let i = 0; i < 48 && !saved; i++) {
      await page.waitForTimeout(5000);
      const imgs = page.locator('img[alt^="Generated image"]');
      const c = await imgs.count();
      if (c && !(await page.locator('button[data-testid="stop-button"]').count())) {
        const last = imgs.nth(c - 1);
        if (await last.evaluate((im) => im.complete && im.naturalWidth > 400)) {
          const [dl] = await Promise.all([
            page.waitForEvent("download", { timeout: 30000 }),
            last.evaluate(async (im) => { const b = await (await fetch(im.src)).blob(); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "r.png"; document.body.appendChild(a); a.click(); }),
          ]);
          await dl.saveAs(j.out);
          saved = true;
          results.push({ h: j.h, saved: j.out.split("\\").slice(-2).join("/"), chat: page.url() });
        }
      }
    }
    if (!saved) results.push({ h: j.h, failed: (await page.locator('[data-message-author-role="assistant"]').last().innerText().catch(() => "")).slice(0, 160) });
  }
  await page.close();
  return results;
}
