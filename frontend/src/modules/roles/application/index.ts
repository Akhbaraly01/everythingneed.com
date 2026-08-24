/**
 * Roles Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Roles/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Role, UserRole } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateRoleDTO {
  name: string;
  displayName: string;
  description?: string;
}

export interface UpdateRoleDTO {
  displayName?: string;
  description?: string;
}

export interface AssignRoleDTO {
  userId: string;
  roleId: string;
  assignedBy?: string;
  expiresAt?: Date;
}

export interface RevokeRoleDTO {
  userId: string;
  roleId: string;
  reason?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateRoleCommand {
  type: "CreateRole";
  payload: CreateRoleDTO;
}

export interface UpdateRoleCommand {
  type: "UpdateRole";
  payload: {
    roleId: string;
    data: UpdateRoleDTO;
  };
}

export interface DeleteRoleCommand {
  type: "DeleteRole";
  payload: { roleId: string };
}

export interface AssignRoleCommand {
  type: "AssignRole";
  payload: AssignRoleDTO;
}

export interface RevokeRoleCommand {
  type: "RevokeRole";
  payload: RevokeRoleDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetRoleQuery {
  type: "GetRole";
  payload: { roleId: string };
}

export interface GetRolesQuery {
  type: "GetRoles";
  payload: { params?: QueryParams };
}

export interface GetUserRolesQuery {
  type: "GetUserRoles";
  payload: { userId: string };
}

export interface GetUsersByRoleQuery {
  type: "GetUsersByRole";
  payload: {
    roleId: string;
    params?: QueryParams;
  };
}

export interface HasRoleQuery {
  type: "HasRole";
  payload: {
    userId: string;
    roleName: string;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface RoleApplicationService {
  createRole(command: CreateRoleCommand): Promise<Role>;
  updateRole(command: UpdateRoleCommand): Promise<Role>;
  deleteRole(command: DeleteRoleCommand): Promise<void>;
  assignRole(command: AssignRoleCommand): Promise<UserRole>;
  revokeRole(command: RevokeRoleCommand): Promise<void>;

  getRole(query: GetRoleQuery): Promise<Role | null>;
  getRoles(query: GetRolesQuery): Promise<PaginatedResult<Role>>;
  getUserRoles(query: GetUserRolesQuery): Promise<UserRole[]>;
  getUsersByRole(query: GetUsersByRoleQuery): Promise<PaginatedResult<UserRole>>;
  hasRole(query: HasRoleQuery): Promise<boolean>;
}
