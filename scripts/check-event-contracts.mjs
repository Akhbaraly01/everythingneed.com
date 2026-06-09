#!/usr/bin/env node
/**
 * Pre-build contract validator.
 *
 * 1. Asserts every key in `DomainEventMap` (EventBus.ts) has a matching zod
 *    schema in `schemas.ts` and vice-versa.
 * 2. Asserts `src/shared/index.ts` re-exports both ui + utils (the public
 *    cross-module contract surface).
 *
 * Run via `node scripts/check-event-contracts.mjs`. Exits non-zero on drift
 * so CI / pre-build hooks block bad commits.
 */
import { readFileSync } from "node:fs";

const EVENTS_FILE = "src/core/events/EventBus.ts";
const SCHEMAS_FILE = "src/core/events/schemas.ts";
const SHARED_INDEX = "src/shared/index.ts";

const errors = [];

const eventsSrc = readFileSync(EVENTS_FILE, "utf8");
const schemasSrc = readFileSync(SCHEMAS_FILE, "utf8");

// Extract DomainEventMap keys: lines like "  EventName: { ... }" within the
// interface block. Ignore the index signature line `[key: string]: unknown;`.
const mapBlockMatch = eventsSrc.match(
  /export interface DomainEventMap\s*{([\s\S]*?)\n}/
);
if (!mapBlockMatch) {
  console.error(`✗ Could not find DomainEventMap interface in ${EVENTS_FILE}`);
  process.exit(1);
}
const mapKeys = new Set(
  [...mapBlockMatch[1].matchAll(/^\s{2}(\w+)\s*:/gm)].map((m) => m[1]),
);

// Extract zod schema keys from the `domainEventSchemas = { ... }` object.
const schemaBlockMatch = schemasSrc.match(
  /domainEventSchemas\s*=\s*{([\s\S]*?)\n}\s*as const;/,
);
if (!schemaBlockMatch) {
  console.error(`✗ Could not find domainEventSchemas in ${SCHEMAS_FILE}`);
  process.exit(1);
}
const schemaKeys = new Set(
  [...schemaBlockMatch[1].matchAll(/^\s{2}(\w+)\s*:/gm)].map((m) => m[1]),
);

for (const k of mapKeys) {
  if (!schemaKeys.has(k)) {
    errors.push(`Missing zod schema for event '${k}' in ${SCHEMAS_FILE}`);
  }
}
for (const k of schemaKeys) {
  if (!mapKeys.has(k)) {
    errors.push(`Schema '${k}' in ${SCHEMAS_FILE} has no TS counterpart in ${EVENTS_FILE}`);
  }
}

// Shared barrel contract surface.
const sharedSrc = readFileSync(SHARED_INDEX, "utf8");
for (const required of ["./ui", "./utils"]) {
  if (!sharedSrc.includes(`from "${required}"`)) {
    errors.push(`${SHARED_INDEX} must re-export ${required}`);
  }
}

if (errors.length) {
  console.error("✗ Cross-module contract drift detected:\n");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(
  `✓ Contracts aligned (${mapKeys.size} events, schemas match, shared barrel OK).`,
);
