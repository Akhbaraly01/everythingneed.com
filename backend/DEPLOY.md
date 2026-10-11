# EverythingNeed — Production Deploy Runbook

Target: Laravel 13 modular monolith (`backend/`) + Inertia React SPA (Vite build into `public/build`).

## 1. Prerequisites

- PHP 8.2+, extensions: pdo_pgsql, mbstring, openssl, tokenizer, bcmath, fileinfo
- Composer 2
- Node 20+ (build only)
- PostgreSQL 14+
- Optional: Redis (sessions/cache), Reverb (websockets), supervisor, cron

## 2. Environment

```bash
cp .env.production.example .env
# edit secrets: APP_KEY (after key:generate), DB_*, MAIL_*, REVERB_*, PAYMENTS_*
php artisan key:generate --force   # if APP_KEY empty
```

Required production values:

| Key | Value |
|---|---|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_URL` / `FRONTEND_URL` | real HTTPS origin(s) |
| `FRONTEND_URLS` | exact public origins (CORS) |
| `MAIL_ENABLED` | `true` |
| `PAYMENTS_DRIVER` | `stripe` \| `paypal` \| `paystack` (never `mock`) |
| `LOG_LEVEL` | `error` or `warning` |
| `FORCE_HTTPS` | `true` behind TLS |
| `SESSION_SECURE_COOKIE` | `true` |

`mock` payments throw when `APP_ENV=production` unless `payments.allow_mock_in_production` is explicitly set (do not set it).

## 3. Install & build

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan storage:link
```

## 4. Database

```bash
php artisan migrate --force
php artisan db:seed --class=ProductionSeeder   # PermissionSeeder + FeatureFlagSeeder only
```

**Never** run in production:

- `php artisan db:seed` (`DatabaseSeeder` aborts outside local/testing — guard is intentional)
- `php artisan db:seed --class=TestUsersSeeder`
- `php artisan db:seed --class=LocalAccessSeeder`

## 5. Optimize (config cache only)

```bash
composer run optimize-prod
# = config:cache + event:cache + view:cache
```

**Do not run `php artisan route:cache` or `php artisan optimize`.**
The codebase still uses closure routes; Laravel refuses to cache them. Use the script above instead.

`config:cache` is safe: no `env()` calls outside `config/*` (footer/store links live in `config/app.php`).

## 6. Scheduler

Registered in `routes/console.php` (all five):

| Command | Cadence | Purpose |
|---|---|---|
| `financial:reconcile --release-expired` | hourly | wallet/hold/payment reconciliation |
| `inventory:release-expired` | every 5 min | release expired cart holds |
| `cms:prune-revisions` | daily | CMS revisions beyond `cms.revision_retention` |
| `needs:expire-past-deadline` | daily | published needs past `deadline` → `expired` |
| `notifications:prune-read` | weekly | read notifications older than 90 days |

Cron (single node):

```cron
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

## 7. Queue

Default production template uses `QUEUE_CONNECTION=database`. Tables `jobs`, `job_batches`, `failed_jobs` ship with migration `2026_09_24_000002_create_queue_tables`.

Worker (supervisor example):

```ini
[program:everythingneed-worker]
command=php /path/to/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
directory=/path/to/backend
autostart=true
autorestart=true
```

To stay on `sync` instead, set `QUEUE_CONNECTION=sync` (jobs run inline).

## 8. Web server

- Point document root at `backend/public`
- Terminate TLS at LB/nginx; set `FORCE_HTTPS=true`
- Trust proxy headers if behind nginx (`TRUSTED_PROXIES` / `TrustProxies` middleware)
- Serve `/up` health check

## 9. Realtime (optional)

```bash
php artisan reverb:serve
```

## 10. Post-deploy smoke

```bash
php artisan about
curl -fsS https://your-domain/up
php artisan route:list --json | head -c 200
```

- Login page 200
- `/api/health` returns `{status,database,timestamp}` only
- Payments: do not exercise `mock` in production

## 11. Rollback

```bash
php artisan down
# restore code + .env
php artisan migrate:rollback --force
composer run optimize-prod
php artisan up
```
