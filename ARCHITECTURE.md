# Modular Monolith Architecture

This project is organized as a **Domain-Driven Modular Monolith**, structured to map 1:1 onto a future **Laravel 13 + Inertia.js + React + TypeScript** modular monolith.

## Layout

```
src/
├── core/                # Infrastructure: api client, event bus, routes, config, logging
├── shared/              # UI primitives + framework-free utils (no business logic)
└── modules/             # 35 business modules, each fully self-contained
```

Each module follows the same three-level internal structure (`module → layer → file`):

```
<module>/
├── components/   pages/      services/    hooks/
├── types/        validators/ store/       routes/
├── api/          utils/      index.ts     README.md
```

Large modules MAY introduce **sub-modules** as another level (`module → sub-module → layer → file`), e.g.:

```
healthcare/
├── doctors/        { components, pages, services, hooks, types }
├── appointments/   { components, pages, services, hooks, types }
├── labs/           { components, pages, services, hooks, types }
└── tickets/        { components, pages, services, hooks, types }
```

Sub-modules are still exported through the parent module's single `index.ts` barrel.

## Path aliases

| Alias        | Resolves to       |
| ------------ | ----------------- |
| `@/*`        | `src/*` (legacy)  |
| `@modules/*` | `src/modules/*`   |
| `@core/*`    | `src/core/*`      |
| `@shared/*`  | `src/shared/*`    |

## Rules

1. **One module = one barrel.** Always import via `@modules/<name>` — never reach into subfolders. Enforced by ESLint (`no-restricted-imports` on `@modules/*/*`).
2. **No module imports another module's internals.** Use the barrel, or emit a domain event via `@core/events/EventBus`.
3. **Infra (PostgreSQL, logging, config)** lives only in `@core`. Modules never import `@/integrations/...` — use `@core/api/laravelGateway` (`db`, `auth`, `storage`). Enforced by ESLint.
4. **`@shared` contains zero business logic.** Only UI primitives and pure utilities.
5. **Routes are module-owned.** Each module exports its `routes` element from `<module>/routes/index.tsx`; `@core/routes` centralizes the path constants.

## Module routing

Routes are grouped by module path:

| Module      | Base path                |
| ----------- | ------------------------ |
| healthcare  | `/healthcare/*`          |
| pharmacy    | `/pharmacy/*`            |
| vendors     | `/vendor/*`              |
| products    | `/product/*`             |
| account     | `/account/*`             |
| needs       | `/needs/*`               |
| learn       | `/learn/*`               |
| experts     | `/experts/*`             |
| deals       | `/deals/*`               |
| admin       | `/admin/*`               |
| messaging   | `/support/tickets/*`     |

Each module ships a `<module>/routes/index.tsx` exporting a React Router `<Route>` fragment. `App.tsx` composes them. Path constants live in `@core/routes`.

## ESLint boundary enforcement

`eslint.config.js` blocks:

- `@modules/<other>/<anything-after-barrel>` from inside `src/modules/**` — forces use of the module's public barrel.
- `@/integrations/*` from inside modules — forces use of `@core/api/laravelGateway` or `@core/services`.
- All data access flows through the Laravel REST gateway (`@core/api/laravelGateway`); no external BaaS clients are permitted.

Run `npx eslint src/modules` to verify boundaries.

## Laravel 13 mapping checklist

Each `src/modules/<name>` will become `Modules/<PascalName>/` in Laravel. For every module, complete this checklist before declaring the migration done:

