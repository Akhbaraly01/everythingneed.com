# Admin / Workspace Authorization Implementation Audit (Iteration 28)

Companion to `ADMIN_WORKSPACE_AUTHORIZATION_MATRIX.md` (what the rules are); this file records
what changed, why, and the evidence.

## 1. Defect and root cause

**Symptom:** admins/super_admins logging in were landed on the customer `/dashboard` instead of
their console; the admin sidebar leaked into the customer shell; denials could surface as raw JSON.

**Root causes found:**

1. `WebAuthController::login()` issued a fixed redirect after login — no concept of a role landing.
2. No server-authoritative workspace concept: which console a user belongs to was (at best)
   duplicated client-side; `AppLayout` hard-coded admin navigation for anyone who looked admin-ish.
3. `abort(403)` throws plain `Symfony\Component\HttpKernel\Exception\HttpException(403)`, which
   **did not match** the handler's `instanceof AccessDeniedHttpException` branch — web denials fell
   into the generic catch-all (`redirect()->back()`), which on direct URL entry re-targets the
   forbidden URL itself (redirect-loop risk) and flashed a generic error.
4. Role writes had a second, unguarded path (`UserAdminService::setRole`) beside the audited one.

## 2. Change inventory

| Area | Files |
|---|---|
| Resolver + config | `config/workspace.php`; `Core/Services/WorkspaceResolver.php`; `Core/Services/Contracts/WorkspaceResolverInterface.php`; bound in `AppServiceProvider` |
| Inertia workspace prop | `app/Http/Middleware/HandleInertiaRequests.php` shares `workspace` (`current/available/landing/adminHrefs`) |
| Login/landing | `app/Http/Controllers/Web/WebAuthController.php` (`landingFor()`, `redirect()->intended(...)`); `routes/web.php` home route; `resources/js/pages/auth/Login.tsx` (post-login → `/`) |
| Denial handling | `bootstrap/app.php` handler: web+authed 403 → **302 to own workspace landing** + error flash; guest → `redirect()->guest(login)` (stores `url.intended`); API → 403 JSON |
| Admin routes | `routes/web.php` admin section: 18-role `/admin` + `/admin/dashboard` → `AdminPageController::dashboard`; per-domain `role:` groups; `/provider` → `ProviderPageController@dashboard` (`role:worker`) |
| Controllers | `AdminPageController::dashboard()` (role-filtered real-data cards, `scopedProductCount()`), `approvals(Request)` (category-scoped), `productCategoryScope()`; new `ProviderPageController::dashboard()` |
| Console layouts | `ConsoleLayout.tsx`, `AdminLayout.tsx`, `ProviderLayout.tsx`, `WorkspaceSwitcher.tsx`, `config/consoleNavigation.ts` (23 admin entries + 3 aliases + provider nav); all 23 admin pages on `AdminLayout`; `AppLayout.tsx` admin nav/panel **removed**, `WorkspaceSwitcher` added |
| Pages | `admin/Dashboard.tsx` rewritten to server props; new `provider/Dashboard.tsx`; honest empty states (no fake charts) |
| RBAC | `AppRole` 12→21 cases; `AdminRbacController::ROLES` 21; `PermissionSeeder::MATRIX` 21 (+`kyc_reviewer`, `worker`); new `RoleAssignmentService` (+interface, bound) as the single guarded write; `setRole` removed from `UserAdminInterface`/`UserAdminService` |
| Seeding | `DatabaseSeeder`: `vendors` row for `vendor@`; `category_admin` gets a real `user_roles.category_id`; `TestUsersSeeder`: `email_verified_at => now()` (its accounts are new users and `/dashboard` sits behind `auth+verified`) |
| Tests | New: `WorkspaceResolverTest` (5), `WorkspaceLandingTest` (9), `WorkspacePropsTest` (5), `RoleEscalationTest` (9), `AdminAuthorizationMatrixTest` (21-role allow/deny + registry completeness + href gating). Updated: `AppRoleTest` 12→21 roles (legitimate defect-encoded change) |

## 3. Verification (Phase 5 gate + Phase 13 regression + Phase 14 runtime)

| Gate | Result |
|---|---|
| Full suite | **677 passed (2545 assertions)**, 0 failed — baseline was 645 (+32 new tests, no regressions) |
| New test files | WorkspaceResolver 5/5, WorkspaceProps 5/5, WorkspaceLanding 9/9, RoleEscalation 9/9, AdminAuthorizationMatrix 4/4 — all green |
| `npx tsc --noEmit` | 0 errors |
| `npx eslint resources/js --max-warnings=0` | 0 errors |
| Route diff vs `routes_baseline_it27.txt` (normalized) | exactly **+1**: `GET|HEAD provider`; no other route added/removed (admin dashboard closure → controller is same method+URI+name) |
| `migrate:fresh --seed` + `TestUsersSeeder` + `LocalAccessSeeder` | applied; seed refuses non-local env |
| Live HTTP matrix (scripted logins) | **19/19**: 15 accounts land on the exact configured landing with 200 console pages; 4 denial cases (3 authenticated role denials → 302 to own workspace; guest → `/login`) |
| Reference independence | `REFERENCE-ADMIN`/Bagisto/Webkul: **0 code dependencies**; concept-only reuse |

