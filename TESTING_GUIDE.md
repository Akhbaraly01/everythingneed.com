# System Testing Guide

## Status: ✅ All Systems Running (re-validated 2026-10-07 (Phase L-A): PHPUnit 1520/10167, unit 40/40, E2E 55/14, matrices 31+26+43, audits 697+260, routes 918)

### Server
- **App (Inertia, single server)**: http://127.0.0.1:8000 — serves both the web UI and the `/api/*` JSON API. There is **no separate frontend server** (no port 8080).

```bash
cd backend
php artisan serve --host=127.0.0.1 --port=8000
```

### Web URLs
- **Home**: http://127.0.0.1:8000/
- **Login**: http://127.0.0.1:8000/login (session-based; the old `/auth` page no longer exists)
- **Register**: http://127.0.0.1:8000/register
- **Marketplace**: `/products`, `/food`, `/healthcare`, `/learn`, `/tickets`
- **Account**: http://127.0.0.1:8000/dashboard (login required)
- **Admin console**: http://127.0.0.1:8000/admin (staff roles only; guests get 302 → `/login`)
- **Health**: `/up` (Laravel), `/api/health` (JSON `{status,database,timestamp}`)

### Web login flow
1. Navigate to http://127.0.0.1:8000/login
2. Enter a credential from the table below
3. You land on the role home: super_admin → `/admin/dashboard`, administrator → `/admin`, vendor_admin → `/vendor`, worker accounts → `/provider`, customer → `/dashboard`

## API Testing (token-based)

### Login Endpoint
**URL**: `http://127.0.0.1:8000/api/auth/login`
**Method**: `POST`
**Content-Type**: `application/json`

### Key API Endpoints
- `POST /api/auth/login` - Login (returns `access_token`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Logout (Bearer token)
- `GET  /api/auth/user` - Get current user (Bearer token)
- `GET  /api/health` - Public health check
- `GET  /api/products` - Public product catalog

### Test Credentials

Seeded via `TestUsersSeeder` / `LocalAccessSeeder` (never run full `db:seed`
in production — see `backend/DEPLOY.md`). Full table with landing pages:
`backend/FINAL_VALIDATION_CHECKLIST.md`.

**Password `password`:** super@, cs@, category@, moderator@,
daniel.worker@ (+4 more `*.worker@`)

**Password `Password1`:** superadmin@, admin@, vendor@, content@,
healthcare@, support@, learning@, finance@, user@, customer@
(all `@everythingneed.com`)

| Email | Role | Lands on |
|-------|------|----------|
| super@everythingneed.com | super_admin | /admin/dashboard |
| admin@everythingneed.com | administrator | /admin |
| vendor@everythingneed.com | vendor_admin | /vendor |
| user@everythingneed.com | user | /dashboard |
| support@everythingneed.com | support_staff | /admin |
| category@everythingneed.com | category_admin (assigned category) | /admin |
| moderator@everythingneed.com | moderator | /admin |
| cs@everythingneed.com | customer_service | /admin |

### Login Response Example
```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": "f6afd0c6-3820-4914-958e-af656c82bd67",
      "email": "admin@everythingneed.com",
      "name": "Administrator",
      "role": "administrator",
      "profile": null
    },
    "access_token": "2|Khdeg9CroHiEjQi5RZeG4PpWQaHj6vqOWE6q0Fq38354821d"
  }
}
```

---

## Database Info
- **Type**: PostgreSQL 14+ at `127.0.0.1:5432`
- **Dev database**: `everythingneed` (137 tables, fully migrated, seeded)
- **Test database**: `everythingneed_test` (used by PHPUnit via `RefreshDatabase`; PHPUnit chunks must run **sequentially**, never in parallel)
- **Status**: ✅ Migrated & Seeded

---

## Quick Test Commands

### Check health (PowerShell)
```powershell
Invoke-WebRequest -Uri http://127.0.0.1:8000/up -UseBasicParsing
Invoke-WebRequest -Uri http://127.0.0.1:8000/api/health -UseBasicParsing
```

### API login (PowerShell)
```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/api/auth/login -Method Post `
  -Body (@{ email='admin@everythingneed.com'; password='Password1' } | ConvertTo-Json) `
  -ContentType 'application/json'
```

### Full gates
See **Automated verification** below. Never run `php artisan migrate:fresh`
against the dev database — it is destructive.

---

## Configuration Files Modified
- Baseline config lives in `backend/.env.example`; production runbook in `backend/DEPLOY.md`.

---

## Automated verification

| Gate | Command | Latest result |
|---|---|---|
| PHPUnit (full suite) | `cd backend && php artisan test --no-coverage` | 1520 passed (10167 assertions), 0 failed |
| Frontend gates | `cd backend && npm run lint && npm run typecheck && npm run build` | 0 errors, 0 type errors, build ok |
| Unit (Vitest) | `cd backend && npm run test:unit` | 40 passed, 0 failed (8 files) |
| Route/page audits | `route_audit.php` + `page_audit.php` (under `%TEMP%\opencode\`) | 697/697 routes, 260/260 pages, 0 violations |
| Live HTTP matrix (admin) | `runtime_matrix_p10.ps1` (under `%TEMP%\opencode\`) | 31/31, 0 fails |
| Live HTTP matrix (customer journey) | `runtime_matrix_p11.ps1` (under `%TEMP%\opencode\`) | 26/26, 0 fails |
| Live HTTP matrix (full) | `live_matrix.ps1` (under `%TEMP%\opencode\`) | 43/43, 0 fails |
| Browser E2E (Playwright) | `cd backend && npm run test:e2e` | 55 passed, 14 skipped (desktop-only tests x3 viewports), 0 failed across chromium + mobile Pixel 5 + tablet 834px |
| CI | `.github/workflows/backend.yml` (tests / frontend / e2e), `.github/workflows/module-boundaries.yml` (architecture gates) | yaml-validated |

Run the live matrices and Playwright **sequentially with a ~60s gap** - they
share the web login throttle (`POST /login` is `throttle:10,1` per IP) plus the
global 240/min rate limit; running them in parallel produces false failures.
