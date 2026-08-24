/**
 * Admin Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Admin/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface AuditLogId {
  value: string;
}

export interface AdminActionId {
  value: string;
}

export interface ActionType {
  value: "create" | "update" | "delete" | "approve" | "reject" | "suspend" | "ban" | "export" | "import";
}

export interface Severity {
  value: "low" | "medium" | "high" | "critical";
}

// ── Entities ─────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: string;
  createdAt: Date;
}

export interface AdminAction {
  id: string;
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  reason?: string;
  status: string;
  approvedBy?: string;
  metadata?: Record<string, any>;
  executedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface AdminActionPerformedEvent {
  type: "AdminActionPerformed";
  adminId: string;
  actionType: string;
  targetType: string;
  targetId: string;
  description: string;
  severity: string;
  timestamp: Date;
}

export interface AuditLogCreatedEvent {
  type: "AuditLogCreated";
  auditLogId: string;
  adminId: string;
  action: string;
  timestamp: Date;
}

export interface AdminActionApprovedEvent {
  type: "AdminActionApproved";
  actionId: string;
  approvedBy: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface AdminService {
  logAdminAction(data: {
    adminId: string;
    action: string;
    targetType: string;
    targetId?: string;
    description: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    severity?: string;
  }): Promise<AuditLog>;

  getAuditLog(auditLogId: string): Promise<AuditLog | null>;
  getAuditLogsByAdmin(adminId: string, params?: any): Promise<{ items: AuditLog[]; total: number }>;
  getAuditLogsByTarget(targetType: string, targetId: string, params?: any): Promise<{ items: AuditLog[]; total: number }>;
  getAdminActions(params?: any): Promise<{ items: AdminAction[]; total: number }>;
  getRecentActivity(params?: any): Promise<AuditLog[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class AuditLogNotFoundError extends DomainError {
  constructor(auditLogId: string) {
    super(`Audit log ${auditLogId} not found`, "AUDIT_LOG_NOT_FOUND");
    this.name = "AuditLogNotFoundError";
  }
}

export class UnauthorizedAdminActionError extends DomainError {
  constructor(adminId: string, action: string) {
    super(`Admin ${adminId} is not authorized to perform action: ${action}`, "UNAUTHORIZED_ADMIN_ACTION");
    this.name = "UnauthorizedAdminActionError";
  }
}

export class AdminActionNotFoundError extends DomainError {
  constructor(actionId: string) {
    super(`Admin action ${actionId} not found`, "ADMIN_ACTION_NOT_FOUND");
    this.name = "AdminActionNotFoundError";
  }
}
