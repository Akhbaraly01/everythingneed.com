# MASTER EXECUTION PLAN — EverythingNeed autonomous programme

**Source of truth:** this repo (`everythingneed-com/`). Stack: Laravel 13 + PHP,
Inertia.js v2 + React 18 + TypeScript, PostgreSQL (`everythingneed` dev /
`everythingneed_test` tests). Single app on `:8000`; no separate frontend.
**Do not** create greenfield projects, replace the framework, add a second
frontend/admin app, run `migrate:fresh` on shared DBs, or commit secrets.

**Live baseline (re-verify before trusting):** 36 backend modules
(`backend/Modules/*`), 269 Inertia pages (`backend/resources/js/pages`),
~891–969 routes, 27 roles / 184 permission grants, ~137 tables, UUID PKs.
Prior verification: ~1773 PHPUnit passed / 0 failed, vitest 47/47, tsc +
eslint + build green, Playwright green (chromium/mobile/tablet).

## Phase order (one phase at a time, gate each before advancing)

| Phase | Plan file | Focus |
|---|---|---|
| 00 Architecture foundation | `docs/implementation/PHASE_00_ARCHITECTURE.md` | Boundaries, DDD rules, enforcement, docs |
| 01 HOME | `docs/implementation/PHASE_01_HOME.md` | Discovery homepage + CMS control |
| 02 NEEDS | `docs/implementation/PHASE_02_NEEDS.md` | Request→offer→select lifecycle |
| 03 LEARN | `docs/implementation/PHASE_03_LEARN.md` | Feed + LMS + moderation |
| 04 HEALTHCARE | `docs/implementation/PHASE_04_HEALTHCARE.md` | Booking, records, labs, aid, privacy |
| 05 ACCOUNT | `docs/implementation/PHASE_05_ACCOUNT.md` | Identity, RBAC, workspaces |
| 06 Integration | `docs/implementation/PHASE_06_INTEGRATION.md` | Cross-module workflows |
| 07 Final verification | `docs/implementation/PHASE_07_FINAL_VERIFICATION.md` | Full gates + release readiness |

## TODO status values

`NOT IMPLEMENTED` · `AUDIT REQUIRED` · `PARTIALLY IMPLEMENTED` ·
`IN PROGRESS` · `IMPLEMENTED BUT RUNTIME-UNVERIFIED` ·
`IMPLEMENTED BUT NEEDS HARDENING` · `IMPLEMENTED AND VERIFIED` ·
`BLOCKED BY EXTERNAL DEPENDENCY`

## Standing rules (every TODO)

- Small, reversible, additive changes; preserve routes, migrations, permission
  identifiers, seed data, and integrations.
- Server-side authorization for every new capability; never frontend-only.
- Money/booking writes: transactions + row locks + idempotency + audit.
- Nothing marked verified without green tests + (where UI) browser evidence.
- Untracked test artifacts under `backend/storage/` are noise — never commit.
- `.env*` diffs must contain empty values only — never real secrets.
- Concurrent sessions may be editing this tree: before touching a file you did
  not change, `git diff` it and reconcile; never silently overwrite.
- External blockers (VAPID creds, live FX feed, Tailwind v4, Reverb cutover)
  are documented with cause, never faked green.

## Sibling evidence (read, don't trust blindly)

- `docs/implementation/MASTER_GAP_REGISTER.md` — wave-by-wave gap history.
- `docs/implementation/FINAL_IMPLEMENTATION_REPORT.md`,
  `FINAL_COMPLETION_REPORT.md` — prior completion claims (re-verify).
- `backend/SECURITY.md` — threat model, key rotation, incident checklist.
- `ARCHITECTURE.md` (repo root) — **STALE**: describes a legacy SPA layout
  (`src/modules`, barrels); the live layout is `backend/Modules/*` +
  `backend/Core/*` + `backend/resources/js/*`. See PHASE_00 for the
  authoritative map. Do not follow the stale file.
