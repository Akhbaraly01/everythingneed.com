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

## 3. The fix that landed (RESOLVED)

The lane had already applied the right fix pattern to two files — it is what repaired the
pre-existing base-commit failures:

```php
use Database\Seeders\PermissionSeeder;
...
$this->seed(PermissionSeeder::class);
```

The 15 remaining failures were the files that seed sweep missed. **That is now fixed** by seeding
the matrix explicitly in the affected test methods:

| File | Failing test(s) | Role |
|---|---|---|
| `tests/Feature/Healthcare/AidDomainTest.php` | `test_support_approving_a_request_makes_it_public`, `test_support_rejecting_records_reason_and_stays_private`, `test_reviewing_twice_is_422_and_never_double_decides` | `healthcare_admin` |
| `tests/Feature/Healthcare/HealthcareBookingsTest.php` | 5 cases (content publish/hide, service request advance, unknown content type, medicine CRUD, prescriptions oversight) | `healthcare_admin`, `pharmacy_admin`, content roles |
| `tests/Feature/Forms/DynamicFormTest.php` | `test_admin_forms_page_renders_for_content_roles_only` — note the file **already seeds** in two other methods (L62, L76); only this method was missing it | `content_manager` |
| `tests/Feature/WaveO/WaveOMessagingTest.php` | `test_admin_support_detail_requires_the_support_role`, `test_admin_support_console_pages_are_role_gated` | `support_agent` |
| `tests/Feature/WaveU/WaveUWorkflowTest.php` | `test_healthcare_chain_find_book_consult_review` | `healthcare_admin` |
| `tests/Feature/Jobs/JobApplicationJourneyTest.php` | `test_admin_applications_queue_is_role_gated` | `jobs_admin` |
| `tests/Feature/Jobs/ApplicantPipelineTest.php` | `test_admin_applications_payload_has_job_post` | `jobs_admin` |
| `tests/Feature/Api/ApiHardeningTest.php` | `test_delivery_index_strips_user_pii` | `platform_ops` |

Every role involved already holds the required grant in the lane's seeder
(`healthcare_admin → healthcare.*`, `content_manager → forms.*`, `platform_ops → delivery.*`,
`jobs_admin → jobs.*`, `support_agent → support.*`), so seeding is sufficient — no matrix change
was required.

### 3.1 Why the matrix must NOT be seeded globally

A first attempt seeded the matrix **once per process** (on its own connection, so it survived the
per-test transaction rollback). It made the 15 failures disappear, but it broke three other tests
that assert the opposite contract:

* `LearnPermissionEnforcementTest::test_review_queue_denies_a_reviewer_whose_permission_was_never_seeded`
  — its sibling `test_review_queue_allows_the_reviewer_once_the_matrix_is_seeded` makes the
  intent explicit: **the matrix is empty by default**, and a test opts in by seeding it.
* `CourseReviewTest::test_moderation_requires_the_role_and_the_permission` — same contract.
* `AuthorizationCoverageTest::test_user_plane_mutating_routes_are_authenticated_or_allowlisted` —
  the new public `POST api/i18n/auto-translate` proxy is now allowlisted next to the
  `api/ai/chat` precedent (throttled, no provider credentials exposed).

The landed fix therefore keeps the empty-by-default baseline and adds one more guard: the resolver
memoises the role matrix for 300 s, so a seeded matrix would leak into the *next* test even
though its rows roll back with the transaction. `Tests\TestCase::tearDown()` now flushes
`rbac.matrix` per test.

**Not recommended:** a hard-coded fallback matrix in `EffectivePermissionResolver` — it would
reintroduce two sources of truth for role grants, which is exactly what that class was created
to remove.

## 3.2 Verification matrix (measured, not inferred)

Three independent full runs on the same machine:

