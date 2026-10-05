// Loaded before every test file (package.json "test"): image requests made by the tests go to a throwaway queue,
// never the real image_requests/ folder the ChatGPT worker reads (they piled up there by the hundred, 2026-10-05).
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
if (!process.env.STUDIO_QUEUE_DIR) process.env.STUDIO_QUEUE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "studio-queue-test-"));