- [ ] **Entities** — Eloquent models in `Entities/` (one per domain noun)
- [ ] **Repositories** — `Repositories/<Name>Repository.php` (data access; mirrors `services/` data calls)
- [ ] **Services** — `Services/<Name>Service.php` (business logic from `services/`)
- [ ] **Actions** — `Actions/<VerbNoun>.php` single-responsibility commands (one per mutation)
- [ ] **DTOs** — `Data/<Name>Data.php` using `spatie/laravel-data` (mirrors `types/` + `validators/`)
- [ ] **Policies** — `Policies/<Name>Policy.php` (mirrors RBAC checks from `@modules/permissions`)
- [ ] **Http/Controllers** — Inertia controllers per page in `Http/Controllers/`
- [ ] **Resources/js/Pages** — React pages from `modules/<name>/pages`
- [ ] **Resources/js/Components** — local components from `modules/<name>/components`
- [ ] **routes/web.php** — module routes from `<module>/routes/index.tsx`
- [ ] **Events + Listeners** — every `DomainEventMap` entry becomes `Events/<Name>.php` + matching listener
- [ ] **Migrations** — `Database/Migrations/*` for the module's tables (derived from PostgreSQL schema in `@core/api/types`)
- [ ] **Seeders / Factories** — `Database/{Seeders,Factories}` parity with the PostgreSQL seed data
- [ ] **Tests** — `Tests/{Unit,Feature}` covering actions + policies

### Per-module status

| Module             | Entities | Repos | Actions | Policies | DTOs | Routes | Events |
| ------------------ | :------: | :---: | :-----: | :------: | :--: | :----: | :----: |
| authentication     |          |       |         |          |      |        |        |
| users              |          |       |         |          |      |        |        |
| roles              |          |       |         |          |      |        |        |
| permissions        |          |       |         |          |      |        |        |
| vendors            |          |       |         |          |      |        |        |
| stores             |          |       |         |          |      |        |        |
| products           |          |       |         |          |      |        |        |
| categories         |          |       |         |          |      |        |        |
| inventory          |          |       |         |          |      |        |        |
| orders             |          |       |         |          |      |        |        |
| checkout           |          |       |         |          |      |        |        |
| payments           |          |       |         |          |      |        |        |
| wallets            |          |       |         |          |      |        |        |
| deliveries         |          |       |         |          |      |        |        |
| food               |          |       |         |          |      |        |        |
| rides              |          |       |         |          |      |        |        |
| bookings           |          |       |         |          |      |        |        |
| hotels             |          |       |         |          |      |        |        |
| real-estate        |          |       |         |          |      |        |        |
| jobs               |          |       |         |          |      |        |        |
| healthcare         |    ✓     |       |         |          |      |   ✓    |        |
| deals              |          |       |         |          |      |        |        |
| messaging          |          |       |         |          |      |        |        |
| notifications      |          |       |         |          |      |        |        |
| reviews            |          |       |         |          |      |        |        |
| subscriptions      |          |       |         |          |      |        |        |
| analytics          |          |       |         |          |      |        |        |
| admin              |          |       |         |          |      |        |        |
| settings           |          |       |         |          |      |        |        |
| experts            |          |       |         |          |      |        |        |
| learn              |          |       |         |          |      |   ✓    |        |
| needs              |          |       |         |          |      |   ✓    |        |
| home               |          |       |         |          |      |   ✓    |        |
| pharmacy           |          |       |         |          |      |        |        |
| building-services  |          |       |         |          |      |        |        |
| engagement         |          |       |         |          |      |        |        |

## Per-module domain catalog

Source-of-truth mapping each frontend module to its target Laravel 13 domain artifacts.

