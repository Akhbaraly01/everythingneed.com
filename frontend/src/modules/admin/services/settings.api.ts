import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export interface SystemSettings {
  [key: string]: string | number | boolean;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  kill_switch: boolean;
}

export const settingsApi = {
  get: () => http.get<{ data: SystemSettings }>(`${API}/admin/settings`),

  update: (settings: { key: string; value: string | number | boolean }[]) =>
    http.put<{ message: string }>(`${API}/admin/settings`, { settings }),

  featureFlags: () => http.get<{ data: FeatureFlag[] }>(`${API}/admin/feature-flags`),

  toggleFlag: (key: string, enabled: boolean) =>
    http.put<{ message: string }>(`${API}/admin/feature-flags/${key}`, { enabled }),
};
