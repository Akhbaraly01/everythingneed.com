# Admin & Workspace Authorization Matrix

Single-page reference for the W1-W2 authorization platform (38-role roster,
canonical permissions, per-user grants, row scopes, console parity, dashboard
queue gating).
Machine-readable sources that this document mirrors:

- `config/workspace.php` — landings, landing priority, console role sets (source of truth).
- `routes/web.php` (admin section) — server-side `role:` middleware gates for pages (the only page authority).
- `Modules/Admin/Routes/api.php` + `Modules/*/Routes/api.php` — API gates (`can:` policies, `role:`, `permission:`).
- `Modules/Admin/Policies/AdminPolicy.php` — Gate definitions for `can:` routes.
- `database/seeders/PermissionSeeder.php` - `CATALOG` (184 canonical permissions) + `MATRIX` (39 roles).
- `resources/js/config/consoleNavigation.ts` — sidebar registry (UX only; visibility = `workspace.adminHrefs` ∩ optional per-entry `permission`).
- Tests: `AdminAuthorizationMatrixTest` (35 role page allow/deny), `AdminRoleAuthorizationSuiteTest` (35 role API allow/deny, 27 probes),
  `AdminConsoleApiParityTest`, `ConsoleNavPermissionTest`, `PermissionMiddlewareTest`, `PermissionScopeTest`,
  `UserPermissionGrantsTest`, `RbacMatrixTest`, `WorkspaceResolverTest`, `WorkspaceLandingTest`, `WorkspacePropsTest`,
  `AuthRbacHardeningTest`, `RoleEscalationTest`, `AdminDomainControllerTest`, `AdminDashboardNeedsAttentionTest` (W2).

## 1. Architecture

Four separate concerns, each with one authority:

| Concern | Question | Authority |
|---|---|---|
| Authentication | Who is this? | Session (`auth`) / Sanctum token (`api`) |
| Route authorization | May they access this route? | `role:` / `permission:` middleware + `AdminPolicy` (`can:`) |
| Row scoping | Which rows may they see? | `permission_scopes` → `ScopeResolver` → `ScopeFilter` (W1.6) |
| Workspace | Which console should they land in / switch to? | `Core\Services\WorkspaceResolver` (config table) |

- Login: `WebAuthController::login()` → `redirect()->intended(landingFor($user))` via
  `WorkspaceResolver::landingPath()`; guests → `redirect()->guest(route('login'))`.
- Root `/`: same resolver — admins land on their console, never on the customer dashboard.
- Every Inertia response shares `workspace` (`current`, `available`, `landing`, `adminHrefs` —
  role-scanned from route middleware) and `auth` (`roles`, effective `permissions` = role matrix ∪
  per-user grants, `['*']` for `super_admin`) — see `HandleInertiaRequests`.

## 2. Role catalog (39 roles, L0-L3) and landings

Canonical set: `AdminRbacController::ROLES` == `AppRole::values()` == `PermissionSeeder::MATRIX`
keys (asserted by `CanonicalRolesTest` + `AdminRoleAuthorizationSuiteTest::test_roster_has_35_roles`).

| Tier | Roles |
|---|---|
| L0 | `super_admin` |
| L1 | `platform_ops`, `security_admin`, `finance_admin`, `customer_service`, `content_manager`, `analytics_admin`, `administrator` |
| L2 | `marketplace_admin`, `orders_admin`, `vendor_admin`, `wallet_admin`, `support_admin`, `healthcare_admin`, `learning_admin`, `hotel_admin`, `food_admin`, `transport_admin`, `jobs_admin`, `real_estate_admin`, `building_admin`, `agriculture_admin`, `pharmacy_admin`, `needs_admin` |
| L3 | `moderator`, `kyc_reviewer`, `payout_reviewer`, `refund_agent`, `inventory_manager`, `cms_editor`, `support_agent`, `auditor`, `analyst` |
| Customer | `worker`, `user` |

Landings (first match in `landing_priority` wins; full map in `config/workspace.php`):

| Role | Landing | | Role | Landing |
|---|---|---|---|---|
| `super_admin`/`administrator`/`platform_ops`/`security_admin`/`analytics_admin`/`needs_admin`/`pharmacy_admin`/`agriculture_admin`/`building_admin`/`kyc_reviewer`/`analyst` | `/admin/dashboard` | | `finance_admin` | `/admin/finance` |
| `healthcare_admin` | `/admin/healthcare/doctors` | | `learning_admin` | `/admin/learning/courses` |
| `support_agent`/`customer_service`/`support_admin` | `/admin/support/tickets` | | `content_manager`/`cms_editor` | `/admin/cms` |
| `marketplace_admin` | `/admin/categories` | | `moderator` | `/admin/approvals` |
| `orders_admin`/`refund_agent` | `/admin/orders` | | `wallet_admin` | `/admin/wallet` |
| `real_estate_admin` | `/admin/real-estate` | | `hotel_admin`/`food_admin`/`transport_admin`/`jobs_admin` | own domain page |
| `payout_reviewer` | `/admin/payouts` | | `inventory_manager` | `/admin/inventory` |
| `auditor` | `/admin/audit-logs` | | `vendor_admin` | `/vendor` |
| `worker` | `/provider` | | `user` (no role) | `/dashboard` |

Console membership: `admin_console_roles` (33 — all but `vendor_admin`, `worker`, `user`),
`provider_console_roles` (`worker`), `vendor_console_roles` (`vendor_admin`).

## 3. Admin page route gates (`routes/web.php`)

Server middleware is the only authority. Every admin page sits under `role:` groups:

| Path(s) | Allowed roles |
|---|---|
| `/admin`, `/admin/dashboard` | the 33 `admin_console_roles` |
| `/admin/approvals`, `/admin/categories` | `super_admin`, `administrator`, `marketplace_admin`, `platform_ops`, `moderator` |
| `/admin/departments` | `super_admin`, `administrator`, `customer_service`, `support_agent`, `support_admin` |
| `/admin/audit-logs` | `super_admin`, `security_admin`, `auditor` |
| `/admin/rbac`, `/admin/roles` | `super_admin` only |
| `/admin/system`, `/admin/settings` | `super_admin`, `administrator` (W5.2) |
| `/admin/reports` | `super_admin`, `administrator`, `analytics_admin`, `auditor`, `analyst` (W5.4) |
| `/admin/users`, `/admin/users/{id}` | `super_admin`, `administrator`, `security_admin` |
| `/admin/analytics` | `super_admin`, `administrator`, `analytics_admin`, `analyst` |
| `/admin/vendors`, `/admin/vendors/{id}`, `/admin/products` | `super_admin`, `administrator`, `platform_ops` |
| `/admin/inventory` | `super_admin`, `administrator`, `platform_ops`, `inventory_manager` |
| `/admin/orders`, `/admin/orders/{id}` | `super_admin`, `administrator`, `platform_ops`, `orders_admin`, `refund_agent` |
| `/admin/cms`, `/admin/newsletter` | `super_admin`, `administrator`, `content_manager`, `cms_editor` |
| `/admin/category`, `/admin/brands` | `super_admin`, `administrator`, `marketplace_admin` |
| `/admin/kyc` | `super_admin`, `administrator`, `kyc_reviewer`, `security_admin` |
| `/admin/hotels` / `/admin/food` / `/admin/transport` / `/admin/jobs` | `super_admin`, `administrator`, domain admin |
| `/admin/payouts`, `/admin/payouts/{id}` | `super_admin`, `administrator`, `finance_admin`, `wallet_admin`, `payout_reviewer` |
| `/admin/finance` | `super_admin`, `administrator`, `finance_admin` |
| `/admin/support/tickets` | `super_admin`, `administrator`, `support_agent`, `support_admin`, `customer_service` |
| `/admin/healthcare/doctors` | `super_admin`, `administrator`, `healthcare_admin` |
| `/admin/learning/courses` | `super_admin`, `administrator`, `learning_admin` |
| `/admin/pharmacy` | `super_admin`, `administrator`, `pharmacy_admin` |
| `/admin/building` | `super_admin`, `administrator`, `building_admin` |
| `/admin/real-estate` | `super_admin`, `administrator`, `building_admin`, `real_estate_admin` |
| `/admin/returns` | `super_admin`, `administrator`, `moderator`, `finance_admin`, `platform_ops`, `orders_admin`, `refund_agent` |
| `/admin/reviews` | `super_admin`, `administrator`, `moderator` |
| `/admin/subscriptions`, `/admin/notifications` | `super_admin`, `administrator` |
| `/admin/wallet` | `super_admin`, `administrator`, `finance_admin`, `wallet_admin` |
| `/admin/deliveries` | `super_admin`, `administrator`, `transport_admin`, `platform_ops`, `orders_admin` |
| `/provider` | `worker` |

Registry parity is test-enforced: `consoleNavigation.ts` admin entries + documented aliases must
exactly mirror the concrete `/admin` GET routes (`AdminAuthorizationMatrixTest`). Parameterized
detail routes (`/admin/{orders|vendors|users|payouts}/{id}`, W3) are deliberately exempt: the
sidebar matches exact hrefs and `WorkspaceResolver::roleHrefs()` skips URIs containing `{`, so
each detail route is reached from its list page and gated by exactly the same `role:` group as
that list (`AdminDetailRoutesTest`).

## 4. API gates (`can:` policies + `role:`/`permission:` middleware)

| Gate / middleware | Endpoints (examples) | Allowed roles |
|---|---|---|
| `can:viewDashboard` | `/api/admin/stats` | 33 console roles |
| `can:manageUsers` | `/api/admin/users*`, `/api/admin/roles`, `/api/admin/permissions` | `super_admin`, `administrator`, `security_admin` — but `POST /api/admin/users` (W8 create) additionally requires `permission:users.users.create`, which only `super_admin` + `administrator` hold (security_admin can read/role/suspend, not provision) |
| `can:manageVendors` | `/api/admin/vendors*` | `super_admin`, `administrator`, `vendor_admin`, `platform_ops` |
| `can:manageOrders` | `/api/admin/orders*` | `super_admin`, `administrator`, `platform_ops`, `orders_admin`, `refund_agent` |
| `can:manageFinance` | `/api/admin/finance/*` | `super_admin`, `administrator`, `finance_admin`, `wallet_admin`, `payout_reviewer` |
| `can:viewAnalytics` | `/api/admin/analytics/{overview,user-growth,revenue,traffic,categories}` (5) | `super_admin`, `administrator`, `analytics_admin`, `analyst` |
| `permission:analytics.overview.export` | `/api/admin/analytics/export` (W5.3) | holders of `analytics.overview.export`: `super_admin`, `administrator`, `analytics_admin` (**not** `analyst` — view ≠ export) |
| `permission:reports.reports.view` | `/api/admin/reports/{sales,analytics}` (W5.4) | holders of `reports.reports.view`: `super_admin`, `administrator`, `analytics_admin`, `auditor`, `analyst` |
| `permission:reports.reports.export` | `/api/admin/reports/export` (W5.4) | holders of `reports.reports.export`: `super_admin`, `administrator`, `analytics_admin`, `auditor` (**not** `analyst`) |
| `auth:sanctum` only (no permission) | `/api/analytics/my-summary` (W5.3) | any authenticated caller — every aggregate is caller-scoped (own orders/wishlist/events) |
| `can:manageCms` | `/api/admin/cms/*` | `super_admin`, `administrator`, `content_manager`, `cms_editor` |
| `can:manageSupport` | `/api/admin/support/tickets*` | `super_admin`, `administrator`, `support_agent`, `customer_service`, `support_admin` |
| `can:manageSettings` | `/api/admin/settings` (incl. DELETE), `/api/admin/stats/system`, feature flags | `super_admin`, `administrator` (W5.2 widened from `super_admin` only; web `/admin/system` + `/admin/settings` match) |
| `can:viewAuditLogs` | `/api/admin/audit-logs` | `super_admin`, `security_admin`, `auditor` |
| `can:viewAuditLogs` + `permission:audit.logs.export` | `/api/admin/audit-logs/export` (W6) | intersection = `super_admin`, `security_admin`, `auditor`; **administrator holds `audit.logs.export` but is refused by the policy** — permission alone is never enough |
| `role:super_admin` | `/api/admin/rbac/*` (matrix, grant, revoke, scopes, user permissions) | `super_admin` |
| `permission:kyc.applications.view` | `/api/admin/kyc` | roles holding `kyc.*` (`super_admin`, `administrator`, `kyc_reviewer`, `security_admin`) |
| `permission:products.products.approve` | `/api/admin/products/pending` + decide | roles holding approve (`super_admin`, `administrator`, `platform_ops`, `marketplace_admin`, `moderator`) |
| `permission:inventory.stock.view` (controller-enforced) | `/api/stock` | `super_admin`, `administrator`, `platform_ops`, `inventory_manager`, `vendor_admin` |
| `role:` lists (module routes) | departments/brands/disputes/refunds/returns/wallet/properties/subscriptions/notifications/pharmacy/building/reviews | mirror the web console groups (see `Modules/Admin/Routes/api.php`) |
| `role:super_admin,administrator,pharmacy_admin` | `POST/PUT /api/medicines` (H-D widened from `super_admin`-only to match the seeded matrix: `pharmacy_admin` holds `pharmacy.medicines.manage`) | `super_admin`, `administrator`, `pharmacy_admin` |
| `role:super_admin,administrator,pharmacy_admin,healthcare_admin` | `GET /api/admin/pharmacy/prescriptions` oversight read (H-D widened to include `healthcare_admin`, who holds `pharmacy.prescriptions.view`; served in the Healthcare console Prescriptions tab) | `super_admin`, `administrator`, `pharmacy_admin`, `healthcare_admin` |