| Module             | Entities                                              | Repositories                 | Actions (commands)                                              | Policies                              | DTOs                                                |
| ------------------ | ----------------------------------------------------- | ---------------------------- | --------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------- |
| authentication     | Session, OtpChallenge, TwoFactorSecret                | SessionRepository            | RequestOtp, VerifyOtp, EnableTwoFactor, SignOut                 | SessionPolicy                         | LoginData, OtpData, TwoFactorData                   |
| users              | User, Profile, Address                                | UserRepository               | UpdateProfile, AddAddress, DeleteAccount                        | UserPolicy                            | UserData, ProfileData, AddressData                  |
| roles              | Role, UserRole                                        | RoleRepository               | AssignRole, RevokeRole                                          | RolePolicy                            | RoleData                                            |
| permissions        | Permission, RolePermission                            | PermissionRepository         | GrantPermission, RevokePermission                               | PermissionPolicy                      | PermissionData                                      |
| vendors            | Vendor, VendorApplication, VendorPayout               | VendorRepository             | RegisterVendor, ApproveVendor, SuspendVendor, RequestPayout     | VendorPolicy                          | VendorData, VendorApplicationData                   |
| stores             | Store, StoreCategory                                  | StoreRepository              | CreateStore, UpdateStore, CloseStore                            | StorePolicy                           | StoreData                                           |
| products           | Product, ProductVariant, ProductImage                 | ProductRepository            | CreateProduct, UpdateProduct, ArchiveProduct                    | ProductPolicy                         | ProductData, VariantData                            |
| categories         | Category, CategoryTree                                | CategoryRepository           | CreateCategory, ReorderCategory                                 | CategoryPolicy                        | CategoryData                                        |
| inventory          | StockLevel, StockMovement                             | InventoryRepository          | AdjustStock, ReserveStock, ReleaseStock                         | InventoryPolicy                       | StockLevelData, StockMovementData                   |
| orders             | Order, OrderItem, OrderStatusHistory                  | OrderRepository              | PlaceOrder, CancelOrder, FulfillOrder, RefundOrder              | OrderPolicy                           | OrderData, OrderItemData                            |
| checkout           | Cart, CartItem, Coupon                                | CartRepository               | AddToCart, RemoveFromCart, ApplyCoupon, BeginCheckout           | CheckoutPolicy                        | CartData, CouponData                                |
| payments           | Payment, PaymentMethod, Refund                        | PaymentRepository            | ChargePayment, RefundPayment, AttachMethod                      | PaymentPolicy                         | PaymentData, RefundData                             |
| wallets            | Wallet, WalletTransaction                             | WalletRepository             | TopUpWallet, DebitWallet, TransferWallet                        | WalletPolicy                          | WalletData, WalletTransactionData                   |
| deliveries         | Shipment, ShippingZone, ShippingRate, Tracking        | ShipmentRepository           | CreateShipment, UpdateTracking, MarkDelivered                   | ShipmentPolicy                        | ShipmentData, TrackingData                          |
| food               | Restaurant, MenuItem, FoodOrder                       | RestaurantRepository         | CreateMenuItem, PlaceFoodOrder                                  | RestaurantPolicy                      | RestaurantData, MenuItemData                        |
| rides              | Ride, Driver, Vehicle                                 | RideRepository               | RequestRide, AcceptRide, CompleteRide                           | RidePolicy                            | RideData, DriverData                                |
| bookings           | Booking, BookingSlot                                  | BookingRepository            | CreateBooking, RescheduleBooking, CancelBooking                 | BookingPolicy                         | BookingData                                         |
| hotels             | Hotel, HotelRoom, HotelReservation                    | HotelRepository              | CreateReservation, CancelReservation                            | HotelPolicy                           | HotelData, ReservationData                          |
| real-estate        | Property, Listing, ViewingRequest                     | PropertyRepository           | CreateListing, ScheduleViewing                                  | PropertyPolicy                        | PropertyData                                        |
| jobs               | JobPost, JobApplication                               | JobRepository                | PostJob, ApplyToJob, ShortlistApplicant                         | JobPolicy                             | JobData, JobApplicationData                         |
| healthcare         | Doctor, Specialty, Appointment, Lab, HealthTicket     | DoctorRepository, LabRepo    | BookAppointment, RescheduleAppointment, CancelAppointment, OrderLab, SendReminder | AppointmentPolicy, HealthTicketPolicy | DoctorData, AppointmentData, LabData, HealthTicketData |
| deals              | Deal, Coupon, Campaign                                | DealRepository               | CreateDeal, ExpireDeal                                          | DealPolicy                            | DealData                                            |
| messaging          | Conversation, Message, SupportTicket                  | ConversationRepository       | SendMessage, OpenTicket, ResolveTicket                          | ConversationPolicy, TicketPolicy      | MessageData, TicketData                             |
| notifications      | Notification, PushSubscription                        | NotificationRepository       | SendNotification, MarkRead, SubscribePush                       | NotificationPolicy                    | NotificationData                                    |
| reviews            | Review, ReviewVote                                    | ReviewRepository             | LeaveReview, EditReview, FlagReview                             | ReviewPolicy                          | ReviewData                                          |
| subscriptions      | Plan, Subscription, Invoice                           | SubscriptionRepository       | Subscribe, ChangePlan, CancelSubscription                       | SubscriptionPolicy                    | PlanData, SubscriptionData                          |
| analytics          | Event, MetricSnapshot                                 | AnalyticsRepository          | TrackEvent, AggregateMetrics                                    | AnalyticsPolicy                       | EventData                                           |
| admin              | AuditLog, AdminAction                                 | AuditRepository              | LogAdminAction                                                  | AdminPolicy                           | AuditLogData                                        |
| settings           | UserSetting, FeatureFlag                              | SettingRepository            | UpdateSetting, ToggleFeature                                    | SettingPolicy                         | SettingData                                         |
| experts            | Expert, ExpertAvailability, ExpertReview              | ExpertRepository             | RegisterExpert, BookExpert, ReviewExpert                        | ExpertPolicy                          | ExpertData, AvailabilityData                        |
| learn              | Course, Lesson, Enrollment, Certificate               | CourseRepository             | EnrollInCourse, CompleteLesson, IssueCertificate                | EnrollmentPolicy                      | CourseData, EnrollmentData, CertificateData         |
| needs              | NeedRequest, NeedCategory, NeedOffer                  | NeedRepository               | SubmitNeed, OfferOnNeed, AcceptOffer                            | NeedPolicy                            | NeedRequestData, NeedOfferData                      |
| home               | (composition only — no entities)                      | —                            | —                                                               | —                                     | —                                                   |
| pharmacy           | Pharmacy, Drug, Prescription, PharmacyOrder           | PharmacyRepository           | UploadPrescription, PlacePharmacyOrder                          | PrescriptionPolicy                    | DrugData, PrescriptionData                          |
| building-services  | BuildingProvider, BuildingRequest                     | BuildingRepository           | RequestService, AssignProvider                                  | BuildingPolicy                        | BuildingRequestData                                 |
| engagement         | Favorite, RecentlyViewed, Wishlist                    | EngagementRepository         | Favorite, Unfavorite, RecordView                                | EngagementPolicy                      | FavoriteData                                        |

