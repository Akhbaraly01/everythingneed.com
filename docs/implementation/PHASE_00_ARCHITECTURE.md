# PHASE 00 — Architecture foundation (DDD hybrid modular monolith)

Status: **IN PROGRESS** (this file) → gate at the bottom.

## P00-01 — Recovered repository state — IMPLEMENTED AND VERIFIED

- Repo: single app `everythingneed-com/`, branch `main` ahead of origin;
  large uncommitted tree (prior hardening waves + a concurrent session's
  edits). Nothing committed by this phase without request.
- Live layout (verified 36 dirs under `backend/Modules/`, 13 under
  `backend/Core/`): modular monolith, **not** the stale `src/modules`
  barrel layout described in root `ARCHITECTURE.md` (marked stale in the
  master plan; do not follow it).
- Module anatomy (e.g. `Modules/Payments`): Actions, Database, DTOs,
  Entities, Events, Http, Listeners, Policies, Providers, Repositories,
  Routes, Services, Support. Frontend: `backend/resources/js/{pages,
  components,lib,layouts,hooks,config}`. Routes: `routes/*.php` + per-module
  `Routes/api.php`. Inertia pages served by `app/Http/Controllers/Web/*`.
- 31 `Core/Services/Contracts/*` interfaces, 24 bound in
  `app/Providers/AppServiceProvider.php`.

## P00-02 — Boundary audit — IMPLEMENTED AND VERIFIED

| Check | Enforcement | Result |
|---|---|---|
| Table ownership per module | `tests/Feature/Architecture/ModularMonolithTest.php` (OWNERSHIP map) | suite green |
| Cross-module class refs ratchet | `tests/Feature/Architecture/ModuleDependencyTest.php` (38-file grandfather allowlist, only shrinks) | suite green |
| No route closures in modules | `ModularMonolithTest` second case | suite green |
| No BaaS SDKs / dead image hosts | `FrontendPolicyTest.php`, `NoDeadImageHostsTest.php`, eslint tripwire | suite green |
| Throttle coverage audit | `backend/scripts/scan-throttle-gaps.php` + `MutatingRateLimit` group middleware | 281 mutating routes covered |
| Dependency map regeneration | `backend/scripts/scan-module-deps.php --allowlist` | runnable |

Known coupling (grandfathered, load-bearing): money/booking write paths
(`ChargePayment`↔Orders entities with row locks, `PlaceProductOrder`↔
Products/Checkout, Pharmacy↔Orders) and read fan-out (`BlockResolver`,
admin consoles). Migration pattern established: Core contract + module-owned
implementation (example: `LearnCatalogInterface` + `LearnCatalogService`,
consumed by `CourseRatingAggregator`). Next candidates live in the
allowlist; migrate one by one, never in bulk.

## P00-03 — Communication model — IMPLEMENTED AND VERIFIED

- **Synchronous, in-process**: direct calls for immediate results; money
  paths stay transactional (`DB::transaction` + `lockForUpdate` +
  idempotency keys, 23505→422 mapping).
- **Domain events**: 9 mappings in `app/Providers/EventServiceProvider.php`;
  money events HMAC-signed at dispatch (`SignsDispatch`), listeners verify
  (`VerifiesEvents`, `event.rejected` audit on forgery/replay). Broadcast
  payloads carry IDs only; no Echo client consumes bodies (polling live).
- **Async/queue**: `sync` driver locally (jobs run inline); DB driver in
  prod config. No exactly-once assumption: handlers tolerate retries.
- **Outbound**: payment gateways behind `PaymentGatewayInterface`
  (mock blocked in prod), HMAC-verified webhooks with replay windows, AI
  behind server-side proxy (keys never reach the browser).
- **Audit**: global mutating-request middleware → `audit_logs` + file;
  hash-chained (`audit:verify-chain` daily).

## P00-04 — Data rules — IMPLEMENTED AND VERIFIED

- PostgreSQL everywhere, UUID PKs (v7 time-ordered for new rows),
  soft deletes where meaningful; no `migrate:fresh` on shared DBs.
- Money in `decimal`, server-computed totals only; PII encrypted at rest
  (TOTP/KYC/payment payloads, APP_KEY custody, `security:encrypt-pii` +
  rotation runbook in `backend/SECURITY.md`).
- Uploads namespaced per-uploader scope, GD-capped, MIME-allowlisted;
  evidence URLs validated against own scope before persistence.

## P00-05 — Docs & decisions recorded — IN PROGRESS

- `docs/implementation/MASTER_EXECUTION_PLAN.md` (new, this programme).
- This file (new). Sibling evidence retained: `MASTER_GAP_REGISTER.md`,
  `FINAL_IMPLEMENTATION_REPORT.md`, `FINAL_COMPLETION_REPORT.md`,
  `backend/SECURITY.md`.
- `backend/scripts/` scanners retained as tooling (not shipped code).

## Acceptance gate (all must hold before HOME)

- [x] Architecture documented here (actual, verified layout).
- [x] Boundaries mapped (ownership + 38-file dependency allowlist).
- [x] Violations prioritized (allowlist = the priority queue; stale entries fail the test).
- [x] Frontend + route strategy understood (single Inertia app, module `Routes/api.php`, Web controllers).
- [x] Migration plan exists (contract-first, one coupling at a time).
- [x] Enforcement tests present and green (see verification below).
- [ ] Final gate run now (boundary tests + secrets scan + config audit).

## Verification (this phase)

- `php artisan test --filter="ModularMonolithTest|ModuleDependencyTest|FrontendPolicyTest|NoDeadImageHostsTest"` → **6 passed** (ownership, 38-file dependency ratchet, route closures, BaaS tripwire, dead hosts).
- Secrets scan: `.env*` diffs add empty values only (`DB_SSLMODE=require` is a non-secret constant); no live secret material in tracked code.
- No migrations, no routes, no behavior changed by PHASE 00 itself (docs + verification only).

**PHASE 00 GATE: CLOSED.** Proceeding to PHASE 01 HOME.
