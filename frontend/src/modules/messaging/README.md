# Messaging Module

Realtime chat + support.

## Public API
Import from `@modules/messaging`. Do not reach into subfolders from outside.

## Layout
- `components/` — module-owned React components
- `pages/` — route entry points
- `services/` — business logic (pure, framework-free)
- `hooks/` — React hooks
- `types/` — DTOs, entities
- `validators/` — zod schemas
- `store/` — module-local state
- `routes/` — module route definitions
- `api/` — data-access (calls `@core/api/client`)
- `utils/` — helpers

## Cross-module communication
Emit events via `@core`'s `eventBus`. Never import another module's internals.

## Laravel mapping
Migrates to `Modules/Messaging/` (entities, repositories, services, actions, policies).
