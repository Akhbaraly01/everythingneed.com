# NEEDS — MASTER PLAN (custom requests, services, tasks & vertical bookings)

> Status legend: ✅ IMPLEMENTED AND VERIFIED · 🔶 PARTIALLY IMPLEMENTED ·
> ⬜ NOT IMPLEMENTED. Every ⬜ item below becomes a TODO with tests before
> it may claim completeness. No fabricated data, transactions, or reviews —
> ever.

## 1. VISION

Needs is the "request anything" marketplace: a customer describes what they
require (with budget, location, attachments, urgency), providers compete
with offers, both sides negotiate in scoped threads, the customer selects,
pays through idempotent money paths, tracks fulfillment, and both sides
review. Tasks are provider-posted gigs with applications. Verticals (jobs,
rides, hotels, food, real estate, building, agriculture, experts, services)
reuse the same lifecycle contracts with domain-specific rules.

## 2. CURRENT STATE (audited 2026-10-13, verified)

**Backend — `Modules/Needs` (14 files) + verticals.**
- `NeedRequest`: 17 statuses
  (`draft → pending → published → reviewing → offered → negotiating →
  accepted → payment_pending → paid → in_progress → fulfilled → completed`,
  plus `cancelled/rejected/expired/disputed/refunded`), server-side
  `transition()` allowlist, `record()` timeline history. ✅
- `NeedOffer`: pending/accepted/rejected/withdrawn; accept is transactional;
  pay is idempotent. ✅
- Task Center: `TaskPost` (open/in_review/assigned/completed/cancelled) +
  applications (approve/reject/submit/verify/mark-paid). ✅
- Routes: public catalog (`need-categories/items/deals/agriculture/tasks`),
  authed request/offer/pay/transition/task-application flows. ✅
- Reviews cover `need_request` type; verified-transaction gating. ✅
- Generic disputes live in Orders (`DisputeController`); usable by reference.

**Frontend — 6 needs pages + 5 `needs/my/*` sub-pages** (Messages, Offers,
Overview, Payment, Review, Tracking), tasks (5), jobs (9), job-seekers (4),
transportation (4), hotels (6), food (6), properties (5), agriculture (4),
building-services (5), experts (4). ✅

**Admin — GAP (confirmed): no dedicated `admin/needs` or `admin/tasks`
console.** Needs surface only in analytics/reports aggregates. Everything
in §5 fixes this first.

## 3. REFERENCE FEATURE MATRIX (what to acquire, from where)

Notation: ✅ have · 🔶 partial · ⬜ build. Links are the systems named in
the programme brief.

### 3.1 Freelance & service marketplaces

| System | Acquire | State |
|---|---|---|
| https://www.upwork.com/ | Milestone contracts, escrow release per milestone, dispute arbitration, freelancer earnings dashboard | 🔶 (pay exists, no milestones/escrow-split) → TODO N-20, N-21 |
| https://www.fiverr.com/ | Gig packages (basic/standard/premium tiers), extras, delivery timer | ⬜ → TODO N-22 |
| https://www.freelancer.com/ | Bid contests, milestone tracker | ⬜ contests deferred; milestones → N-20 |
| https://www.toptal.com/ | Vetting funnel (screening → trial → verified badge) | 🔶 (KYC/worker profiles exist; no trial stage) → TODO N-23 |
| https://www.guru.com/ | Workrooms (shared files per contract) | ⬜ → TODO N-24 (scoped attachments already possible via messaging) |
| https://www.peopleperhour.com/ | Hourlies, time-tracked billing | ⬜ → TODO N-25 (deferred; hourly needs timesheet ledger) |
| https://www.thumbtack.com/ | Request→pro auto-matching, direct hire, cost estimates | 🔶 (categories + offers; no auto-match scores) → TODO N-26 |
| https://www.taskrabbit.com/ | Same-day taskers, live availability, trust badges | 🔶 (tasks exist; no live-availability flags) → TODO N-27 |
| https://www.airtasker.com/ | Open offer threads, community step-in | 🔶 (offer threads exist) |
| https://www.bark.com/ | Lead response SLA, callback requests | ⬜ → TODO N-28 |
| https://www.yelp.com/ | Review authenticity signals, request-a-quote | 🔶 (verified reviews exist) |
| https://www.angi.com/ / https://www.homeadvisor.com/ | Verified pros, True Cost guides, background screening records | ⬜ cost guides → TODO N-29 |
| https://www.urbancompany.com/ | Standardized service SKUs with fixed slots/prices | 🔶 (services module has definitions; wire to needs) → TODO N-30 |

### 3.2 Jobs & recruitment (Indeed, LinkedIn + 14)

Acquired ✅: board, detail, apply, my-applications, employer posting
(MyJobs), application states. This pass added: **saved jobs** (toggle +
wishlist snapshots) ✅.
Remaining → TODOs: job alerts (saved-search notifications) N-31; company
profiles N-32; applicant tracking view for posters (pipeline board) N-33.

### 3.3 Building & trades (Houzz, BuildZoom, Procore, Buildertrend…)

Acquired ✅: provider directory, worker profiles, booking + status flow,
admin Building console. Remaining → TODOs: project timeline/milestones
N-34; cost-estimate guides N-29 (shared); license/credential badges N-23
(shared).

### 3.4 Mechanic & auto (YourMechanic, RepairPal, Openbay…)

Acquired ✅: service booking + worker assignment primitives via services
module. Remaining → TODOs: upfront quote calculator N-35; vehicle profiles
(make/model/year garage) N-36; fair-price estimator data N-29 (shared).

### 3.5 Transport & rides (Uber, Lyft, Bolt, Grab…)