W1.C/D parity work widened policies/routes to match the web groups (page 200 + API 403 leaks are
regressions; pinned by `AdminConsoleApiParityTest` + `AdminRoleAuthorizationSuiteTest`).
Note deliberate pins: `finance_admin` is **not** in `manageOrders` (403 on order refunds —
`AdminOrderRefundJourneyTest`), `administrator` is **not** in `viewAuditLogs`.

## 5. Permission model (canonical naming, grants, scopes)

- **Catalog**: `PermissionSeeder::CATALOG` — 140 entries, `module.resource.action` (entity modules
  double: `orders.orders.view`; console-wide: `{module}.overview.{action}`; specials:
  `inventory.stock.*`, `support.tickets.*`, `kyc.applications.*`, `audit.logs.*`,
  `users.permissions.manage`).
- **Role matrix**: `PermissionSeeder::MATRIX` (39 roles, prefix grants `orders.*` expanded at seed).
  Idempotent `run()` (delete+insert per role) + `Cache::forget('rbac.matrix')`. Runtime grants/revokes
  via `/api/admin/rbac/*` (`PermissionService::grantRolePermission/revokeRolePermission`).
- **Per-user grants (W1.5)**: `user_permissions` (uuid, user_id, permission, granted_by, note;
  unique(user_id, permission)). Endpoints: `GET/POST/DELETE /api/admin/users/{id}/permissions`
  (`role:super_admin`, payload validated by `GrantUserPermissionRequest` against the CATALOG).
  `User::hasPermission` = super_admin implicit → role matrix → per-user grants (cache
  `user.permissions.{id}` 300s, flushed on write). UI: Users page “Perms” modal.
- **Row scopes (W1.6)**: `permission_scopes` (holder_type `role|user`, holder_id, permission, scope,
  scope_value; unique(holder_type,holder_id,permission)). **Absence of a row = global** (zero
  behavior change until scoped). Semantics:
  - `global` — no filter; `own` — owner column = actor id; `vendor` — `vendors.user_id` binding,
    fail-closed null; `domain` — `scope_value` required at grant (e.g. department id);
  - `team`, `country`, `region` — **architected, enforcement deferred** (no-op filter; documented
    and test-pinned — `PermissionScopeTest::test_deferred_scopes_architect_but_do_not_narrow`).
  - Resolution: `ScopeResolver::contextFor(user, permission)` — super_admin → global; user row beats
    role rows; narrowest role row wins by `PermissionScope::precedence()`; cache `permission.scopes`
    300s flushed on write. Endpoints: `GET/POST/DELETE /api/admin/rbac/scopes` (`role:super_admin`,
    payload `GrantScopeRequest`).
  - Enforcement: `ScopeFilter::apply($query, $ctx, $ownColumn, $vendorColumn, $domainColumn)` —
    fail-closed `whereRaw('1 = 0')` when a column/binding is missing. Wired into
    `OrderQueryService` (orders: `o.customer_id`/`o.vendor_id`, ctx for `orders.orders.view`) and
    `SupportQueryService` (tickets: own `t.assigned_to`, domain `t.department_id`, ctx for
    `support.tickets.view`; assign is scope-guarded and 404s outside scope).
  - Out-of-scope detail/writes return **404 (non-leaking, chosen convention)**.
- **Grant-matrix decisions (W1)**: `platform_ops` = orders/vendors/products/inventory/categories/
  delivery/needs/tasks; `security_admin` = kyc/audit/users view-update-suspend-activate +
  settings view; `analytics_admin` = analytics/reports; `orders_admin` = orders/delivery;
  `wallet_admin` = payments + finance.transactions.view + finance.payouts.manage;
  `support_admin` = support/messaging/departments; `payout_reviewer` = payouts.manage +
  transactions.view; `refund_agent` = orders.view/refund + refunds.process; `cms_editor` =
  cms.pages.view/manage; `auditor` = audit/reports; `analyst` = analytics.overview.view +
  reports.reports.view; `marketplace_admin` = products view/approve + categories view/manage +
  orders.view; `moderator` = products view/approve + **categories.view + orders.view** (W1.7
  reconciliation — moderator reaches the categories/returns pages, nav + API must agree).

## 6. `permission:` middleware syntax (W1.7 expansion)

`EnsureUserHasPermission` (alias `permission` in `bootstrap/app.php`):

| Syntax | Meaning |
|---|---|
| `permission:orders.orders.view` | exact permission |
| `permission:a.b.c,d.e.f.g` | OR (router comma-splits params) |
| `permission:a.b.c&d.e.f.g` | AND within one requirement |
| `permission:orders.*` | wildcard — any CATALOG entry under the prefix (checked through `hasPermission`, so role matrix ∪ user grants ∪ super bypass apply) |

Denials: API → `403` JSON `{message, error}`; guests → `401`; web → `abort(403)`.
Pinned by `PermissionMiddlewareTest` (5 tests).

## 7. Console navigation (UX only)

- `consoleNavigation.ts`: one entry per admin page route; every entry declares a canonical
  `permission` (documented exemption: **Dashboard** — no single catalog permission spans all 33
  console roles). `ConsoleLayout` filters by `workspace.adminHrefs` ∩ `auth.permissions`
  (`*` bypasses). Contract test: `ConsoleNavPermissionTest` — permission ∈ CATALOG and every role on
  the route's `role:` list holds it in the seeded matrix (the UX filter can never hide a page its
  role can open).
- Hiding nav is never authorization: every `/admin/*` route stays guarded by backend middleware;
  `canViewCurrentPage` (Access denied panel) mirrors `adminHrefs`.

## 8. Denial behavior

| Caller | Context | Response |
|---|---|---|
| Authenticated, denied | Web page | `302` → **their own workspace landing** + `session('error')` flash (never back onto the forbidden URL) |
| Guest, denied | Web page | `302` → `/login`, destination stored in `url.intended`, honored after login |
| Anyone, denied | API (`api/*` or `expectsJson`) | `403` JSON `{ "message": "Forbidden", "error": … }` |
| Row out of scope | Scoped detail/write (W1.6) | `404` (non-leaking) |

Implemented centrally in `bootstrap/app.php` (covers `abort(403)` and `AccessDeniedHttpException`).

## 9. RBAC write path (escalation hardening)

All role changes flow through `Core\Services\RoleAssignmentService::assign()`
(`AdminUserController::updateRole`, `AdminRbacController::updateRole`; no unguarded writer):

1. Role must be canonical (`AppRole::values()` — 35 entries) → `422`.
2. Self-assign (actor == target) → `403`.
3. Actor must hold `super_admin` or `administrator` → `403`.
4. Granting `super_admin` requires actor `super_admin` → `403`.
5. Demoting a current `super_admin` allowed only if another remains → otherwise `409`.
6. Apply = transactional delete+insert via `PermissionService::setUserRole` + audit `action:'update'`.

Parity is test-enforced: `AppRole` == `AdminRbacController::ROLES` (35) == `PermissionSeeder::MATRIX`.

## 10. Category scoping — PARTIAL (documented honestly)

- **Server-side (done):** `/admin/approvals` and the admin dashboard product counts scope
  `user_roles.category_id → categories.name → products.category`. An unassigned `marketplace_admin`
  **fails closed** to `__no_category_assigned__` (empty queue), never to "all categories".
- **P6 (done):** scoping is contract-enforced — `PermissionServiceInterface::productCategoryScope()`
  feeds `ProductQueryInterface::pending()/decide()`; an out-of-scope approve/reject returns
  **404 (non-leaking, chosen convention)**. Pinned by `ProductApprovalTest` (incl. 3 scope tests).
- **PARTIAL:** API product/category write endpoints are role-gated only, not category-row-scoped.

## 11. Test suites (W1 quality gates)

