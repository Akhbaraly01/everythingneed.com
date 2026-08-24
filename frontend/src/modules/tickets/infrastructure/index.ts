/**
 * Tickets Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Tickets/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  Ticket,
  TicketInsert,
  TicketUpdate,
  TicketMessage,
  TicketMessageInsert,
  TicketMessageUpdate,
  Department,
  DepartmentInsert,
  DepartmentUpdate,
} from "@core/api/types";
import type {
  TicketRepository,
  TicketMessageRepository,
  DepartmentRepository,
} from "@core/repositories";

// ── Ticket Repository ────────────────────────────────────────────

export class TicketRepositoryImpl
  extends BaseRepository<Ticket, TicketInsert, TicketUpdate>
  implements TicketRepository
{
  get TableName(): string {
    return "tickets";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Ticket>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "user_id", operator: "=", value: userId },
      ],
    });
  }

  async findByTicketNumber(ticketNumber: string): Promise<Ticket | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("ticket_number", "=", ticketNumber)
      .single();
    return (result as Ticket) || null;
  }

  async findByAssignee(assigneeId: string, params?: QueryParams): Promise<PaginatedResult<Ticket>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "assigned_to", operator: "=", value: assigneeId },
      ],
    });
  }

  async updateStatus(id: string, status: string): Promise<Ticket> {
    return this.update(id, { status: status as any });
  }

  async assignTo(id: string, assigneeId: string): Promise<Ticket> {
    return this.update(id, { assigned_to: assigneeId, status: "in_progress" });
  }
}

// ── Ticket Message Repository ────────────────────────────────────

export class TicketMessageRepositoryImpl
  extends BaseRepository<TicketMessage, TicketMessageInsert, TicketMessageUpdate>
  implements TicketMessageRepository
{
  get TableName(): string {
    return "ticket_messages";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByTicketId(ticketId: string, params?: QueryParams): Promise<PaginatedResult<TicketMessage>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "ticket_id", operator: "=", value: ticketId },
      ],
      sort: [{ field: "created_at", direction: "asc" }],
    });
  }

  async findBySenderId(senderId: string): Promise<TicketMessage[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("sender_id", "=", senderId)
      .orderBy("created_at", false);
    return (result as TicketMessage[]) || [];
  }

  async markAsRead(id: string): Promise<TicketMessage> {
    return this.update(id, {});
  }

  async countByTicketId(ticketId: string): Promise<number> {
    return this.count([{ field: "ticket_id", operator: "=", value: ticketId }]);
  }
}

// ── Department Repository (Tickets) ──────────────────────────────

export class TicketsDepartmentRepositoryImpl
  extends BaseRepository<Department, DepartmentInsert, DepartmentUpdate>
  implements DepartmentRepository
{
  get TableName(): string {
    return "departments";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByName(name: string): Promise<Department | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("name", "=", name)
      .single();
    return (result as Department) || null;
  }
}