Acquired ✅: ride request/accept/complete/cancel, driver registry, flight
booking, tracking page, Transport admin. Remaining → TODOs: scheduled
rides N-37; fare estimate before booking N-38; driver earnings view N-39.

### 3.6 Travel, food, real estate, classifieds

Hotels ✅ (search/detail/rooms/reservations/cancel rules); Food ✅
(menu/cart/checkout/history/tracking); Real estate ✅ (listings/inquiry/
viewing-requests/my-listings); Agriculture ✅; Classifieds-style deals ✅.
Remaining → TODOs: hotel/room reviews UI (ReviewSection exists — wire)
N-40; saved homes N-41; food scheduled orders N-42; viewing tour slots
N-43.

## 4. LIFECYCLE SPEC (normative)

```
draft → pending → published ⇄ reviewing → offered → negotiating
  → accepted → payment_pending → paid → in_progress → fulfilled
  → completed (+ review)      // happy path
  ↘ cancelled / rejected / expired / disputed → refunded (terminal guards)
```

- Every transition validated server-side against the allowlist; illegal
  jumps 422 with audit row. Owner + assigned provider + staff only.
- Offers: one active negotiation each; accept is transactional
  (offer→accepted, siblings→rejected, request→accepted) with row locks.
- Pay: idempotency-keyed, double-submit safe; refunds request-before-
  processing with support review.
- Tasks: open → assigned → in_review → completed (+cancelled); evidence
  submit → verify → mark-paid chain already enforced.

## 5. ADMIN MANAGEMENT & CONTROL (the core of this plan)

New console: **`admin/needs`** (Needs + Tasks tabs), roles
`super_admin,administrator,needs_admin,support_admin`, all reads/writes
behind `needs.*` granular permissions + audit rows.

| Entity | List/filter | Moderate | Assign/reassign | Suspend/restore | Audit |
|---|---|---|---|---|---|
| Need requests | status/category/search/date | approve/reject/hide + reason | assign provider, reassign | suspend/restore + reason | every action |
| Need offers | per-request thread | remove abusive offer | — | — | every action |
| Task posts | status/search | approve/reject/hide | assign worker | suspend/restore | every action |
| Task applications | per-task queue | approve/reject | reassign | — | every action |
| Categories | tree editor | — | — | activate/deactivate | every action |
| Disputes (needs scope) | status/assignee | resolve/refund-split/escalate | assign agent | — | every action |
| Fraud flags | auto-rules list | confirm/dismiss | assign reviewer | shadow-suspend | every action |

Supporting endpoints (all `auth:sanctum` + role + `permission:needs.*`):
`GET /api/admin/needs/requests`, `PUT /api/admin/needs/requests/{id}`,
`GET /api/admin/needs/offers?request=`, `DELETE /api/admin/needs/offers/{id}`,
`GET /api/admin/tasks`, `PUT /api/admin/tasks/{id}`,
`GET /api/admin/tasks/applications`, `PUT /api/admin/tasks/applications/{id}`,
`GET /api/admin/needs/disputes`, `PUT /api/admin/needs/disputes/{id}`,
`GET /api/admin/needs/fraud-flags`, `PUT /api/admin/needs/fraud-flags/{id}`.
Auto fraud rules (v1, flags → human review, never auto-punish): duplicate
text bursts, impossible contact velocity, price-outlier offers, new-account
high-value requests.

RBAC additions (additive-only, seeded idempotent): `needs.requests.view/
manage/moderate`, `needs.offers.moderate`, `needs.tasks.manage`,
`needs.disputes.manage`, `needs.fraud.view`. Matrix: super_admin `*`,
administrator + needs_admin full set, support_admin view + disputes,
moderator view-only.

## 6. PHASED ROADMAP (execute in order, gate each)

- **P0 Admin console + fraud flags** ✅ DONE 2026-10-15 (endpoints, page,
  permissions, seeds, 11 PHPUnit + 1 Playwright: gates per role, moderation
  transitions, audit rows; tsc/eslint/build/vitest green).
- **P1 Customer depth** ✅ DONE 2026-10-16 (alerts N-31, cost guides N-29,
  fare/quote estimators N-35/N-38, scheduled rides N-37, food scheduling
  N-42, tour slots N-43).
- **P2 Provider depth** ✅ DONE 2026-10-16 (vetting funnel N-23 trial stage,
  earnings views incl. driver N-39, applicant pipeline N-33, company
  profiles N-32).
- **P3 Matching & trust** ✅ DONE 2026-10-16 (auto-match push N-26, live
  availability N-27, response SLAs N-28, hotel reviews N-40, saved homes
  N-41, gig packages N-22, workrooms N-24).
- **P4 Money depth** (milestone escrow N-20, arbitration N-21, hourly
  billing N-25 if timesheet ledger approved).
- **P5 Regression** ✅ DONE 2026-10-16 (needs verticals 172 green, adjacent
  suites 64 green, architecture 6 green, tsc/eslint/build clean; Playwright
  chains + admin-needs + admin 15 passed, customer/marketplace/engagement 57
  passed — one spec locator fixed for the DataTable dual-render on mobile;
  browser proof for the new P3 surfaces added in `e2e/needs-gigs.spec.ts`
  (deal tier pick → prefilled request → server snapshot; workroom upload →
  signed-URL stream → owner retrieval), 6/6 across chromium/mobile/tablet;
  full PHPUnit tree swept the same day (~1,887 tests, 0 failures)).

## 7. ACCEPTANCE GATES (per TODO)

Happy path + authZ (guest 401, stranger 403, admin gates) + failure edges
(422s, idempotency replay, race collapse via 23505) + audit rows asserted +
browser proof for UI + no dead links. Global rules (§3 contract) apply to
every item.