| Suite | Contract |
|---|---|
| `AdminRoleAuthorizationSuiteTest` (W1.8, roster now 39) | all 39 roles x 27 API probes: allow = not 401/403, deny = exactly 403 (35 -> 38 in Wave P §65, 38 -> 39 in Phase L-A with `learning_reviewer`) |
| `AdminAuthorizationMatrixTest` (W1.8, roster now 39) | all 39 roles x pages: allow = 200, deny = 302 -> own landing + error flash; registry <-> route parity (extended 21 -> 35 -> 38 -> 39) |
| `AdminConsoleApiParityTest` | each console role loads its console's primary API (no 401/403 leaks); `user` denied |
| `PermissionScopeTest` (W1.6) | scope API contract, OWN/VENDOR/DOMAIN enforcement, deferred scopes no-op, super bypass, user-beats-role, upsert |
| `PermissionMiddlewareTest` (W1.7) | exact / OR / AND / wildcard / guest / per-user grants through middleware |
| `ConsoleNavPermissionTest` (W1.7) | every admin entry declares a catalog permission held by every route role |
| `UserPermissionGrantsTest` (W1.5) | per-user grant API contract + enforcement through `hasPermission` |
| `RbacMatrixTest` | runtime role grant/revoke + cache flush + matrix endpoint |
| `AuthRbacHardeningTest`, `RoleEscalationTest` | escalation pins, super_demote 409, self-assign 403 |
| `AdminOrderRefundJourneyTest` | refund journey + **finance_admin 403 pin** on `manageOrders` |
| `AdminDomainControllerTest` | specialist role domain endpoints; plain `user` denied |
| `AdminDetailRoutesTest` (W3) | detail pages render inside the list page's exact `role:` group; orders scope-aware (OWN vs foreign → identical non-leaking not-found); role deny = 302 landing; soft-deleted withdrawal unreachable |
| `ApprovalEngineTest` (W4) | engine store/decide contract: ordered steps, per-step role gate + super bypass + null-role branch, reject skips remainder, one-shot decisions, route permission before the engine (guest 401), validation, status filters, console `requests` prop |
| `AdminOrderStateMachineTest` (W4) | forward lifecycle allowed; backward + terminal writes 422 with state unchanged; same-state idempotent; cancel/refund outcomes from active states; provider-owned `paid` never admin-set; refund endpoint shares the terminal guard |
| `AdminSystemSettingsTest` (W5.2) | settings CRUD gate (`manageSettings` = super + administrator, others 403); flag toggles read current state (array shape), missing key 404, no implicit flag creation; immutable keys survive update |
| `AdminAnalyticsRangeExportTest` (W5.3) | range whitelist (invalid range falls back to 30d), windowed overview keys (`range`/`since`), series endpoints 200 for viewer roles, export gate = `analytics.overview.export` (analyst view-only 403), CSV stream content, inverted dates, categories breakdown returns a plain array (W7 regression) |
| `AdminReportsTest` (W5.4) | `/admin/reports` web role gate (5 roles 200, others 302 landing + flash); sales/analytics windowing incl. 30d default; inverted date range 422; export gate = `reports.reports.export` (analyst 403 on export, 200 on view); CSV content |
| `AdminAuditConsoleTest` (W6) | export double gate (guest 401; analyst/finance_admin 403; **administrator 403 despite `audit.logs.export`**; security_admin/auditor/super 200); filtered CSV stream + filename; self-audit event (`action=export`, actor); index/export filter validation (bad action, inverted dates = 422 — never a silent empty list); index gate mirrors the page |
| `AdminUserCreateTest` (W8) | `POST /api/admin/users`: 201 + role assigned + verified + loginable; duplicate email 422; security_admin 403 (holds manageUsers, lacks create grant) with nothing written; administrator provisioning `super_admin` = 403 **pre-insert**; administrator console-role 201; guest 401; validation/unknown role 422 |
| `AdminAccessToggleTest` (W8) | suspend revokes tokens **and purges DB sessions**, surviving sessions blocked per-request (API 403 JSON / web 302 login with the suspended message); self-suspend 403; last-active-super 409; suspend/restore roundtrip (login 403 -> 200); guest 401 / customer 403 on the toggle; super dashboard receives `adminAccess` (console accounts + roles + is_self, customers excluded), administrator receives `null` |
| `UiTextTest` (W8) | guest login page shares default `uiTexts` (nested dot-safe props); settings override flows to editor endpoint **and** the rendered page immediately; runtime `ui.*` key editable and self-labelled; editor gate guest 401 / security_admin 403 / administrator 200; non-`ui.*` settings never surfaced |
| `AdminProductManagementTest` (W8) | admin creates a published product for any vendor (`approved_at` + `is_active=true`), updates/renames another vendor's product, toggles `is_active`, archives (`is_active=false`); vendor submissions still enter the approval queue untouched |
| `WaveCCmsBlockEngineTest` (Wave C) | closed 24-type registry + field schemas; builder gate matrix (guest 401, plain user / learning_admin / moderator 403, cms_editor 200); save → revision v1; unknown type / `javascript:` URL / required_if / unknown-key stripping / list bounds / 100-block cap = 422; restore writes forward (v3, history intact); retention prune; duplicate slug 422; published render + SEO props; draft 404 for guests vs admin preview; dynamic grids from real tables; cache invalidation; unregistered block row never renders; page update appends `Details updated` |
| `WaveCNavigationMediaTest` (Wave C) | nav CRUD + full-replacement items (child dropped on replace, nav soft-deleted); location/destination/duplicate-id/self-parent/foreign/cycle validation; gate + `navigation.*` matrix (guest 401, user 403, cms_editor GET 200 / POST 403); upload records `MediaItem` (owner, server MIME, image dims); SVG/PHP uploads 422 with no row; media scoping (owner-only list, owner/super delete, others 403) |
| `WaveDPublicNavTest` (Wave D) | `siteNav` shared even with no menus seeded (5 empty arrays); seeded menus flow into HTTP responses; seeder idempotent; visibility matrix (`guest`/`auth`/`all`, **role fail-closed on empty permissions incl. super_admin**, role grants reveal rows); children of hidden parents promoted not dropped; draft navigations/inactive items excluded; `/p/{slug}` destination resolves to the CMS route; `devices` exposed for client-side filtering; builder write flushes the cache |
| `WaveDHomeSectionsTest` (Wave D) | `/` renders `Home/Index` for guests and marketplace customers; admin/worker keep role landings (redirects); Dashboard carries the same `sections` payload; all 11 section keys present-but-empty on a fresh DB (complete, never fabricated); promo copy = editable `ui_texts` defaults; one real row per vertical surfaces with its canonical link (products/deals/tasks/jobs/hotels/flights/food/agriculture/properties/worker); daily deals exclude non-discounts and inactive rows |
| `WaveFNeedsWorkflowTest` (Wave F) | draft save → submit → publish (draft excluded from `scope=open`, double-submit 422); negotiation re-submit updates the standing offer → `negotiating`, accept → `accepted`, accepted provider re-bid 422; owner dispute from `paid` (stranger 403) → moderator-only refund → `Payment::STATUS_REFUNDED` + double-refund 422; timeline carries `create/submit/publish/offer/accept_offer/pay/start/complete` with to_status/actor edges matching `NeedRequestEvent` rows; transition guards (publish-from-draft 422, stranger submit/cancel/reject/expire 403, owner cancel once then 422, cancelled closes to offers); moderator reject + owner expire + open-scope exclusion; need_request review rules (not-completed 422, non-requester 403, completed 201, duplicate 422, filtered index 1 row); fulfill-before-start 422 then fulfill→completed, post-completion dispute 422 |
| `WaveFNeedsPagesTest` (Wave F) | `/needs` renders `needs/Index` with `categories` + all 16 `sections` keys in spec order; `/needs/create` guest→login / auth→`needs/Request`; the 7 my-needs workspace routes render their components with `need_id`; all 10 private needs routes guest→login; canonical `/needs/{category}/{id}` + legacy `/needs/requests/{id}` render `needs/Show` with the right props; `/needs/{slug}` server-props (open request + canonical URL, completed excluded, unknown slug → null category + empty arrays); per-need chat conversation (`recipient_id` + `booking_id` idempotent, message visible to requester); `POST /api/upload` folder contract (`need-images` in URL) |
| `WaveGCatalogSlugTest` (Wave G, 10) | models generate unique slugs; canonical `/products/{slug}` + legacy id 301 to the slug form; unknown product slug hits the locked 404 contract; `products/{slug}/{reviews,vendor}` render; `/vendors/{slug}` + its 3 sub-pages render with id redirects; category slug canonical + id redirect; deal slug canonical + id redirect; vertical deal landings (`/deals?category=`/`/deals/category/{slug}`) keep precedence over the `/deals/{id}` resolver; `/deals?category=` page renders; catalog index pages render |
| `WaveGCartVariantTaxTest` (Wave G, 5) | cart show exposes the Wave G totals shape (tax, vendor grouping, ETA); variant line uses variant pricing and carries `variant_name`; variant stock validated on update; paused vendor (`settings.is_accepting_orders=false`) blocks add-to-cart with 422 `Vendor is not accepting orders`; inactive/unresolvable variant rejected with 404 `Item not found` |
| `WaveGOrderWorkflowTest` (Wave G, 11) | place order stores server `tax` and stays consistent (cart cleared, totals); place records the variant line; cancel restores variant stock + marks `cancelled`; customer completes a delivered order (`completed` accepted by the DB CHECK); complete rejects non-delivered orders 422; return request freezes the order (`refund_requested` + `previous_status`) and rejection resumes it; dispute holds the order (`disputed`) and closing resumes it; someone else's dispute 403; terminal-order dispute 422; **admin dispute resolution restores the previous status except `resolution=refund`, which keeps the order disputed** |
| `WaveGVendorPortalTest` (Wave G, 8) | portal pages require auth and render for vendors; profile returns the own vendor and updates; profile without a vendor profile 403; settings toggle `is_accepting_orders`; services CRUD **scoped to the own vendor** (foreign → 404, soft delete via `deleted_at`, list excludes it); reviews shaped with reviewer + product names; bookings limited to `service_type=vendor_service` ∩ own service ids; earnings answers for the own vendor |
| `WaveHPaymentsTest` (Wave H, 10) | HTTP charge with a repeated `idempotency_key` replays the same payment (1 row, identical id) while a new key charges again; checkout + wallet_deposit purposes stored server-side; `cancelled` accepted by the DB CHECK + transition map (pending→cancelled, terminal refunded/failed/cancelled, no resurrection, same-state idempotent); stale `payment_intent.payment_failed` on a refunded payment leaves it refunded with the event `ignored`; `payment_intent.canceled` on pending → cancelled; unknown `PAYMENTS_DRIVER` throws instead of falling back to mock; chained partials 50+60+90 on 200 → partial/partial/refunded then 422 (over-refund never exceeds the charge); `GET /api/payments/methods` sandbox + card (guest 401); `financial:reconcile` reports the planted drift and webhook health |
| `WaveIWalletKycTest` (Wave I, 15) | KYC show redacted (masked number, no paths/reviewer, `verification_state`) + `not_started` fallback; submit records identity and rejects foreign document paths (422) with spec `under_review`; requires_action loop (reason mandatory, resubmit attempts 2, `verified_at`, decided rows 422); upload→submit→stream scoping (owner 200, stranger 404, reviewer 200/plain-user 403); withdraw/transfer 403 until verified then 201 with paired references and 75/15 balances; withdraw vs active holds (available 10/pending 90, over-withdraw 422 `INSUFFICIENT_FUNDS`); wallet payment debits real ledger money for verified+funded (provider wallet, `WALLET-PAY-*` row) with honest 403/422/201 fallbacks; wallet refunds restore the balance (partial + full); owner-scoped transaction details + type filters; methods endpoint wallet gating; reconcile pair + negative-availability flags |
| `WaveJBillsTest` (Wave J, 10) | services catalog lists all 5 services with per-country availability (US electricity unavailable with reasons, guest 401); airtime purchase debits the wallet and records a provider reference with masked `****5678` account and a `bill_payment` payment row; replay returns the original purchase (1 row, 1 debit); unverified → 403 and unfunded → 422 with a persisted failed row; unknown service/country/fields/phone rejected with 0 succeeded rows; unknown driver 422 with balance untouched and nothing succeeded; forced vend failure reverses the debit (`WALLET-REF-BILL-*` credit, `wallet_refunded`, whole balance); manual driver stays pending without moving money; history owner-scoped (guest 401, foreign 404) |
| `WaveKHealthcareTest` (Wave K, 7) | partial unique index rejects a raced duplicate slot insert (23505) while cancelled rows insert fine; booking API returns the identical clash 422 under lock; medicine vendor/detail columns persist and `show` embeds the vendor; pharmacy orders enforce stock (422 + 0 orders) and active prescriptions (422 + message) with stock decrements; doctor `?q=` isolates by name/specialty; emergency endpoint reports configured numbers; 12 spec pages render for guests with book/bookings gated to auth |
| `WaveLLearnTest` (Wave L, 8) | quiz submit body contains no `correct_index`/`correct_answers` with score/pass intact; canonical course URL 301s with per-quiz pages rendering (unknown quiz 302); 5 public spec pages + progress gates + Show detail props; public certificate verify (valid/invalid) with owner-scoped detail/download attachment; owner-scoped lesson notes (replace-single, foreign-null, unknown-404, guest-401); enrollments carry lesson counts + recency; popular/featured/level sorting + detail columns; instructors/categories endpoints |
| `WaveMAccountTest` (Wave M, 5) | `/account/orders` canonical carries the real order row (component + guest→login); 16 canonicals redirect guests and render for users; order detail + message thread enforce owner/participant scoping (strangers redirected); saved payment-method CRUD with validation, foreign-404 and guest-401 |
| `WaveNVerticalsTest` (Wave N, 12) | ride availability carries no fabricated fares with driver registration/lifecycle (409/403/terminal guards, confirmed fares, ride counter); restaurant order endpoint places real itemized orders with cross-restaurant/unavailable/unknown rejections; property create persists real columns with scoped my-listings and alias gates; building bookings auto-assign free workers with assignment guards + completion/quote flow; job application pipeline + employer aggregates + admin visibility + spec pages; hotel booking aliases + review round-trip; expert categories + filters; agriculture farmers/products pages |
| `WaveOMessagingTest` (Wave O, 12) | notification `?type=`/`?is_read=` filters + own-only unread badge; wallet-deposit fan-out row (unread, ≤500 chars); review votes one-per-user with server-side recount + write flood throttle; self-conversation 422 with participant-only thread; uploader-scoped ticket/message attachments (foreign → 422) surfaced in resources; `support_admin` added to ticket staff checks; admin ticket detail (full thread + events + requester) behind `manageSupport`; spec-62 support URLs render with legacy `/tickets` render-pinned, console pages role-gated |

## 12. Seed credentials (local dev)

- `Password1` @ `*.everythingneed.com`: superadmin, admin, ops, security, analytics, orders, wallet,
  supportadmin, realestate, needs, payouts, refunds, inventory, cmseditor, auditor, analyst, vendor,
  content, healthcare, support, learning, finance, user, customer.
- `password`: `super@`, `cs@`, `category@`, `moderator@`, `*.worker@`.
- Access flows: `php artisan migrate` + `php artisan db:seed --class=PermissionSeeder --force` +
  `TestUsersSeeder` (keep dev DB in lockstep with seeders after every MATRIX change).

## 13. Runtime evidence

- P10 matrix: `%TEMP%\opencode\runtime_matrix_p10.ps1` → `p10_matrix_result.txt` — **TOTAL=31 FAILS=0**
  (15 landings, 39-page super sweep, 7 specialist allows, 3 cross-role denials, 3 workspace denials,
  2 guest checks). Route diff vs P1: 595 → 631 (+36, 0 removed).
- W1.5 live smoke: `%TEMP%\opencode\w15_smoke.ps1` — catalog=140, roles=35, grant → grantee 200 →
  revoke → 403.
- W1 live gates: full `php artisan test --no-coverage`, `npm run lint` (0 errors),
  `npx tsc --noEmit` (0), `npm run build`, P10/P11 runtime matrices, Playwright E2E.
- W2 live gates: full suite **909 passed (5364 assertions), 0 failures**; lint 0 errors; tsc 0;
  build ok; P10 31/31; P11 26/26; Playwright 5/5 (`w2_full.log`).
- W3 live gates: full suite **920 passed (5463 assertions), 0 failures** (806s, `w3_full.log`);
  lint 0 errors (2 pre-existing warnings); tsc 0; build ok; P10 31/31; P11 26/26; Playwright 5/5.
- W4 live gates: full suite **940 passed (5594 assertions), 0 failures** (1151s, `w4_full.log`);
  lint 0 errors (2 pre-existing warnings); tsc 0; build ok; regression batch 166/166; P10 31/31;
  P11 26/26; Playwright 5/5.
