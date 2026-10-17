# NEEDS Domain Boundaries — TODO 03

Designed from the ACTUAL implementation (TODO 01 audit). Every row below names
the owning model/table/contract or marks an explicit GAP with its TODO.

## Aggregates and ownership

| Responsibility | Owner (model / table) | Notes |
|---|---|---|
| Custom request | NeedRequest / need_requests | 17-status lifecycle; owner = user_id |
| Offer / quotation | NeedOffer / need_offers | provider_id + need_request_id; single accepted via acceptOffer (atomic) |
| Offer revisions | GAP (TODO 12) | Re-submit flips offered→negotiating; no revision rows — history by NeedRequestEvent only |
| Request timeline | NeedRequestEvent / need_request_events | Append-only (from/to/action/note/actor) |
| Task post | TaskPost / task_posts | open/assigned/in_review/completed/cancelled; owner = created_by |
| Task application + evidence + payout | TaskApplication / task_applications | pending→approved→submitted→verified→paid; TKPAY-* |
| Taxonomy | NeedCategory / need_categories | No timestamps; sort_order + visibility flags |
| Predefined packages | NeedItem / need_items + deals landings | Catalog split with Product noted (TODO 09 reconciles) |
| Category form schemas | GAP (TODO 05) | No versioned schema entity; questions live in frontend copy |
| Attachments | Upload module + media rows (TODO 06/14 verify) | No NeedAttachment entity; uses shared upload |
| Messaging | Messaging module, request-linked threads (TODO 14) | No duplicate backend; threads reference need_request_id |
| Notifications | Notifications module on persisted events (TODO 14) | need_* event keys already emitted by transitions |
| Payments | Payments module via gateway contract (TODO 16) | NRPAY-* charge, NEEDPAYOUT-* release; no second engine |
| Reviews | Reviews module on completed engagements (TODO 17) | No NeedReview entity; eligibility rules pending |
| Disputes | Dispute / disputes (Orders-owned table, needs-scoped rows) | need_request_id/task_id nullable; order flow untouched |
| Dispute evidence | GAP (TODO 17) | Description/attachments only; no evidence entity |
| Fraud signals | FraudFlag / fraud_flags | Flag-only, human decide; never auto-punish |
| Bookings | Bookings module Booking + Services ServiceBooking | No NeedBooking entity — reuse verified (TODO 13) |
| Milestones | GAP (P4 N-20) | Task verify/mark-paid is the only staged release; no milestone ledger |
| Matching output | GAP (TODO 11) | No RequestMatch entity; open-scope listing only |
| Provider profile/verification | Vendors/Users + KYC evidence (TODO 08) | No ProviderProfile in Needs; verification states live in KYC/admin |
| Service areas/availability | GAP (TODO 08/11/13) | No ProviderServiceArea/Availability entities |

## Canonical lifecycles (as implemented, pinned by tests)

**NeedRequest:** draft → pending → published → reviewing/offered/negotiating →
accepted → payment_pending → paid → in_progress → fulfilled → completed.
Terminal alternates: cancelled, rejected, expired, disputed → refunded.
Moderator-only: reject/expire/refund. Single state-machine owner:
NeedRequestController::transition (admin console delegates, never forks).

**NeedOffer:** pending → accepted/rejected/withdrawn. Accepted is terminal and
protected from admin delete.

**TaskPost:** open → assigned → in_review → completed (+cancelled/restore by
moderator). **TaskApplication:** pending → approved → submitted → verified →
paid.

## Ownership rules (server-enforced)

- Request: owner-only edit/cancel/pay/accept; provider-only start/fulfill;
  offers visible to owner + bidding providers only (strangers 403).
- Task: owner-only applications view + approve; worker-only submit on assigned
  application; admin treated as owner in applicationAction.
- Disputes: requester or assigned provider (needs), owner or assigned worker
  (tasks); exactly one context per row.
- Admin: role + granular permission gates on every /api/admin/needs endpoint;
  consequential writes record events/notes.

## Integration contracts (reuse, don't duplicate)

Payments → Core PaymentGatewayInterface (charge/refund, idempotency keys).
Messaging → Messaging module threads. Notifications → persisted-event keys.
Media → Upload module (signed URLs, no enumeration). Audit → AuditLog
middleware + need_request_events. Scheduler → needs:expire-past-deadline daily.

## Gaps queued to TODOs

05 form schemas · 08 provider verification/areas · 09 listing moderation
states · 11 match entity + ranking · 12 offer revisions · 13 booking locks +
cancellation windows · 14 thread/notification hardening · 16 webhook/recon
proof · 17 review eligibility + dispute evidence · P4 milestone ledger.
