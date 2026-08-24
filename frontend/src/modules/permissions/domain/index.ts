/**
 * Permissions Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Permissions/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface PermissionId {
  value: string;
}

export interface PermissionName {
  value: string;
}

export interface PermissionGroup {
  value: string;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  group: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  grantedBy?: string;
  grantedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface PermissionGrantedEvent {
  type: "PermissionGranted";
  roleId: string;
  permissionId: string;
  grantedBy?: string;
  timestamp: Date;
}

export interface PermissionRevokedEvent {
  type: "PermissionRevoked";
  roleId: string;
  permissionId: string;
  reason?: string;
  timestamp: Date;
}

export interface PermissionCreatedEvent {
  type: "PermissionCreated";
  permissionId: string;
  name: string;
  group: string;
  timestamp: Date;
}

export interface PermissionDeletedEvent {
  type: "PermissionDeleted";
  permissionId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface PermissionService {
  createPermission(data: {
    name: string;
    displayName: string;
    description?: string;
    group: string;
  }): Promise<Permission>;

  deletePermission(permissionId: string): Promise<void>;
  getPermissionById(permissionId: string): Promise<Permission | null>;
  getPermissionByName(name: string): Promise<Permission | null>;
  getAllPermissions(): Promise<Permission[]>;
  getPermissionsByGroup(group: string): Promise<Permission[]>;

  grantPermission(roleId: string, permissionId: string, grantedBy?: string): Promise<RolePermission>;
  revokePermission(roleId: string, permissionId: string, reason?: string): Promise<void>;
  getRolePermissions(roleId: string): Promise<RolePermission[]>;
  getRolesByPermission(permissionId: string): Promise<RolePermission[]>;
  hasPermission(roleName: string, permissionName: string): Promise<boolean>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class PermissionNotFoundError extends DomainError {
  constructor(permissionId: string) {
    super(`Permission ${permissionId} not found`, "PERMISSION_NOT_FOUND");
    this.name = "PermissionNotFoundError";
  }
}

export class PermissionAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(`Permission "${name}" already exists`, "PERMISSION_ALREADY_EXISTS");
    this.name = "PermissionAlreadyExistsError";
  }
}

export class SystemPermissionCannotBeDeletedError extends DomainError {
  constructor(permissionId: string) {
    super(`System permission ${permissionId} cannot be deleted`, "SYSTEM_PERMISSION_CANNOT_BE_DELETED");
    this.name = "SystemPermissionCannotBeDeletedError";
  }
}

export class RolePermissionAlreadyGrantedError extends DomainError {
  constructor(roleId: string, permissionId: string) {
    super(`Role ${roleId} already has permission ${permissionId}`, "ROLE_PERMISSION_ALREADY_GRANTED");
    this.name = "RolePermissionAlreadyGrantedError";
  }
}

export class RolePermissionNotGrantedError extends DomainError {
  constructor(roleId: string, permissionId: string) {
    super(`Role ${roleId} does not have permission ${permissionId}`, "ROLE_PERMISSION_NOT_GRANTED");
    this.name = "RolePermissionNotGrantedError";
  }
}
