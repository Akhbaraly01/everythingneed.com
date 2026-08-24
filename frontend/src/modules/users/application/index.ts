/**
 * Users Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Users/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { UserProfile as Profile, UserRole } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface UpdateUserProfileDTO {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AssignRoleDTO {
  userId: string;
  role: string;
  categoryId?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface UpdateUserProfileCommand {
  type: "UpdateUserProfile";
  payload: {
    userId: string;
    data: UpdateUserProfileDTO;
  };
}

export interface AssignRoleCommand {
  type: "AssignRole";
  payload: AssignRoleDTO;
}

export interface RemoveRoleCommand {
  type: "RemoveRole";
  payload: {
    userId: string;
    role: string;
  };
}

export interface DeactivateUserCommand {
  type: "DeactivateUser";
  payload: {
    userId: string;
    reason?: string;
  };
}

export interface ReactivateUserCommand {
  type: "ReactivateUser";
  payload: { userId: string };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetUserProfileQuery {
  type: "GetUserProfile";
  payload: { userId: string };
}

export interface GetUserRolesQuery {
  type: "GetUserRoles";
  payload: { userId: string };
}

export interface HasRoleQuery {
  type: "HasRole";
  payload: {
    userId: string;
    role: string;
  };
}

export interface SearchUsersQuery {
  type: "SearchUsers";
  payload: { query: string };
}

// ── Application Services ─────────────────────────────────────────

export interface UserApplicationService {
  updateProfile(command: UpdateUserProfileCommand): Promise<Profile>;
  assignRole(command: AssignRoleCommand): Promise<UserRole>;
  removeRole(command: RemoveRoleCommand): Promise<boolean>;
  deactivateUser(command: DeactivateUserCommand): Promise<void>;
  reactivateUser(command: ReactivateUserCommand): Promise<void>;

  getProfile(query: GetUserProfileQuery): Promise<Profile | null>;
  getUserRoles(query: GetUserRolesQuery): Promise<UserRole[]>;
  hasRole(query: HasRoleQuery): Promise<boolean>;
  searchUsers(query: SearchUsersQuery): Promise<Profile[]>;
}
