# Video Provider Compatibility Matrix

Deliverable #15 of the master directive. Describes what actually plays
inside EverythingNeed, what cannot, and why. Every row reflects the shipped
implementation and is pinned by automated tests — if this file and the code
disagree, the code and its tests are authoritative.

## 1. How resolution works

| Surface | Resolved by | When |
| --- | --- | --- |
| Knowledge feed posts | `Modules/Learn/Support/VideoResolver.php` (server) | At submit time; unsupported hosts rejected with 422 |
| Feed composer preview | `resources/js/lib/video.ts` `resolveVideoUrl()` (client mirror) | While typing |
| Lessons, course intros | `resources/js/lib/video.ts` `resolvePlaybackSource()` | At render time |
| Live rooms (healthcare, live classes) | `resources/js/components/media/VideoRoom.tsx` | When the participant joins |

Stored URLs are never echoed into an arbitrary iframe: playback only uses
provider-specific embed URLs built by `embedUrlFor()` or a native `<video>`.

## 2. Playback matrix

| Provider | Detection | Mechanism | In-app playback | Watch-time heartbeat | Failure behavior | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| YouTube | `youtube.com`, `youtu.be`, `youtube-nocookie.com`, shorts/embed/live paths | IFrame Player API → embed; basic-mode `youtube-nocookie.com/embed` iframe if the SDK cannot load | Yes | Yes (SDK state events; off in basic mode, labeled) | In-app embed fallback; never an external redirect | `video.test.ts`, `LearnFeedV2Test`, `playback.spec.ts` (real embed mounts, zero external watch links) |
| Vimeo | `vimeo.com`, `player.vimeo.com` | Vimeo Player SDK → embed; `player.vimeo.com/video/{id}` iframe in basic mode | Yes | Yes (SDK events; off in basic mode, labeled) | In-app embed fallback | `video.test.ts`, `LearnFeedV2Test` |
| Facebook | `facebook.com`, `m.facebook.com`, `fb.watch` | Official plugin iframe (`/plugins/video.php`) | Yes | No — playback state is not observable from our origin; honest zero | n/a (plugin iframe is the only mechanism) | `video.test.ts`, feed tests |
| TikTok | `tiktok.com`, `m.tiktok.com` (`/@user/video/{id}`) | Official `tiktok.com/embed/v2/{id}` iframe | Yes | No — same origin limitation as Facebook; labeled on the player | n/a | `video.test.ts`, `LearnFeedV2Test` |
| Direct files (MP4/WebM/OGG/MOV/M4V/HLS) | URL extension (`DIRECT_FILE`) | Native `<video controls playsinline>` | Yes | Yes (native play/pause events) | n/a | `video.test.ts`, `LearnFeedV2Test` |
| Platform uploads | `/storage/uploads/` paths | Native `<video>` | Yes | Yes | n/a | existing upload tests |
| Udemy | `udemy.com`, `*.udemy.com` | None — Udemy refuses embedding and uses authenticated/DRM'd delivery | **No** | No | In-app notice card explaining why + clearly labeled "Open on Udemy (leaves the app)" link | `video.test.ts`, `VideoPlayer.tsx` |
| Google Meet | `meet.google.com` | None — frame headers refuse third-party embedding | **No** | No | In-app notice + labeled "Open on Google Meet (leaves the app)" link (lesson page) | `video.test.ts`, `Lesson.tsx` |
| Zoom | `zoom.us`, `*.zoom.us` | None — embedding requires the paid Meeting SDK with signed credentials | **No** | No | In-app notice + labeled "Open on Zoom (leaves the app)" link (lesson page) | `video.test.ts`, `Lesson.tsx` |
| Jitsi (live rooms) | `*.jit.si`, `jitsi.*`, or any room URL in `VideoRoom` | Jitsi `external_api.js` External API; plain iframe fallback | Yes | n/a | Iframe fallback inside the app; SDK failure never navigates away | `VideoRoom.tsx`, `playback.spec.ts` (healthcare join/leave, single page) |

**DRM, authentication and provider restrictions are never bypassed.** No
provider bytes are re-hosted or proxied through the application.

