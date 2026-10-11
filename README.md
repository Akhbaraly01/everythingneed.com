# EverythingNeed.com

A multi-vendor, multi-service platform: marketplace, services, bookings,
transportation, hotels, jobs, learning, healthcare, pharmacy, food and more.

**Stack** — Laravel 13 (modular monolith, DDD) · PostgreSQL 18 · Inertia.js v2 ·
React 18 · TypeScript · Tailwind CSS · Sanctum auth · Reverb realtime.

---

## Repository layout

```
everythingneed-com/
├── backend/                 Laravel API + Inertia pages (the single app shell)
│   ├── Modules/<Name>/      Domain modules: Entities, Http, Actions,
│   │                        Services, Routes, Providers, Events, Listeners
│   ├── Core/                Shared kernel: Services+Contracts, Exceptions,
│   │                        Policies, Traits, Enums
│   ├── app/Http/Controllers/Web   Inertia page controllers
│   ├── resources/js/pages         Inertia React pages
│   └── routes/web.php             Web (Inertia) routes; /api via modules
└── scripts/                 Architecture guard scripts (CI)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for module boundaries and conventions and
[DEVELOPMENT.md](DEVELOPMENT.md) to get running in five minutes.

## Quick start

```bash
# Single app: API + Inertia shell on :8000
cd backend
composer install && npm install
cp .env.example .env            # set DB_* to your PostgreSQL
php artisan key:generate
php artisan migrate --seed      # demo data: role accounts, products, flights…
php artisan storage:link        # expose public disk (product/CMS images)
                                # Windows: run the shell as admin (or enable
                                # Developer Mode) so the link can be created
npm run build                   # production Inertia bundle
php artisan serve               # http://127.0.0.1:8000
```

**Test accounts (DEV ONLY, password `password`):**
`super@everythingneed.com` · `admin@…` · `vendor@…` · `cs@…`

## Testing

```bash
cd backend && php artisan test          # 1274 tests on PostgreSQL
cd backend && npm run test:e2e          # Playwright (chromium + mobile)
```

## Key conventions

- **PostgreSQL only.** UUID primary keys, soft deletes where meaningful.
- **Authorization is server-side**: role middleware *and* granular
  `permission:<module.action>` matrix (`role_permissions` table).
- **Payments** go through `PaymentGatewayInterface` (`config/payments.php`);
  the `mock` driver is blocked in production.
- **No BaaS SDKs** — `backend/eslint.config.js` and CI architecture gates
  reject external BaaS imports.
- New user-facing features land as **Inertia pages** under
  `backend/resources/js/pages/<Module>/`.
