import { existsSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, type Config } from "@playwright/test";
import base from "./playwright.config";

/**
 * LOCAL verification config only.
 * Uses whatever full-Chromium build already exists in ms-playwright cache
 * (this machine has build 1194 while @playwright/test@1.61 pins shell 1228
 * and this network stalls the download). CI uses playwright.config.ts as-is.
 */
const candidate = join(
  process.env.LOCALAPPDATA ?? "",
  "ms-playwright",
  "chromium-1194",
  "chrome-win",
  "chrome.exe",
);

const local: Config = {
  ...base,
  use: {
    ...base.use,
    headless: true,
    executablePath: existsSync(candidate) ? candidate : undefined,
    launchOptions: { args: ["--no-sandbox"] },
  },
};

export default defineConfig(local);
