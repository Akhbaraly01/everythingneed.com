# Sub-page completeness audit (2026-10-13)

Method: route inventory (969 routes) × page inventory (269 tsx) × reference
checklists (Indeed/LinkedIn, Booking/Airbnb, DoorDash, Zillow, Upwork,
Fiverr, YouTube/Udemy, Zocdoc/GoFundMe) + dead-link sweep (0 dead).

## Findings + resolutions

| Gap (reference) | Resolution | Evidence |
|---|---|---|
| Expert reviews UI (Fiverr/Upwork): API existed, no list endpoint, no UI, no admin coverage | `GET /api/experts/{id}/reviews`; reviews section + form on `experts/Show`; admin `expert` tab with list + delete (`GET`/`DELETE /api/admin/expert-reviews`, same console gates) | `ExpertReviewTest` 3 passed; e2e `engagement.spec.ts` 3 passed |
| Saved jobs (Indeed/LinkedIn): wishlist API product-keyed, no job UI | Wishlist generalized (`entity_type`, typed unique triple, existence-checked, 409 on race); `snapshot` enrichment (batched, gone→null); save toggle on `jobs/Show`; generic `Wishlist.tsx` incl. "No longer available" | `SavedJobsTest` 3 passed; e2e deterministic fixture |
| Latent: wishlist page read fields the API never returned | Fixed by the same `snapshot` enrichment | `SavedJobsTest` + existing `WishlistEndpointTest` green |

## Intentionally not built

- Job alerts, company profiles, saved homes, tour scheduling: no backend
  signals for these exist; recorded as future vertical TODOs, not faked.
- Needs/agriculture/tasks/bills/experts/bookings dedicated admin consoles:
  covered via adjacent consoles (jobs, finance, services, reviews queue);
  per prior decision, needs/agri stay dashboard-only.
- Expert-review approve/hide workflow: separate table has no status
  lifecycle — delete-only moderation, documented here.

## Admin access/control delta (this pass)

- Expert reviews enter the Reviews console (`expert` tab, list + delete,
  `reviews.reviews.moderate` gates, audit on delete).
- Dependency ratchet extended honestly (Engagement snapshot reads
  allowlisted with reason); `AuthorizationCoverageTest` green.
