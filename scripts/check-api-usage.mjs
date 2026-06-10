#!/usr/bin/env node
/**
 * Enforce the shared API layer:
 *   - No direct `@/integrations/supabase/client` imports in modules
 *     (must use `@core/api/supabaseGateway` or `@core/api/RequestBuilder`).
 *   - No bare `fetch(` / `axios` in modules (must use `http` from @core/api).
 *   - No imports from `@core/services/*` (modules use contracts + DI).
 *   - No inline `z.object(` in module form code (must use @shared/validators).
 *     Inline schemas are allowed only with `// allow-local-validator` on the
 *     line above.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "src/modules";
const ALLOW_LOCAL = "allow-local-validator";

const VIOLATIONS = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(name)) scan(p);
  }
}

function scan(file) {
  const src = readFileSync(file, "utf8");
  const lines = src.split("\n");
  const rel = relative(process.cwd(), file);

  const checks = [
    { re: /from\s+["']@\/integrations\/supabase\/client["']/, msg: "Use @core/api/supabaseGateway instead of direct supabase client." },
    { re: /from\s+["']@core\/services\/.+["']/, msg: "Modules must depend on @core/contracts, not @core/services/*. Use DI resolve()." },
    { re: /\bfetch\s*\(/, msg: "Use `http` from @core/api instead of bare fetch()." },
    { re: /from\s+["']axios["']/, msg: "Use `http` from @core/api instead of axios." },
  ];

  lines.forEach((line, i) => {
    for (const c of checks) {
      if (c.re.test(line)) VIOLATIONS.push({ file: rel, line: i + 1, msg: c.msg, src: line.trim() });
    }
    if (/z\.object\s*\(/.test(line)) {
      const prev = lines[i - 1] ?? "";
      if (!prev.includes(ALLOW_LOCAL)) {
        VIOLATIONS.push({
          file: rel,
          line: i + 1,
          msg: `Inline z.object() in modules is forbidden; use @shared/validators. Add // ${ALLOW_LOCAL} on the previous line to whitelist.`,
          src: line.trim(),
        });
      }
    }
  });
}

try {
  walk(ROOT);
} catch (e) {
  console.error(`[check-api-usage] cannot scan ${ROOT}:`, e.message);
  process.exit(1);
}

if (VIOLATIONS.length) {
  console.error(`\n❌ Architecture violations in ${ROOT}:\n`);
  for (const v of VIOLATIONS) {
    console.error(`  ${v.file}:${v.line}  ${v.msg}\n    > ${v.src}`);
  }
  console.error(`\n${VIOLATIONS.length} violation(s). Fix or whitelist.\n`);
  process.exit(1);
}

console.log(`✅ API/contracts/validators usage clean across ${ROOT}.`);
