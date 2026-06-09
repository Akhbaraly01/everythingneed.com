#!/usr/bin/env node
/**
 * Module structure linter.
 *
 * Every module in src/modules/<name> MUST expose the canonical three-layer
 * folder convention so it maps 1:1 to a future Laravel Modules/<Name> package
 * and so sub-modules nest predictably.
 *
 *   <module>/
 *     index.ts                  ← public barrel (required)
 *     components/  pages/  services/  hooks/
 *     types/       validators/  store/   routes/
 *     api/         utils/
 *
 * Sub-modules (folders inside pages/ or components/ that contain an index.ts)
 * MUST repeat the same three-layer shape so nesting stays uniform.
 *
 * Exits non-zero on violation so CI fails.
 */
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const MODULES_DIR = "src/modules";
const REQUIRED_FOLDERS = [
  "components",
  "pages",
  "services",
  "hooks",
  "types",
  "validators",
  "store",
  "routes",
  "api",
  "utils",
];

const errors = [];

function isDir(p) {
  try { return statSync(p).isDirectory(); } catch { return false; }
}

function checkModule(modPath, label) {
  if (!existsSync(join(modPath, "index.ts"))) {
    errors.push(`${label}: missing public barrel index.ts`);
  }
  for (const folder of REQUIRED_FOLDERS) {
    if (!isDir(join(modPath, folder))) {
      errors.push(`${label}: missing required folder '${folder}/'`);
    }
  }
  // Sub-modules: nested dirs inside pages/ or components/ that themselves
  // declare an index.ts are treated as sub-modules and must follow the
  // same shape (recursive, one level deep is enough for the convention).
  for (const parent of ["pages", "components"]) {
    const parentPath = join(modPath, parent);
    if (!isDir(parentPath)) continue;
    for (const entry of readdirSync(parentPath)) {
      const sub = join(parentPath, entry);
      if (!isDir(sub)) continue;
      if (existsSync(join(sub, "index.ts"))) {
        checkModule(sub, `${label}/${parent}/${entry}`);
      }
    }
  }
}

for (const name of readdirSync(MODULES_DIR)) {
  const modPath = join(MODULES_DIR, name);
  if (!isDir(modPath)) continue;
  checkModule(modPath, `modules/${name}`);
}

if (errors.length) {
  console.error("✗ Module structure violations:\n");
  for (const e of errors) console.error("  - " + e);
  console.error(`\n${errors.length} violation(s). See scripts/check-module-structure.mjs.`);
  process.exit(1);
}
console.log("✓ All modules follow the three-layer convention.");
