# Learn 2.0 — Moderation Model (Phase L-A)

Status: **IMPLEMENTED & VERIFIED** (`LearnModerationV2Test` 9/9,
`LearnFeedV2Test` 8/8, e2e `learn.spec.ts` review console green).

Backend: `backend/Modules/Learn/Http/Controllers/LearnModerationController.php`
(+ submission/appeal side in `LearnPostController.php`), routes in
`backend/Modules/Learn/Routes/api.php`, console UI in
`backend/resources/js/pages/admin/LearnReview.tsx`.

## 1. State machine

Eight states, defined on `Modules\Learn\Entities\LearnPost`:

```
draft ──submit──► pending ──claim──► under_review ──approve──► approved
                    ▲                    │   │                    │
                    │                    │   └─reject──► rejected  │
     resubmit       │                    │                │       │
                    └──needs_information─┘                │       │
                    ▲                                     │       │
                    └────────────── appeal(reason) ───────┘       │
                                                                 │
approved ◄──restore── hidden ◄──hide── approved                   │
   │  └──────────────────────────────────────────────────────────┘
   └── remove ──► removed (terminal)
```

- **`approved` is the only publicly visible state** (`VISIBLE_STATUSES`),
  which keeps the phase-16 contract intact (pending/draft/rejected invisible).
- `LearnPost::STATUS_*` constants are the single source of truth; the shared
  tone/label map lives in `backend/resources/js/lib/lifecycle.ts`
  (`under_review`, `needs_information`, `draft`, `hidden`, `removed` labels
  added in L-A so no state renders as a raw string).
- Guards: `decide()` and `approve()` refuse `removed`/`draft` (409); `restore()`
  only works from `hidden` (409 otherwise); `pin()` only on `approved`.
- **`remove` is a soft delete**: `LearnModerationController::remove()` calls
  `$post->delete()` and writes `learn.post.remove` with
  `new_values.status = removed`. The row keeps its previous status column but
  gains `deleted_at`, so it vanishes from the feed, the queue and further
  moderation (a later `find()` → 404). `STATUS_REMOVED` therefore reads as the
  *intent* recorded in the audit trail rather than a value written to
  `learn_posts.status` — see the honest gap in §3.

## 2. Review tiers

Role roster is **39** after L-A (new role **`learning_reviewer`**).

| Tier | Roles | Allowed actions |
|---|---|---|
| **Review** | `super_admin`, `administrator`, `learning_admin`, `learning_reviewer`, `moderator` | queue, claim, approve, reject, needs-info, hide, restore, remove, reports inbox, resolve/dismiss report |
| **Senior** | `super_admin`, `administrator`, `learning_admin` | reassign, pin (and course create) |
| **Author** | any authenticated user | submit/draft, edit own, appeal own rejection, like/save/report/comment/follow |
| **Guest** | — | public reads only → 401 on every auth route, 403 on `role:`-gated web routes |

Tier enforcement is **inline per route** (`->middleware('role:...')`) so the
split is readable at the route definition, plus in-controller checks for
actions that depend on the *content*, not just the role.

### Extra in-controller rules

- **No self-moderation**: a reviewer cannot approve/reject/decide their own
  post (403, `LearnModerationV2Test::reviewers cannot moderate their own posts`).- **Sensitive topics need a senior**: `learn_posts.sensitive_topic` is set at
  submit time from `LearnPost::SENSITIVE_CATEGORIES`
  (`health/healthcare/medical/medicine/finance/financial/investment/money/
  legal/law/pharmacy/drugs`). `requiresSecondReview()` + `isSenior()` gate
  approval with a 403 explaining the requirement.
- **Claims are atomic**: a conditional `UPDATE … WHERE assigned_to IS NULL
  OR assigned_to = me` decides the claim; a lost race returns **409** with the
  current assignee's name (pinned by `claim is an atomic single owner lock`).
  Claiming a `pending` post moves it to `under_review`.
- **Reassign** (senior) hands the post to another reviewer and notifies them.

## 3. Queue (`GET /api/learn/posts-queue`)

- Tabs = `QUEUE_STATUSES` = `pending`, `under_review`, `needs_information`,
  `rejected`, `approved`, `hidden`, `removed` (`draft` is author-private and
  never enters the queue).
- **Honest gap:** the `removed` tab is always `0` — removal is a soft delete
  (§1) and the queue query runs on the default (non-trashed) scope, so removed
  rows never appear there. Removed content is still fully accounted for by its
  `learn.post.remove` audit row and the author notification.
- `counts` returns a real `GROUP BY status` count, unioned with zeros so every
  tab pill always renders (real counts win over defaults).
- Filters: `status` (tab slug or `all`; unknown values are intersected away),
  `q` (title/content), `assignee`, `sort` = `oldest` (default — `submitted_at`
  ascending, i.e. **SLA order**) or `newest`.
- Pagination: 20 rows/page with `meta.current_page/last_page/total`.
- Order: `submitted_at ASC, created_at ASC` (oldest waiting first).

## 4. Decisions

All decisions funnel through `decide()` → one DB transaction:

1. guard (404 / 409 / 403 as above),
2. write `status` + `rejection_reason` (for reject/hide) + `reviewed_by` /
   `reviewed_at`,
3. write an audit row,
4. notify the author (best-effort — notification failure never breaks the
   decision).

| Action | Status written | Audit action | Author notification |
|---|---|---|---|
| `approve` | `approved` + `published_at`, clears `rejection_reason` | `learn.post.approve` | "Your post is live" + feed line |
| `reject` | `rejected` + `rejection_reason` | `learn.post.reject` | "not published" + reason |
| `needs-info` | `needs_information` (the note is **not** a post column — it travels in the audit row `reason` and the notification) | `learn.post.needs_information` | "changes requested" + note |
| `hide` | `hidden` + `reason` | `learn.post.hide` | hidden from feed |
| `restore` | `approved` (clears reason) | `learn.post.restore` | back in the feed |
| `remove` | `removed` | `learn.post.remove` | — |
| `reassign` | `assigned_to` change | `learn.post.reassign` | assignee notified |
| `pin` | `is_pinned` | `learn.post.pin` | — |

Notifications use the shared Notifications contract with
`type = 'moderation'` and `related_id = post_id`, so they land in the author's
notification inbox with a deep link to the post.

### Author-side loops

- **Resubmit**: `needs_information` → author edits (`PATCH /api/learn/posts`)
  → back to `pending`, `submitted_at` refreshed.
- **Appeal**: `POST /api/learn/posts/{id}/appeal` — author only, only from
  `rejected`, `reason` required (≤1000, stripped); resets `status = pending`,
  clears `assigned_to`/`reviewed_by`/`reviewed_at`, stores `appeal_reason`.
  Wrong state → 409, someone else's post → 403.

## 5. Reports inbox

- `POST /api/learn/posts/{id}/report` (throttled `10/1`): the post must be
  publicly visible (404 otherwise), `reason` must come from
  `LearnPostReport::REASONS`, `details` ≤500, and **one report per
  (user, post)** — a duplicate returns 409 (and the DB unique index backstops
  the race). Pinned by `saves and reports are single edge per user`.
- `GET /api/learn/reports?status=open|resolved|dismissed`: list with post +
  reporter context.
- `POST /api/learn/reports/{reportId}/resolve` with
  `action = resolve|dismiss`: a report can only be closed once (409 on a
  repeat), writes `learn.report.resolve|dismiss` audit rows and sets
  `handled_by` / `handled_at`.
- Resolving a report does **not** itself publish/unpublish content — the
  reviewer still takes the explicit queue decision (hide/remove/approve), so
  moderation intent is always auditable.

## 6. Console UI

`GET /admin/learning/review` → `resources/js/pages/admin/LearnReview.tsx`
(route registered in `backend/routes/web.php`, guest → `auth/Login`).

- Two views: **Queue** and **Reports**.
- Nine status pill tabs with live counts, search, assignee and sort filters,
  `DataTable` columns (title, author, status, assignee, submitted, actions).
- Row actions gated by `isReviewer` / `isSenior` on the client
  (claim, approve, reject, needs-info, hide, restore, pin, remove) with
  `ConfirmDialog` / `PromptDialog` for destructive or reason-bearing actions;
  the server re-checks every action regardless of client gating.
- `admin/Learning.tsx` keeps its legacy `/api/learn/posts-queue` `data[]`
  contract (shape preserved in L-A).

## 7. Security posture

- Guest → 401 on every moderation endpoint (route-level + test).
- Moderating your **own** post → 403 (self-moderation rule); a non-senior
  touching a sensitive topic → 403.
- Missing model → 404 (JSON), matching the house convention; illegal
  transitions (`remove`/`approve` on `draft` or `removed`, `restore` outside
  `hidden`, `claim` on a decided post) → 409 with a plain message.
- Report/heartbeat endpoints carry route throttles; `approve` on an already
  approved post is a **no-op 200** ("Post is already approved") that writes no
  second audit row; report closure is single-shot (409 on repeat).
- Every state change writes an `audit_logs` row through
  `AuditServiceInterface` (`learn.post.*` / `learn.report.*` actions).

## 8. Tests

| Suite | Count | Pins |
|---|---|---|
| `tests/Feature/Learn/LearnModerationV2Test.php` | 9 | atomic claim, no self-approval, senior-only sensitive topics, queue filters/counts/SLA order, notification + audit rows on transitions, hide/restore, reviewer denied senior actions, report resolved once, guests 401 everywhere |
| `tests/Feature/Learn/LearnFeedV2Test.php` | 8 | draft privacy + resubmit, video resolution/422, cursor paging, heartbeat, single-edge like/save/report, threaded comments + comment likes, rejection appeal, follows |
| `tests/Feature/Learn/LearnPlaylistTest.php` | 3 | owner scoping, approved-only items, guest 401, hard-delete re-add, per-user duplicate names |
| `e2e/learn.spec.ts` | 2 (× viewports) | submit → approve → watch page → comment; queue counts + reports inbox render |

L-A total: **20 unit/feature tests (183 assertions)**; full suite
**1520 passed (10167 assertions), 0 failed**.