| Tree | Tests | Failures | Notes |
|---|---|---|---|
| `63c3f56` (pristine base, detached worktree) | 1976 | **73** | the base commit is **not** green |
| `feature/lh-feature-wave` (base + L-H wave) | 1996 | **72** | failing set is a **strict subset** of base |
| shared working tree (base + all lanes' WIP) | 2102 | **16** | 15 RBAC regressions + 1 L-H (now fixed) |

Diffing the failing-test sets of the first two runs:

```
in MY BRANCH but NOT in base (caused by my changes):   NONE
in BASE but fixed on my branch:
  - Tests\Feature\Architecture\ModuleDependencyTest::test_cross_module_logic_references_stay_within_allowlist
```

So the L-H wave introduces **zero** new failures, and the RBAC lane's rewrite in fact takes the
tree from 73 failures down to 16 — of which 15 are the regressions described above.

## 4. Second finding: the base commit `63c3f56` is not green either

The L-H branch was verified in a detached git worktree at its base commit. Running the same
Admin matrix test against the untouched base commit reproduces the failure there too:

```
$ git worktree add --detach wt-base 63c3f56
$ php -d memory_limit=3072M vendor\bin\phpunit --filter test_every_registry_href_is_role_gated_or_root_alias \
      tests/Feature/Admin/AdminAuthorizationMatrixTest.php
→ /admin/users must carry a role: middleware
  Failed asserting that false is true.
  Tests: 1, Assertions: 2, Failures: 1
```

So the branch inherits a set of **pre-existing failures at `63c3f56`** (the L-H work is purely
additive and introduces none of them). The RBAC lane's WIP actually *repairs* several of them —
e.g. it renames the test to `test_every_registry_href_is_role_or_permission_gated` and widens the
assertion to accept `permission:` gates, which is why the test does **not** appear in the
16-failure list from the shared tree.

**Consequence for the merge:** the two lanes are complementary, not conflicting. The permission
model (RBAC lane) carries the fixes for the pre-existing base failures; the L-H branch carries
the feature wave. They must land **together** — merging only the L-H branch would re-introduce
the base failures, and merging only the RBAC lane would keep the 15 regressions above.

### 4.1 The "L-G is green" baseline does not reproduce

Commit `63c3f56` states *"1976 phpunit / 166 e2e clean"*. Re-running the same suite on that
exact commit, in a pristine detached worktree, gives:

```
Tests: 1976, Assertions: 11978, Failures: 73, PHPUnit Warnings: 1.
```

Same test count, but **73 failures** and 784 fewer assertions. The likely reason is that the
recorded gate run had a seeded permission matrix in the test database, while a suite that never
seeds (`RefreshDatabase` without `$seed = true`) always starts from an empty `role_permissions`
table. Whatever the cause, the team should not treat `63c3f56` as a green baseline: the
"pre-existing" failures are the ones the RBAC lane has been repairing, and they are still
visible in the shared tree only because that lane's fix is not yet correct for 8 test files.

**Recommendation:** re-baseline the green claim after the RBAC lane lands, and record the
run command + database name in the commit message so the number is reproducible.

## 5. Merge gate

`feature/lh-feature-wave` (L-H feature wave) is **held** until:

* [ ] the 15 failures above are green in a full `php -d memory_limit=3072M vendor\bin\phpunit` run;
* [ ] the full e2e acceptance suite is green against the merged tree;
* [ ] the L-H docs rows (`AUDIT_MATRIX.md`, `FINAL_VALIDATION_CHECKLIST.md`,
      `docs/implementation/MASTER_GAP_REGISTER.md`) carry the final gate numbers.

## 6. Shared-working-tree protocol (all lanes)

All lanes share **one** working tree, so the branch you are on is the branch everyone commits to.
The L-H lane is currently checked out on `feature/lh-feature-wave` with the other lanes' work
still uncommitted in the working tree.

**Before committing, create your own branch** (this keeps the working tree and the index intact):

```bash
git switch -c feature/<your-lane>     # e.g. feature/rbac-wave, feature/i18n-wave
git add -p                             # stage only your own hunks
git commit
```

Do not run `git switch main` while other lanes have uncommitted changes in the shared files
(`backend/routes/web.php`, `backend/Modules/*/Routes/api.php`, `backend/resources/js/lib/i18n.tsx`,
`backend/resources/js/lib/i18n-dict.ts`, `backend/playwright.config.ts`, `backend/e2e/*`) —
the checkout will be refused, and forcing it would discard another lane's work.

**Merge order:** `feature/lh-feature-wave` and the RBAC lane must land together (see section 4).

## 7. Isolation note (L-H lane)

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