- W5 live gates: full suite **964 passed (5925 assertions), 0 failures** (1194.5s, `w5_full2.log`;
  first run caught a `ModularMonolithTest` cross-module violation, fixed, rerun green); lint 0
  errors (2 pre-existing warnings); tsc 0; build ok; P10 31/31; P11 26/26; Playwright 5/5;
  recall: CATALOG 140, routes 655 (+6 W5), nav/registry parity green.
- W6 live gates: full suite **969 passed (5991 assertions), 0 failures** (561s, `w6_full.log`);
  lint 0 errors (2 pre-existing warnings); tsc 0; build ok; P10 31/31; P11 26/26; Playwright 5/5;
  recall: routes 656 (+1 W6: `api/admin/audit-logs/export`), CATALOG 140, nav/registry parity green.
- W7 live gates: full suite **970 passed (5996 assertions), 0 failures** (574s, `w7_full.log`);
  lint 0 errors (2 pre-existing warnings); tsc 0; build ok; P10 31/31; P11 26/26; Playwright 6/6
  + `E2E_MIN_TESTS=6` floor; CI PHP pin 8.3 → 8.5 (lock requires >=8.4.1); recall: routes 656
  (unchanged), CATALOG 140, nav/registry parity green.
- W8 live gates: full suite **995 passed (6130 assertions), 0 failures** (594s, `w8_full2.log`;
  first run caught a `ModularMonolithTest` cross-module violation — the new controller-level
  `DB::table` reads on `users`/`user_roles` — fixed by moving them into Core `UserAdminService`
  per the `UserAdminInterface` contract, rerun green); lint 0 errors (2 pre-existing warnings);
  tsc 0; build ok; P10 31/31; P11 26/26; Playwright 6/6 + `E2E_MIN_TESTS=6` floor; recall:
  routes **658** (+2: `POST /api/admin/users`, `GET /api/admin/ui-texts`), CATALOG 140,
  nav/registry parity green.
- Wave A/B live gates: full suite **995 → 1013 passed (6361 assertions), 0 failures**
  (`waveA_*`, `waveB_full2.log`); lint 0 errors; tsc 0; build ok; CATALOG 140 → 184.
- Wave C live gates: full suite **1040 passed (6572 assertions), 0 failures** (831s,
  `waveC_full.log`); focused `--filter=WaveC` 27/27 (210 assertions, `waveC_focus.log`);
  lint 0 errors (2 pre-existing warnings); tsc 0; build ok; recall: CATALOG 184,
  routes 667, 24 block slugs.
- Wave D live gates: full suite **1058 passed (6781 assertions), 0 failures** (801s,
  `waveD_full.log`); focused `--filter=WaveD` 18/18 (203 assertions) + `WorkspaceLanding`
  10/10; lint 0 errors (2 pre-existing warnings); tsc 0; build ok; recall: CATALOG 184,
  routes 672 (`/` → `home › Web\HomePageController@root`), 5 seeded menus, 11 Home
  section keys.
- Wave F live gates: full suite **1074 passed (7069 assertions), 0 failures** (801s,
  `waveF_full.log`); focused `--filter=WaveF` 16/16 (288 assertions); lint 0 errors
  (2 pre-existing warnings); tsc 0; build ok; recall: CATALOG 184, routes **681**
  (+9: `/needs/create`, `/needs/my-needs` + hub + 6 sub-pages, `/needs/{category}/{id}`),
  17 need states, 16 Needs-index section keys.
- Wave G live gates: full suite **1108 passed (7246 assertions), 0 failures** (854s,
  `waveG_full.log`); focused `--filter=WaveG` 34/34 (177 assertions) + pinned commerce
  regression batch 205/205; lint 0 errors (2 pre-existing warnings); tsc 0; build ok;
  recall: CATALOG 184, routes **707** (+26: `/api/vendor/*` portal API, `/vendor/*`
  portal pages, product/vendor/deals slug pages + sub-pages), 12 order states,
  `vendor_services` table.
- Wave H live gates: full suite **1118 passed (7293 assertions), 0 failures** (1576s,
  `waveH_full.log`); focused `--filter=WaveH` 10/10 (47 assertions) + payment-affected
  pinned batch 200/200; lint 0 errors (2 pre-existing warnings); tsc 0; build ok;
  recall: CATALOG 184, routes **708** (+1: `GET /api/payments/methods`),
  7 payment states + `cancelled`, `payments.purpose` column.
- Wave I live gates: full suite **1133 passed (7385 assertions), 0 failures** (1513s,
  `waveI_full.log`); focused `--filter=WaveI` 15/15 (92 assertions) + KYC/wallet/payment
  pinned batch 435/435; lint 0 errors (2 pre-existing warnings); tsc 0; build ok;
  recall: CATALOG 184, routes **714** (+6: KYC document streaming, wallet transfer,
  transaction details, `/kyc` + `/wallet/transactions/{id}` pages),   `kyc_verifications`
  identity columns, ledger-backed wallet payments.
- Wave J live gates: focused `--filter=WaveJ` 10/10 (66 assertions) + finance/wallet/payment pinned batch 268/268; **full suite 1163 passed (7680 assertions), 0 failures** (978s, `waveM_full.log` — combined J–M close-out); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; recall: CATALOG 184, routes **769** (+55 across J–M: bills module, healthcare spec pages, Learn pages, account canonicals), `bill_purchases` table.
- Wave K live gates: focused `--filter=WaveK` 7/7 (47 assertions) + healthcare/pharmacy pinned batch 221/221; **full suite 1163 passed (7680 assertions), 0 failures** (978s, `waveM_full.log` — combined J–M close-out); lint 0 errors; tsc 0; build ok; recall: CATALOG 184, routes 769, slot-guard index, medicine vendor columns.
- Wave L live gates: focused `--filter=WaveL` 8/8 (86 assertions) + Learn pinned batch 69/69; **full suite 1163 passed (7680 assertions), 0 failures** (978s, `waveM_full.log` — combined J–M close-out); lint 0 errors; tsc 0; build ok; recall: CATALOG 184, routes 769, course/lesson/enrollment columns + `lesson_notes`.
- Wave M live gates: focused `--filter=WaveM` 5/5 (96 assertions); **full suite 1163 passed (7680 assertions), 0 failures** (978s, `waveM_full.log` — combined J–M close-out); lint 0 errors; tsc 0; build ok; recall: CATALOG 184, routes 769 (+35 across L–M), 17 account canonicals + saved-methods API.
- Wave N live gates: focused `--filter=WaveN` 12/12 (100 assertions); **full suite 1175 passed (7780 assertions), 0 failures** (chunked runs); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; recall: CATALOG 184, routes **796** (+27: drivers/rides lifecycle, building assign/transition, job pipeline/admin, hotel booking aliases, expert categories, real-estate aliases, my-listings), `bill-driven` nothing new, `properties.listing_type` + `building_service_bookings.worker_id` columns.
- Wave O live gates: focused `--filter=WaveO` 12/12 (112 assertions); **full suite 1187 passed (7888 assertions), 0 failures** (chunked runs: 377+82+151+116+266+195); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; recall: CATALOG 184, routes **803** (+7: notification unread-count, review votes, admin ticket detail API + staff page, support aliases, canonical support URLs), `tickets`/`ticket_messages.attachments` columns.

## 14. Dashboard "Needs Attention" queues + notification bell (W2)

Queue items on `admin/Dashboard` are derived on read (no `admin_tasks` table) and are gated with the
**same router-built registry that drives the sidebar** (`WorkspaceResolver::adminHrefs` — non-parameterized
`/admin/*` URIs whose `role:` middleware names the role). A queue is pushed only when its count is > 0 **and**
its target href is in that registry, so a role can never be shown work it cannot open:

| Queue (label) | Predicate | Target href |
|---|---|---|
| Products awaiting approval | `products.deleted_at IS NULL AND approved_at IS NULL`, category-filtered via `productCategoryScope` (unscoped `marketplace_admin` fails closed to 0 — matches the approvals page) | `/admin/approvals` |
| KYC reviews pending | `kyc_verifications` status ∈ `pending, submitted` | `/admin/kyc` |
| Open disputes | `disputes` status ∈ `open, in_review` | `/admin/returns` |
| Returns awaiting decision | `return_requests` status = `pending` | `/admin/returns` |
| Support tickets open / Tickets unassigned | `tickets` status = `open` (reporting convention); unassigned adds `assigned_to IS NULL` (subset) | `/admin/support/tickets` |
| Withdrawals awaiting processing | `vendor_withdrawals.processed_at IS NULL` (stamped on every decision) | `/admin/payouts` |
| Vendors pending verification | `vendors.is_verified = false` | `/admin/vendors` |
| Stock at or below reorder point | `stock_levels` `reorder_point > 0 AND quantity <= reorder_point` | `/admin/inventory` |

Pinned by `AdminDashboardNeedsAttentionTest` (6 tests): live-row counts for super_admin, honest empty
state, href-gate (`content_manager` sees nothing despite pending rows), scoped + fail-closed
marketplace_admin (queue and the "Pending Approvals" card agree with the page), kyc_reviewer-only list.
Caveat: counts are unscoped (global) — if a per-user `permission_scopes` row is later granted, list APIs
narrow but queue counts do not (no scope rows are seeded; same caveat as the stat cards).

**Notification bell** (`components/notifications/NotificationBell.tsx`): badge = shared
`unreadNotifications` prop (whole-account count; visible before the dropdown opens), optimistically
adjusted after read mutations and resynced with `router.reload({ only: ['unreadNotifications'] })`
(reverts to the shared count if the API call fails). "View all" → `/admin/notifications` only when
`workspace.current === 'admin'` **and** the href is in `adminHrefs` (super_admin/administrator), else
`/notifications` — never a 403 dead-end. Type-links with a missing `related_id` fall back to
`/notifications` (no broken `/pharmacy/order/`).

## 15. Approval engine + order state machine (W4)

**Generic approval engine** — `approval_requests` / `approval_steps` (migration
`2026_09_27_000001`, append-only: no soft deletes), `ApprovalEngineInterface` bound to
`Core\Services\ApprovalEngine` in `AppServiceProvider`:

- **API** (`Modules/Admin/Routes/api.php`): `GET/POST /api/admin/approval-requests`,
  `GET …/{id}`, `POST …/{id}/approve`, `POST …/{id}/reject` — all gated
  `permission:products.products.approve` (the Approvals console's declared nav permission;
  holders today: super_admin, platform_ops, administrator, moderator, marketplace_admin).
  Route gate runs **before** the engine (guest 401, wrong permission 403).
- **Step semantics**: steps decide strictly in `step_order`; the current step's `approver_role`
  must be held by the actor — `super_admin` bypasses role gates, a `null` `approver_role`
  accepts any caller that already passed the route permission. Wrong role → 403 with a fixed
  non-leaking message. **Reject** ends the request (`status=rejected`) and marks every remaining
  pending step `skipped`. Already-decided → 422; unknown id → 404. Store validation rejects
  unknown `AppRole` values, missing title/type, and empty step lists (422) before creation.
- **Console**: `/admin/approvals` now renders a `requests` prop (pending, page 1) and the
  Approvals page gained a **Requests** tab (server prop for Pending; `api.get` filters for
  Approved/Rejected/All; step chips; Approve/Reject with optional comment; ordered role-step
  builder fed by `GET /api/admin/roles`; create dialog posts to the engine API). The web page
  itself added **no** route — registry-parity and `adminHrefs` unchanged.
- **Audit**: `approval.requested` / `approval.decided` logged through `AuditServiceInterface`
  (failures swallowed — audit never breaks a decision).
- **Phase-2 seams**: KYC, product approval and payout decisions keep their own stronger flows;
  migrating them onto the engine is a deliberate future step, not implied by this wave.

**Order state machine** — `Modules\Orders\Support\OrderStateMachine` (server) mirrored by
`resources/js/lib/orderStatus.ts` (client, display-only):

- Forward-only lifecycle `pending → paid → confirmed → processing → shipped → delivered`;
  `cancelled` / `refunded` reachable from any **active** state; both terminal (final);
  same-state updates idempotent no-ops. `paid` is provider-owned: excluded from
  `AdminOrderController::VALID_STATUSES`, so a browser can never set it (422 at validation).
- `OrderQueryService::updateStatus()` now returns `ok | missing | invalid_transition` and
  refuses writes before touching the row; `refund()` refuses terminal rows
  (`not_refundable` besides `already_refunded`) — the refund endpoint shares the same guard.
- FE selects (`Orders.tsx`, `OrderDetail.tsx`) only offer legal destinations via
  `settableOptionsFor(current)` (terminal states show a disabled `… (final)` option,
  `paid` shows `paid (locked)`); the server remains the authority (422 on any bypass).

