# RBAC permission-gate regression — 15 test failures (2026-10-20)

**Status:** OPEN — blocks the L-H feature wave merge into `main`.
**Owner:** RBAC / roles-access lane (uncommitted work in the shared working tree).
**Reported by:** L-H feature lane (branch `feature/lh-feature-wave`).
**Severity:** high — every non-`super_admin` role-gated surface is unreachable in the test env.

---

## 1. Symptom

Full suite on the shared working tree:

```
Tests: 2102, Assertions: 13308, Failures: 16, PHPUnit Warnings: 1, Deprecations: 1.
```

16 failures = **1 from the L-H lane** (already fixed on `feature/lh-feature-wave`:
`ModuleDependencyTest` cross-module reference, resolved with a sanctioned allowlist entry)
+ **15 from the RBAC lane's uncommitted work** (listed below).

All 15 fail the same way: an expected `200`/`201` comes back as **`403`** (API) or **`302`**
(Inertia admin page redirect), i.e. the permission check denies a role that owns the grant.

| # | Failing test | Role used | Surface |
|---|---|---|---|
| 1 | `Tests\Feature\Api\ApiHardeningTest::test_delivery_index_strips_user_pii` | `platform_ops` | `GET /api/delivery/managers` |
| 2 | `Tests\Feature\Forms\DynamicFormTest::test_admin_forms_page_renders_for_content_roles_only` | `content_manager` | `GET /admin/forms` |
| 3-5 | `Tests\Feature\Healthcare\AidDomainTest` (3 cases) | `healthcare_admin` | `PUT /api/admin/healthcare/aid/{id}` |
| 6-10 | `Tests\Feature\Healthcare\HealthcareBookingsTest` (5 cases) | `healthcare_admin`, `pharmacy_admin`, content roles | healthcare content / service requests / medicines / prescriptions oversight |
| 11-12 | `Tests\Feature\Jobs\ApplicantPipelineTest`, `JobApplicationJourneyTest` (2 cases) | `jobs_admin` | `GET /api/jobs/admin/applications` |
| 13-14 | `Tests\Feature\WaveO\WaveOMessagingTest` (2 cases) | `support_agent` / non-support | support console + detail |
| 15 | `Tests\Feature\WaveU\WaveUWorkflowTest::test_healthcare_chain_find_book_consult_review` | `healthcare_admin` | healthcare chain |

The failure is **deterministic** — it reproduces in isolation with a fresh
`migrate:fresh`, so it is not a stale-seed or test-ordering artefact:

```
php -d memory_limit=3072M vendor\bin\phpunit --filter test_support_approving_a_request_makes_it_public \
    tests/Feature/Healthcare/AidDomainTest.php
→ Failed asserting that 403 is identical to 200.
```

## 2. Root cause

The RBAC lane converted route gates from **role-based** to **permission-based** middleware.
That is the intended direction, but it changes the resolution path:

* `role:super_admin,administrator,healthcare_admin` → checked the user's roles directly
  (Spatie role membership). No seed data needed. **Legacy tests relied on this.**
* `permission:healthcare.aid.manage` → goes through
  `Core\Services\EffectivePermissionResolver::has()` → `roleMatrix()` →
  `DB::table('role_permissions')->where('state','granted')` (cached under `rbac.matrix`, 300 s).

`role_permissions` rows are written **only** by `Database\Seeders\PermissionSeeder` and
`Core\Services\PermissionService::bulkUpdateRolePermissions()`. The suite never seeds it
globally:

* `tests/TestCase.php` uses `RefreshDatabase` with no `$seed = true` and no seeding in `setUp()`;
* `phpunit.xml` has no seeding hook;
* no migration inserts grants (`role_permissions` is only created/renamed/extended by migrations).

So `role_permissions` is **empty during a test run**. Tests that explicitly seed it pass:

```php
$this->seed(PermissionSeeder::class);   // tests/Feature/Admin/*  →  PASS
```

