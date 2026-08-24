import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { RoleService } from "../domain";

export const roleService: RoleService = {
  async createRole(data) {
    const role = { id: crypto.randomUUID(), ...data, isSystem: false, createdAt: new Date(), updatedAt: new Date() } as any;
    eventBus.emit("RoleCreated", { roleId: role.id, name: data.name, timestamp: new Date() });
    return role;
  },

  async deleteRole(roleId) {
    eventBus.emit("RoleDeleted", { roleId, timestamp: new Date() });
  },

  async getRoleById(roleId) {
    return null;
  },

  async getRoleByName(name) {
    return null;
  },

  async getAllRoles() {
    return [];
  },

  async assignRole(userId, roleId, assignedBy) {
    const userRole = { id: crypto.randomUUID(), userId, roleId, assignedBy, assignedAt: new Date() } as any;
    eventBus.emit("RoleAssigned", { userId, role: roleId });
    eventBus.emit("UserRoleAssigned", { userId, role: roleId });

    return userRole;
  },

  async revokeRole(userId, roleId, reason) {
    eventBus.emit("RoleRevoked", { userId, role: roleId });
    eventBus.emit("UserRoleRemoved", { userId, role: roleId });
  },

  async getUserRoles(userId) {
    return [];
  },

  async getUsersByRole(roleId) {
    return [];
  },

  async hasRole(userId, roleName) {
    return false;
  },
};
