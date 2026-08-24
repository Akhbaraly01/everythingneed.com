import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { ProfileRepository, UserRoleRepository } from "@core/repositories";
import type { UserService } from "../domain";

export const userService: UserService = {
  async getProfile(userId) {
    const repo = resolve<ProfileRepository>(TOKENS.ProfileRepository);
    const profile = await repo.findByEmail(userId);
    return profile as any;
  },

  async updateProfile(userId, data) {
    const repo = resolve<ProfileRepository>(TOKENS.ProfileRepository);
    eventBus.emit("UserProfileUpdated", { userId, changes: data as Record<string, unknown> });
    return data as any;
  },

  async getUserRoles(userId) {
    const repo = resolve<UserRoleRepository>(TOKENS.UserRoleRepository);
    return (await repo.findByUserId(userId)) as any;
  },

  async assignRole(userId, role, categoryId) {
    const repo = resolve<UserRoleRepository>(TOKENS.UserRoleRepository);
    const userRole = (await repo.assignRole(userId, role, categoryId)) as any;
    eventBus.emit("UserRoleAssigned", { userId, role, categoryId });
    return userRole;
  },

  async removeRole(userId, role) {
    const repo = resolve<UserRoleRepository>(TOKENS.UserRoleRepository);
    const result = await repo.removeRole(userId, role);
    eventBus.emit("UserRoleRemoved", { userId, role });
    return result;
  },

  async hasRole(userId, role) {
    const repo = resolve<UserRoleRepository>(TOKENS.UserRoleRepository);
    return repo.hasRole(userId, role);
  },

  async searchUsers(query) {
    const repo = resolve<ProfileRepository>(TOKENS.ProfileRepository);
    return (await repo.search(query)) as any;
  },

  async deactivateUser(userId, reason) {
    eventBus.emit("UserDeactivated", { userId, reason });
  },

  async reactivateUser(userId) {
    eventBus.emit("UserReactivated", { userId });
  },
};
