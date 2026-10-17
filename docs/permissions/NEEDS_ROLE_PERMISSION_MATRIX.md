# NEEDS Role–Permission Matrix — TODO 21

Additive-only: identifiers below extend `PermissionSeeder::CATALOG`; nothing
was renamed or removed. `needs_admin`/`administrator`/`platform_ops` hold
`needs.*` (every current and future needs permission); least-privilege roles
hold exact grants.

## Roles

| Role | Weight | Needs grants | Notes |
|---|---|---|---|
| super_admin | 10 | `*` (implicit) | Bootstrap + privilege management only |
| administrator | 8 | `needs.*`, `tasks.*` | Full domain control |
| platform_ops | 7 | `needs.*`, `tasks.*` | Ops without finance/security/content |
| needs_admin | 4 | `needs.*`, `tasks.*` | Domain console owner (L2) |
| needs_viewer | 2 | view-only set below | Triage: sees queues, mutates nothing |
| moderator | 5 | none | Generic moderator holds no needs grants |
| support_admin/agent, customer_service | 3–4 | none | Needs tickets via support module |

## needs_viewer exact grants

`needs.overview.view`, `needs.requests.view`, `needs.offers.view`,
`needs.tasks.view`, `needs.disputes.view`, `needs.fraud.view`,
`needs.providers.view`, `needs.listings.view`.

## Endpoint gates (`/api/admin/needs/*`, group floor `needs.overview.view`)

| Endpoint | Extra gate |
|---|---|
| GET overview | — (group floor) |
| GET requests, GET requests/{id} | `needs.requests.view` |
| POST requests/{id}/moderate | `needs.requests.moderate` |
| GET offers | `needs.offers.view` |
| DELETE offers/{id} | `needs.offers.moderate` |
| GET tasks, GET tasks/{id}/applications | `needs.tasks.view` |
| POST tasks/{id}/cancel, /restore | `needs.tasks.manage` |
| GET disputes, GET disputes/{id} | `needs.disputes.view` |
| POST disputes/{id}/assign, /resolve | `needs.disputes.manage` |
| GET fraud-flags | `needs.fraud.view` |
| POST fraud-flags/{id}/decide, POST fraud-scan | `needs.fraud.manage` |
| GET providers, GET providers/{id} | `needs.providers.view` |
| POST providers/{id}/review | `needs.providers.review` |
| POST providers/{id}/suspend, /reinstate | `needs.providers.manage` |
| GET listings | `needs.listings.view` |
| POST listings/{id}/moderate | `needs.listings.review` |
| GET categories | — (group floor; triage-readable) |
| POST/PUT/DELETE categories | `needs.overview.manage` |

## High-risk actions

- Refunds flow through the dispute→refund transition (moderator roles) with
  gateway idempotency + payout tagging; every resolution lands in
  `need_request_events` and the audit log.
- Role/permission grants are `role:super_admin`-only; needs roles (admin,
  viewer, moderator) receive exactly 403 (pinned by NeedsViewerRbacTest).
- Separation note: financial disbursement beyond needs refunds stays with
  finance roles; needs consoles never touch wallet internals or global RBAC.

## Verification

- NeedsViewerRbacTest (4): read-all/deny-all, fraud.manage split,
  self-escalation probes, console reachability.
- AdminRoleAuthorizationSuiteTest: roster 40 + needs probes (overview,
  requests, fraud-flags allow the 5 holders, deny the other 35).
- CanonicalRolesTest: ROLES == AppRole::values().
