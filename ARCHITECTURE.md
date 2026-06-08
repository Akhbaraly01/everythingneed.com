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
3. **Infra (Supabase, logging, config)** lives only in `@core`. Modules never import `@/integrations/...` — use `@core/api/client`. Enforced by ESLint.
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
- `@/integrations/supabase/*` from inside modules — forces use of `@core/api/client`.

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
- [ ] **Migrations** — `Database/Migrations/*` for the module's tables
- [ ] **Seeders / Factories** — `Database/{Seeders,Factories}` parity with Supabase seed data
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
- [ ] all other modules — barrels re-export from legacy `@/pages/*` and `@/components/*`

To migrate the next module: move files into `src/modules/<name>/`, rewrite the barrel `index.ts` to use relative paths, and update any direct `@/pages/...` imports in `App.tsx` to use `@modules/<name>`.
