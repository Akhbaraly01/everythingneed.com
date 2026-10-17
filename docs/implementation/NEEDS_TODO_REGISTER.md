# NEEDS TODO Register — Master Spec Execution Log

Source spec: full NEEDS module specification, Parts A–S (26 TODOs).
Stack: Laravel 13 modular monolith + Inertia + React + TS + PostgreSQL.
Rule: one TODO at a time, gate each, no false verification.

## TODO 01 — Repository and module audit ✅ COMPLETE (2026-10-15)

### Inventory (verified by reading code, not inferred)

**Modules/Needs (14 files):** 8 entities (NeedRequest 17-status lifecycle,
NeedOffer, NeedCategory, NeedItem, NeedRequestEvent, TaskPost,
TaskApplication, FraudFlag), 3 controllers (NeedController catalog,
NeedRequestController workflow, TaskController task center), 1 routes file
(23 API routes), NeedsFraudScanner (3 flag-only rules), NeedsServiceProvider.
No DTOs/Requests/Resources/Jobs/Events/Listeners/Policies; no module
migrations dir (tables from global `database/migrations`).

**Web routes (routes/web.php):** public `/needs` + `/{slug}`, canonical
`/needs/create`, `/needs/{category}/{id}`, workspace `/needs/my-needs*`
(Overview/Offers/Messages/Payment/Tracking/Review), `/tasks*`,
`/requests`, `/account/needs*`, `/admin/needs`
(role: super_admin, administrator, needs_admin, platform_ops).

**Frontend:** needs/ (12 pages), tasks/ (5), requests/ (1), deals/ (4),
admin/Needs.tsx (P0 console, 5 tabs).

**Permissions (17):** needs.* (12) + tasks.* (5). Holders: super_admin (*),
administrator, platform_ops, needs_admin. moderator/support roles: none.

### Working functionality (test-pinned)

- Request lifecycle submit→offer→accept→pay→transitions (NeedRequestWorkflowTest)
- Task lifecycle publish→apply→approve→submit→verify→mark-paid (TaskWorkflowTest)
- Escrow charge/payout idempotency NRPAY-*/NEEDPAYOUT-*/TKPAY-* (NeedPayoutTest)
- Drafts, negotiation, moderator transitions, dispute→refund, timeline, review
  rules (WaveFNeedsWorkflowTest, 8 tests)
- All needs web pages render + chat/upload endpoints (WaveFNeedsPagesTest, 8)
- Admin console: gates, moderation, fraud, disputes, audit (AdminNeedsConsoleTest, 11)
- Scheduler `needs:expire-past-deadline` EXISTS
  (app/Console/Commands/ExpirePastDeadlineNeeds.php, published-only sweep).

### Gaps / conflicts (corrected against code — no speculation)

1. Dual task namespaces (`needs.tasks.*` vs `tasks.*`) — harmless today (same
   4 roles hold both), rename-risk only.
2. Admin task cancel/restore + offer delete bypass state-machine event coupling
   (no NeedRequestEvent/TaskPost history rows for those writes).
3. Overlapping pay/transition URIs (`/pay` vs `/{action=payment}`) — clients
   must prefer dedicated routes.
4. NeedItem vs Product parallel catalogs; agriculture answered by Needs route
   over Products data.
5. NeedRequest/Offer lifecycle diverges from JobSeekers WorkRequest/Offer.
6. `/needs/{slug}` catch-all is order-sensitive; `/needs/request`≡`/needs/create`
   and `/account/needs`≡`/needs/my-needs` duplicate URLs for same components.
7. needs_admin/platform_ops moderate via transition() but cannot view all
   offers via customer API (admin console only).
8. `Modules/Needs/Database` absent (provider `loadMigrationsFrom` no-ops).

### Baseline (2026-10-15, pre-change)

- tests/Feature/Needs: 21 passed · AdminNeedsConsoleTest: 11 passed ·
  WaveFNeedsWorkflow+Pages: 16 passed (288 assertions). Total 48 green.
- tsc / eslint / vite build / vitest-47 / e2e admin-needs: green.

## TODO 02 — Reference-system research ✅ COMPLETE (2026-10-15)

Verified live: Upwork Project Catalog + hiring flow, Taskrabbit how-it-works +
hire-a-tasker, Thumbtack Search→Chat→Hire + pro leads model, Fiverr client
journey. Register: docs/research/NEEDS_REFERENCE_REGISTER.md (exact URLs,
adaptations, verification hooks, 6 rejections with reasons).


## TODO 03 — Domain model + workflow design ✅ COMPLETE (2026-10-15)