## 16. CMS / settings / analytics / reports (W5)

**CMS completion (W5.1)** — no route/gate changes; the wave closed functional gaps:
announcement end-time window validation (`ends_at` > `starts_at`), full edit UI for all four
content types (announcements, banners, blog, pages) with `ConfirmDialog` deletes, and an
idempotent `CmsSeeder` (`upsert()` by slug) wired into `DatabaseSeeder`.

**Settings (W5.2)** — `manageSettings` widened to `super_admin` + `administrator` (policy,
web group and API all moved together; suite pin `/api/admin/settings => [super_admin,
administrator]`, matrix pin allows `administrator` on `/admin/system` + `/admin/settings`;
`/admin/rbac` + `/admin/roles` remain super-only). Lifecycle rules: `DELETE /api/admin/settings/{key}`
answers 404 for missing keys (no implicit re-create), feature-flag toggles never auto-create
flags, and `AdminSettings.tsx` renders immutable keys read-only with a confirm step on delete.

**Analytics (W5.3)** — `/api/admin/analytics/*` overview/series honour `?range=7d|90d|30d`
(whitelist; invalid → 30d; windowed `new_users`/`total_orders`/`total_revenue`, stock gauges
all-time and labelled as such). CSV export is a **separate permission**
(`analytics.overview.export` — analyst has view but not export): `GET /api/admin/analytics/export`.
Customer-facing `GET /api/analytics/my-summary` needs only a session; every number is
caller-scoped and comes through `ReportingServiceInterface::userStats()` (cross-module reads
never happen in the Analytics module — pinned by `ModularMonolithTest`). Web `/analytics`
requires `auth`.

**Reports (W5.4)** — `/admin/reports` (role: super, administrator, analytics_admin, auditor,
analyst) renders `admin/Reports.tsx`: date-range filter (server-side 30d default, inverted
range → 422), revenue/orders/AUV cards, sales-by-day table, events-by-type bars, and a
permission-gated CSV export. API mirrors the web gate: `permission:reports.reports.view` for
`sales`/`analytics`, `permission:reports.reports.export` for `export` (analyst is view-only).
Denials follow §8 (302 → own landing + flash; content_manager lands on `/admin/cms`).

**Latent-bug ledger** (W5 gates found six always-broken paths — details in `AUDIT_MATRIX.md`
W5 section): settings PUT 500 (missing closure capture), feature-flags GET 500 (`Collection`
vs `: array`), new-setting insert 23502 (missing uuid PK), analytics series GET 500
(same `: array` signature lie — slipped past the parity test, which pins the deny side only),
`userStats.recent_orders` always `[]` (wrong column name), web error handler logged nothing
before redirecting. Also: the matrix test itself tripped `GlobalRateLimit` (240 req/min/IP)
after wave growth — fixed in the test harness (`RateLimiter::clear` per role), middleware
behaviour unchanged.

## 17. Audit console + system views (W6)

**Audit export** — `GET /api/admin/audit-logs/export` implements the long-declared
`audit.logs.export` permission (it sat in the CATALOG with no endpoint) behind a **double
gate**: `permission:audit.logs.export` *and* `can:viewAuditLogs`. Holders of the permission
are super, security_admin, auditor, administrator (`audit.*`); the view policy is
super, security_admin, auditor — so **administrator can export nothing** (403): a permission
grant alone never reaches audit data. The export streams a CSV (cap 10 000 rows, same filter
contract as the index, no paging params) and **audits itself** (`action=export`,
`entity_type=audit_logs`, actor + row count + filters in `new_values`; audit failures are
swallowed and never block the download).

**Audit console** (`AuditLogs.tsx`) — server-driven filters (search, action select bounded by
`VALID_ACTIONS`, entity type, date range), pagination over `meta{total,page,per_page}` with
25/50/100 page sizes, Changes column rendered from `new_values`/`old_values`, and an
Export CSV button gated by `audit.logs.export` in the shared permissions prop. Two old bugs
died here: the free-text action filter silently rendered "No audit logs" whenever the server
422'd, and the page read `user_name`/`ip_address`/`details` — fields the API never returns
(`performed_by_name`/`performed_by_email`; `audit_logs` has no IP column), which left the
User and IP columns permanently blank.

**RBAC scopes UI** — the W1.6 scopes API (`GET/POST/DELETE /api/admin/rbac/scopes`,
super-only) gained its console: Rbac.tsx lists holder/permission/scope/value with revoke, and
a grant form (role select or debounced user search, catalog permission, scope select labelled
`(deferred)` for team/country/region, domain key required for `domain`).

**System Health** — badge for the endpoint's overall `healthy|degraded` status (previously
computed server-side and ignored by the UI), a Refresh button, and three mojibake string
fallbacks fixed. Five more mojibake strings were fixed on the RBAC page in the same pass.

Gates: full suite **969 (5991 assertions)**, lint 0 errors, tsc 0, build ok, P10 31/31,
P11 26/26, Playwright 5/5, routes 656 (+1), CATALOG 140.

## 18. Tests, CI, docs (W7)

