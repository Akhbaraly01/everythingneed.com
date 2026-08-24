/**
 * Settings Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Settings/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface SettingKey {
  value: string;
}

export interface SettingValue {
  value: unknown;
}

export interface SettingGroup {
  value: string;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Setting {
  id: string;
  key: string;
  value: unknown;
  group: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSetting {
  id: string;
  userId: string;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface SettingUpdatedEvent {
  type: "SettingUpdated";
  settingId: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: Date;
}

export interface UserSettingUpdatedEvent {
  type: "UserSettingUpdated";
  userId: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface SettingsService {
  get(key: string): Promise<Setting | null>;
  getByGroup(group: string): Promise<Setting[]>;
  getAll(): Promise<Setting[]>;
  getPublicSettings(): Promise<Setting[]>;

  set(data: {
    key: string;
    value: unknown;
    group: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<Setting>;

  update(key: string, value: unknown): Promise<Setting>;
  delete(key: string): Promise<void>;

  getUserSetting(userId: string, key: string): Promise<UserSetting | null>;
  getUserSettings(userId: string): Promise<UserSetting[]>;

  setUserSetting(userId: string, key: string, value: unknown): Promise<UserSetting>;
  deleteUserSetting(userId: string, key: string): Promise<void>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class SettingNotFoundError extends DomainError {
  constructor(key: string) {
    super(`Setting ${key} not found`, "SETTING_NOT_FOUND");
    this.name = "SettingNotFoundError";
  }
}

export class InvalidSettingValueError extends DomainError {
  constructor(key: string, value: unknown) {
    super(`Invalid value for setting ${key}`, "INVALID_SETTING_VALUE");
    this.name = "InvalidSettingValueError";
  }
}

export class ReadOnlySettingError extends DomainError {
  constructor(key: string) {
    super(`Setting ${key} is read-only`, "READ_ONLY_SETTING");
    this.name = "ReadOnlySettingError";
  }
}