Doc: docs/architecture/NEEDS_DOMAIN_BOUNDARIES.md — aggregates, lifecycles,
ownership rules, integration contracts, explicit gap list per TODO.
## TODO 04–26 — QUEUED (execute in order, one at a time)

| TODO | Scope | Status |
|---|---|---|
| 04 | Route + navigation audit (canonical paths, aliases) | ✅ COMPLETE (2026-10-15): all 13 Inertia components exist; /needs/{slug} safely last; 48 frontend hrefs resolve, zero dead links. Canonical: /needs, /needs/create, /needs/{category}/{id}, /needs/my-needs*, /tasks*, /requests, /account/needs*, /admin/needs. Preserved aliases: /needs/request, /needs/requests/{id}. No changes needed. |
| 05 | Category + dynamic-form system | ✅ COMPLETE (2026-10-15): hierarchy (parent/children, cycle-guarded), is_active visibility, allowlisted schemas (6 types, ≤20 fields), versioned, answer validation + snapshots on requests, guarded delete, admin CRUD (needs.overview.manage), dynamic form UI + detail display, 7 tests, 47-suite regression green. |
| 06 | Customer request creation | ✅ COMPLETE (2026-10-15): pricing_basis (7 modes, coherence-validated; undeclared defaults flexible for backward compat), structured location (state/LGA/city/remote), ASAP + time windows, visibility public/invite_only with server enforcement (open-scope/detail/offer gates), who-sees-what disclosure, review-before-submit step, package nudge, detail display, 3 tests. Deferred to TODO 18: invite-picker UI (API complete + tested; no provider directory to pick from yet). |
| 07 | Request lifecycle | ✅ COMPLETE (2026-10-15): client_key idempotent submit (replay returns original, no dup/event), owner PUT endpoint (draft/pending editable; published+ frozen; bids named as reason), answer re-validation + snapshot refresh, edit audit rows, 7 tests, 57-suite regression green. |
| 08 | Provider onboarding + verification | ✅ COMPLETE (2026-10-15): need_provider_profiles (draft→submitted→approved/rejected/suspended; edit-approved→re-review; evidence reviewer-only; KYC state surfaced but never duplicated), admin review queue (approve with note-required reject, suspend with note, reinstate→re-review), category requires_verified_provider flag, submitOffer enforcement (suspension global, verified categories need profile+KYC), 3 new permissions, console Providers tab, 5 tests, 67-suite regression + e2e green. Deferred to TODO 19: provider-facing onboarding UI (API complete). |
| 09 | Service listings + packages | ✅ COMPLETE (2026-10-15): draft→submitted→approved→published→(rejected/suspended/archived) with two-step approve/publish, packages/add-ons/deliverables/terms fields, owner revision returns live listings to review, public items/deals/deal gated to published+available+active-category, inactive-category hide + listing refusal, 3 listings permissions, console Listings tab, 6 tests, 81-suite regression + e2e/build green. |
| 10 | Search + discovery | ✅ COMPLETE (2026-10-15): fixed unified-search leaks (needs now published+public only; services now published+available+active-category), open-scope budget/geo/remote/basis filters + allowlisted sorts, task budget filters + sorts, 3 discovery indexes, 4 tests, 80-suite regression green. |
| 11 | Matching + recommendations | ✅ COMPLETE (2026-10-15): NeedMatcher service (eligibility-first: suspension/category-vetting/invite/self exclusion, then additive documented weights with per-match reasons, empty-never-fabricated), owner matches endpoint (owner/admin only) + provider-side eligibility annotations, recommended-providers UI on Offers page, 6 tests (caught a partial-select bug), 86-suite regression green. Deferred to TODO 19: provider board surfacing of eligibility (API complete). |
| 12 | Offers + quotations | ✅ COMPLETE (2026-10-15): quotation fields (scope/deliverables/exclusions/duration/terms/expiry), append-only revision log, provider withdraw, lazy + scheduled expiry, row-locked single-winner accept, 5 tests (exposed a missing deleted_at + a CHECK-constraint gap, both migrated), comparison UI with withdraw, 89-suite regression green. Deferred to TODO 18: shortlisting (workspace concern). |
| 13 | Scheduling + booking | ✅ COMPLETE (2026-10-15): need_bookings (slot+timezone+policy counter, my-bookings/request view/book/reschedule/cancel), row-locked provider overlap guard, partial unique index (one live booking per request; rebook-after-cancel works), 24h change policy, cancel-keeps-request, tracking UI slot card, 5 tests, 97-suite regression green. Notable find: DB session TZ is America/Los_Angeles while APP_TZ is UTC — writes use naive-UTC normalization to stay immune (systemic TZ pinning queued for TODO 24). |
| 14 | Communication + notifications | ✅ COMPLETE (2026-10-15): request chats bilateralized server-side (owner ↔ bidding providers; strangers 403; other modules untouched), reschedule counterparty notification added, all notifies verified post-persistence, 4 tests + WaveF chat test updated to bid-first, 129-suite run green. |
| 15 | Fulfillment + milestones | ✅ COMPLETE (2026-10-15): provider progress notes (timeline + owner notify), fulfill deliverables, owner accept transition (fulfilled→completed + payout; provider-direct complete preserved as pinned), payout extracted to shared releasePayout honoring agreed overrides, scope-change propose/decide with counterparty rule + agreed_price_override + before/after audit (offer rows never rewritten), accept UI on Tracking, 4 tests, 110-suite regression green. Milestone ledger stays P4. |
| 16 | Payment integration | ✅ COMPLETE (2026-10-15): audited (server amounts, idempotency keys, signed webhooks+dedupe, reconcile coverage all present); added async SyncNeedRequestPayment listener (NRPAY success → paid + event + notify, idempotent); 3 tests. Notable find+fix: single-use event nonces broke multi-listener events — scoped nonces per listener class (backward compatible, SignedEventsTest still green). 175-suite regression green. |
| 17 | Reviews, trust, disputes | ✅ COMPLETE (2026-10-15): task_post review eligibility (owner/completed/once), report queue (one-per-reporter + dismiss/uphold with audit + hide), single provider response (counterparty-resolved), dispute evidence rows (party-upload, reviewer-visible, closed-case lock), 4 tests, 133-suite regression green. Notable fix: 23505-catch savepoints in review writes (25P02 poisoning). |
| 18 | Customer workspace | ✅ COMPLETE (2026-10-15): edit mode (?edit= + PUT with race-safe answers), duplicate-as-draft (brief only, fresh refs), visibility toggle + invitee trim, dashboard counts strip, Saved tab + listing save buttons + saved-search persistence, 3 tests, 115-suite regression green. Deferred: provider saves + invite-adding (need provider directory, TODO 19). |
| 19 | Provider workspace | ✅ COMPLETE (2026-10-15): my-offers/my-work/my-listings self-scoped endpoints, provider NeedsHub (opportunities/offers/work/listings tabs) + Profile onboarding UI (categories/areas/qualifications/evidence, KYC shown), auth-only routes + nav, 5 tests + render coverage, tsc/eslint/build/e2e green. |
| 20 | Admin overview + operations | ✅ COMPLETE (2026-10-15): /api/admin/needs/overview (attention queue, status distribution, 30d completions, 8w cancellation trend, date/category scoped), console Overview tab, category filter on requests queue, 2 tests, build + e2e green. |
| 21 | Admin configuration + RBAC | ✅ COMPLETE (2026-10-15): needs_viewer read-only role (enum+roster+MATRIX+dashboard+landing+workspace sets, roster now 40), per-endpoint view gates + fraud.manage split, self-escalation probes, NEEDS_ROLE_PERMISSION_MATRIX.md, workspace matrix addendum, suite probes for needs endpoints, 193-suite regression green. |
| 22 | Audit, reporting, export | ✅ COMPLETE (2026-10-15): requests report (volume/status/offer/acceptance/completion/dispute rates, verification turnaround, task completion), chunked CSV export (PII-free, formula-sanitized, audit-logged), needs.reports.view/export perms, console export button, 1 test, 132-suite regression green. |
| 23 | UI + accessibility | ✅ COMPLETE (2026-10-15): table header scope, 44px tab targets, reduced-motion scroll, labeled controls + alert/error roles verified present, tsc/eslint/build green, chains customer journey e2e green. |
| 24 | Security + performance | ✅ COMPLETE (2026-10-15): bulk KYC/history preloads (matching + providers queue), upload posture audited (allowlist/caps/scoping verified), mass-assignment review (all privileged fields server-set), NEEDS_THREAT_MODEL.md (enforced controls + 7 explicit limitations incl. TZ/session + unsigned-attachment follow-ups), behavior-preserving tests green. |
| 25 | Integration + regression | ✅ COMPLETE (2026-10-15): sequential full-system sweep — Unit, all Feature domains (Admin in 4 splits, Needs, WaveA–U, Journeys, Auth, RBAC, Payments, Reviews, Messaging, Search, Events, Security, Workspace…), all green. Two own-goals fixed: parallel phpunit runs against one test DB (re-ran sequentially), and two stale 39-role pins. |
| 26 | Final acceptance + documentation | ✅ COMPLETE (2026-10-15): docs/testing/NEEDS_VERIFICATION_REPORT.md — per-TODO evidence, regression totals, Journey-H coverage, zero unresolved NEEDS blockers, deferred items with owners. |
| 26 | Final acceptance + documentation | queued |