## 4. Honest limitations

1. **Category scope = PARTIAL.** Server-side scoping (approvals queue + dashboard counts) is real
   and fails closed; API product/category writes are role-level only, not category-row-scoped.
2. **Agriculture console NOT implemented (documented, no fake UI).** Pharmacy, building,
   real-estate, KYC, food, jobs, hotels, transport, finance, returns/reviews, subscriptions,
   wallet, notifications and deliveries consoles all exist now (39 admin page routes, P5).
   `agriculture_admin` still lands on the role-filtered dashboard only — there are no
   agriculture tables, so no console was faked. The sidebar registry contains no dead links
   (registry ⇄ route parity is test-enforced).
3. **Seeded credential drift:** `LocalAccessSeeder` sets `super@`/`admin@`/`user@` to `password`;
   a later `TestUsersSeeder` run resets `admin@`/`user@` to `Password1`. The live matrix verified
   the state shown in the matrix doc table; re-running seeders changes passwords accordingly.
4. **`superadmin@`/`customer@` exist only via `TestUsersSeeder`** (not `DatabaseSeeder`).
5. Login is `throttle:10,1` per IP — scripted verification must pace attempts (~7s).
6. Web denial target = redirect-with-flash (established, test-pinned convention:
   `PageRenderSmokeTest` expects 302 + `error`), not a 403 error page.

## 5. Notable debugging findings (for future iterations)

- `abort(403)` throws plain `HttpException`, not `AccessDeniedHttpException` — handler must test both.
- `redirect()->back()` after a denial self-loops when the forbidden URL was the entry point
  (no referer): handler now targets the resolver landing instead.
- `AssertableInertia::where(key, closure)` passes arrays as `Illuminate\Support\Collection`.
- PS 5.1 `Invoke-WebRequest -MaximumRedirection 0` is unreliable; scripted HTTP checks use
  `System.Net.HttpWebRequest` with `AllowAutoRedirect=$false`.
- Inertia login pages have no `_token` field — scripted login uses the `XSRF-TOKEN` cookie via the
  `X-XSRF-TOKEN` header.
- In double-quoted strings `"$r.loc"` is NOT property access — use `"$($r.loc)"`.

## 6. Master plan P1-P10 addendum (admin control plane completion)

| Area | What changed |
|---|---|
| P6 scope/IDOR | `Core/Services/Contracts/PermissionServiceInterface::productCategoryScope()` (+impl in `Core/Services/PermissionService.php`); `ProductQueryInterface::pending($perPage, ?string $categoryScope)` / `decide($id, $approve, $reason, ?string $categoryScope)`; `ProductQueryService` filters `where('category', $scope)` and returns **null on scope mismatch -> 404 (non-leaking)**; `AdminProductApprovalController` resolves scope via the contract. Semantics: super/administrator -> null (unrestricted); non-category_admin (e.g. moderator) -> null (full queue); category_admin assigned -> `categories.name`; unassigned -> `__no_category_assigned__` fail-closed. |
| P5 consoles | 39 admin page routes total: batches added inventory/kyc/brands/newsletter (Batch 1), healthcare/learning/hotels/food/jobs/transport (Batch 2), pharmacy/building/real-estate/returns/reviews/subscriptions/notifications/wallet/deliveries (Batch 3) + `AdminDomainController` (11 role-gated API endpoints over medicine orders, building bookings, disputes, refunds, subscriptions, wallet transactions, notifications, properties, reviews). |
| P7 extraction | `PromptDialog` + `Skeleton`/`TableSkeleton` added to `components/shared/Ui.tsx`; **11 native `prompt`/`confirm` sites replaced** across `admin/{Approvals,Returns,Kyc,Reviews,Brands,Products,Departments,Categories}.tsx`, `account/Reviews.tsx`, `hotels/Reservations.tsx`, `healthcare/AppointmentShow.tsx`. Remaining RA patterns (DataGrid, PermissionTree, settings renderer, notification centre, `ApiError.errors`) were already native. |
| P8 footers | Both marketplace footers rewritten token-only (backend `Marketplace/Footer.tsx`, legacy `frontend/src/modules/home/components/Footer.tsx`): semantic utilities + `var(--gradient-primary)`, **zero `amber-*`**; structure preserved. |
| P9 tests | `AdminConsoleRenderTest` (39 route->component datasets + web-403 convention + guest redirect), `FrontendPolicyTest` (no native dialogs repo-wide + no `amber-` in either footer), `AdminDomainControllerTest` (8 read shapes + role gates + dispute/property/review mutations + audit rows + 422/404). |
| P10 gates | Full suite **740 passed (3044 assertions, 377s)** (P1 baseline 677/2545, +60 tests, 0 regressions); route diff **595 -> 631 (+36, 0 removed)**; live HTTP matrix **31/31 OK** (15 landings, 39-page sweep all 200, 7 specialist checks, 3 cross-role denials -> 302 own landing, 3 workspace denials, 2 guest checks); tsc/eslint/build 0 in both apps. |
| §70 dependency audit | `REFERENCE-ADMIN/` = 37,796 files / 636.6 MB, sits **outside** the app tree (`Desktop\EVERYTHINGNEED\REFERENCE-ADMIN` vs app at `...\MY PROJECT\everythingneed-com`). Searched code, config, routes, modules, tests, frontend src, scripts and env files: **0 references** (only `.md` docs mention it, documenting this very audit). Only reparse point under the app is the standard Laravel `public/storage` symlink. Verdict: **safe to delete - awaiting explicit user approval.** |

