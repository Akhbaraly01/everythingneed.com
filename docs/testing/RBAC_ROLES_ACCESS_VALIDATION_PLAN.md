# RBAC Roles & Permissions — Validation Plan & Execution Record

**Scope:** redesigned `/admin/rbac` console page, RBAC API endpoints (bulk grants, custom role CRUD, role reset), `RoleRegistry`, and permission-aware workspace/nav parity.
**Status:** PASS — all layers green (final runs executed on an isolated test database).
**Date:** 2026-10-19.

---

## 1. Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC1 | `/admin/rbac` renders stats, the full 40-role roster, and the ~214-permission catalog with Core badges and permission chips. |
| AC2 | Grant / revoke round-trips persist through the API (bulk in one transaction) and are reversible from the page. |
| AC3 | Custom roles can be created with picked permissions, assigned to users, and deleted only when unassigned (409 while held). |
| AC4 | Revocation applies immediately: caches flushed on write, nav links disappear, gated pages return 403 on the next request. |
| AC5 | Least privilege holds: grants are downhill-only, super-admin guards (last super admin, self-demote) are intact. |
| AC6 | Restricted users see and open only what their permissions allow — server middleware, console nav, and `WorkspaceResolver` hrefs agree. |
| AC7 | UI composition matches the reference layout (stats strip, card grid, grant box) in light/dark and at 375/834/1280 px. |
| AC8 | No regressions elsewhere in the backend suite caused by the RBAC work. |

**Documented scope decision (updated 2026-10-20):** permissions are now the single authority for the admin surface. Every `/admin/*` page and admin API route uses `permission:` middleware, and `AdminPolicy` delegates to `User::hasPermission()` (only `viewDashboard` keeps a role list). `role:super_admin` remains on `/admin/rbac` and the RBAC write APIs. Custom roles are therefore enforced everywhere; revocation removes nav, page and API together. Core roles (`super_admin`, `administrator`, `user`) cannot be deleted/reset.

---

## 2. Test Layers

| Layer | Command | Scope |
|-------|---------|-------|
| E2E | `npx playwright test e2e/admin-rbac.spec.ts --project=chromium` | Real browser flows against the running app (`127.0.0.1:8000`, reused dev server). |
| Unit (frontend) | `npm run test:unit` | `lib/rbac.ts` helpers + 11 existing suites. |
| Feature (backend) | `php artisan test <files>` | RBAC endpoints, middleware semantics, nav/API parity, workspace resolver, escalation guards. |

---

## 3. Environment Isolation (critical)

`everythingneed_test` is **shared** on this machine (concurrent agent/external test runs; `everythingneed_test2` also exists). Two `php artisan test` processes against it cause PostgreSQL DDL races (`42P07 duplicate table`, `42P01 undefined table`) that masquerade as feature failures. On Windows, killed bash commands leave orphaned `php.exe`/phpunit children still holding locks (observed: 89-minute lock waits, impossible test durations).

All final verification therefore ran against a dedicated database:

```powershell
# one-time
psql -U postgres -c "CREATE DATABASE everythingneed_test_rbac"

# every run (shell env wins over phpunit.xml <env> because force=false)
$env:DB_DATABASE='everythingneed_test_rbac'
php artisan test <paths>
```

Orphan cleanup after any killed/timed-out run:

