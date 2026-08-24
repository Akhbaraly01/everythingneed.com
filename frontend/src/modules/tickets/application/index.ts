/**
 * Tickets Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Tickets/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Ticket, TicketMessage, Department } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateTicketDTO {
  userId: string;
  subject: string;
  description: string;
  priority: string;
  departmentId?: string;
}

export interface AddTicketMessageDTO {
  ticketId: string;
  senderId: string;
  message: string;
  isInternal?: boolean;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateTicketCommand {
  type: "CreateTicket";
  payload: CreateTicketDTO;
}

export interface AssignTicketCommand {
  type: "AssignTicket";
  payload: {
    ticketId: string;
    assigneeId: string;
  };
}

export interface UpdateTicketStatusCommand {
  type: "UpdateTicketStatus";
  payload: {
    ticketId: string;
    status: string;
  };
}

export interface ResolveTicketCommand {
  type: "ResolveTicket";
  payload: {
    ticketId: string;
    resolution?: string;
  };
}

export interface CloseTicketCommand {
  type: "CloseTicket";
  payload: { ticketId: string };
}

export interface AddTicketMessageCommand {
  type: "AddTicketMessage";
  payload: AddTicketMessageDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetTicketQuery {
  type: "GetTicket";
  payload: { ticketId: string };
}

export interface GetTicketByNumberQuery {
  type: "GetTicketByNumber";
  payload: { ticketNumber: string };
}

export interface GetUserTicketsQuery {
  type: "GetUserTickets";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetAssignedTicketsQuery {
  type: "GetAssignedTickets";
  payload: {
    assigneeId: string;
    params?: QueryParams;
  };
}

export interface GetTicketMessagesQuery {
  type: "GetTicketMessages";
  payload: {
    ticketId: string;
    params?: QueryParams;
  };
}

export interface GetDepartmentQuery {
  type: "GetDepartment";
  payload: { departmentId: string };
}

export interface GetAllDepartmentsQuery {
  type: "GetAllDepartments";
  payload: {};
}

// ── Application Services ─────────────────────────────────────────

export interface TicketApplicationService {
  createTicket(command: CreateTicketCommand): Promise<Ticket>;
  assignTicket(command: AssignTicketCommand): Promise<void>;
  updateTicketStatus(command: UpdateTicketStatusCommand): Promise<void>;
  resolveTicket(command: ResolveTicketCommand): Promise<void>;
  closeTicket(command: CloseTicketCommand): Promise<void>;
  addMessage(command: AddTicketMessageCommand): Promise<TicketMessage>;

  getTicket(query: GetTicketQuery): Promise<Ticket | null>;
  getTicketByNumber(query: GetTicketByNumberQuery): Promise<Ticket | null>;
  getUserTickets(query: GetUserTicketsQuery): Promise<PaginatedResult<Ticket>>;
  getAssignedTickets(query: GetAssignedTicketsQuery): Promise<PaginatedResult<Ticket>>;
  getTicketMessages(query: GetTicketMessagesQuery): Promise<PaginatedResult<TicketMessage>>;
  getDepartment(query: GetDepartmentQuery): Promise<Department | null>;
  getAllDepartments(query: GetAllDepartmentsQuery): Promise<Department[]>;
}
