/**
 * Permissions Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Permissions/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Permission, RolePermission } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreatePermissionDTO {
  name: string;
  displayName: string;
  description?: string;
  group: string;
}

export interface UpdatePermissionDTO {
  displayName?: string;
  description?: string;
  group?: string;
}

export interface GrantPermissionDTO {
  roleId: string;
  permissionId: string;
  grantedBy?: string;
}

export interface RevokePermissionDTO {
  roleId: string;
  permissionId: string;
  reason?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreatePermissionCommand {
  type: "CreatePermission";
  payload: CreatePermissionDTO;
}

export interface UpdatePermissionCommand {
  type: "UpdatePermission";
  payload: {
    permissionId: string;
    data: UpdatePermissionDTO;
  };
}

export interface DeletePermissionCommand {
  type: "DeletePermission";
  payload: { permissionId: string };
}

export interface GrantPermissionCommand {
  type: "GrantPermission";
  payload: GrantPermissionDTO;
}

export interface RevokePermissionCommand {
  type: "RevokePermission";
  payload: RevokePermissionDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetPermissionQuery {
  type: "GetPermission";
  payload: { permissionId: string };
}

export interface GetPermissionsQuery {
  type: "GetPermissions";
  payload: { params?: QueryParams };
}

export interface GetPermissionsByGroupQuery {
  type: "GetPermissionsByGroup";
  payload: { group: string };
}

export interface GetRolePermissionsQuery {
  type: "GetRolePermissions";
  payload: { roleId: string };
}

export interface HasPermissionQuery {
  type: "HasPermission";
  payload: {
    roleName: string;
    permissionName: string;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface PermissionApplicationService {
  createPermission(command: CreatePermissionCommand): Promise<Permission>;
  updatePermission(command: UpdatePermissionCommand): Promise<Permission>;
  deletePermission(command: DeletePermissionCommand): Promise<void>;
  grantPermission(command: GrantPermissionCommand): Promise<RolePermission>;
  revokePermission(command: RevokePermissionCommand): Promise<void>;

  getPermission(query: GetPermissionQuery): Promise<Permission | null>;
  getPermissions(query: GetPermissionsQuery): Promise<PaginatedResult<Permission>>;
  getPermissionsByGroup(query: GetPermissionsByGroupQuery): Promise<Permission[]>;
  getRolePermissions(query: GetRolePermissionsQuery): Promise<RolePermission[]>;
  hasPermission(query: HasPermissionQuery): Promise<boolean>;
}
