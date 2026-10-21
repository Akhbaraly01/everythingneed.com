# RBAC ROLES & ACCESS UI — IMPLEMENTATION PLAN
(custom roles + reversible permission revocation)

Status: implemented on 2026-10-19. Validation evidence lives in
`docs/testing/RBAC_ROLES_ACCESS_VALIDATION_PLAN.md`.

---

## 1. Goal

Rebuild the admin console page at `/admin/rbac` so a super admin can:

1. See every canonical role as a card: name, Core badge, holder count,
   permission chips ("+N more"), Manage action (reference layout, restyled
   with the project's existing design system — tokens, fonts, light+dark).
2. Create custom roles from a top-right **Create role** button (name, slug,
   description, permission picker) and delete them safely.
3. Grant or revoke any permission at any time, where revocation is
   **reversible**: the denied state is persisted, so "reduce access without
   removing it" never destroys the grant definition; a denied chip can be
   restored in place.
4. Save a whole role's permission delta in one atomic bulk action (single
   audit entry, single cache flush) instead of per-permission requests.
5. Reset a canonical role back to its seeded defaults with one click.

Everything is responsive (single column <=640px, two columns >=1024px;
verified at 375/834/1280 viewports in the e2e suite).

## 2. Authorization scope decision (documented, deliberate)

- **Permissions are the single authority (Phase 1, completed 2026-10-20).**
  Every admin console page and admin API now uses `permission:` middleware;
  `AdminPolicy` delegates to `User::hasPermission()` (only `viewDashboard`
  keeps a role list, as a documented exemption). Console navigation, the
  route gates, `WorkspaceResolver` hrefs and the RBAC matrix therefore agree
  by construction.
- Consequences for custom-role users: a custom role opens exactly the pages
  its permissions cover, and revocation removes the page, the nav entry and
  the API on the next request. `role:super_admin` remains on `/admin/rbac`
  and the RBAC write APIs only (core-role management stays core-only).
- Deliberate tightenings that fell out of permission truth: `moderator` lost
  returns-decide (`orders.orders.refund`) and the refunds queue; roles
  holding `orders.orders.view` gained read-only orders/disputes/returns
  surfaces; `finance_admin` can issue refunds (`orders.orders.refund` is in
  its seeded defaults); `vendor_admin` gained a scoped admin workspace
  (orders/inventory read). `administrator` keeps user *management* but not
  `users.users.delete`/`users.users.activate` — those stay least-privilege
  and are grantable per user or to `security_admin`.

## 3. Data model

`custom_roles` table (migration `2026_10_19_000001_create_custom_roles_table`):

| column      | type             | notes                        |
|-------------|------------------|------------------------------|
| id          | uuid pk          |                              |
| slug        | varchar(40) uniq | `^[a-z][a-z0-9_]{2,39}$`     |
| name        | varchar(60)      | display name                 |
| description | varchar null     | optional                     |
| created_by  | uuid null        | actor                        |
| timestamps  |                  |                              |

Canonical roles stay code-defined (`Core\Enums\AppRole`, 40 roles); the
registry is the single access point for "which roles exist":

- `Core\Services\RoleRegistry` (`RoleRegistryInterface`, bound in
  `AppServiceProvider`): `canonical()`, `custom()`, `all()`, `exists()`,
  `isCore()`, `label()`, `holderCount()`, `create()`, `delete()`.
- `delete()` is refused while users still hold the role unless the caller
  supplies `reassign_to`; holders move to that role in the same transaction.
- Every validation site that used `Rule::in(AppRole::values())` / hardcoded
  role lists now resolves through the registry: grant/revoke/assign/update
  requests, `AdminUserController` role filter, `RoleAssignmentService`.

## 4. API surface (all `role:super_admin`)

| method | path                                | behavior |
|--------|-------------------------------------|----------|
| POST   | `/api/admin/rbac/bulk`              | one transaction: validates role + permission names against the catalog, upserts granted rows / writes denied rows, one audit entry, one cache flush |
| POST   | `/api/admin/rbac/roles`             | create custom role (name, slug, description, permissions[]); reserved/duplicate slugs rejected; explicit `slug` wins, otherwise derived from name (`slugifyRole`, leading digits/underscores stripped server-side too) |
| DELETE | `/api/admin/rbac/roles/{slug}`      | delete custom role; 422 while users hold it unless `reassign_to` moves them atomically; canonical/unknown rejected |
| POST   | `/api/admin/rbac/roles/{role}/reset`| canonical roles only: delete the role's permission rows and reinsert `PermissionSeeder::defaultsFor($role)` (state granted) |

Least privilege: `BulkRolePermissionRequest::authorize()` requires the actor
to already hold **every permission they grant** (the route itself remains
super-admin-only, so this is defense in depth). Revokes are never escalated
up.

