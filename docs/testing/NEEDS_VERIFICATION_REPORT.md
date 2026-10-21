# NEEDS Verification Report — TODO 26 (2026-10-15)

Status: **IMPLEMENTED AND VERIFIED** for TODOs 01–25. Nothing below is
claimed without the evidence cited beside it.

## Acceptance per TODO

| TODO | Evidence |
|---|---|
| 01 audit | NEEDS_TODO_REGISTER §TODO 01; 48-test baseline green |
| 02 references | docs/research/NEEDS_REFERENCE_REGISTER.md (5 live sources, 6 rejections) |
| 03 domain | docs/architecture/NEEDS_DOMAIN_BOUNDARIES.md |
| 04 routes | register §TODO 04 (13 components exist, 48 hrefs resolve, 0 dead) |
| 05 forms | NeedCategoryFormsTest 7/7; 47-suite regression |
| 06 creation | NeedRequestCreationTest 3/3; review step + package nudge in UI |
| 07 lifecycle | NeedRequestLifecycleTest 7/7; idempotent submit + owner edit |
| 08 providers | NeedProviderVerificationTest 5/5; KYC-distinct approval |
| 09 listings | NeedListingModerationTest 6/6; two-step publish |
| 10 discovery | NeedDiscoveryTest 4/4; two unified-search leaks closed |
| 11 matching | NeedMatchingTest 6/6; explainable weights + reasons |
| 12 offers | NeedOfferLifecycleTest 5/5; revisions, withdraw, expiry, single-winner |
| 13 booking | NeedBookingTest 5/5; locks, partial unique index, UTC normalization |
| 14 comms | NeedCommunicationTest 4/4; bilateral chats, persisted notifies |
| 15 fulfillment | NeedFulfillmentTest 4/4; accept + agreed-price payout |
| 16 payments | NeedPaymentSyncTest 3/3; async listener; per-listener nonces |
| 17 trust | NeedTrustTest 4/4; task reviews, reports, responses, evidence |
| 18 workspace | NeedWorkspaceTest 3/3; edit/duplicate/visibility/saved |
| 19 provider ws | NeedProviderWorkspaceTest 5/5; self-scoping + render |
| 20 admin ops | overview + category filter (console suite 14/14) |
| 21 RBAC | NeedsViewerRbacTest 4/4; roster 40; matrix doc |
| 22 reports | export privacy + audit (console suite 14/14) |
| 23 UI/a11y | scope/col, 44px targets, reduced motion; chains e2e green |
| 24 sec/perf | NEEDS_THREAT_MODEL.md; bulk preloads; mass-assignment review |
| 25 regression | full sequential sweep, all domains green (see below) |

## Regression totals (sequential, one process per run)

- Needs (19 files), Admin (36 files, 4 splits), WaveA–U, Journeys, Auth,
  RBAC, Payments, Reviews, Messaging, Search, Events, Security, Workspace,
  Healthcare, Learn, Products, Checkout, Orders, Wallet, Users, Vendors,
  Services, Bookings, Engagement, JobSeekers, Analytics→Upload domains:
  **all green, zero failures at close** (only own-goals encountered were
  parallel-run DB collisions and two stale role-count pins, both fixed and
  re-verified).
- tsc, eslint, vite build, vitest (47), Playwright admin-needs + chains:
  green.

## Authorization attack coverage (Journey H)

Stranger/owner confusion on requests, offers, bookings, profiles, listings,
chats, disputes, reviews, saved items, workspaces, admin queues; expired/
withdrawn acceptance; self-escalation and RBAC grant probes; moderator
least-privilege — all refused with 401/403/404/422 as appropriate, pinned
in the suites above.

## Unresolved blockers

None inside NEEDS scope. Known external/adjacent limits:
Turnstile keys are still unprovisioned (the platform now **fails closed**
in production when they are missing — the auth endpoints answer 503
instead of accepting unverified logins); braces advisory (Tailwind v4);
live FX/VAPID/Reverb cutover pending.

## Deferred with owners (documented, not dropped)

- Invite-adding UI + provider saves → needs public provider directory.
- Signed-URL private attachments; global DB session TZ pin; pg_trgm search.
- Review-rating signal in matching weights.
- Milestone escrow ledger, hourly billing, arbitration → **shipped
  2026-10-21** (`need_milestones`, `need_timesheets`, dispute
  arbitration with an award/buyer-refund split; 14 new tests green). What
  remains is operational/legal (holding-funds licensing, arbitrator terms),
  not code.
