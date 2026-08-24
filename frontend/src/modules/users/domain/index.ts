/**
 * Users Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Users/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Email, PhoneNumber, Address } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  userId: string;
  role: string;
  categoryId?: string;
  createdAt: Date;
}

// ── Entities ─────────────────────────────────────────────────────

export interface User extends UserProfile {
  roles: UserRole[];
  isActive: boolean;
  lastSignInAt?: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface UserProfileUpdatedEvent {
  type: "UserProfileUpdated";
  userId: string;
  changes: Partial<UserProfile>;
  timestamp: Date;
}

export interface UserRoleAssignedEvent {
  type: "UserRoleAssigned";
  userId: string;
  role: string;
  categoryId?: string;
  timestamp: Date;
}

export interface UserRoleRemovedEvent {
  type: "UserRoleRemoved";
  userId: string;
  role: string;
  timestamp: Date;
}

export interface UserDeactivatedEvent {
  type: "UserDeactivated";
  userId: string;
  reason?: string;
  timestamp: Date;
}

export interface UserReactivatedEvent {
  type: "UserReactivated";
  userId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface UserService {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile>;
  getUserRoles(userId: string): Promise<UserRole[]>;
  assignRole(userId: string, role: string, categoryId?: string): Promise<UserRole>;
  removeRole(userId: string, role: string): Promise<boolean>;
  hasRole(userId: string, role: string): Promise<boolean>;
  searchUsers(query: string): Promise<UserProfile[]>;
  deactivateUser(userId: string, reason?: string): Promise<void>;
  reactivateUser(userId: string): Promise<void>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class UserNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`User ${userId} not found`, "USER_NOT_FOUND");
    this.name = "UserNotFoundError";
  }
}

export class InvalidRoleError extends DomainError {
  constructor(role: string) {
    super(`Invalid role: ${role}`, "INVALID_ROLE");
    this.name = "InvalidRoleError";
  }
}

export class RoleAlreadyAssignedError extends DomainError {
  constructor(userId: string, role: string) {
    super(`User ${userId} already has role ${role}`, "ROLE_ALREADY_ASSIGNED");
    this.name = "RoleAlreadyAssignedError";
  }
}

export class CannotDeactivateSelfError extends DomainError {
  constructor() {
    super("Cannot deactivate your own account", "CANNOT_DEACTIVATE_SELF");
    this.name = "CannotDeactivateSelfError";
  }
}
