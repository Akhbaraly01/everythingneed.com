# Learn 2.0 — Knowledge Feed Architecture (Phase L-A)

Status: **IMPLEMENTED & VERIFIED** (backend + frontend + tests + e2e green 2026-10-07).
Runtime-unverified: actual third-party video *playback* in a real browser (the
e2e proves the watch page, player chrome and data flow; provider embeds are
resolution-tested server-side and rendered client-side — see "Honest gaps").

Related: `docs/LEARN_MODERATION_MODEL.md` (state machine + review tiers),
`backend/AUDIT_MATRIX.md` → *Phase L-A* rows, `backend/FINAL_VALIDATION_CHECKLIST.md`
→ *Phase L-A*.

## 1. Scope

Phase L-A turns the phase-16 `learn_posts` prototype into a moderated
knowledge feed:

- user-submitted posts (text / image / video) with a real review lifecycle,
- a public feed that exposes **approved posts only**,
- a watch page (post detail) with player, threaded comments and watch time,
- a reviewer console (`/admin/learning/review`) with a queue + report inbox,
- playlists, follows, saves, reports and appeals.

Everything runs on module-owned tables inside `Modules/Learn`; shared concerns
(Media, Notifications, Audit) go through their existing contracts — there are
no cross-module `DB::table()` reads (enforced by `ModularMonolithTest`).

## 2. Data model

Migration: `backend/database/migrations/2026_10_07_100000_upgrade_learn_feed_tables.php`
(applied to the dev **and** test databases).

| Table | Owner | Purpose / notable columns |
|---|---|---|
| `learn_posts` | Learn | `status` (8 states), `category` (NOT NULL, default `general`), `media_type`, `video_provider`/`provider_video_id`, `duration_seconds`, `views_count`, `likes_count`, `comments_count`, `shares_count`, `sensitive_topic`, `rejection_reason`, `appeal_reason`, `reviewed_by`/`reviewed_at`, `assigned_to`, `submitted_at`, `published_at`, `is_pinned`, `slug` |
| `learn_post_comments` | Learn | threaded replies (`parent_id`), `comments_count` on the post |
| `learn_comment_likes` | Learn | one edge per (user, comment) |
| `learn_post_likes` / `learn_post_saves` | Learn | one edge per (user, post) |
| `learn_post_reports` | Learn | `status` open/resolved/dismissed, `reason`, `reviewer_id` |
| `learn_video_views` | Learn | per-viewer watch time (`seconds_watched`), heartbeat dedupe |
| `learn_follows` | Learn | follower → creator edge |
| `learn_playlists` / `learn_playlist_items` | Learn | owner-scoped collections; unique `(playlist_id, post_id)` is a **hard** unique (no `deleted_at`), so item removal uses `forceDelete()` |

Models live in `backend/Modules/Learn/Entities/` (`LearnPost`,
`LearnPostComment`, `LearnCommentLike`, `LearnPostLike`, `LearnPostSave`,
`LearnPostReport`, `LearnVideoView`, `LearnFollow`, `LearnPlaylist`,
`LearnPlaylistItem`). All inherit `App\Models\Model` (SoftDeletes,
`$guarded = ['id']`).

## 3. API surface

Routes: `backend/Modules/Learn/Routes/api.php`.

**Public reads** (no auth)
`GET /api/learn/posts` (feed), `GET /api/learn/posts/{id}`,
`GET /api/learn/posts/{id}/comments`, `GET /api/learn/creators/{userId}`.

**Authenticated member actions** (`auth:sanctum`)
`POST /api/learn/posts` (submit/draft), `PATCH/DELETE /api/learn/posts/{id}`,
`GET /api/learn/posts-mine`, like / save / share / report / appeal /
comment / comment-like / follow / heartbeat, `GET /api/learn/saved`,
playlists CRUD.

**Review tier** (`role:super_admin,administrator,learning_admin,learning_reviewer,moderator`)
queue, claim, approve, reject, needs-info, hide, restore, remove,
reports inbox, resolve report.

**Senior tier** (`role:super_admin,administrator,learning_admin`)
reassign, pin (and course create).

Report and heartbeat endpoints carry route throttles
(`throttle:10,1` on report, `throttle:60,1` on heartbeat).

## 4. Feed semantics (`LearnPostController::index`)

- Visibility: `status = approved` — the only publicly visible state, which
  keeps the phase-16 contract (pending/draft/rejected invisible) intact.
- Filters: `q` (ilike title/content), `type` (text/image/video),
  `category`, `author` (user id), `sort` (latest/top/trending),
  `per_page` (≤30, default 15).
- Deterministic ordering: every sort carries a uuid7 id tiebreaker so pages
  never skip or repeat rows.
  - `latest`: pinned rows lead **page one only**, then `(created_at, id)` —
    the cursor path stays a pure keyset.
  - `top`: `(likes_count, id)` keyset.
  - `trending`: `(views_count, likes_count, id)` with offset `page`
    pagination (computed ordering has no stable keyset value).
- Cursor is base64 `{k, v, i}`; a cursor issued for another sort (or a
  corrupt one) is dropped instead of returning a wrong page.
- Response: `{ data, meta: { per_page, has_more, next_cursor, sort, page } }`.

## 5. Video pipeline (self-hosted + provider embeds)

Decision (mega-plan): **self-hosted uploads for platform media, plus
external-link ingestion** — a creator pastes a YouTube / Vimeo / Facebook /
TikTok URL (or a direct MP4/HLS file link) at submit time; the post is
moderated, and approved posts play inside our player chrome via the
provider's embed player or a native `<video>` element. Provider bytes are
never re-hosted.

