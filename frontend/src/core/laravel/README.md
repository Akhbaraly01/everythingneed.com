# Laravel 13 Backend Blueprint

This directory contains the folder structure and key files for the Laravel 13 backend migration.

## Directory Structure

```
backend/
├── app/
│   ├── Console/
│   │   └── Commands/
│   ├── Contracts/
│   │   ├── Repositories/
│   │   └── Services/
│   ├── Domain/
│   │   ├── Shared/
│   │   │   ├── ValueObjects/
│   │   │   ├── Events/
│   │   │   └── Exceptions/
│   │   └── Engines/
│   ├── Modules/
│   │   ├── Authentication/
│   │   │   ├── Domain/
│   │   │   ├── Application/
│   │   │   ├── Infrastructure/
│   │   │   └── Presentation/
│   │   ├── Users/
│   │   ├── Products/
│   │   ├── Healthcare/
│   │   ├── Orders/
│   │   ├── Payments/
│   │   ├── Vendors/
│   │   ├── Messaging/
│   │   ├── Learn/
│   │   ├── Needs/
│   │   ├── Pharmacy/
│   │   ├── BuildingServices/
│   │   ├── Bookings/
│   │   ├── Notifications/
│   │   ├── Tickets/
│   │   ├── Analytics/
│   │   ├── Settings/
│   │   ├── Experts/
│   │   └── Subscriptions/
│   ├── Infrastructure/
│   │   ├── Repositories/
│   │   ├── Services/
│   │   └── Adapters/
│   └── Providers/
├── bootstrap/
├── config/
├── database/
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── routes/
│   ├── api.php
│   ├── web.php
│   └── channels.php
├── storage/
└── tests/
```

## Key Files

### Domain Layer
- `app/Domain/Shared/ValueObjects/` - Common value objects (Email, Money, Address, etc.)
- `app/Domain/Shared/Events/` - Base event classes
- `app/Domain/Shared/Exceptions/` - Base exception classes
- `app/Domain/Engines/` - Business engines (Pricing, Tax, Commission, Wallet)

### Module Structure (Example: Healthcare)
```
app/Modules/Healthcare/
├── Domain/
│   ├── Entities/
│   │   ├── Doctor.php
│   │   ├── HealthTicket.php
│   │   └── Department.php
│   ├── ValueObjects/
│   │   ├── TicketNumber.php
│   │   ├── Specialization.php
│   │   └── ConsultationType.php
│   ├── Events/
│   │   ├── AppointmentBooked.php
│   │   ├── DoctorAssigned.php
│   │   └── ConsultationCompleted.php
│   └── Exceptions/
│       ├── DoctorNotFoundError.php
│       └── AppointmentAlreadyBookedError.php
├── Application/
│   ├── Services/
│   │   └── HealthcareService.php
│   ├── DTOs/
│   │   ├── BookAppointmentDTO.php
│   │   └── CreateDoctorDTO.php
│   ├── Commands/
│   │   └── BookAppointmentCommand.php
│   └── Queries/
│       ├── GetDoctorQuery.php
│       └── GetHealthTicketsQuery.php
├── Infrastructure/
│   ├── Repositories/
│   │   ├── EloquentDoctorRepository.php
│   │   └── EloquentHealthTicketRepository.php
│   └── Services/
│       └── HealthcareServiceImpl.php
└── Presentation/
    ├── Http/
    │   ├── Controllers/
    │   │   └── HealthcareController.php
    │   └── Requests/
    │       └── BookAppointmentRequest.php
    └── Resources/
        └── DoctorResource.php
```

### Repository Pattern (Example)
```php
// Contracts/Repositories/DoctorRepository.php
interface DoctorRepository
{
    public function findById(string $id): ?Doctor;
    public function findMany(QueryParams $params): PaginatedResult;
    public function create(CreateDoctorDTO $dto): Doctor;
    public function update(string $id, array $data): Doctor;
    public function delete(string $id): bool;
}

// Infrastructure/Repositories/EloquentDoctorRepository.php
class EloquentDoctorRepository implements DoctorRepository
{
    public function findById(string $id): ?Doctor
    {
        return Doctor::find($id);
    }
    
    public function create(CreateDoctorDTO $dto): Doctor
    {
        return Doctor::create($dto->toArray());
    }
}
```

