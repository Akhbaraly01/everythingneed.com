import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { PermissionService } from "../domain";

export const permissionService: PermissionService = {
  async createPermission(data) {
    const permission = { id: crypto.randomUUID(), ...data, isSystem: false, createdAt: new Date(), updatedAt: new Date() } as any;
    eventBus.emit("PermissionCreated", { permissionId: permission.id, name: data.name, group: data.group, timestamp: new Date() });
    return permission;
  },

  async deletePermission(permissionId) {
    eventBus.emit("PermissionDeleted", { permissionId, timestamp: new Date() });
  },

  async getPermissionById(permissionId) {
    return null;
  },

  async getPermissionByName(name) {
    return null;
  },

  async getAllPermissions() {
    return [];
  },

  async getPermissionsByGroup(group) {
    return [];
  },

  async grantPermission(roleId, permissionId, grantedBy) {
    const rolePermission = { id: crypto.randomUUID(), roleId, permissionId, grantedBy, grantedAt: new Date() } as any;
    eventBus.emit("PermissionGranted", { roleId, permission: (permissionId as any) ?? "" });
    return rolePermission;
  },

  async revokePermission(roleId, permissionId, reason) {
    eventBus.emit("PermissionRevoked", { roleId, permission: (permissionId as any) ?? "" });
  },

  async getRolePermissions(roleId) {
    return [];
  },

  async getRolesByPermission(permissionId) {
    return [];
  },

  async hasPermission(roleName, permissionName) {
    return false;
  },
};
