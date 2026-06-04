# Core Layer

Infrastructure used by every module. **Modules MUST depend on `@core/*`, never on each other directly.**

Contents:
- `api/` — single Supabase client (swap target during Laravel migration)
- `events/` — typed `EventBus` for cross-module communication
- `routes/` — central route table
- `config/` — global app config
- `logging/` — leveled logger

Laravel mapping:
- `api/client` → HTTP/Inertia client
- `events/EventBus` → Laravel event dispatcher + listeners
- `routes/` → `routes/web.php` + Inertia route helpers
- `config/` → `config/app.php`