## 3. Live rooms (healthcare + live classes)

- Healthcare virtual appointments: `POST /api/appointments/{id}/video-room`
  issues the room (provider + join URL, Jitsi by default via
  `config('services.video')`); the patient joins **in-app** on the
  appointment page. Owner-scoped, physical appointments rejected (422),
  strangers blocked (403) — `VideoRoomTest`.
- Learn live classes: a lesson whose `video_url` is a Jitsi link renders a
  join card and mounts `VideoRoom` inline with a Leave control.
- Camera/microphone are delegated **only** to the configured video-room
  host through `Permissions-Policy` (`camera=(self "<video host>")`,
  `microphone=(self "<video host>")`) — never globally.
- Recording stays disabled (no recording workflow is implemented).

## 4. CSP and security requirements (enforced)

`app/Http/Middleware/SecurityHeaders.php` allowlists only what playback
needs, all config-driven via `services.video.base_url`:

- `frame-src`: `'self'` + YouTube, YouTube-nocookie, Vimeo player, Facebook,
  TikTok, and the video-room host.
- `script-src`: `'self'` + `www.youtube.com` (IFrame API),
  `player.vimeo.com` (player.js), and the video-room host
  (`external_api.js`).
- `media-src` allows `https:` for direct files; `connect-src` allows `https:`
  for SDK traffic.
- Pinned by `SecurityHeadersTest` (3 tests, 27 assertions) including the
  camera/microphone scoping assertions.

## 5. Known limitations (honest)

- Facebook and TikTok embeds cannot report watch time from our origin; the
  player says so instead of inventing numbers.
- Udemy, Google Meet and Zoom physically refuse embedding; they render
  informational in-app cards with clearly labeled external links.
- HLS plays through the browser's native support; no hls.js dependency was
  added (revisit only if a browser matrix proves it necessary).
- Product videos (`video_url`, falling back to `production_video_url`) now
  play in-app on the product detail page; vendors set them in
  `vendor/ProductCreate|ProductEdit.tsx`, admins in `admin/Products.tsx`.
  Vendors can also upload a small MP4/WebM as the product media.

## 6. Test evidence (last full run: 2026-10-17)

| Check | Result |
| --- | --- |
| `npm run test:unit` (includes 9 video-resolution tests) | 56/56 passed |
| `php artisan test tests/Feature/Learn/LearnFeedV2Test.php` (incl. TikTok + direct-file cases) | 9/9 passed (77 assertions) |
| `php artisan test tests/Feature/SecurityHeadersTest.php` | 3/3 passed (27 assertions) |
| `php artisan test tests/Feature/Healthcare/VideoRoomTest.php` | 2/2 passed |
| `php artisan test tests/Feature/Learn/AdminLessonManagementTest.php` (lesson CRUD + learner lesson page) | 4/4 passed (49 assertions) |
| `php artisan test tests/Feature/Products/ProductCrudTest.php` (video read + write paths) | 20/20 passed (60 assertions) |
| `php artisan test tests/Feature/Learn tests/Feature/Products tests/Feature/SecurityHeadersTest.php` | 131 passed (895 assertions) |
| `php artisan test tests/Feature/Admin/AdminConsoleApiParityTest.php + AdminConsoleAllowSweepTest.php` | 38 passed (98 assertions) |
| `npx playwright test e2e/playback.spec.ts --project=chromium` | 4/4 passed — feed video embed; virtual appointment room; **admin-managed YouTube lesson plays in-app**; **admin-managed Jitsi live class joins/leaves the in-app room** |
| `npx playwright test e2e/admin.spec.ts --project=chromium` | 5/5 passed — incl. **lesson manager modal add/delete loop on real course rows** |
| `npx playwright test e2e/learn-landing.spec.ts --project=chromium` | 6/6 passed |
| `npx tsc --noEmit`, `npx eslint`, `npm run build` | clean |

Browsers exercised for playback: Chromium (desktop) via Playwright. The e2e
matrix also defines mobile-pixel5 and tablet projects; playback specs run
there in full-suite runs, but the provider-embed assertions above were
verified on Chromium. Do not generalize results to browsers that were not
run.