- `backend/Modules/Learn/Support/VideoResolver.php` resolves a submitted URL
  at **submit time** into `video_provider` ∈
  `upload|youtube|vimeo|facebook|tiktok|file` + `provider_video_id`;
  unsupported hosts are rejected with 422 (pinned by `LearnFeedV2Test`).
- `backend/resources/js/lib/video.ts` mirrors the resolution rules client-side
  (embed URL construction for the player; `resolvePlaybackSource()` also
  powers lesson/course surfaces).
- `backend/resources/js/components/learn/VideoPlayer.tsx`: shared player chrome
  (provider embed or native `<video>` for uploads/files), muted autoplay in
  view, progress callbacks for the watch-time heartbeat. When a player SDK
  fails it falls back to the provider's plain embed iframe in-app — it never
  replaces a failed player with an external redirect.
- Provider compatibility matrix (what embeds, what cannot, and why):
  `docs/architecture/VIDEO_PROVIDER_COMPATIBILITY.md`.
- Watch time: `POST /api/learn/posts/{id}/view-heartbeat` accumulates
  `learn_video_views.seconds_watched` per viewer (30s or 75% of duration in
  the client), counted once per viewer for `views_count`.

## 6. Watch page + engagement

`GET /learn/watch/{id}` → `resources/js/pages/learn/Watch.tsx` (registered as
`learn.watch` after `learn.feed` in `backend/routes/web.php`, id constrained
with `->where('id', '[^/]+')`).

Renders the post, player, like/save/share/follow/report actions, and threaded
comments (replies + comment likes). A missing/unknown id surfaces the honest
404 empty state (`ApiError status === 404`) — no fake content.

Feed page `resources/js/pages/learn/Feed.tsx` (rewritten in L-A) lists approved
posts with sort/filter controls, cursor/`Load more` paging, save/like/report,
and card links into the watch page.

## 7. Frontend files

| File | Role |
|---|---|
| `resources/js/pages/learn/Feed.tsx` | public feed (v2) |
| `resources/js/pages/learn/Watch.tsx` | post detail / player / comments |
| `resources/js/pages/admin/LearnReview.tsx` | reviewer console (queue + reports) |
| `resources/js/components/learn/VideoPlayer.tsx` | player chrome |
| `resources/js/lib/video.ts` | embed URL helpers |
| `resources/js/lib/lifecycle.ts` | shared status tones/labels (adds `under_review`, `needs_information`, `draft`, `hidden`, `removed`) |

Bundle evidence: `npm run build` emits `assets/Watch-*.js` and
`assets/LearnReview-*.js`.

## 8. Roles and authorization

- New role **`learning_reviewer`** → role roster **38 → 39**, wired through
  `AppRole`, `AdminRbacController::ROLES`, `PermissionSeeder`
  (`learn.posts.review`), `config/workspace.php`, `AdminPolicy`, the
  `$adminConsoleRoles` list + `/admin/learning/review` web route,
  `AdminPageController` dashboard cards and the console navigation
  ("Content Review").
- 184-permission catalog is untouched (additive-only rule respected: the new
  grant reuses the existing `learn.posts.review` catalog entry).
- Tier checks are **inline per route** (see §3) rather than a shared
  middleware alias, so the review/senior split is readable at the route.

## 9. Tests and gates

| Gate | Result |
|---|---|
| `LearnFeedV2Test` | 8/8 (draft privacy, video resolution + 422, cursor paging, heartbeat, single-edge like/save/report, threaded comments, appeal, follows) |
| `LearnModerationV2Test` | 9/9 (atomic claim, no self-approval, senior-only sensitive topics, queue filters/counts/SLA, notifications + audit rows, hide/restore, tier denial, report resolution, guest 401s) |
| `LearnPlaylistTest` | 3/3 (owner scoping, approved-only items, guest 401, hard-delete re-add, per-user duplicate names) |
| L-A suites total | **20 passed (183 assertions)** |
| Learn filter batch | **70 passed** |
| Full PHPUnit | **1520 passed (10167 assertions), 0 failed** (`%TEMP%\opencode\la2_full_phpunit.log`) |
| Vitest | **40/40** |
| ESLint / tsc | 0 errors (1 pre-existing `Kyc.tsx` warning) / 0 |
| Build | green (`Watch-*`, `LearnReview-*` chunks) |
| Route / page audits | **697 routes + 260 pages, 0 violations** |
| `route_list.txt` | regenerated: **918 routes**, UTF-8, no BOM, 0 U+FFFD, contains `learn/watch/{id}` + `admin/learning/review` |
| Runtime probes | `/learn/feed` → `learn/Feed`; `/learn/watch/{uuid}` → 200 `learn/Watch`; `/admin/learning/review` (guest) → `auth/Login` |
| Playwright e2e | **55 passed / 14 skipped / 0 failed** (`e2e/learn.spec.ts`: feed journey + review console) |

## 10. Honest gaps (not yet implemented)

- External provider **playback** is not asserted in a real browser (embeds are
  resolved server-side and rendered client-side; provider availability can't
  be pinned in CI).
- No recommendation/personalization: feed order is strictly deterministic
  (latest/top/trending). LLM gating is deferred by decision; only the rule
  engine (sensitive categories, status transitions) is in play.
- Live transcription/SEO of video content, captions and chapter markers: not
  implemented.
- `learn_direct_messages` exists as a legacy table/model but has no L-A
  endpoints (pre-existing, untouched).
- `remove` is a soft delete, so the queue's `removed` tab always shows `0`
  (removed rows leave every default-scope query) — the removal is evidenced by
  its audit row instead. See `docs/LEARN_MODERATION_MODEL.md` §1/§3.
