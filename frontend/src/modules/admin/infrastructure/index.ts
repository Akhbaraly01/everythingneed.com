/**
 * Admin Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Admin/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  AuditLog,
  AuditLogInsert,
} from "@core/api/types";
import type { AuditLogRepository } from "@core/repositories";

// ── Audit Log Repository ─────────────────────────────────────────

export class AuditLogRepositoryImpl
  extends BaseRepository<AuditLog, AuditLogInsert, Partial<AuditLog>>
  implements AuditLogRepository
{
  get TableName(): string {
    return "audit_logs";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByEntity(entityType: string, entityId: string, params?: QueryParams): Promise<PaginatedResult<AuditLog>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "entity_type", operator: "=", value: entityType },
        { field: "entity_id", operator: "=", value: entityId },
      ],
    });
  }

  async findByActorId(actorId: string, params?: QueryParams): Promise<PaginatedResult<AuditLog>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "actor_id", operator: "=", value: actorId },
      ],
    });
  }

  async findByAction(action: string, params?: QueryParams): Promise<PaginatedResult<AuditLog>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "action", operator: "=", value: action },
      ],
    });
  }
}
