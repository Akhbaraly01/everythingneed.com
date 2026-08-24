/**
 * Settings Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Settings/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Setting, UserSetting } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateSettingDTO {
  key: string;
  value: unknown;
  group: string;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateSettingDTO {
  value: unknown;
}

export interface SetUserSettingDTO {
  userId: string;
  key: string;
  value: unknown;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateSettingCommand {
  type: "CreateSetting";
  payload: CreateSettingDTO;
}

export interface UpdateSettingCommand {
  type: "UpdateSetting";
  payload: {
    key: string;
    value: unknown;
  };
}

export interface DeleteSettingCommand {
  type: "DeleteSetting";
  payload: { key: string };
}

export interface SetUserSettingCommand {
  type: "SetUserSetting";
  payload: SetUserSettingDTO;
}

export interface DeleteUserSettingCommand {
  type: "DeleteUserSetting";
  payload: {
    userId: string;
    key: string;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetSettingQuery {
  type: "GetSetting";
  payload: { key: string };
}

export interface GetSettingsByGroupQuery {
  type: "GetSettingsByGroup";
  payload: { group: string };
}

export interface GetAllSettingsQuery {
  type: "GetAllSettings";
  payload: {};
}

export interface GetPublicSettingsQuery {
  type: "GetPublicSettings";
  payload: {};
}

export interface GetUserSettingQuery {
  type: "GetUserSetting";
  payload: {
    userId: string;
    key: string;
  };
}

export interface GetUserSettingsQuery {
  type: "GetUserSettings";
  payload: { userId: string };
}

// ── Application Services ─────────────────────────────────────────

export interface SettingsApplicationService {
  createSetting(command: CreateSettingCommand): Promise<Setting>;
  updateSetting(command: UpdateSettingCommand): Promise<Setting>;
  deleteSetting(command: DeleteSettingCommand): Promise<void>;
  setUserSetting(command: SetUserSettingCommand): Promise<UserSetting>;
  deleteUserSetting(command: DeleteUserSettingCommand): Promise<void>;

  getSetting(query: GetSettingQuery): Promise<Setting | null>;
  getSettingsByGroup(query: GetSettingsByGroupQuery): Promise<Setting[]>;
  getAllSettings(query: GetAllSettingsQuery): Promise<Setting[]>;
  getPublicSettings(query: GetPublicSettingsQuery): Promise<Setting[]>;
  getUserSetting(query: GetUserSettingQuery): Promise<UserSetting | null>;
  getUserSettings(query: GetUserSettingsQuery): Promise<UserSetting[]>;
}
