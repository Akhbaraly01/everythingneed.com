#!/usr/bin/env node
/**
 * CI coverage-threshold gate for the Playwright E2E suite.
 *
 * Reads `playwright-report/results.json` (produced by the JSON reporter)
 * and asserts:
 *   - zero failed/timedOut/interrupted tests
 *   - at least MIN_TESTS executed (guards against routing regressions where
 *     specs accidentally get skipped or filtered out).
 *
 * Tune MIN_TESTS as the suite grows.
 */
import { readFileSync, existsSync } from "node:fs";

const REPORT = "playwright-report/results.json";
const MIN_TESTS = Number(process.env.E2E_MIN_TESTS ?? 5);

if (!existsSync(REPORT)) {
  console.error(`✗ ${REPORT} not found — did Playwright run with the JSON reporter?`);
  process.exit(1);
}

const data = JSON.parse(readFileSync(REPORT, "utf8"));

let total = 0;
let failed = 0;
const fails = [];

function walk(suite) {
  for (const s of suite.suites ?? []) walk(s);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      total++;
      const last = t.results?.[t.results.length - 1];
      const status = last?.status;
      if (status === "failed" || status === "timedOut" || status === "interrupted") {
        failed++;
        fails.push(`${spec.title} [${t.projectName ?? "?"}] → ${status}`);
      }
    }
  }
}
for (const s of data.suites ?? []) walk(s);

if (failed > 0) {
  console.error(`✗ ${failed}/${total} E2E tests failed:`);
  for (const f of fails) console.error("  - " + f);
  process.exit(1);
}
if (total < MIN_TESTS) {
  console.error(`✗ Only ${total} E2E tests ran; threshold is ${MIN_TESTS}.`);
  process.exit(1);
}
console.log(`✓ E2E gate passed (${total} tests, 0 failures, threshold ${MIN_TESTS}).`);
