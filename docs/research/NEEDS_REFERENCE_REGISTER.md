# NEEDS Reference Register — TODO 02

Verified 2026-10-15. Only publicly documented flows are recorded below; no
claims about third-party internals, no copied branding/text.

## Upwork (project + professional engagement)

- https://www.upwork.com/ (marketplace home)
- https://support.upwork.com/hc/en-us/articles/10408677826963-What-is-Project-Catalog (Project Catalog: predefined projects, set scope/price/timeline, packages, add-ons, save-to-compare, message-before-buy, requirements after purchase, workroom, 72h-style completion flows)
- https://support.upwork.com/hc/en-us/articles/211063398-How-to-start-hiring-on-Upwork (client account + billing verification before hiring, post-a-job → proposals → interview, OR buy predefined project; hourly = weekly billing with limits, fixed-price = milestone funding + release on approval; no public contact details in profiles)

Adapted: custom request posting (NeedRequest), offer workflow (NeedOffer),
predefined service packages (NeedItem/deals), milestones via task
applications (submit→verify→mark-paid), message-before-booking, acceptance
releases payout (NEEDPAYOUT-*).
Required verification: validation, persistence, ownership, valid transitions,
idempotent payout — all pinned by NeedRequestWorkflowTest, TaskWorkflowTest,
NeedPayoutTest.

## Taskrabbit (local task booking)

- https://www.taskrabbit.com/how-it-works (choose task + location → compare
  Taskers by rate/skills/reviews → chat → confirm → cashless in-app payment
  after completion; Taskprotect resolution path; identity + background-checked
  Taskers; free cancel/reschedule ≥24h)
- https://support.taskrabbit.com/hc/en-us/articles/46260422073755-How-Do-I-Hire-a-Tasker (category → address → filter by date/time/price → profile → day/time slot → task details → review summary → confirm-and-chat; schedulable up to 14 days ahead; one Tasker per booking)

Adapted: TaskPost board + apply/approve flow, slot/date selection on tasks,
review-before-submit on request creation, in-app payment after acceptance,
24h-style cancellation policy surface, chat via request-linked messaging.
Required verification: availability collision protection (DB locking, TODO 13),
cancellation windows per category (TODO 13), vetting claims must match checks
actually performed (TODO 08).

## Thumbtack (professional discovery + matching)

- https://www.thumbtack.com/how-it-works (Search → Chat → Hire; verified
  reviews; cost guides)
- https://www.thumbtack.com/pro/jobs + https://help.thumbtack.com/article/how-thumbtack-works (customers describe project in own words + quick questions; platform shows best-fit pros WITH the reason each matches; pro job preferences control lead flow; pay-only-if-customer-responds; limited competition per lead; insights dashboard)
- https://www.thumbtack.com/ (cost guides, maintenance tips, project guides as discovery content)

Adapted: explainable matching (eligibility filters before ranking, reasons
shown — TODO 11), category-specific questions on request creation (§7),
provider job preferences / service areas, cost guides content (P1 N-29),
limited-competition lead fairness.
Required verification: eligibility exclusion tests (TODO 11 gate), no
sensitive-attribute ranking, no fabricated recommendations.

## Fiverr (predefined packages + add-ons)

- https://www.fiverr.com/ (gig marketplace home)
- https://help.fiverr.com/hc/en-us/articles/360010558038-How-Fiverr-works-for-clients (search + filters incl. budget/delivery-time/tier; Basic/Standard/Premium packages; Gig extras; Request-to-Order where required; Confirm & Pay with explicit 5.5% + $3-under-$100 fee disclosure; delivery → accept / request revisions / more time; auto-complete after 72h idle; payment released on acceptance; post-completion reviews; project-brief → tailored offers)

Adapted: NeedItem packages + add-ons (TODO 09), Request-to-Order equivalent
for inspection-before-quote services, explicit fee disclosure at checkout
(TODO 16/21), revision workflow on completion submission, configurable
auto-closure policy with notice (§17), review-after-completion rule (TODO 17).
Required verification: fee policy authorized + snapshotted, no fake success
states, eligibility-gated reviews.

## Supporting references (consulted per-TODO only)

- https://www.amazon.com/ — search/filter/review/discovery patterns (TODO 10)
- https://www.etsy.com/ — discovery patterns where applicable (TODO 10)
- https://www.shopify.com/ — catalog administration concepts (TODO 09)
- https://www.google.com/ — search interaction/relevance concepts (TODO 10)
- https://laravel.com/docs — framework implementation (all build TODOs)
- https://owasp.org/ — application security (TODO 24)
- https://tailwindcss.com/ — styling/responsive (TODO 23)
- https://ui.shadcn.com/ — reusable interface patterns (TODO 23)

## Rejected / deferred with reasons

- Upwork-style hourly work diaries with screenshots: REJECTED — invasive
  tracking without legitimate need (violates §15); weekly limits concept kept
  for future hourly billing (P4 N-25, needs timesheet ledger first).
- Taskrabbit 14-day booking cap as global rule: REJECTED as global —
  category-specific scheduling windows instead (TODO 13); cleaning/recurring
  tasks may adopt it per category.
- Thumbtack pay-per-lead provider monetization: DEFERRED — business model must
  explicitly authorize fees first (§21); matching fairness rules adopted now.
- Fiverr 72h auto-complete + fixed 5.5%/$3 fee: REJECTED as constants —
  auto-closure must be configurable + communicated (§17); fees configurable +
  snapshotted (§21).
- Background-check badges: REJECTED as a generic badge — verification states
  must distinguish identity/qualification/business checks actually performed
  (TODO 08, §23).
- End-to-end encrypted messaging: DEFERRED — impacts moderation/support/recovery
  (§18); secure transport + protected storage now.
