import { http } from "@/core/api/client";
import { eventBus } from "@core/events/EventBus";
import type { SettingsService } from "../domain";

export const settingsService: SettingsService = {
  async get(key) {
    const data: any = await http.get(`/api/settings/${key}`);
    return data.data || null;
  },

  async getByGroup(group) {
    const data: any = await http.get("/api/settings", { params: { group } } as any);
    return data.data || [];
  },

  async getAll() {
    const data: any = await http.get("/api/settings");
    return data.data || [];
  },

  async getPublicSettings() {
    const data: any = await http.get("/api/settings/public");
    return data.data || [];
  },

  async set(data) {
    const result: any = await http.post("/api/settings", data);
    return result.data;
  },

  async update(key, value) {
    const result: any = await http.put(`/api/settings/${key}`, { value });
    eventBus.emit("SettingUpdated", { settingId: "", key, oldValue: null, newValue: value });
    return result.data;
  },

  async delete(key) {
    await http.delete(`/api/settings/${key}`);
  },

  async getUserSetting(userId, key) {
    const data: any = await http.get(`/api/users/${userId}/settings/${key}`);
    return data.data || null;
  },

  async getUserSettings(userId) {
    const data: any = await http.get(`/api/users/${userId}/settings`);
    return data.data || [];
  },

  async setUserSetting(userId, key, value) {
    const result: any = await http.put(`/api/users/${userId}/settings`, { key, value });
    eventBus.emit("UserSettingUpdated", { userId, key, oldValue: null, newValue: value, timestamp: new Date() });
    return result.data;
  },

  async deleteUserSetting(userId, key) {
    await http.delete(`/api/users/${userId}/settings/${key}`);
  },
};