### Service Layer (Example)
```php
// Application/Services/HealthcareService.php
class HealthcareService implements HealthcareServiceInterface
{
    public function __construct(
        private DoctorRepository $doctorRepo,
        private HealthTicketRepository $ticketRepo,
        private PaymentPort $paymentPort,
        private NotificationPort $notificationPort
    ) {}
    
    public function bookAppointment(BookAppointmentDTO $dto): HealthTicket
    {
        // Domain logic here
        $ticket = $this->ticketRepo->create($dto);
        
        // Emit domain event
        event(new AppointmentBooked($ticket));
        
        return $ticket;
    }
}
```

### Command/Query Pattern (Example)
```php
// Application/Commands/BookAppointmentCommand.php
class BookAppointmentCommand
{
    public function __construct(
        public readonly string $patientId,
        public readonly string $symptoms,
        public readonly ?string $description = null,
        public readonly ?string $consultationType = null,
        public readonly ?string $appointmentDate = null,
        public readonly ?string $appointmentTime = null
    ) {}
}

// Application/Handlers/BookAppointmentHandler.php
class BookAppointmentHandler
{
    public function handle(BookAppointmentCommand $command): HealthTicket
    {
        $dto = new BookAppointmentDTO(
            patientId: $command->patientId,
            symptoms: $command->symptoms,
            description: $command->description,
            consultationType: $command->consultationType,
            appointmentDate: $command->appointmentDate,
            appointmentTime: $command->appointmentTime
        );
        
        return $this->healthcareService->bookAppointment($dto);
    }
}
```

### Controller (Example)
```php
// Presentation/Http/Controllers/HealthcareController.php
class HealthcareController extends Controller
{
    public function __construct(
        private BookAppointmentHandler $bookAppointmentHandler,
        private GetDoctorHandler $getDoctorHandler
    ) {}
    
    public function bookAppointment(BookAppointmentRequest $request): JsonResponse
    {
        $command = new BookAppointmentCommand(
            patientId: auth()->id(),
            symptoms: $request->symptoms,
            description: $request->description,
            consultationType: $request->consultationType,
            appointmentDate: $request->appointmentDate,
            appointmentTime: $request->appointmentTime
        );
        
        $ticket = $this->bookAppointmentHandler->handle($command);
        
        return response()->json([
            'success' => true,
            'data' => new HealthTicketResource($ticket)
        ], 201);
    }
}
```

## Migration Strategy

1. **Phase 1: Core Infrastructure**
   - Set up Laravel 13 project
   - Configure PostgreSQL
   - Set up authentication (Laravel Sanctum)
   - Create base domain classes

2. **Phase 2: Module Migration**
   - Start with Authentication module
   - Migrate Users module
   - Migrate Products module
   - Continue with other modules

3. **Phase 3: Frontend Integration**
   - Set up Inertia.js
   - Configure React components
   - Implement server-side rendering

4. **Phase 4: Testing**
   - Write unit tests for domain logic
   - Write integration tests for repositories
   - Write feature tests for controllers

## Key Patterns

1. **Domain-Driven Design** - Rich domain models with business logic
2. **CQRS** - Separate read/write operations
3. **Event Sourcing** - Domain events for cross-module communication
4. **Repository Pattern** - Abstract data access
5. **Service Layer** - Orchestrate business operations
6. **DTO Pattern** - Transfer data between layers
7. **Value Objects** - Immutable domain concepts
8. **Aggregate Roots** - Consistency boundaries

## Security

1. **RBAC** - Role-Based Access Control
2. **PBAC** - Policy-Based Access Control
3. **Laravel Policies** - Authorization logic
4. **Laravel Gates** - Permission checks
5. **Sanctum** - API authentication

## Performance

1. **Caching** - Redis for frequently accessed data
2. **Queue** - Laravel Horizon for background jobs
3. **Indexing** - Database query optimization
4. **Pagination** - Efficient data loading
5. **Eager Loading** - N+1 query prevention