```powershell
Get-CimInstance Win32_Process -Filter "Name='php.exe'" |
  Where-Object { $_.CommandLine -match 'phpunit' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

Never run two suites in parallel. Never touch dev servers (`php -S 127.0.0.1:8000`, other projects' `artisan serve`).

---

## 4. Execution Results

### 4.1 E2E — 4 passed (~3.8 min)

| Test | Covers |
|------|--------|
| Stats, badges and permission grid render | AC1, AC7 |
| Manage sheet saves bulk permission changes; persists after reload | AC2 |
| Create custom role, then delete it | AC3 |
| Layouts at 375 / 834 / 1280 px (light + dark) | AC7 |

### 4.2 Frontend unit — 82 passed / 12 files

Includes `rbac.test.ts` (12 tests): name→slug normalization (incl. leading-digit strips), OR/AND/wildcard permission matching parity with the server, denied-state helpers.

### 4.3 Backend — consolidated RBAC-critical run

17 files, **169 passed (1,895 assertions)**, 734.63 s, isolated DB:

- `RbacBulkUpdateTest` (5) — immediate apply, atomic rollback, unknown role, super-admin-only, custom roles.
- `RbacRoleResetTest` (4) — defaults restored, super admin full catalog, custom/unknown rejected, guard.
- `CustomRoleLifecycleTest` (8) — create/assign/delete lifecycle, 409 while held, reserved/duplicate slugs, roles merge, guard.
- `RbacMatrixTest` (6) — implicit super admin, scoped roles, grant/revoke via API, matrix metadata.
- `RbacLifecycleTest` (4) — grant/revoke/restore keeps denied rows; downhill-only authorization.
- `ReturnDecisionTest` (8) — returns list/approve/reject flows with role gating and audit.
- `RoleEscalationTest` (9) — no super-admin escalation, no self-change, last-super-admin lock, RBAC endpoint parity.
- `UserPermissionGrantsTest` (7) — user-level grants layered over the role matrix.
- `PermissionScopeTest` (9) — own/vendor/domain scopes, deferred scopes, super-admin bypass.
- `PermissionMiddlewareTest` (5) — exact/OR/AND/wildcard semantics, user grants count.
- `ConsoleNavPermissionTest` (3) — every nav entry declares a catalog permission.
- `AuthRbacHardeningTest` (10) — default role on registration, token revocation on suspend, middleware JSON/401 behavior, catalog parity.
- `AdminAuthorizationMatrixTest` (4) — 40-role roster enforced end-to-end by middleware; registry coverage.
- `AdminConsoleAllowSweepTest` (2) — console sections open for their roles, bounce plain users.
- `AdminConsoleApiParityTest` (35) — each console role loads its own data; non-console roles forbidden.
- `AdminConsoleRenderTest` (43) — includes `/admin/rbac` render.
- `Unit\WorkspaceResolverTest` (6) — **"permission grants open matching admin pages"** validates href parity.

### 4.4 Regression context runs (same code, mixed environments)

| Run | Result | Notes |
|-----|--------|-------|
| Full-suite context (Unit + Feature A→Wallet) | Unit all green; Feature green except 16 | All 16 failures proven to be DB contention (DDL races/lock waits); re-verified green: `RbacMatrixTest` 3, `RbacRoleResetTest` 4, `ReturnDecisionTest` 8, `RoleEscalationTest` 1. |
| 8 suspect files, one sequential process | **110 passed (2,334 assertions)** | After killing orphan phpunit PID 15800. |
| Admin tail batch (ProductApproval→UserPermissionGrants) | **57 passed (418 assertions)** | Post-orphan-cleanup, ~4 min. |
| Isolated chunk A (Wallet + RbacMatrix + ReturnDecision + RoleEscalation) | **71 passed (354)** | WalletHoldApi 7/7, WalletHold 9/9. |
| Isolated chunk B1 (WaveA/B/C/D/F) | **79 passed (940)** | |
| Isolated chunk B2 (WaveG–L) | **84 passed (519)** | |
| Isolated chunk B3 (WaveM–Q) | **76 passed (695)** | |
| Isolated chunk B4 (WaveR, WaveS, WaveU + Web + Workspace) | WaveR/S/U pass; **Web+Workspace 81 passed (547)** | Run was interrupted by a fatal in `TranslateLocaleCommand` (see §6); re-run green after the fix. |

No failures remain attributable to the RBAC changes.

### 4.5 Phase 2 console gaps (2026-10-20)

Job Seekers had consumer endpoints only; it now has an admin console and
moderation API (`/admin/job-seekers`, workers + work-requests tabs) with
`job_seekers.*` gates. Jobs and Rides consoles already existed (Rides via
`/admin/transport`); Agriculture/Deals are Needs data and stay moderated via
`/admin/needs` (documented in the UI plan §9).

Evidence (isolated DB):

| Run | Result |
|-----|--------|
| `AdminJobSeekerConsoleTest` | 5 passed — list/filters (incl. deleted), verification round-trip reaching public `verified_only`, remove/restore + active-work-request guard, work-request queue with requester/worker/offers, web render + plain-user bounce |
| `AdminConsoleRenderTest` | 44 passed (added `/admin/job-seekers`) |
| `AdminConsoleAllowSweepTest` | 2 passed (new page + API probes) |
| `AdminConsoleApiParityTest` | 36 passed (jobs_admin probes job-seekers + work-requests) |
| `AdminAuthorizationMatrixTest` | 4 passed (registry mirror + 40-role middleware sweep over the new route) |
| `ConsoleNavPermissionTest` | 3 passed (new nav entry declares `job_seekers.overview.view`) |
| `JobSeekersWorkflowTest` | 5 passed (public/worker flows unchanged) |
| `tsc --noEmit`, ESLint on the new page/nav | clean |
| Delivery hardening (`tests/Feature/Delivery`, 20) | passed — directory read gated on `delivery.deliveries.view`, delete/assign on `delivery.deliveries.manage`, rider self-service + vendor stripped profile unchanged |

### 4.6 Phase 1 enforcement (2026-10-20, permission-authoritative)

All admin pages/APIs were moved from role-list gates to `permission:` gates
and `AdminPolicy` was made permission-based (see the UI plan §2/§8). The
matrix and module suites were re-baselined and re-run on the isolated DB:

| Run | Result |
|-----|--------|
| RBAC core (ConsoleNav, AuthorizationMatrix, RoleAuthorizationSuite 40 roles, RbacLifecycle, RoleEscalation, ReturnDecision, AdminAuditConsole, CustomRoleLifecycle, RbacRoleReset, UserPermissionGrants, PermissionMiddleware, AuthRbacHardening, UiText, NeedsViewerRbac, AdminSystemSettings) | all passed |
| Console parity/render | AdminConsoleApiParity, AdminConsoleAllowSweep, AdminConsoleRender — passed |
| Workspace | WorkspaceResolver 6, WorkspaceLanding 10, WorkspaceProps 5 — passed (vendor_admin now gets a scoped admin workspace) |
| Domain/detail/dashboard | AdminDomainController 19, AdminDetailRoutes 11, AdminDashboardNeedsAttention 6 — passed |
| Web sweeps | PageRenderSmoke 10, FullPageSweep 4 — passed |
| Module CRUD/queues | Food, Jobs, Healthcare, Pharmacy (CRUD + fulfillment), Hotels, Products, Transport, Learn (4 suites), Department, AdminUserCrud/Create, AdminOrderStateMachine, AdminReports, AdminOrderRefundJourney, AdminSupportJourney, AdminRbacRoster38 — passed |

Notable test-baseline changes: module suites now seed `PermissionSeeder`
(gates are permission-based); `AdminUserCrudTest` keeps administrator
without `users.users.delete`; `AdminOrderRefundJourneyTest` now asserts
`finance_admin` (holder of `orders.orders.refund`) is allowed; dashboard
tests seed the matrix so queue visibility is permission-derived;
`AdminRbacRoster38Test` remains canonical (39 roster entries incl. custom
capable registry).

---

## 5. Manual QA Script (revocation immediacy + UX)

1. Sign in as `super@everythingneed.com` (`Password1`).
2. Open `/admin/rbac`: verify 40 roles (Core badge on super_admin / administrator / user), stats strip, permission chips and search.
3. Create role "QA Validator" with `learn.overview.view`; assign a test user to it via Users.
4. In an incognito window sign in as the test user: console nav shows the Learning entry only; `/admin/learning/courses` loads; `/admin/orders` → 403.
5. As super admin, revoke `learn.overview.view` from the custom role, save. Back in incognito, next navigation: link gone, page 403 (caches flushed on write; TTL would otherwise be 300 s).
6. Manage sheet: toggle several permissions → Save → toast; reload persists; toggle back.
7. Delete the role while still assigned → 409 toast, role retained; unassign, delete again → removed from the grid.
8. Reset a builtin role → seeded defaults restored.
9. Repeat steps 2–6 at 375 / 834 / 1280 px in light and dark mode.

---

## 6. Known Issues & Notes

- **`TranslateLocaleCommand` fatal (concurrent localization workstream).** At 22:06 the command file introduced two illegal member overrides — `private option()` and `private run()` — colliding with public methods on `Illuminate\Console\Command`. PHP compile-time fatals broke every artisan/test bootstrap. Fixed minimally with behavior preserved: private helpers renamed to `stringOption()` / `draftMissing()` (call sites updated). Artisan boots; suites unblocked. The localization workstream should keep helper names clear of framework methods.
- **Historical, unverified:** old saved outputs show a `Needs\NeedListingModerationTest` "500 identical to 201" pattern from earlier sessions; not observed in any current run.
- **E2E server:** Playwright reuses the long-running dev server on `127.0.0.1:8000`; do not kill it.
- **Cache semantics:** `rbac.matrix` TTL 300 s, but every RBAC write flushes immediately, which is what makes AC4 provable.

## 7. Re-run Playbook

```powershell
# frontend
cd backend; npm run test:unit
npx playwright test e2e/admin-rbac.spec.ts --project=chromium