## 7. Master plan Stages 0-6 addendum (verification, E2E, CI)

| Area | What changed |
|---|---|
| Stage 0 | Random-assign healthcare booking no longer double-books a doctor at the same date+time (per-slot exclusion, then next free doctor, waitlist only when none free); matrix verified against implementation; AUDIT_MATRIX header → P1-P11 + behavior-contract corrections. |
| G1 returns | Admin decision loop built end-to-end: `adminIndex`/`decide`/`audit()` in `Modules/Orders/.../ReturnRequestController.php`; `GET/PUT /api/admin/returns[/{id}]` role-gated (`super_admin,administrator,moderator,finance_admin`); approve → mock-gateway `RefundPayment` → status `refunded` (+ partial `refund_amount` → `partially_refunded`), reject → `rejected` (payments untouched), audit rows `return.approved`/`return.rejected`; 422 non-pending or no succeeded payment, 404 unknown id; dead `approve`/`reject` methods removed; FE `admin/Returns.tsx` Returns tab (3-way tabs, status chips, approve/reject PromptDialogs). **8 tests.** |
| G2 needs payout | `NeedRequestController::complete` pays the provider inside `DB::transaction` (gateway charge `NEEDPAYOUT-{needId}`, `gateway_response.kind=need_payout`, owner `need_completed` + provider `need_payout` notifications). Distinct from owner checkout (`NRPAY-*`); status gate makes a second payout impossible (422); admin forced-complete without an offer pays nothing. **3 tests.** |
| Stage 2 | 19 journey tests across 6 files (`tests/Feature/Journeys/`) + `CustomerPageRenderTest` 27/27; FE contract fixes (`Book.tsx`/`LabBooking.tsx` symptoms schema, my-courses enrollment rows); 2FA wrong-code → 422 not 500. |
| Stage 3 | `runtime_matrix_p11.ps1` **26/26 OK**; live checkout 500 root-caused from laravel.log (broadcast to non-running Reverb under sync queue) → `NotificationService` broadcast wrapped in try/catch + `BROADCAST_CONNECTION=log` in `.env` and `.env.example` (duplicate reverb line removed with flip instructions). |
| Stage 4 | Playwright suite `backend/e2e/` (chromium, reuses `php artisan serve` on 127.0.0.1:8000, JSON report): guest redirects, customer dashboard/orders/wallet, wrong-password error rendering, admin Returns tab fed by a full customer→vendor→return API chain. Found + fixed: **`HandleInertiaRequests` never shared `errors`** (all failed web forms were silent); stale `public/build` bundle predated G1/H edits → rebuilt and build became a CI gate; API token contract `data.access_token`. **5/5 + coverage floor.** |
| Stage 5 CI | New `.github/workflows/backend.yml` (PHPUnit on pgsql `everythingneed_test` w/ trust auth; lint+tsc+build; Playwright on freshly seeded `everythingneed` + `check-e2e-results.mjs` floor + failure artifacts); `module-boundaries.yml` rewritten to PHP architecture gates (ModularMonolith + FrontendPolicy + AdminAuthorizationMatrix) because the old revision targeted the deleted `src/` SPA; `e2e-recently-viewed.yml` deleted (legacy SPA has no `index.html`); `DatabaseSeeder` now calls `LocalAccessSeeder` → `TestUsersSeeder` (Password1+verified wins; cs@ stays `password`) — verified end-to-end on a scratch DB then dropped; both workflows yaml-validated. |
| Stage 6 gates | Full suite **797 passed (3453 assertions), 0 failed** (425s); `npm run lint` 0 errors (2 pre-existing warnings Brands.tsx/Kyc.tsx); `tsc --noEmit` 0; `vite build` ok; `runtime_matrix_p10.ps1` **31/31**; `runtime_matrix_p11.ps1` **26/26**; Playwright **5/5** + coverage floor; docs refreshed: FINAL_VALIDATION_CHECKLIST (Stage 0-6 section + seed note), AUDIT_MATRIX (Stages 0-6 table + contracts), TESTING_GUIDE (credentials + automation), DEVELOPMENT (CI section). |
| §70 status | user **approved deletion (2026-09-26) and will remove `REFERENCE-ADMIN/` manually**; audit remains on file (37,796 files / 636.6 MB, 0 code refs, outside the app tree). |
