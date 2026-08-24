/**
 * Tickets Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Tickets/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { TicketNumber as SharedTicketNumber } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface TicketId {
  value: string;
}

export interface TicketStatus {
  value: "open" | "in_progress" | "pending" | "resolved" | "closed";
}

export interface TicketPriority {
  value: "low" | "medium" | "high" | "urgent";
}

// ── Entities ─────────────────────────────────────────────────────

export interface Ticket {
  id: string;
  userId: string;
  ticketNumber: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assignedTo?: string;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface TicketCreatedEvent {
  type: "TicketCreated";
  ticketId: string;
  ticketNumber: string;
  userId: string;
  priority: string;
  timestamp: Date;
}

export interface TicketAssignedEvent {
  type: "TicketAssigned";
  ticketId: string;
  assigneeId: string;
  timestamp: Date;
}

export interface TicketStatusChangedEvent {
  type: "TicketStatusChanged";
  ticketId: string;
  oldStatus: string;
  newStatus: string;
  timestamp: Date;
}

export interface TicketResolvedEvent {
  type: "TicketResolved";
  ticketId: string;
  resolution?: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface TicketService {
  create(data: {
    userId: string;
    subject: string;
    description: string;
    priority: string;
    departmentId?: string;
  }): Promise<Ticket>;

  assign(ticketId: string, assigneeId: string): Promise<void>;
  updateStatus(ticketId: string, status: string): Promise<void>;
  resolve(ticketId: string, resolution?: string): Promise<void>;
  close(ticketId: string): Promise<void>;

  addMessage(data: {
    ticketId: string;
    senderId: string;
    message: string;
    isInternal?: boolean;
  }): Promise<TicketMessage>;

  getById(ticketId: string): Promise<Ticket | null>;
  getByTicketNumber(ticketNumber: string): Promise<Ticket | null>;
  getByUserId(userId: string, params?: any): Promise<{ items: Ticket[]; total: number }>;
  getByAssignee(assigneeId: string, params?: any): Promise<{ items: Ticket[]; total: number }>;
  getMessages(ticketId: string, params?: any): Promise<{ items: TicketMessage[]; total: number }>;

  getDepartmentById(departmentId: string): Promise<{ id: string; name: string; description?: string } | null>;
  getAllDepartments(): Promise<{ id: string; name: string; description?: string }[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class TicketNotFoundError extends DomainError {
  constructor(ticketId: string) {
    super(`Ticket ${ticketId} not found`, "TICKET_NOT_FOUND");
    this.name = "TicketNotFoundError";
  }
}

export class TicketAlreadyClosedError extends DomainError {
  constructor(ticketId: string) {
    super(`Ticket ${ticketId} is already closed`, "TICKET_ALREADY_CLOSED");
    this.name = "TicketAlreadyClosedError";
  }
}