## Sub-module structure

Multi-section modules use a three-layer sub-module structure:

```
<module>/
├── <sub-module-a>/{components,pages,services,hooks,types,validators}
├── <sub-module-b>/{components,pages,services,hooks,types,validators}
├── routes/index.tsx        # composes sub-module routes
├── index.ts                # single public barrel re-exporting from sub-modules
└── README.md
```

Single-section modules keep the flat layer layout (`components/`, `pages/`, ...) and skip the sub-module level. Sub-modules are still exported through the parent module's single `index.ts` barrel.

## Physical migration status

- [x] healthcare — files moved to `src/modules/healthcare/{pages,components,routes}`
- [x] home / needs / learn / users (account) — module barrels + route fragments published; files still re-exported from `@/pages/*`
- [x] External BaaS fully removed - all data access via the Laravel REST gateway `@core/api/laravelGateway` (Laravel 13 + PostgreSQL)
- [ ] all other modules — barrels re-export from legacy `@/pages/*` and `@/components/*`

To migrate the next module: move files into `src/modules/<name>/`, rewrite the barrel `index.ts` to use relative paths, and update any direct `@/pages/...` imports in `App.tsx` to use `@modules/<name>`.

## Backend modular monolith (live)

The Laravel backend under `backend/Modules/<Name>/` is the authoritative
implementation. 34 domain modules ship with:

