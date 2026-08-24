import { http } from "@core/api";
import type { TrackEventInput, GenerateReportInput } from "../validators";

const API_BASE = "/api/analytics";

const qs = (params?: Record<string, unknown>) => {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
};

export const analyticsApi = {
  getEvents: (params?: any) => http.get<any[]>(`${API_BASE}/events${qs(params)}`),
  getEventsByType: (eventType: string, params?: any) => http.get<any[]>(`${API_BASE}/events/type/${eventType}${qs(params)}`),
  getEventsByUser: (userId: string, params?: any) => http.get<any[]>(`${API_BASE}/events/user/${userId}${qs(params)}`),
  getDashboardMetrics: (filters?: any) => http.get<any[]>(`${API_BASE}/dashboard/metrics${qs(filters)}`),
  trackEvent: (data: TrackEventInput) => http.post<any>(`${API_BASE}/events`, data),
  generateReport: (data: GenerateReportInput) => http.post<any>(`${API_BASE}/reports`, data),
};
