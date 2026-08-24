/**
 * Users Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Users/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
  UserRole,
  UserRoleInsert,
  UserRoleUpdate,
} from "@core/api/types";
import type { ProfileRepository, UserRoleRepository } from "@core/repositories";

// ── Profile Repository ───────────────────────────────────────────

export class ProfileRepositoryImpl
  extends BaseRepository<Profile, ProfileInsert, ProfileUpdate>
  implements ProfileRepository
{
  get TableName(): string {
    return "profiles";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("email", "=", email)
      .single();
    return (result as Profile) || null;
  }

  async findByPhone(phone: string): Promise<Profile | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("phone", "=", phone)
      .single();
    return (result as Profile) || null;
  }

  async search(query: string): Promise<Profile[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("full_name", "ilike", `%${query}%`);
    return (result as Profile[]) || [];
  }
}

// ── User Role Repository ─────────────────────────────────────────

export class UserRoleRepositoryImpl
  extends BaseRepository<UserRole, UserRoleInsert, UserRoleUpdate>
  implements UserRoleRepository
{
  get TableName(): string {
    return "user_roles";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string): Promise<UserRole[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId);
    return (result as UserRole[]) || [];
  }

  async findByRole(role: string): Promise<UserRole[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("role", "=", role);
    return (result as UserRole[]) || [];
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .where("role", "=", role)
      .single();
    return result !== null;
  }

  async assignRole(userId: string, role: string, categoryId?: string): Promise<UserRole> {
    return this.create({
      user_id: userId,
      role: role as any,
      category_id: categoryId || null,
    });
  }

  async removeRole(userId: string, role: string): Promise<boolean> {
    const roles = await this.findByUserId(userId);
    const roleToRemove = roles.find((r) => r.role === role);
    if (!roleToRemove) return false;
    return this.delete(roleToRemove.id);
  }
}
