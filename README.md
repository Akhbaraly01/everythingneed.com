# EverythingNeed.com

A multi-vendor, multi-service platform: marketplace, services, bookings,
transportation, hotels, jobs, learning, healthcare, pharmacy, food and more.

**Stack** — Laravel 13 (modular monolith, DDD) · PostgreSQL 18 · Inertia.js v2 ·
React 18 · TypeScript · Tailwind CSS · Sanctum auth · Reverb realtime.

---

## Repository layout

```
everythingneed-com/
├── backend/                 Laravel API + Inertia pages (primary app shell)
│   ├── Modules/<Name>/      Domain modules: Entities, Http, Actions,
│   │                        Services, Routes, Providers, Events, Listeners
│   ├── Core/                Shared kernel: Services+Contracts, Exceptions,
│   │                        Policies, Traits, Enums
│   ├── app/Http/Controllers/Web   Inertia page controllers
│   ├── resources/js/pages         Inertia React pages
│   └── routes/web.php             Web (Inertia) routes; /api via modules
├── frontend/                Legacy SPA surface (React Router), still served
│   └── src/modules/         37 feature modules migrating into backend/
└── scripts/                 Architecture guard scripts
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for module boundaries and conventions and
[DEVELOPMENT.md](DEVELOPMENT.md) to get running in five minutes.

## Quick start

```bash
# Backend (API :8000 + Inertia shell)
cd backend
composer install && npm install
cp .env.example .env            # set DB_* to your PostgreSQL
php artisan key:generate
php artisan migrate --seed      # demo data: 13 roles, products, flights…
npm run dev                     # or: php artisan serve

# Legacy SPA (:8080, proxies /api to backend)
cd ../frontend
npm install && npm run dev
```

**Test accounts (DEV ONLY, password `password`):**
`super@everythingneed.com` · `admin@…` · `vendor@…` · `cs@…`

## Testing

```bash
cd backend && php artisan test          # 380+ tests on PostgreSQL
cd frontend && npx playwright test      # browser smoke suite
node scripts/check-api-usage.mjs        # architecture tripwires
```

## Key conventions

- **PostgreSQL only.** UUID primary keys, soft deletes where meaningful.
- **Authorization is server-side**: role middleware *and* granular
  `permission:<module.action>` matrix (`role_permissions` table).
- **Payments** go through `PaymentGatewayInterface` (`config/payments.php`);
  the `mock` driver is blocked in production.
- **No BaaS SDKs** — ESLint and CI tripwires reject Supabase/Firebase imports.
- New user-facing features land as **Inertia pages** under
  `backend/resources/js/pages/<Module>/`.
