/**
 * Core Domain Layer - Shared types, interfaces, and building blocks
 * for all modules. Framework-agnostic, pure TypeScript.
 *
 * Laravel mapping: app/Domain/Shared/*
 */

// ── Value Objects ─────────────────────────────────────────────────

export interface UniqueId {
  value: string;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface Email {
  value: string;
}

export interface PhoneNumber {
  value: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface PaginationParams {
  page: number;
  perPage: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface SortParams {
  field: string;
  direction: "asc" | "desc";
}

export interface FilterParams {
  field: string;
  operator: "=" | "!=" | ">" | "<" | ">=" | "<=" | "like" | "ilike" | "in" | "between";
  value: unknown;
}

export interface QueryParams {
  pagination?: PaginationParams;
  sort?: SortParams[];
  filters?: FilterParams[];
  search?: string;
  searchFields?: string[];
}

// ── Domain Events ────────────────────────────────────────────────

export interface DomainEvent {
  id: string;
  name: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void>;

// ── Repository Interfaces ────────────────────────────────────────

export interface Repository<T, TInsert = Partial<T>, TUpdate = Partial<T>> {
  findById(id: string): Promise<T | null>;
  findMany(params?: QueryParams): Promise<PaginatedResult<T>>;
  create(data: TInsert): Promise<T>;
  update(id: string, data: TUpdate): Promise<T>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(filters?: FilterParams[]): Promise<number>;
}

export interface ReadRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(params?: QueryParams): Promise<PaginatedResult<T>>;
  exists(id: string): Promise<boolean>;
  count(filters?: FilterParams[]): Promise<number>;
}

export interface WriteRepository<T, TInsert = Partial<T>, TUpdate = Partial<T>> {
  create(data: TInsert): Promise<T>;
  update(id: string, data: TUpdate): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// ── Service Interfaces ───────────────────────────────────────────

export interface DomainService<T> {
  execute(command: T): Promise<unknown>;
}

export interface QueryService<T, R> {
  execute(query: T): Promise<R>;
}

// ── Unit of Work ─────────────────────────────────────────────────

export interface UnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  getTransactionId(): string;
}

// ── Outbox Pattern ───────────────────────────────────────────────

export interface OutboxMessage {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  processedAt?: Date;
}

export interface OutboxRepository {
  save(message: OutboxMessage): Promise<void>;
  findUnprocessed(limit: number): Promise<OutboxMessage[]>;
  markProcessed(id: string): Promise<void>;
}

// ── CQRS Interfaces ──────────────────────────────────────────────

export interface Command<C = unknown, R = void> {
  readonly type: string;
  readonly payload: C;
}

export interface CommandHandler<C = unknown, R = void> {
  execute(command: Command<C, R>): Promise<R>;
}

export interface Query<Q = unknown, R = unknown> {
  readonly type: string;
  readonly payload: Q;
}

export interface QueryHandler<Q = unknown, R = unknown> {
  execute(query: Query<Q, R>): Promise<R>;
}

// ── Specification Pattern ────────────────────────────────────────

export interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class NotFoundError extends DomainError {
  constructor(entityType: string, id: string) {
    super(`${entityType} with id ${id} not found`, "NOT_FOUND", { entityType, id });
    this.name = "NotFoundError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR", { field });
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden") {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class InsufficientFundsError extends DomainError {
  constructor(required: number, available: number) {
    super(`Insufficient funds: required ${required}, available ${available}`, "INSUFFICIENT_FUNDS", {
      required,
      available,
    });
    this.name = "InsufficientFundsError";
  }
}

export class PrescriptionRequiredError extends DomainError {
  constructor(entityId: string) {
    super(`Prescription required for ${entityId}`, "PRESCRIPTION_REQUIRED", { entityId });
    this.name = "PrescriptionRequiredError";
  }
}

export class InvalidTicketStatusError extends DomainError {
  constructor(currentStatus: string, attemptedAction: string) {
    super(`Cannot ${attemptedAction} with status ${currentStatus}`, "INVALID_TICKET_STATUS", {
      currentStatus,
      attemptedAction,
    });
    this.name = "InvalidTicketStatusError";
  }
}

// ── Shared Value Objects ──────────────────────────────────────────

export interface StockQuantity {
  value: number;
}

export interface TicketNumber {
  value: string;
}

// ── Aggregate Root ───────────────────────────────────────────────

export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }
}

// ── Entity Base ──────────────────────────────────────────────────

export abstract class Entity<T> {
  constructor(
    protected readonly _id: string,
    protected readonly _props: T
  ) {}

  get id(): string {
    return this._id;
  }

  equals(other: Entity<T>): boolean {
    return this._id === other._id;
  }
}