| Layer | Location | Notes |
|---|---|---|
| Entities | `Modules/<X>/Entities` | extend `App\Models\Model` (UUID + soft deletes) |
| HTTP | `Modules/<X>/Http/{Controllers,Requests,Resources}` | JSON API per module |
| Actions | `Modules/<X>/Actions` | one command per mutation |
| Routes | `Modules/<X>/Routes/api.php` | registered by the module provider |
| Events/Listeners | `Modules/<X>/{Events,Listeners}` | registered in module provider |
| Web (Inertia) | `app/Http/Controllers/Web/*PageController.php` → `resources/js/pages/**` | new user-facing surfaces land here |

Shared kernel: `Core/Services` + `Core/Services/Contracts`
(PaymentGateway, Notification, Pricing, Wallet, Audit…), `Core/Exceptions`,
`Core/Policies`. Authorization = role middleware **and** granular
`permission:<module.action>` matrix seeded by `PermissionSeeder`
(`role_permissions` table; enforced by
`App\Http\Middleware\EnsureUserHasPermission`).

Data plane rules: module REST APIs are canonical. The generic TableGateway
(`/api/db/{table}`) is a legacy read/write plane with a strict whitelist —
sensitive tables (`user_certificates`, `orders`, …) are read-only there.

---

## Enterprise Enforcement (Laravel 13 parity)

This codebase is engineered to migrate 1:1 into Laravel 13 + Inertia.js + React + TypeScript.
Every contributor — human or AI — MUST follow these rules before adding code.

### 1. Architectural pillars

DDD · SOLID · DRY · KISS · Clean Architecture · CQRS-ready · Repository + Service patterns · Event-driven.

### 2. Reuse-first rule (non-negotiable)

Before creating any component, hook, service, validator, API client, engine, or utility:

1. Search `@shared/*` and `@core/*` first.
2. Search the owning module's barrel (`@modules/<name>`).
3. If it exists → **REUSE**. If it doesn't → **CREATE ONCE in `@shared` or `@core`, then use everywhere.**

Duplicated UI, validation, pricing, tax, commission, wallet, payment, notification, search, or analytics code is a defect - refactor it on sight. Never create a new data access method - always use `db`, `auth`, or `storage` from the Laravel REST gateway `@core/api/laravelGateway`.

### 3. Canonical shared surfaces

| Concern                  | Source of truth                                |
| ------------------------ | ---------------------------------------------- |
| UI primitives            | `@shared/ui/*` (re-exports shadcn)             |
| Validation rules         | `@shared/validators` (zod)                     |
| HTTP / REST              | `@core/api/RequestBuilder` (`http`)            |
| PostgreSQL data API      | `@core/api/laravelGateway` (`db`, `auth`, `storage`) |
| Database types           | `@core/api/types` (PostgreSQL schema types)    |
| Domain events            | `@core/events/EventBus` (+ `schemas.ts` zod)   |
| Business engines         | `@core/engines` (Pricing/Tax/Commission/Wallet)|
| Domain contracts         | `@core/contracts` (Payment/Notification/...)   |
| Domain layer             | `@core/domain` (Value Objects, Entities, Aggregate Roots) |
| Repository interfaces    | `@core/repositories` (Repository pattern contracts) |
| Application layer        | `@core/application` (Services, DTOs, Commands, Queries) |
| Infrastructure layer     | `@core/infrastructure` (Repository implementations, adapters) |
| API client               | `@core/services` (HTTP-based API client)       |
| Service adapters         | `@core/services/adapters` (AI, bookings, reminders — Laravel-backed) |
| Security utils           | `@core/security` (sanitize/escape/hash/limit)  |
| Routes                   | `@core/routes`                                 |
| Config                   | `@core/config`                                 |
| Logging                  | `@core/logging`                                |
| Laravel 13 blueprint     | `@core/laravel` (Backend migration structure)  |

