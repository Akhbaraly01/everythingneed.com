import { http } from "@core/api";
import type { CreateSettingInput, UpdateSettingInput, SetUserSettingInput } from "../validators";

const API_BASE = "/api/settings";

export const settingsApi = {
  get: (key: string) => http.get<any>(`${API_BASE}/${key}`),
  getByGroup: (group: string) => http.get<any[]>(`${API_BASE}/group/${group}`),
  getAll: () => http.get<any[]>(API_BASE),
  getPublic: () => http.get<any[]>(`${API_BASE}/public`),
  getUserSetting: (userId: string, key: string) => http.get<any>(`${API_BASE}/user/${userId}/${key}`),
  getUserSettings: (userId: string) => http.get<any[]>(`${API_BASE}/user/${userId}`),
  create: (data: CreateSettingInput) => http.post<any>(API_BASE, data),
  update: (key: string, data: UpdateSettingInput) => http.put<any>(`${API_BASE}/${key}`, data),
  delete: (key: string) => http.delete<void>(`${API_BASE}/${key}`),
  setUserSetting: (data: SetUserSettingInput) => http.post<any>(`${API_BASE}/user`, data),
  deleteUserSetting: (userId: string, key: string) => http.delete<void>(`${API_BASE}/user/${userId}/${key}`),
};