Existing endpoints kept: `GET /rbac/roles` and `GET /rbac/matrix` now return
`label` / `user_count` / `is_core` / `is_custom` metadata per role; grant /
revoke / user-permission routes unchanged.

## 5. Permission semantics (unchanged, mirrored everywhere)

- Comma-separated middleware params are OR; `&` inside a param is AND;
  `.*` suffix is a wildcard over the canonical catalog; an empty token is
  false. `WorkspaceResolver` mirrors this exactly
  (`satisfiesPermissionExpression/Requirement/Token`) so navigation hrefs
  agree with `EnsureUserHasPermission`.
- Denied rows persist (`role_permissions.state = denied`) so revocation is
  reversible: restore flips the row back to granted without losing its
  definition; the UI surfaces denied chips with a restore action.
- `PermissionSeeder` remains the single source of truth for canonical
  defaults: `defaultsFor($role)` / `isDefaultRole($role)` are shared by the
  seeder and the reset endpoint so they cannot drift. Catalog size is now
  ~214 entries (added `users.users.manage`, `brands.brands.view`,
  `brands.brands.manage`, `products.products.manage` for the console gates).

Cache: `rbac.matrix` (TTL 300s) and `permission.scopes`; every write path
(grant, revoke, bulk, create/delete role, reset) flushes once inside its
transaction boundary.

## 6. UI composition

Page: `resources/js/pages/admin/Rbac.tsx` (rewritten; scopes section kept).

- Stats strip — roles, custom roles, active grants, revoked count
  (`RbacStats`).
- Grant access bar — role picker + permission picker + grant, kept on the
  single-grant endpoint (`GrantAccessBar`).
- Role grid — `RoleCard` per role: Core/Custom badge, holder count,
  permission chips (first N + "+N more"), Manage; custom roles also expose
  Delete with a confirm dialog.
- Manage sheet (`ManageRoleSheet`) — full permission picker for a role with
  current granted/denied state; Save sends the computed diff through
  `/rbac/bulk` (`diffRoleSelection`), then refreshes.
- Create sheet (`CreateRoleSheet`) — name -> slug auto-derive, description,
  permission selection, create -> role appears in the grid.
- Filters — search + catalog grouping via `filterCatalog` / `groupCatalog`.
- Denied chips (`DeniedPermissionChip`) render struck-through with a restore
  action; chips use `PermissionChip`.

Shared helpers: `resources/js/lib/rbac.ts` (`humanizeRole`, `roleLabel`,
`slugifyRole`, `roleBadge`, `matrixStats`, `groupCatalog`, `filterCatalog`,
`diffRoleSelection`, `ROLE_SLUG_PATTERN`) — unit-tested in `rbac.test.ts`.

Components reuse existing primitives only: `Button`, `Sheet`, `Card`, `Ui`
(confirm dialog), `SearchInput`, `DataTable`, project tokens for color /
radius / type. No new design language was introduced.

## 7. Files

Created:

- `database/migrations/2026_10_19_000001_create_custom_roles_table.php`
- `Core/Services/RoleRegistry.php`, `Core/Services/Contracts/RoleRegistryInterface.php`
- `Modules/Admin/Http/Requests/BulkRolePermissionRequest.php`,
  `Modules/Admin/Http/Requests/CreateCustomRoleRequest.php`
- `resources/js/lib/rbac.ts` (+ `rbac.test.ts`)
- `resources/js/components/admin/rbac/{RbacStats,PermissionChip,RoleCard,PermissionPicker,GrantAccessBar,ManageRoleSheet,CreateRoleSheet}.tsx`
- `tests/Feature/Admin/{RbacBulkUpdateTest,RbacRoleResetTest,CustomRoleLifecycleTest}.php`
- `e2e/admin-rbac.spec.ts`

Modified (highlights):

- `Modules/Admin/Http/Controllers/AdminRbacController.php` (metadata,
  bulk/create/delete/reset, `CORE_ROLES`)
- `Modules/Admin/Routes/api.php` (4 new routes)
- `Core/Services/PermissionService.php` + interface (bulk, reset)
- `database/seeders/PermissionSeeder.php` (`defaultsFor`, `isDefaultRole`)
- `app/Providers/AppServiceProvider.php` (registry binding)
- `Core/Services/WorkspaceResolver.php` (permission-gated href parity)
- `Core/Services/RoleAssignmentService.php`, `AdminUserController`,
  request validators (registry-based role validation)
- `resources/js/pages/admin/Rbac.tsx`

## 8. Phase 1 enforcement rollout (2026-10-20)

