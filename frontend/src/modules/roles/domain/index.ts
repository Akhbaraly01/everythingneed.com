/**
 * Roles Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Roles/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface RoleId {
  value: string;
}

export interface RoleName {
  value: string;
}

export interface RoleDescription {
  value: string;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy?: string;
  assignedAt: Date;
  expiresAt?: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface RoleAssignedEvent {
  type: "RoleAssigned";
  userId: string;
  roleId: string;
  assignedBy?: string;
  timestamp: Date;
}

export interface RoleRevokedEvent {
  type: "RoleRevoked";
  userId: string;
  roleId: string;
  reason?: string;
  timestamp: Date;
}

export interface RoleCreatedEvent {
  type: "RoleCreated";
  roleId: string;
  name: string;
  timestamp: Date;
}

export interface RoleDeletedEvent {
  type: "RoleDeleted";
  roleId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface RoleService {
  createRole(data: {
    name: string;
    displayName: string;
    description?: string;
  }): Promise<Role>;

  deleteRole(roleId: string): Promise<void>;
  getRoleById(roleId: string): Promise<Role | null>;
  getRoleByName(name: string): Promise<Role | null>;
  getAllRoles(): Promise<Role[]>;

  assignRole(userId: string, roleId: string, assignedBy?: string): Promise<UserRole>;
  revokeRole(userId: string, roleId: string, reason?: string): Promise<void>;
  getUserRoles(userId: string): Promise<UserRole[]>;
  getUsersByRole(roleId: string): Promise<UserRole[]>;
  hasRole(userId: string, roleName: string): Promise<boolean>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class RoleNotFoundError extends DomainError {
  constructor(roleId: string) {
    super(`Role ${roleId} not found`, "ROLE_NOT_FOUND");
    this.name = "RoleNotFoundError";
  }
}

export class RoleAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(`Role "${name}" already exists`, "ROLE_ALREADY_EXISTS");
    this.name = "RoleAlreadyExistsError";
  }
}

export class SystemRoleCannotBeDeletedError extends DomainError {
  constructor(roleId: string) {
    super(`System role ${roleId} cannot be deleted`, "SYSTEM_ROLE_CANNOT_BE_DELETED");
    this.name = "SystemRoleCannotBeDeletedError";
  }
}

export class UserRoleAlreadyAssignedError extends DomainError {
  constructor(userId: string, roleId: string) {
    super(`User ${userId} already has role ${roleId}`, "USER_ROLE_ALREADY_ASSIGNED");
    this.name = "UserRoleAlreadyAssignedError";
  }
}

export class UserRoleNotAssignedError extends DomainError {
  constructor(userId: string, roleId: string) {
    super(`User ${userId} does not have role ${roleId}`, "USER_ROLE_NOT_ASSIGNED");
    this.name = "UserRoleNotAssignedError";
  }
}
