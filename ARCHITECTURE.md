# Modular Monolith Architecture

This project is organized as a **Domain-Driven Modular Monolith**, structured to map 1:1 onto a future **Laravel 13 + Inertia.js + React + TypeScript** modular monolith.

## Layout

```
src/
├── core/                # Infrastructure: api client, event bus, routes, config, logging
├── shared/              # UI primitives + framework-free utils (no business logic)
└── modules/             # 35 business modules, each fully self-contained
    ├── authentication/
    ├── users/
    ├── roles/
    ├── permissions/
    ├── vendors/
    ├── stores/
    ├── products/
    ├── categories/
    ├── inventory/
    ├── orders/
    ├── checkout/
    ├── payments/
    ├── wallets/
    ├── deliveries/
    ├── food/
    ├── rides/
    ├── bookings/
    ├── hotels/
    ├── real-estate/
    ├── jobs/
    ├── healthcare/
    ├── deals/
    ├── messaging/
    ├── notifications/
    ├── reviews/
    ├── subscriptions/
    ├── analytics/
    ├── admin/
    ├── settings/
    ├── experts/
    ├── learn/
    ├── needs/
    ├── pharmacy/
    ├── building-services/
    └── engagement/      # wishlist, compare, recently-viewed
```

Each module follows the same internal layout:

```
<module>/
├── components/   pages/      services/    hooks/
├── types/        validators/ store/       routes/
├── api/          utils/      index.ts     README.md
```

## Path aliases

Configured in `vite.config.ts` and `tsconfig.json`:

| Alias        | Resolves to       |
| ------------ | ----------------- |
| `@/*`        | `src/*` (legacy)  |
| `@modules/*` | `src/modules/*`   |
| `@core/*`    | `src/core/*`      |
| `@shared/*`  | `src/shared/*`    |

## Rules

1. **One module = one barrel.** Always import via `@modules/<name>` — never reach into subfolders.
2. **No module imports another module's internals.** Use the barrel, or emit a domain event.
3. **Cross-module communication** goes through `eventBus` in `@core/events/EventBus`. This mirrors Laravel's event/listener dispatch.
4. **Infra (Supabase, logging, config)** lives only in `@core`. Modules never import `@/integrations/...` directly — use `@core/api/client`.
5. **`@shared` contains zero business logic.** Only UI primitives and pure utilities.

## Migration phases

This refactor was done in two safe phases to avoid breaking the running app:

- **Phase 1 (done):** scaffolded `core/`, `shared/`, and all 35 module folders. Each module's `index.ts` re-exports current implementations from their existing locations. Aliases configured.
- **Phase 2 (incremental, per module):** physically relocate each module's files into its folder. Because all consumers already import from `@modules/<name>`, moves are transparent.

To migrate a module:

1. Move existing files (e.g. `src/pages/healthcare/*`) into `src/modules/healthcare/pages/`.
2. Update the module's `index.ts` re-exports to point at the new local paths.
3. Run the app — no external consumer code changes.

## Laravel 13 target mapping

Each `src/modules/<name>` maps directly to:

```
Modules/<PascalName>/
├── Entities/        # domain models
├── Repositories/    # data access
├── Services/        # business logic
├── Actions/         # single-responsibility commands
├── Http/Controllers # Inertia controllers
├── Resources/js/    # React pages (from modules/<name>/pages)
├── Policies/        # from modules/<name>/permissions
└── routes/web.php   # from modules/<name>/routes
```

Domain events emitted via `@core/events/EventBus` become Laravel events with the same names (`OrderCreated`, `PaymentCompleted`, `DeliveryCreated`, …).

## Event catalog

See `src/core/events/EventBus.ts` `DomainEventMap` for the typed list. Add new events there before emitting them.