### 4. Security baseline

- AuthN: Email/password + Google (default), Phone OTP, optional MFA via `@core/services/apiClient`.
- AuthZ: RBAC + PBAC via `user_roles` table + role hierarchy check in `AuthContext` + Laravel Policies.
- Secrets: server-side only. Browser code never sees raw API secrets.
- Encryption: AES-256-GCM (data at rest server-side), Argon2id/bcrypt (passwords via Laravel), HMAC-SHA-256 for signed payloads.
- All input validated client-side via `@shared/validators` AND server-side (Laravel validation + Form Requests).
- Output escaping via `escapeHtml`; never `dangerouslySetInnerHTML` with user input.
- Rate limiting on sensitive client actions via `RateLimiter`; on server via Laravel middleware.
- Authorization: Laravel Gates + Policies for fine-grained access control per module.

### 5. Contracts over implementations

Modules depend on interfaces from `@core/contracts` and `@core/repositories`. Adapters (API client, Payment gateway, Email service, AI service, etc.) implement them. Swapping providers is a wiring change, not a module rewrite. All repository interfaces follow the Repository pattern with CRUD operations + domain-specific queries.

### 6. Event-driven communication

Cross-module side effects flow through `eventBus` with payloads validated by `domainEventSchemas`. Direct imports between modules are blocked by ESLint and CI. Each module defines its own domain events in `domain/index.ts` and publishes them via the EventBus. Events are typed with Zod schemas for runtime validation.

### 7. Portability & interoperability

Business logic lives in pure functions / classes inside `modules/<name>/domain/`, `modules/<name>/application/`, `engines/`, and `contracts/`. No React, no database client, no fetch inside business logic — only adapters touch infrastructure via `@core/infrastructure`. This guarantees migration to Laravel 13 Actions/Services without rewrites and enables REST, GraphQL, WebSocket, queue, or mobile consumers. The Application layer orchestrates use cases, the Domain layer contains business rules, and the Infrastructure layer handles external integrations.

### 8. Adaptability

No hardcoded currencies, tax rates, commission rates, countries, providers, or feature flags inside modules. Read from `@core/config` or the `settings` module.

### 9. Performance

Lazy-load route components, paginate lists, cache GET responses via `http({ cacheTtlSeconds })`, debounce search inputs, memoize selectors, avoid prop drilling with module-scoped stores.

### 10. Testability

- Unit: pure functions in `engines/`, `modules/<name>/domain/`, `modules/<name>/application/`, `validators/`.
- Integration: module services against a test database (PostgreSQL).
- E2E: Playwright suites in `e2e/` (routing + cross-module events already gated in CI).
- Contracts: `scripts/check-event-contracts.mjs` keeps event schemas honest.
- Structure: `scripts/check-module-structure.mjs` enforces the three-layer convention.
- Domain: Test domain entities, value objects, and domain services in isolation.
- Application: Test use cases with mocked repositories and services.
- Infrastructure: Test repository implementations against real database.

### 11. Definition of Done (per change)

- [ ] Reuse check performed (no duplicate created).
- [ ] Inputs validated with `@shared/validators` (or extension thereof).
- [ ] Cross-module side effects emitted via `eventBus` with a registered schema.
- [ ] No direct `@/integrations/*`, `@/pages/*`, `@/components/*`, or sibling-module-internal imports.
- [ ] Uses `@core/api/laravelGateway` (`db`, `auth`, `storage`) for all data access.
- [ ] Module barrel updated; route fragment exported if applicable.
- [ ] Domain entities and value objects defined in `modules/<name>/domain/`.
- [ ] Application services and DTOs defined in `modules/<name>/application/`.
- [ ] Repository interfaces defined in `@core/repositories`.
- [ ] Tests added/updated; `module-boundaries` CI passes locally.
- [ ] Laravel 13 migration checklist updated for the module.

