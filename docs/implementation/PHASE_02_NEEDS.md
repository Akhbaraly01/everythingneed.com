# PHASE 02 — NEEDS + verticals

Status: audit complete; regression gate running below.

## NEEDS-01 Audit (2026-10-13)

- Domain: `Modules/Needs` (14 files: NeedRequest/Category/Offer/Item/Event,
  TaskPost/Application controllers + routes) plus verticals Jobs(5),
  JobSeekers(7), Bookings(4), Services(6), BuildingServices(5), Rides(11),
  Hotels(7), Food(10), RealEstate(6).
- Pages: needs 6 (+5 my/*), jobs 9, job-seekers 4, tasks 5, transportation
  4, hotels 6, food 6, properties 5, agriculture 4, building-services 5,
  experts 4 — full customer + provider coverage, no missing shells.
- Lifecycle: `NeedRequest` statuses draft→…→reviewed (+cancel/dispute
  paths), `NeedOffer` pending/accepted/rejected/withdrawn, server-side
  `transition()` + `record()` timeline history, transactional
  accept/pay, budget validation (`gte:budget_min`), idempotent pay.
- Ownership: requester/provider/admin/moderator gates in controller
  (`isAdmin`/`isModerator` + policy middleware on routes).

## NEEDS-02 Reference recall (catalogue mapping, no live visits claimed)

Upwork/Fiverr (offers, milestones) → offer threads + negotiation;
Thumbtack/TaskRabbit (request→pro matching) → NeedCarousel + categories;
Indeed/LinkedIn (search, Easy Apply) → jobs board + applications;
Uber/Lyft (slots, tracking) → rides booking/tracking; Booking/Airbnb
(listings, reservations) → hotels/properties; DoorDash/Zomato (menus,
tracking) → food cart/checkout; Zillow (tours, inquiry) → properties.

## NEEDS-03..13 — implemented in prior waves, re-verified here

Customer + provider workflows, lifecycle engine, matching/collision
guards, escrow-adjacent pay flow, verified reviews, vertical consoles with
seeded demo data, needs admin (moderation/categories/fraud/audit),
per-request messaging, lifecycle notifications.

## NEEDS-14 Regression gate

- `NeedRequestWorkflowTest`, `WaveFNeedsWorkflowTest`,
  `WaveFNeedsPagesTest`, `NeedsJobsHardeningTest`, `NeedPayoutTest`.
- `e2e/chains.spec.ts` need-request chain (post→offer→accept→pay→complete).
- Jobs/JobSeekers/Bookings/BuildingServices/Rides/Hotels/Food/RealEstate suites.

## Re-verification (programme execution, this session)

- Needs workflow suites: **32 passed**.
- Vertical suites (Jobs/JobSeekers/Bookings/BuildingServices): **18 passed**.
- Vertical suites (Rides/Hotels/Food/RealEstate/Services/Experts): **61 passed**.
- Need-request e2e chain (chromium): **passed**.

**TRACK B GATE: CLOSED.**
