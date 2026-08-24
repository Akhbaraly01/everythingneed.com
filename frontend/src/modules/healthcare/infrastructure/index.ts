/**
 * Healthcare Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Healthcare/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  Doctor,
  DoctorInsert,
  DoctorUpdate,
  HealthTicket,
  HealthTicketInsert,
  HealthTicketUpdate,
  Department,
  DepartmentInsert,
  DepartmentUpdate,
} from "@core/api/types";
import type {
  DoctorRepository,
  HealthTicketRepository,
  DepartmentRepository,
} from "@core/repositories";

// ── Doctor Repository ────────────────────────────────────────────

export class DoctorRepositoryImpl
  extends BaseRepository<Doctor, DoctorInsert, DoctorUpdate>
  implements DoctorRepository
{
  get TableName(): string {
    return "doctors";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .single();
    return (result as Doctor) || null;
  }

  async findBySpecialization(specialization: string, params?: QueryParams): Promise<PaginatedResult<Doctor>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "specialization", operator: "=", value: specialization },
      ],
    });
  }

  async findAvailable(params?: QueryParams): Promise<PaginatedResult<Doctor>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "is_available", operator: "=", value: true },
      ],
    });
  }

  async search(query: string): Promise<Doctor[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("full_name", "ilike", `%${query}%`);
    return (result as Doctor[]) || [];
  }
}

// ── Health Ticket Repository ─────────────────────────────────────

export class HealthTicketRepositoryImpl
  extends BaseRepository<HealthTicket, HealthTicketInsert, HealthTicketUpdate>
  implements HealthTicketRepository
{
  get TableName(): string {
    return "health_tickets";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByPatientId(patientId: string, params?: QueryParams): Promise<PaginatedResult<HealthTicket>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "patient_id", operator: "=", value: patientId },
      ],
    });
  }

  async findByDoctorId(doctorId: string, params?: QueryParams): Promise<PaginatedResult<HealthTicket>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "doctor_id", operator: "=", value: doctorId },
      ],
    });
  }

  async findByTicketNumber(ticketNumber: string): Promise<HealthTicket | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("ticket_number", "=", ticketNumber)
      .single();
    return (result as HealthTicket) || null;
  }

  async updateStatus(id: string, status: string): Promise<HealthTicket> {
    return this.update(id, { status: status as any });
  }

  async assignDoctor(id: string, doctorId: string): Promise<HealthTicket> {
    return this.update(id, { doctor_id: doctorId, status: "assigned" });
  }
}

// ── Department Repository ────────────────────────────────────────

export class DepartmentRepositoryImpl
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