# backend (always isolate)
$env:DB_DATABASE='everythingneed_test_rbac'
php artisan test tests/Feature/Admin/RbacBulkUpdateTest.php tests/Feature/Admin/RbacRoleResetTest.php `
  tests/Feature/Admin/CustomRoleLifecycleTest.php tests/Feature/Admin/RbacMatrixTest.php `
  tests/Feature/Admin/RbacLifecycleTest.php tests/Feature/Admin/ReturnDecisionTest.php `
  tests/Feature/Admin/RoleEscalationTest.php tests/Feature/Admin/UserPermissionGrantsTest.php `
  tests/Feature/Admin/PermissionScopeTest.php tests/Feature/Admin/PermissionMiddlewareTest.php `
  tests/Feature/Admin/ConsoleNavPermissionTest.php tests/Feature/Admin/AuthRbacHardeningTest.php `
  tests/Feature/Admin/AdminAuthorizationMatrixTest.php tests/Feature/Admin/AdminConsoleAllowSweepTest.php `
  tests/Feature/Admin/AdminConsoleApiParityTest.php tests/Feature/Admin/AdminConsoleRenderTest.php `
  tests/Unit/WorkspaceResolverTest.php
```

Phase 1 enforcement regression (also isolated):

```powershell
$env:DB_DATABASE='everythingneed_test_rbac'
php artisan test tests/Feature/Web/PageRenderSmokeTest.php tests/Feature/Web/FullPageSweepTest.php `
  tests/Feature/Admin/AdminDomainControllerTest.php tests/Feature/Admin/AdminDetailRoutesTest.php `
  tests/Feature/Admin/AdminDashboardNeedsAttentionTest.php tests/Feature/Admin/AdminAuthorizationMatrixTest.php `
  tests/Feature/Admin/AdminRoleAuthorizationSuiteTest.php tests/Feature/Admin/AdminUserCrudTest.php `
  tests/Feature/Admin/DepartmentAdminTest.php tests/Feature/Workspace tests/Unit/WorkspaceResolverTest.php `
  tests/Feature/Food/AdminRestaurantCrudTest.php tests/Feature/Jobs/AdminJobCrudTest.php `
  tests/Feature/Healthcare/AdminHealthcareCrudTest.php tests/Feature/Pharmacy/AdminMedicineCrudTest.php `
  tests/Feature/Pharmacy/PharmacyFulfillmentTest.php tests/Feature/Hotels/AdminHotelCrudTest.php `
  tests/Feature/Journeys/AdminSupportJourneyTest.php tests/Feature/Journeys/AdminOrderRefundJourneyTest.php
```