- `routes/web.php` admin section: every page now carries a `permission:`
  gate (approvals `products.products.approve`, categories `categories.*`,
  users `users.users.manage`, products `products.products.manage`, brands
  `brands.brands.view`, CMS/newsletter `cms.pages.manage`, navigation
  `navigation.view`, wallet `payments.payments.view`, finance
  `finance.overview.view`, payouts `finance.payouts.manage`, support
  `support.tickets.view`, audit `audit.logs.view`, settings
  `settings.system.update`, domain consoles `*.overview.view`, returns
  `orders.orders.view`, reviews `reviews.reviews.moderate`, etc.).
- `Modules/Admin/Routes/api.php`: granular permissions on every admin API
  (users view/manage/suspend/activate, vendors, orders view/update/refund,
  finance transactions/payouts, support assign, departments, brands, domain
  routes: pharmacy, building, disputes, refunds, subscriptions, wallet,
  notifications, properties, reviews, returns).
- Module routes converted role→permission: Healthcare, Food, Jobs, Rides,
  Vendors (suspend), Pharmacy, KYC review.
- Tests updated to seed `PermissionSeeder` and assert permission truth
  (`AdminRoleAuthorizationSuiteTest`, `AdminAuthorizationMatrixTest`,
  `ConsoleNavPermissionTest`, `RbacLifecycleTest`, workspace tests, domain
  and journey tests). Module CRUD suites (Food/Jobs/Healthcare/Pharmacy/
  Hotels) now seed the matrix so role holders actually exercise their gates.

## 9. Phase 2 console gap audit (2026-10-20)

| Area | Finding | Action |
|------|---------|--------|
| Jobs | `/admin/jobs` already ships full post CRUD + applications triage (`admin/Jobs.tsx`) | none needed |
| Rides | `/admin/transport` already ships rides + flights queues and flight activation (`Modules/Rides` admin APIs) | none needed |
| Job Seekers | Consumer directory + work-request lifecycle existed; **no admin visibility** | **Built**: `/admin/job-seekers` (workers + work requests tabs), admin API (`GET/PUT/DELETE/POST restore /api/admin/job-seekers`, `GET /api/admin/work-requests`), nav entry, permission gates (`job_seekers.overview.view/manage`, `job_seekers.requests.manage`), soft-delete/restore with active-request guard, verification toggle reaching `verified_only` public search |
| Agriculture | No module: deep pages read Needs listings (`NeedController::agriculture`) | **Built**: `/admin/agriculture` console over the existing needs/profile/product data (`GET /api/admin/agriculture/{overview,products,farmers,workers}`, `POST .../{products,workers,farmers}/{id}/moderate`), permission-gated by `agriculture.*`, audited moderation; dedicated `AdminAgricultureConsoleTest` |
| Deals | No module: deals are Needs items (`/api/deals`, `NeedController::deals`) | **Built**: `/admin/deals` console (`GET /api/admin/deals[/overview]`, `POST .../{id}/moderate`, `POST .../{id}/visibility`); status transitions delegate to the Needs workflow, visibility maps to `is_available`; dedicated `AdminDealsConsoleTest` |
| Messaging | User chat has no admin console (support tickets do) | **Built**: `/admin/messaging` read-only inbox for support roles plus soft delete/restore for `support_admin` (`GET /api/admin/messaging/conversations[/{id}]`, `DELETE/POST restore`, `DELETE messages`); conversations/messages soft-deleted and audited; dedicated `AdminMessagingConsoleTest` |
| Delivery managers | Directory read was auth-only; writes used a role-list helper | **Hardened**: directory read now `delivery.deliveries.view`, delete/assign `delivery.deliveries.manage`, `transport_admin` gained the matching manage permission; self-service registration/availability/completion and the vendor stripped-profile view keep their controller-level fan-out (tested by 20 Delivery tests) |

The new Job Seekers surfaces follow the established pattern: server-rendered page +
JSON API with per-route `permission:` middleware, audit entries on every moderation
write, console nav entry, render/allow-sweep/parity/nav tests and a dedicated
feature suite (`AdminJobSeekerConsoleTest`, 5 tests).

The Agriculture, Deals, and Messaging consoles reuse the same pattern (dedicated
`Admin*ConsoleTest` suites, allow-sweep/parity/matrix probes). Newsletter gained
search/pagination, delete, and streamed CSV export behind
`newsletter.subscriptions.view/manage`; Notifications gained search, recipient
lookup, audience counts, targeted send (user/role/all), and soft delete behind
`notifications.overview.view/manage`. The sidebars and dashboard were verified
end-to-end with `e2e/admin-sidebar.spec.ts`: every `/admin` nav link navigates,
dashboard totals render once above the Admin Access panel, and access switches are
live (self-toggle disabled).

## 10. Out of scope / follow-ups

- Separate custom-role-only `role:` gates (none left for admin pages; only
  `/admin/rbac` + RBAC writes remain `role:super_admin`).
- Per-role audit history UI (audit entries already written).
- Role slug renames; importing/exporting role definitions.