**CI workflows** (`.github/workflows/backend.yml` = PHPUnit / lint-typecheck-build / Playwright
jobs on postgres:16; `module-boundaries.yml` = ModularMonolith + FrontendPolicy +
AdminAuthorizationMatrix gates) — every `setup-php` step now pins **8.5**: the composer lock
ships symfony/* **v8.1** components requiring php `>=8.4.1`, so the old 8.3 pin failed
`composer install` platform checks before any test could run (the tree has no git remote, so
the workflows had never executed until now). The e2e job's `E2E_MIN_TESTS` floor rose 5 → 6
with the new sweep.

**E2E console sweep** (`e2e/admin.spec.ts`) — super admin logs in and opens `/admin/reports`,
`/admin/analytics`, `/admin/system`, `/admin/audit-logs`, asserting each page heading and the
**absence of the `An unexpected error occurred.` catch-all flash**. This is the first browser
test that watches the web error contract, and it caught **latent bug 8** on its first run:
`productCategoryBreakdown()` returned a `Collection` despite `: array` → `TypeError` →
`GET /api/admin/analytics/categories` always 500 → the analytics page's `Promise.all` died
with "Failed to load analytics". Fixed (`->get()->all()`) with a regression test
(`AdminAnalyticsRangeExportTest` 9/9).

Gates: full suite **970 (5996 assertions)**, lint 0 errors, tsc 0, build ok, P10 31/31,
P11 26/26, Playwright 6/6 (+ floor at 6), routes 656 (unchanged), CATALOG 140.

## 19. Console self-service, access switches, editable text (W8)

Three user-directed pillars, all shipped behind the existing gates:

**1. Admins manage products, people and more from the console.**
- Products console (`Products.tsx`) now has full CRUD: Add/Edit dialogs (vendor select from
  `/api/admin/vendors`, name/description/category/price/stock, `is_active` toggle on edit) and
  an Archive confirm — all through the existing `/api/products` routes where
  `ProductController::isAdmin()` (super + administrator) bypasses vendor ownership; admins
  publish on create (`approved_at` + `is_active=true`); buttons are gated in the FE by
  `products.products.*` grants (which only super/administrator hold — lockstep with the
  backend check). Also fixed the always-blank vendor column (`p.vendor_name` →
  `p.vendor.store_name`).
- Users console: **Add User** dialog (name/email/password/role from the roster) behind
  `users.users.create`; new `POST /api/admin/users` route = `permission:users.users.create`
  **and** `can:manageUsers`. Creation flow: email uniqueness (soft-delete aware) →
  `assertAssignable()` escalation guards **before any row exists** → `UserAdminService::create`
  (uuid, hashed password, pre-verified) → `RoleAssignmentService::assign()` for the initial
  grant. MATRIX: `administrator` += `users.users.create` (CATALOG unchanged at 140);
  security_admin deliberately keeps manageUsers without create (guard would 403 anyway).

**2. Super admin turns admin access on/off from his dashboard.**
- `GET /admin` now shares `adminAccess` (super-only): every account holding a role beyond
  `user`/`worker`, with roles, suspended state and an `is_self` flag — rendered as switches in
  a new **Admin Access** panel (self-switch disabled, per-row busy state, toasts).
- Suspension is now immediate, not just at next login: `UserAdminService::suspend()` revokes
  tokens **and deletes the user's `sessions` rows** (SESSION_DRIVER=database), a new
  `EnsureAccountActive` middleware runs on the web append and after `auth:sanctum` on the
  api/admin group (API → 403 JSON with the suspended message; web → logout + redirect to login
  with errors), and both `EnsureUserHasRole`/`EnsureUserHasPermission` short-circuit suspended
  accounts too. Guards: self-suspend 403; suspending the **last active super admin** 409
  (`UserAdminService::isLastActiveSuperAdmin()`).

**3. No-code management of displayed text.**
- `config/ui_texts.php` holds five wired strings (login title/subtitle, admin console brand,
  dashboard heading, footer site name) with defaults identical to the previous hardcoded text;
  `UiTextService` (Core, behind `UiTextServiceInterface`, bound in AppServiceProvider) merges
  config defaults with stored `system_settings` rows keyed `ui.*` (cache-flushed by the
  Settings domain on every write — edits appear immediately). Shared to every Inertia render
  as the **nested** `uiTexts` prop (`uiTexts.ui.login_title.value` — nested so Inertia
  dot-notation survives the dots in the keys); editor endpoint `GET /api/admin/ui-texts`
  behind `can:manageSettings` feeds a new **UI Text** section in Admin Settings (label + key +
  value rows, saved through the existing `PUT /api/admin/settings` upsert — so unknown `ui.*`
  keys are creatable too). Wired consumers: `Login.tsx`, `ConsoleLayout.tsx` (admin brand),
  `Dashboard.tsx` (heading), `Footer.tsx` (site name).

Architecture note: the first cut of the new controller queries (`DB::table('users'/'user_roles')`
in `AdminUserController`) failed `ModularMonolithTest` — module Admin owns only cms/jobs tables.
Fixed by pushing them into Core (`UserAdminInterface` += `emailExists`, `create`,
`isLastActiveSuperAdmin`), exactly what the contract's docblock demands ("all queries on
users/user_roles/profiles live here, not in controllers").

E2E hardening: the return-journey test now issues `DELETE /api/cart` before the flow —
leftover cart items from prior runs pushed `existing + 1` past stock and 422'd the add on
repeat runs. Operational note: `POST /login` carries `throttle:10,1` keyed by IP, and the P10
matrix logs in many roles from the same 127.0.0.1 — running P10/P11 and the Playwright suite
back-to-back inside the same minute can exhaust the bucket (429 → the wrong-password test
fails); CI runs e2e in its own job, locally wait a minute between gates.

Gates: full suite **995 (6130 assertions)**, lint 0 errors, tsc 0, build ok, P10 31/31,
P11 26/26, Playwright 6/6 (+ floor at 6), routes 658 (+2), CATALOG 140.

## §20 No-code platform schema + spec S64 aliases (Wave B, 2026-09-27)

- **New tables (10)**: `cms_blocks`, `cms_revisions`, `navigations`, `navigation_items`, `cms_forms`, `cms_form_submissions`, `media_library`, `dynamic_modules`, `dynamic_module_entries` — migration `2026_09_27_000002_create_no_code_platform_tables.php`; UUIDv7 primary keys (time-ordered, spec S70) via `Core\Traits\HasUuid7` + `App\Models\Uuid7Model`; FKs, indexes, unique constraints, soft deletes throughout. Self-referencing `navigation_items.parent_id` FK added post-create so PostgreSQL validates against the registered PK.
- **Entities (10)**: `Modules\Admin\Entities\{CmsPage, CmsBlock, CmsRevision, Navigation, NavigationItem, CmsForm, CmsFormSubmission, MediaItem, DynamicModule, DynamicModuleEntry}` — proper Eloquent models (the legacy CMS tables previously had none; raw `DB::table` only).
- **CATALOG 140 → 184** (+28 spec S64 2-segment aliases: `users.view`, `products.manage`, `cms.publish`, `payments.refund`, `rbac.manage`, …; +15 no-code: `cms.blocks.*`, `cms.revisions.*`, `navigation.*`, `forms.*`, `media.*`, `modules.*`). Original 140 byte-identical (pinned by `test_existing_140_permissions_unchanged`).
- **2-segment alias resolution**: `User::hasPermission()` expands `module.action` to every `module.*.action` catalog entry and grants when any is held — so spec S64 checks (`users.view`, `cms.manage`) resolve against the 3-segment matrix without renaming existing grants.
- **MATRIX grants updated**: `administrator` += `navigation.*`/`forms.*`/`media.*`/`modules.*`; `content_manager` += `cms.blocks.*`/`cms.revisions.*`/`navigation.*`/`forms.*`/`media.*`/`modules.*`; `cms_editor` += `cms.blocks.*`/`cms.revisions.*`/`navigation.view`/`media.*`; `learning_admin` += `cms.blocks.*`; `moderator` += `cms.blocks.view`. super_admin still `*`.
- **Ownership**: `ModularMonolithTest` Admin allowlist extended with the 10 new tables (Admin owns the no-code platform).
- **Tests**: `WaveBNoCodeSchemaAndRbacTest` 9/9 (204 assertions) — tables exist, UUIDv7 format, nav tree, media, dynamic modules, alias resolution, original-140 intact.

## §21 No-code block CMS engine (Wave C, 2026-09-27)

- **Closed registry (S42/S68)**: exactly 24 block slugs in `BlockRegistry` — hero, rich_text, image, cta, banner, video, gallery, spacer, divider, cards, stats, testimonials, faq, featured_content, product_grid, course_grid, doctor_grid, expert_grid, vendor_grid, category_grid, service_grid, need_categories, healthcare_services, learning_categories. `GET /api/admin/cms/blocks/registry` serves the field schemas that drive the admin editor's generic form; the public renderer (`BlockRenderer.tsx`) switches on the same 24 slugs and ignores anything else (rogue DB rows render nothing, page still 200). Structured content only — no HTML/PHP/JS/SQL execution (S42/S68).
- **Validation (S41/S68)**: unknown block type → 422 ("Only the 24 registered block types"); URL fields accept only http/https/mailto/tel/`/path`/`#anchor` (`javascript:`/`data:` rejected); `required_if` (filter demanded when `source=selected`); unknown data keys stripped; list items bounded; payload capped at 100 blocks/page.
- **Revisions (S41/S45/S71)**: every save/restore appends a `cms_revisions` snapshot (page metadata + ordered blocks) and prunes beyond `config('cms.revision_retention')=50`; restore writes a NEW version (history never destroyed); page metadata updates append a `Details updated` snapshot.
- **Draft preview (S99)**: `/p/{slug}` renders published pages for everyone; drafts only for non-suspended `manageCms` holders (super_admin/administrator/content_manager/cms_editor); guests and everyone else get a real HTTP 404 (mirrors the web catch-all — never a 302 soft-404 that would leak draft URLs).
- **Caching (S109)**: block skeleton cached per slug (`cms.page.{slug}`, TTL 900s) and invalidated by every builder mutation; dynamic grid items (products, needs, doctors, courses, …) resolve fresh on each request from real tables.
- **Navigation builder (S46)**: full-replacement `PUT /api/admin/navigations/{id}/items` with client-supplied UUIDs (`forceCreate` — `Uuid7Model` guards `id`), url-or-page_slug destination, parent-in-payload + self-parent/foreign/cycle guards (422), parents inserted before children (topological order so the self-referencing FK never fires). Locations: header/footer/mobile/category/more. Public menu consumption lands in Wave D.
- **Media library (S44/S86)**: uploads record a `MediaItem` (server-detected MIME, image dims, owner); SVG/executables stay 422 with no row; index/delete owner-scoped (super bypasses).
- **Ownership**: `ModularMonolithTest` Admin allowlist unchanged (the two builder migrations touch legacy `cms_pages`/`cms_revisions`, already Admin-owned).
- **Gates**: `WaveCCmsBlockEngineTest` 18/18 + `WaveCNavigationMediaTest` 9/9 (27 tests, 210 assertions); focused `--filter=WaveC` green; full suite **1040 passed (6572 assertions), 0 failures** (`waveC_full.log`, 831s); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 667.

## §22 Public navigation + Home 26 sections (Wave D, 2026-09-28)

- **Contract**: `Core/Services/Contracts/PublicNavigationInterface.php` — `menus(?User): array` (keys `header`/`footer`/`mobile`/`category`/`more`, items `{id,title,url,icon,target,devices,children[]}`) + `flush()`; bound to `Core/Services/PublicNavigationResolver` in `AppServiceProvider`. Core is exempt from `ModularMonolithTest`, so the resolver reads Eloquent directly.
- **Resolver (S6/S46/S109)**: raw published+active rows cached under `navigations.public` (TTL 300s); per-request visibility filter `all|guest|auth|role` — **role visibility fails closed when the user holds no permissions, even `super_admin`**; tree build with cycle guard; visible orphans (children of hidden parents) are promoted with their subtree; item URL = `url` ?: `/p/{page_slug}` ?: `/`.
- **Wiring**: `HandleInertiaRequests` shares `siteNav` on every response; `AdminNavigationController::flushMenuCache()` invalidates on store/update/destroy/replaceItems; `NavigationSeeder` publishes the 5 default menus idempotently (registered after `PermissionSeeder`).
- **`/` route (S8)**: `HomePageController::root` — guests and marketplace roles render `Home/Index`; console roles keep their role landing (verified: all priority role landings are non-default); `/home` route retained.
- **Home payload (S8)**: `HomePageController::sections()` — 11 always-present keys (dailyDeals, featured, deals, services, jobs, hotels, transportation, food, agriculture, realEstate, buildingServices), each try/catch-isolated with limit 6 and a uniform `{id,title,subtitle,image,url,badge,price,rating}` DTO; `Dashboard` receives the same payload.
- **Frontend (S6/S7/S8)**: `Home/Index.tsx` renders spec §8 order 3-25 (`data-testid="home-section-*"`), empty rails hide themselves (never placeholder content); `Header`/`Footer`/`BottomNav`/`CategoryGrid` consume `siteNav` with hard-coded fallbacks identical to the seeder; device filtering is client-side (header desktop, bottom nav mobile); Home links `/` for everyone including staff.
- **Gates**: `WaveDPublicNavTest` 10/10 + `WaveDHomeSectionsTest` 8/8 (18 tests, 203 assertions); focused `--filter=WaveD|WorkspaceLanding` 28/28; full suite **1058 passed (6781 assertions), 0 failures** (`waveD_full.log`, 801s); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 672.

## §23 Needs lifecycle S10-S14 (Wave F, 2026-09-28)

- **Workflow schema (S10/S13)**: `need_requests` extended (subcategory, quantity, currency, country, preferred_date, `images` json, service/delivery requirements, notes) with `need_requests_status_check` re-created for the **17 spec states** (draft/pending/published/reviewing/offered/negotiating/accepted/payment_pending/paid/in_progress/fulfilled/completed/cancelled/rejected/expired/disputed/refunded); `need_request_events` table records every transition (actor, from→to, action, note) for the S12 timeline.
- **Lifecycle API (S11/S13)**: `NeedRequestController` — `store()` full S11 validation + `save_as_draft` (draft|pending); `index()` `scope=mine` (owner's board) / `open` (OPEN_STATUSES marketplace with category/q filters); `show()` timeline + payment (owner/admin `NRPAY-%`) + competing offers hidden from non-owners; `submitOffer` → `offered` first / `negotiating` re-submit; accept/reject owner-only via `offers/{offerId}/accept|reject`; `transition` role-guarded (owner: submit/publish/cancel/expire/dispute; provider: start/fulfill/complete/dispute; moderator: reject/expire/refund); `pay` amounts come from the accepted offer (server-owned) through `PaymentGatewayInterface`; `refund` runs the real gateway refund (422 on failure).
- **OPEN_STATUSES contract**: `pending, published, reviewing, offered, negotiating` — one constant shared by the open index, offer submission, accept/reject, expire, and public show guards.
- **Pages (S10/S12/S14)**: `NeedsPageController` — `/needs` (16 always-present section rails + categories + nearby-city prompt) and `/needs/{slug}` (open requests + published items as server props); web routes for `/needs/create`, the 7-page my-needs workspace (list, hub, offers, messages, payment, tracking, review) and canonical `/needs/{category}/{id}` (legacy `/needs/requests/{id}` retained for pinned tests).
- **Frontend (S10-S14)**: `needs/Index.tsx` (rails/search/submit CTA/carousel deep-links), `needs/Request.tsx` (S11 form + drafts + uploads), `needs/Show.tsx` (S12 canonical-slug redirect, 17-state pill, provider offer form, role-aware actions, timeline, payment state), `needs/Category.tsx` (server props), `needs/MyNeeds.tsx` + `my/*` (S14 workspace incl. per-need chat, pay/receipt, tracking timeline, star review); shared `lib/needs.ts` status helpers; honest empty/error states only (S98).
- **Review (S14)**: `need_request` reviews — requester-only (403), completed-only (422), once (422); filtered `GET /api/reviews` powers the review page.
- **Gates**: `WaveFNeedsWorkflowTest` 8/8 + `WaveFNeedsPagesTest` 8/8 (16 tests, 288 assertions); focused `--filter=WaveF` 16/16; full suite **1074 passed (7069 assertions), 0 failures** (`waveF_full.log`, 801s); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 681.

## §24 Commerce spec §115 Phases 7+8 - catalog/cart/orders/vendor portal (Wave G, 2026-09-28)

- **Schema (S9/S32/S33/S34/S61)**: unique `slug` columns on `products`/`vendors`/`need_items` (backfilled with numeric collision suffixes), `vendors.settings` json, `cart_items.product_variant_id` + `variant_name`, `orders.tax`, 12-state `orders_status_check`, `return_requests.previous_status`/`disputes.previous_status` restore points, `shipping_rates.estimated_days`, `order_tracking.proof_of_delivery`; new `vendor_services` table (own-vendor scoped, soft deletes); `vendor_orders` CHECK += `completed`.
- **Canonical slugs (S9)**: `HasSlug` on Product/Vendor/NeedItem; slug-or-id page controllers with 301 from legacy id URLs (`/products/{slug}` + reviews/vendor sub-pages, `/vendors/{slug}` + products/services/reviews, `/deals/{slug}` landing before the `/deals/{id}` resolver, category slug-or-id); `GET /deals?category=` + `/deals/category/{slug}` vertical landings; unknown product slug hits the **locked 404 contract** (web redirect-back 302, JSON 404).
- **Cart (S33)**: variant lines resolve effective price/stock from `product_variants` (unresolvable/inactive → 404 `Item not found`), server-side tax via `CommerceTax` + `config/commerce.php` (rate 0 default keeps pinned totals honest), vendor grouping with `is_accepting_orders` (**paused vendor → 422** on add), ETA from `ShippingService::estimatedDays()`.
- **Orders (S32)**: `PlaceProductOrder` persists tax + variant, clears the cart, seeds `order_tracking.estimated_delivery`; 12-state workflow through `OrderStateMachine` (admin `VALID_STATUSES` never includes provider-owned `paid`); cancel/complete + proof-of-delivery uploads; returns freeze at `refund_requested` (reject resumes via `resumeOrder()`, approve sets `returned` before the gateway refund); disputes hold the order at `disputed` and restore `previous_status` on close/resolve — **except `resolution=refund`, which keeps the order disputed until the refund lands** (shared by `DisputeController@close` and `AdminDomainController@updateDispute`).
- **Vendor portal (S34)**: `VendorWorkspaceController` API (`/api/vendor/profile`, `/api/vendor/settings`, `/api/vendor/services` CRUD, `/api/vendor/reviews`, `/api/vendor/bookings`, earnings) all scoped to the authenticated user's own vendor; web routes `/vendor/{dashboard,profile,services,bookings,reviews,earnings,settings}`; `VendorResource` exposes `slug`; portal pages share `components/vendor/VendorTabs.tsx`.
- **Frontend**: `lib/orderStatus.ts` mirrors the 12-state contract; variant picker on `products/Show`, tax/variant/paused/ETA rows on `cart/Index`, 12-state + workflow gates on `orders/Index|Show`; new public sub-pages `products/{Reviews,Vendor}`, `vendors/{Products,Services,Reviews}`, `deals/Category`; `deals/Show` renders the real NeedItem shape; slug sweep across listing pages, `ProductCard`, recently-viewed; vendor portal pages `vendor/*`.
- **Gates**: `WaveGCatalogSlugTest` 10/10 + `WaveGCartVariantTaxTest` 5/5 + `WaveGOrderWorkflowTest` 11/11 + `WaveGVendorPortalTest` 8/8 (34 tests, 177 assertions); pinned commerce regression batch 205/205; full suite **1108 passed (7246 assertions), 0 failures** (`waveG_full.log`, 854s); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 707.

## §25 Payments spec S31/S73/S74 (Wave H, 2026-09-28)

- **Schema + states (S31)**: `payments.purpose` column; `payments_status_check` re-created with the full vocabulary incl. new `cancelled` (legacy `completed` terminal-only, finance reporting untouched); `PaymentStateMachine` TRANSITIONS map: succeeded → (partially)/refunded, terminal failed/cancelled/refunded, same-state idempotent for webhook repeats.
- **Idempotency (S31)**: the frontend's `idempotency_key` (previously dropped at `validated()`) now flows to the gateway; `ChargePayment` replays the original payment past the paid-order guard and skips side effects on concurrent replays; creation runs in a savepoint so a concurrent 23505 insert becomes an idempotent replay.
- **Purpose (S31)**: server-derived on every charge (`order_payment`/`checkout`, `wallet_deposit`, `course_enrollment`, `need_payment`/`need_payout`, `task_payout`); exposed on `PaymentResource`; balances-pay stays deferred to Wave I (§115 Phase 10 wallet), pinned `method=wallet` passthrough preserved.
- **Webhooks (S74)**: transition-validated updates (stale events → recorded `ignored`, never resurrecting), `payment_webhook_events.payment_id` linkage, atomic insert-first dedupe (savepoint-safe), `payment.webhook_*` audits, `payment_intent.canceled` → `cancelled`; replay windows unchanged (Stripe ±300s pinned, Paystack/PayPal rely on signature + event-id idempotence — no timestamp header exists there).
- **Gateway honesty (S73)**: unknown driver throws instead of silently mocking; mock runs only when config **and** runtime agree on local/testing; `config/payments.php` honors the documented `PAYMENTS_*` env names (fallback legacy) + `paypal.access_token`; unconfigured Stripe/Paystack/PayPal still fail closed (422, no false success).
- **Refunds + reconcile (S31)**: lock-protected, accumulated chained partials with `completed`/`refunded`/`partially_refunded` vocabulary; `financial:reconcile` adds refund-drift + webhook-health reports (flags/order/schedule untouched); new `GET /api/payments/methods` lists only working methods, auth-gated, before `/payments/{id}`.
- **Gates**: `WaveHPaymentsTest` 10/10 (47 assertions); pinned payment-affected batch 200/200; full suite **1118 passed (7293 assertions), 0 failures** (`waveH_full.log`, 1576s); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 708.

## §26 KYC + wallet spec S28/S29 (Wave I, 2026-09-28)

- **KYC (S28)**: identity columns + attempts + `verified_at` (stored vocabulary unchanged); `KycStatus` canonical states (submitted→under_review, approved→verified) with `verification_state` on every user response; document paths scoped to the uploader's own `kyc-documents` folder (arbitrary paths 422); redacted owner view (masked number, no paths/reviewer); reviewer `requires_action` loop with mandatory reasons; document streaming for owner + reviewers (no public URLs, traversal-guarded, no-store); admin queue + UI gain the requires_action filter/action and front/back doc links.
- **Gating (S28)**: withdrawals, transfers and wallet payments require verified identity (403) at the API boundary; deposits and holds stay ungated; ledger services stay pure.
- **Wallet (S29)**: pay-from-balance for verified+funded wallets (debit `WALLET-PAY-*`, provider wallet, idempotent create-or-resume) with honest 403/422/passthrough fallbacks; refunds return to the wallet when the charge was ledger-backed; debits/transfers respect active holds; fixed the no-arg `InsufficientFundsException` crash (now 422, not 500); `available` returns balance/available/pending; user transaction type filter + owner-scoped details; new transfer endpoint (verified, paired references); reconcile adds incomplete-transfer + negative-availability reports (pinned lines untouched).
- **Frontend**: `kyc/Submit` + `/kyc`; `wallet/Index` shows true available/total/on-hold, working deposit, KYC-aware withdraw errors, type filter, detail links; `wallet/Transaction` + route; admin KYC requires_action + docs; Checkout offers wallet only when the server says it is enabled and funded.
- **Gates**: `WaveIWalletKycTest` 15/15 (92 assertions); KYC/wallet/payment pinned batch 435/435; full suite **1133 passed (7385 assertions), 0 failures** (`waveI_full.log`, 1513s); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 714.

## §27 Financial services spec S30 (Wave J, 2026-09-28)

- **Catalog (S30)**: 5 services (airtime/data/electricity/internet/tv) in `config/bills.php` with countries/currencies/fields/min/enabled; `BillCatalog::availability()` derives country + currency + provider reasons; `GET /api/bills/services` reports `available` + `unavailable_reasons` (never hides, never fakes).
- **Providers (S30)**: `BillProviderInterface::vend()` + mock (dual local/testing guard, explicit test failure flag) + manual (`pending_manual`, never succeeds) + resolver that throws on unknown drivers; unconfigured providers fail safe (422, no debit, no succeeded rows).
- **Purchase (S30)**: `PurchaseBill` validates → replays idempotently → KYC-gates (403) → resolves before money → records pending → debits the holds-aware wallet → vends → settles or reverses via `WALLET-REF-BILL-*` and persists the failed row (never a fake success); manual stays pending without moving money; every purchase writes a `bill_payment` payment row.
- **Privacy + history (S30)**: account identifiers masked (`****`+last4, raw fields never exposed); owner-scoped list/show.
- **Frontend**: `bills/Index` + `/bills` with country/currency selectors, dynamic per-service forms, masked receipts, KYC links, history; nav entries in AppLayout/account/footer.
- **Gates**: `WaveJBillsTest` 10/10 (66 assertions); finance/wallet/payment pinned batch 268/268; full suite **1163 passed (7680 assertions), 0 failures** (`waveM_full.log`, 978s — combined J–M close-out); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 769.

## §28 Healthcare spec S21-S25 (Wave K, 2026-09-28)

- **Booking integrity (S23)**: `BookAppointment` in one transaction with the doctor row locked; partial unique index `health_tickets_doctor_slot_unique` (live dated slots only); raced inserts surface the identical clash 422 via savepoint (never a 500); all other validation untouched.
- **Pharmacy (S25)**: `medicines.vendor_id/dosage_form/strength/manufacturer` columns + relation (admin catalog API persists for real, `show` embeds the vendor); order placement checks stock and active prescriptions with atomic decrement; new `pharmacy/Show` detail page (+ `/healthcare/pharmacy*` aliases).
- **Spec pages (S22)**: `doctors/{id}` renders the profile (`/profile` alias kept, `/book` added, WaveA-safe); new availability/reviews pages; lab detail + bookings + booking detail; health-services hub with config emergency block; providers directory + detail; healthcare search (`?q=` server filter on doctors); doctors list made public per spec.
- **Config + API (S21)**: `config/health.php` emergency numbers + support blurb; `GET /api/health/emergency`.
- **Gates**: `WaveKHealthcareTest` 7/7 (47 assertions); healthcare/pharmacy pinned batch 221/221; full suite **1163 passed (7680 assertions), 0 failures** (`waveM_full.log`, 978s — combined J–M close-out); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 769.

## §29 Learn LMS spec S15-S20 (Wave L, 2026-09-28)

- **Schema + grading (S17/S18/S19)**: course level/objectives/requirements/language, lesson resources + free previews, enrollment recency, `lesson_notes` table; quiz submit no longer leaks the answer key (attempts still persist score/total/passed).
- **Certificates (S20)**: public verify-by-code API + page, owner-scoped detail + printable download; fixed the wrong `UserCertificate` namespace (latent crash).
- **Pages (S16)**: canonical 301 to `/learn/{id}`, per-quiz pages, categories + slug, instructors directory, search, progress, certificate detail, public verify; Show gains instructor/objectives/quizzes/progress/claim/reviews; Lesson gains resources + notes; Index gains isolated rails; Catalog gains search.
- **Gates**: `WaveLLearnTest` 8/8 (86 assertions); Learn pinned batch 69/69; full suite **1163 passed (7680 assertions), 0 failures** (`waveM_full.log`, 978s — combined J–M close-out); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 769.

## §30 Account center spec S26-S27 (Wave M, 2026-09-28)

- **Canonicals (S27)**: 17 new `/account/*` routes reusing existing components/controllers (no URL/component changes to the 4 pinned pages); `/account/orders` fixed to serve real orders.
- **Payment methods (S26)**: cache-backed saved references with validated CRUD API + hub page (details stay with the provider).
- **Pages (S26/S27)**: booking detail, financial-services hub, focused deposit/withdraw pages; hub lists extended; owner/participant scoping reused exactly.
- **Gates**: `WaveMAccountTest` 5/5 (96 assertions); full suite **1163 passed (7680 assertions), 0 failures** (`waveM_full.log`, 978s — combined J–M close-out); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 769.

## §31 Verticals spec S53-S60 (Wave N, 2026-09-28)

- **Rides (S55)**: fabricated fare/time estimates removed (quotes confirmed on accept); locked accepts; complete/cancel lifecycle with confirmed fares + driver counters; driver registration + availability endpoints.
- **Food (S56)**: `PlaceFoodOrder` shared action (ownership/availability/server totals/persisted items); dead `order()` fixed; empty-cart stub removed; Checkout reads the real client cart.
- **Real estate (S58)**: `listing_type` column; `store` rewritten to real columns; my-listings endpoint + page; `/real-estate*` aliases; working create form.
- **Building (S59)**: real worker assignment (auto + manual with clash/availability guards), quote + complete/cancel lifecycle, fixed `worker()` relation.
- **Jobs (S53)**: application show/pipeline updates, employer profile, admin applicants list, 5 spec pages.
- **Hotels (S54)**: booking aliases (API + web) + detail page, review loop, stay-status constants.
- **Experts (S60)**: categories directory + qualification/experience filters (pinned shapes untouched).
- **Agriculture (S57)**: farmers directory from real vendors + dynamic subcategory shelves (never hard-coded).
- **Gates**: `WaveNVerticalsTest` 12/12 (100 assertions); full suite **1175 passed (7780 assertions), 0 failures** (chunked runs); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 796.

## §32 Messaging/notifications/reviews/support spec S50-S52/S62 (Wave O, 2026-09-29)

- **Notifications (S50)**: index `?type=`/`?is_read=` filters + unread-count badge; `notify()` elevated to the service contract; broadcast best-effort (500-char); transactional fan-out wired (wallet ×2, KYC decision, certificates, bill purchases, building assignments, ride accepted/completed) — never breaks the business op.
- **Messaging (S51)**: self-conversation 422; participant-only threads kept; ticket staff checks now include `support_admin` (console roles aligned); `TicketResource.message` fixed (was a broken relation → null).
- **Reviews (S52)**: write throttles on the mutation routes; new one-per-user vote endpoint with server-side `helpful_count` recount.
- **Support (S62)**: `attachments` columns on tickets + messages scoped to the sender's ticket-uploader scope (foreign/traversal 422); ticket-number collision retried; staff detail API (full thread + events) + `admin/SupportDetail` page linked from the desk; spec-62 web URLs added; legacy `/tickets*` kept rendering (pinned WaveA 200 honoured over a 301 plan).
- **Gates**: `WaveOMessagingTest` 12/12 (112 assertions); full suite **1187 passed (7888 assertions), 0 failures** (chunked runs); lint 0 errors; tsc 0; build ok; CATALOG 184 unchanged; routes 803.

## §33 Admin control plane spec §47/§48/§49/§63/§65/§66 (Wave P, 2026-09-30)

- **Roles (§65)**: canonical roster 35 → **38** (`category_admin`, `vendor_manager`, `content_admin`): `AppRole` cases + labels + hierarchy; `AdminRbacController::ROLES` + comment; `AdminPolicy::viewDashboard` (+3), `manageVendors` (+VENDOR_MANAGER), `manageCms` (+CONTENT_ADMIN); web splits — `/admin/categories` own group (`...moderator,category_admin`), `/admin/vendors` own group (`super_admin,administrator,platform_ops,vendor_manager`), `/admin/cms` + `/admin/newsletter` +`content_admin`, `/admin/category` + `/admin/brands` +`category_admin`; API brands ×4 + newsletter role parity (+`content_admin`); `config/workspace.php` landings + priority + `admin_console_roles` +3; `PermissionSeeder::MATRIX` rows (`category_admin → categories.* + products.view`, `vendor_manager → vendors.* + products.view`, `content_admin → cms.* + navigation.* + media.*`); live DB re-seeded (role_permissions: category_admin 3 / vendor_manager 6 / content_admin 16); suites extended to the 38 roster (`CanonicalRolesTest` count, `AdminRoleAuthorizationSuiteTest` probes + console parities, `AdminAuthorizationMatrixTest` MATRIX/allow-deny/registry, `AdminConsoleApiParityTest` consoleMap).
- **Categories (§48)**: migration `2026_09_30_000002` SEO columns (`meta_title/_description/_keywords`, `hasColumn`-guarded); model fillable; store/update SEO validation; server-side `uniqueSlug()` numeric suffix (slug regenerates on rename only); `isDescendant()` cycle guard (self/descendant → 422 `"A category cannot be nested under itself or its own child."`); `AdminPageController::categories()` selects SEO cols ordered by sort_order+name; `admin/Categories.tsx` full form incl. SEO block, parent picker (descendant-excluded), tree, search.
- **Audit (§66)**: migration `2026_09_30_000001` adds `ip_address` + `metadata` to `audit_logs`; `AuditService` IP capture made `runningUnitTests`-aware so feature tests can pin it; emissions from API + web login/logout/failures, RBAC grant/revoke with old/new (existence reads live behind new `PermissionServiceInterface::rolePermissionExists/userPermissionExists` — `ModularMonolithTest` caught module-local `DB::table` reads in-wave and Core absorption fixed it), CMS publish, product create, domain creates; dynamic action whitelist (`VALID_ACTIONS` ∪ emitted) + `GET /api/admin/audit-logs/actions` (`can:viewAuditLogs`); console `AuditLogs.tsx` action dropdown + IP column; export CSV contract unchanged.
- **Analytics (§63)**: `adminAnalyticsSeries` extended with 8 domain metrics (orders, bookings, healthcare, learning, needs, services, wallet, payments) + `adminConversionFunnel` (Signed up/Orders/Payments succeeded; rates null when denominator is 0, never 0% invented); `dailySeries()` column-parameterised with `hasColumn` guard (learning reads `enrollments.last_active_at` — that table has no `created_at`); new `GET /api/admin/analytics/domains` (`can:viewAnalytics`) returning `{range, since, series, funnel}`; `Admin/Analytics.tsx` domain cards + funnel card with empty states.
- **Search (§49)**: `discover()` rewritten — 14 groups, every row stamped server-side `type` + canonical `url` (all URL prefixes covered by web routes); controller `TYPES` whitelist (unknown → 422) + `types` advertised in the response; `search/Results.tsx` rewritten (15 tabs synced to the URL, per-group field mapper, server URLs with `/search` fallback).
- **Content creation (§47)**: dead `ProductCreated` event + `IndexProductForSearch` placeholder listener + provider mapping removed (search is DB-direct; stale composer classmap purged); new role-gated admin creates `POST /api/admin/courses|restaurants|hotels|properties` (validated, auto-live, audited `create`) + Add-forms in `admin/Learning|Food|Hotels|RealEstate.tsx`; propagation pinned by test (listing + detail + unified search + audit row).
- **Gates**: `tests/Feature/WaveP` 6 files, 34/34 (340 assertions); full suite **1227 passed (8407 assertions), 0 failures** (chunked runs: 383+82+151+116+266+229); `ModularMonolithTest` red-then-fixed in-wave (P1 reads moved to Core); lint 0 errors (2 pre-existing warnings); tsc 0; build ok; CATALOG 184 unchanged; `route_list.txt` regenerated — **809 routes** (4 admin creates + audit-logs/actions added in Wave P); live matrix 43/43 after fixing a `| Out-Null` false-negative in the script's 302 probe; Playwright 6/6.

## §34 Security hardening spec §67/§68/§85/§86/§95 (Wave Q, 2026-09-30)

- **Audit first**: `eval`/`unserialize`/shell — none; user-controlled server fetches (SSRF) — none; user-controlled redirects — none; path-based file serving — none; mass assignment — fillables everywhere; FE — no `dangerouslySetInnerHTML`, no dynamic `<a href>`.
- **Already structural**: Eloquent parameter binding; server-side order pricing (no price fields accepted); wallet `DB::transaction` + `lockForUpdate` + holds-aware spendable balance; stock `lockForUpdate` + in-transaction decrement; payment `idempotency_key` replay; Stripe/PayPal/Paystack webhook HMAC verification (`hash_equals`); upload `mimes` whitelist + hash names + uploader scope + traversal-safe delete; CMS 24-type closed `BlockRegistry` + schema validation + URL-scheme whitelist; CSP/security headers global; per-route throttles on auth/mutations.
- **Fixed in-wave**: new `App\Rules\NoExecutableCode` (rejects `<?php`/`<?=`/`<%`/`<script`/`</script`, prose-safe) wired into `BlockRegistry` text/textarea rules (all 24 types), page/blog/announcement `content`, plus `safeUrlRule()` on banner `link_url`/`image_url` and page `seo_image`/`canonical_url`; deleted dead naive `XssSanitizer` + `PreventSqlInjection` middleware (unwired; listed only in the superseded legacy `Kernel.php`) and their stale references.
- **Gates**: `tests/Feature/WaveQ/WaveQSecurityTest` 12/12 (39 assertions — §95 battery, green first run, no code fixes needed); affected gate **521 passed (4333 assertions), 0 failures** (Admin, Architecture, Categories, Orders, Payments, Reviews, Search, Security, Upload, Wallet, WaveC, WaveQ, SecurityHeadersTest); lint 0 errors; tsc 0; full-suite arithmetic **1239 passed (8446 assertions)**; live spot-checks (CMS `<script>` → 422, CSP headers present).

## §35 Performance §109/§110/§111 (Wave R, 2026-09-30)

- **Audit first**: product listing N+1-clean (`vendor` eager, `images`/`reviews_count` denormalized columns); listeners already `ShouldQueue`; CMS/navigation cached with invalidation; no `eval`/fetch/redirect hazards (see §34).
- **Indexes (§109)**: migration `2026_09_30_000003` — `audit_logs(created_at)`, `payments(status,created_at)`, `users(created_at)`, `vendor_orders(created_at)`, `notifications(user_id,is_read)`; applied to live DB.
- **Cache (§109)**: `GET /api/admin/analytics/overview` cached 120s per range (`analytics.overview.{range}`); CSV export still reads live data. Live spot-check: identical payload cold vs cached.
- **Scheduler (§111)**: new `cms:prune-revisions` (daily, retention window, keeps ≥1), `needs:expire-past-deadline` (daily, `published` + past `deadline` → `expired`), `notifications:prune-read --days=90` (weekly, read-only, hard delete — model SoftDeletes would otherwise retain rows); `schedule:list` shows all five.
- **Gates**: `tests/Feature/WaveR/WaveRPerformanceTest` 7/7 (37 assertions — index pins, cache keys, prune/expire scoping guards, listener queueability, product-listing query cap ≤6); affected gate **348 passed (3928 assertions), 0 failures** (Admin, WaveR, WaveP); php -l clean; full-suite arithmetic **1246 passed (8483 assertions)**.

## §36 Frontend verification §96 (Wave S, 2026-09-30)

- **Projects**: `chromium` (Desktop Chrome) + new `mobile` (Pixel 5); admin console specs explicitly desktop-only, customer + marketplace journeys run on both; e2e timeouts raised to 20s for single-threaded dev-server capacity; marketplace navigations use `domcontentloaded` (a hanging `load` event no longer fails rendered pages).
- **New specs**: `e2e/marketplace.spec.ts` (home sections, products + empty search, verticals, register taken-email failure, login credential requirement — all on both viewports); `e2e/console.spec.ts` (Wave P category create with native-validation failure first + API cleanup, Wave Q CMS executable-content guard as `content_manager`, Wave P console tour + analytics funnel).
- **Real bugs fixed**: `ProductsPageController@index` passed a raw paginator while `products/Index` expects `{data, meta}` — page crashed on `.total` (invisible to HTTP-level checks; caught by the new browser spec); e2e now selects a buyable product instead of assuming row zero has stock.
- **Flake forensics**: transient stalls traced to the 22h-old dev server process (restarted, suite time 10.6m → 4.4m); no app changes needed beyond the two real fixes.
- **Gates**: Playwright **22 passed, 6 skipped (desktop-only console), 0 failed** across both projects; tsc 0; eslint 0.

## §37 Backend test gaps — Bills/Delivery/RealEstate (Wave T, 2026-09-30)

- **Coverage audit**: every module now has a same-named Feature suite — Bills, Delivery and RealEstate were the last three without one.
- **Real bug fixed**: `DeliveryController@show` gated vendors on `hasRole('vendor')`, a value outside the canonical 38-role roster (dead check — vendors always 403). Corrected to `vendor_admin`; pinned by test (stripped profile, no phone).
- **Suites**: `BillsPurchaseTest` 8/8 (catalog, guest 401s, unknown service 422, KYC 403 before debit, account-field 422, full purchase with wallet debit + ownership scoping, idempotent replay single-row/single-debit, provider-failure reversal); `DeliveryLifecycleTest` 10/10 (guest 401s, registration defaults, validation, availability + 404 without profile, cross-user 403s, vendor stripped vs self/admin full profile, counters, rates math); `PropertyLifecycleTest` 5/5 (guest 401s, type/price 422s, my-listings scoping, inquiry + viewing-request row, inquiry 422/404).
- **Gates**: full 6-chunk suite **1270 passed (8579 assertions), 0 failures** (383+100+151+121+266+249); php -l clean.

## §38 End-to-end workflows §97 (Wave U, 2026-09-30)

- **Gap analysis**: Needs (WaveF), CMS (WaveC) and commerce-return (e2e) chains already unbroken; Healthcare, Learning, Wallet and order-to-review had only piecemeal coverage.
- **Real fix**: `User` had no `doctor()` relation, so the assigned-doctor-completes-own path in `AppointmentController@complete` was dead (only admins could close). Added `hasOne(Doctor::class)`; pinned.
- **Chains**: `WaveUWorkflowTest` 4/4 — healthcare (admin creates doctor → link account → patient finds/views/books → doctor starts/completes → patient 403 on complete → doctor review), learning (browse → enroll → lesson → quiz pass → certificate → public verify), wallet (KYC → deposit 1000 → bills purchase 100 → withdraw 200 → balance 700 + ledger ≥3), commerce (order → pay → accept/ship/deliver → review + stock decrement). The commerce chain caught a missing payment step mid-wave (unpaid orders correctly un-acceptable) — added to the chain.
- **Gates**: full 6-chunk suite **1274 passed (8617 assertions), 0 failures** (383+100+151+121+266+253); php -l clean.

## §39 Build, seed and route audits §112/§125 (Wave V, 2026-09-30)

- **§125 validations**: `composer validate` clean; `php artisan about` sane (Laravel 13.17, PHP 8.5.4, pgsql, debug off); `migrate:status` zero pending; route list loads clean (809 with vendor routes, 803 without); all seeder files `php -l` clean; `PermissionSeeder` re-ran idempotent on live DB. `composer audit` **blocked — no network to packagist on this box** (documented per §125, not reported as passed).
- **Backend route audit**: scripted check over `route:list --json` — **605 controller actions resolve, 0 violations** (rest are closures). Script kept at `%TEMP%\opencode\route_audit.php` for re-runs.
- **Frontend route audit**: every `inertia()`/`Inertia::render()` page in routes + web controllers mapped to `resources/js/pages` — **244 pages, 0 missing** (`%TEMP%\opencode\page_audit.php`).
- **Seed validation (§112)**: live DB state verified (43 users, 41 products, 3 vendors, 10 categories, 5 courses, 27 roles in use); full `migrate:fresh --seed` never run against live (destructive) — migrations proven by every RefreshDatabase suite, seeders by the idempotent re-run + login matrix.
- **Build**: fresh `npm run build` green (deterministic hashes match Wave P); products page re-verified in-browser after the Wave S wrap fix.
- **Gates**: no code changes required in-wave (audits green first pass); suite arithmetic **1274 passed (8617 assertions)** stands.

## §40 Final definition of done §126 + delivery (Wave W, 2026-09-30)

- **§126**: Frontend (pages, navigation, responsive + mobile nav, forms, search, filters, dynamic content) — Wave S e2e on both viewports. Backend (real logic, validation, authorization, persistence, transactions, errors) — 1274-test suite. Commerce/Needs/Healthcare/Learn/Account end-to-end — §97 chains (WaveU + WaveF + e2e). Admin without code changes + data-driven CMS pages — Wave P/Q e2e. Security audit — Wave Q, nothing remaining. Testing — all green. Production — DEPLOY.md runbook (scheduler table refreshed for the 5 Wave R commands this wave).
- **Inventories**: routes 809 (803 app) · CATALOG 184 · roles 38 · PHPUnit 1274/8617 (152 files) · e2e 22 passed / 6 skipped · Inertia pages 244/244 · controller actions 605/605 · migrations 78 · seeders 14 · scheduled commands 5 · live seed 43 users / 41 products / 3 vendors / 10 categories / 5 courses / 12 orders / 270 audit rows.
- **Final gates**: live matrix 43/43 · Playwright 22/6 green · fresh build already green in Wave V.
- **ZIP**: `everythingneed-com-2026-09-30.zip` (4.7 MB, 3288 entries) at `Desktop\` — full source snapshot minus regenerable/secrets (`vendor/`, `node_modules/`, test artifacts, logs, `bootstrap/cache/*.php`, `.env`); reinstall via `composer install` + `npm ci` per DEPLOY.md.
