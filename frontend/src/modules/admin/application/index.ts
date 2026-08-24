/**
 * Admin Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Admin/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { AuditLog, AdminAction } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface LogAdminActionDTO {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface LogAdminActionCommand {
  type: "LogAdminAction";
  payload: LogAdminActionDTO;
}

export interface ApproveAdminActionCommand {
  type: "ApproveAdminAction";
  payload: {
    actionId: string;
    approvedBy: string;
  };
}

export interface RejectAdminActionCommand {
  type: "RejectAdminAction";
  payload: {
    actionId: string;
    rejectedBy: string;
    reason?: string;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetAuditLogQuery {
  type: "GetAuditLog";
  payload: { auditLogId: string };
}

export interface GetAuditLogsByAdminQuery {
  type: "GetAuditLogsByAdmin";
  payload: {
    adminId: string;
    params?: QueryParams;
  };
}

export interface GetAuditLogsByTargetQuery {
  type: "GetAuditLogsByTarget";
  payload: {
    targetType: string;
    targetId: string;
    params?: QueryParams;
  };
}

export interface GetAdminActionsQuery {
  type: "GetAdminActions";
  payload: {
    params?: QueryParams;
  };
}

export interface GetRecentActivityQuery {
  type: "GetRecentActivity";
  payload: {
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface AdminApplicationService {
  logAdminAction(command: LogAdminActionCommand): Promise<AuditLog>;
  approveAdminAction(command: ApproveAdminActionCommand): Promise<void>;
  rejectAdminAction(command: RejectAdminActionCommand): Promise<void>;

  getAuditLog(query: GetAuditLogQuery): Promise<AuditLog | null>;
  getAuditLogsByAdmin(query: GetAuditLogsByAdminQuery): Promise<PaginatedResult<AuditLog>>;
  getAuditLogsByTarget(query: GetAuditLogsByTargetQuery): Promise<PaginatedResult<AuditLog>>;
  getAdminActions(query: GetAdminActionsQuery): Promise<PaginatedResult<AdminAction>>;
  getRecentActivity(query: GetRecentActivityQuery): Promise<AuditLog[]>;
}
