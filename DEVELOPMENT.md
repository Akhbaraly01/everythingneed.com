# Development Guide

## Prerequisites

| Tool | Version |
|---|---|
| PHP | ≥ 8.2 (8.5 used in dev) |
| Composer | 2.x |
| Node.js | ≥ 20 |
| PostgreSQL | ≥ 15 (18 used in dev) |

## First-run setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# .env: DB_CONNECTION=pgsql, DB_DATABASE=everythingneed, DB_USERNAME=postgres
php artisan migrate --seed
npm install
```

Seeders create 13 role accounts (password `password`), demo catalogue,
flights, tasks, worker profiles and the RBAC permission matrix.

## Daily commands

```bash
# Backend API + Inertia dev server
php artisan serve --port=8000        # http://127.0.0.1:8000
npm run dev                          # backend Vite (Inertia HMR)

# Legacy SPA
cd ../frontend && npm run dev        # http://localhost:8080 (proxies /api)

# Tests
php artisan test                     # full suite (~6 min)
php artisan test --filter CartApiTest

# Frontend builds
cd backend && npm run build          # Inertia production bundle
cd frontend && npm run build         # SPA production bundle
```

## Where things live

| Concern | Location |
|---|---|
| Domain logic | `backend/Modules/<Name>/Actions`, `Services` |
| HTTP endpoints | `backend/Modules/<Name>/Routes/api.php` |
| Inertia pages | `backend/resources/js/pages/<module>/` |
| Page controllers | `backend/app/Http/Controllers/Web/*PageController.php` |
| Shared UI | `backend/resources/js/components/shared/` |
| Cross-cutting services | `backend/Core/Services` + `Contracts` |
| Permissions | `PermissionSeeder` → `role_permissions` table |

## Adding a feature (checklist)

1. Migration + Entity under `Modules/<Name>/Entities`
2. Action(s) for mutations; thin controller
3. Routes in the module's `Routes/api.php`
4. Policy / `permission:` middleware on writes
5. Feature test covering happy path + authorization + failure
6. If user-facing: Inertia page + nav entry; reuse `components/shared`

## Payments

Drivers live behind `PaymentGatewayInterface`. Select via
`PAYMENTS_DRIVER=mock|manual`. The mock driver hard-fails when
`APP_ENV=production` unless `PAYMENTS_ALLOW_MOCK_IN_PRODUCTION=true`.
Never trust client amounts — controllers pass server-computed values only.

## Mail

`MAIL_MAILER=log` in development — emails render to
`storage/logs/laravel.log` (password-reset tokens, verification links).
Configure SMTP keys for staging/production.

## Architecture guardrails

- `scripts/check-api-usage.mjs` — blocks BaaS imports, bare fetch, cross-module leaks
- ESLint boundaries in `frontend/eslint.config.js`
- CI: `.github/workflows/module-boundaries.yml` enforces ≥5 e2e tests