Tests that relied on the old role-based semantics do **not** seed it, and now get 403:

```php
$admin = $this->actingAsUser('healthcare_admin');   // tests/Feature/Healthcare/AidDomainTest
// no PermissionSeeder::class seed → role_permissions empty → permission:healthcare.aid.manage → 403
```

`super_admin` is unaffected because `EffectivePermissionResolver::has()` short-circuits
`if ($user->hasRole('super_admin')) { return true; }` — which is exactly why the failures
are limited to *specific* roles while the ~2000 other assertions stay green.

**Secondary check (permissions that do not exist at all):** of the 119 distinct
`permission:` gates now referenced by the route files, 5 are absent from the `PermissionSeeder`
CATALOG as of `63c3f56`: `brands.brands.view`, `brands.brands.manage`, `products.products.manage`,
`users.users.manage`, `settings.languages.manage`. The RBAC lane's working-tree seeder **does**
add all 5, so this is already handled on the lane side — it is only a trap for anyone
re-basing onto the old seeder.

## 3. Recommended fix (RBAC lane)

The grant matrix the lane ships is already correct for every failing case
(`healthcare_admin` → `healthcare.*`, `content_manager` → `forms.*`, `platform_ops` → `delivery.*`,
`jobs_admin` → `jobs.*`, `support_agent` → `support.*`). The gap is **test-side seeding**, so
either of these closes it:

1. **Per-test seeding (minimal, matches the existing convention in `tests/Feature/Admin/*`)** —
   add `$this->seed(PermissionSeeder::class);` to the 15 affected test methods/files.
2. **Shared helper** — add a `seedPermissionMatrix()` helper to `Tests\TestCase` (or a
   `protected $seed = true` variant that seeds only `PermissionSeeder`, not the whole
   `DatabaseSeeder`, to keep the 2102-test runtime flat) and call it from the affected tests.

Note the cache: `roleMatrix()` memoises under `rbac.matrix` for 300 s and
`PermissionService` now flushes it on bulk update/reset — when a test seeds the matrix after a
prior request has already resolved permissions, ensure the cache is cleared
(`Cache::forget('rbac.matrix')`) or the assertions will read a stale empty matrix.

**Not recommended:** adding a hard-coded fallback matrix to `EffectivePermissionResolver` — it
would reintroduce two sources of truth for role grants, which is exactly what that class was
created to remove.

## 4. Merge gate

`feature/lh-feature-wave` (L-H feature wave) is **held** until:

* [ ] the 15 failures above are green in a full `php -d memory_limit=3072M vendor\bin\phpunit` run;
* [ ] the full e2e acceptance suite is green against the merged tree;
* [ ] the L-H docs rows (`AUDIT_MATRIX.md`, `FINAL_VALIDATION_CHECKLIST.md`,
      `docs/implementation/MASTER_GAP_REGISTER.md`) carry the final gate numbers.

## 5. Isolation note (L-H lane)

The L-H wave was isolated on `feature/lh-feature-wave` (base `63c3f56`) so that this regression
could be fixed without entangling the two efforts. The branch contains only L-H work:

* `routes/web.php`, `Modules/Food/Routes/api.php`, `Modules/Pharmacy/Routes/api.php` were staged
  **hunk-by-hunk** (blob-level index update) so the RBAC lane's `role:` → `permission:` conversions
  and the i18n lane's `/locale` route are **not** part of the branch;
* `resources/js/lib/i18n-dict.ts` was staged from `63c3f56` plus the 16 L-H home-rail translation
  lines only, so the i18n lane's dictionary rewrite is not part of the branch;
* `eslint.config.js` carries the one-line node-globals fix for `scripts/**/*.mjs`, because
  `npm run lint` was already broken at `63c3f56` (tracked `scripts/copy-ffmpeg-core.mjs`).

No RBAC/i18n/healthcare-messaging/job-seeker file was modified, reverted or staged by the L-H lane.
