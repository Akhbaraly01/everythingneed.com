import { http } from "@core/api";
import type { LogAdminActionInput } from "../validators";

const API_BASE = "/api/admin";

function toQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const adminApi = {
  getAuditLog: (id: string) => http.get<any>(`${API_BASE}/audit/${id}`),
  getAuditLogsByAdmin: (adminId: string, params?: any) => http.get<any[]>(`${API_BASE}/audit/admin/${adminId}${toQueryString(params)}`),
  getAuditLogsByTarget: (targetType: string, targetId: string, params?: any) =>
    http.get<any[]>(`${API_BASE}/audit/target/${targetType}/${targetId}${toQueryString(params)}`),
  getAdminActions: (params?: any) => http.get<any[]>(`${API_BASE}/actions${toQueryString(params)}`),
  getRecentActivity: (params?: any) => http.get<any[]>(`${API_BASE}/activity/recent${toQueryString(params)}`),
  logAction: (data: LogAdminActionInput) => http.post<any>(`${API_BASE}/audit`, data),
  approveAction: (actionId: string, approvedBy: string) => http.post<void>(`${API_BASE}/actions/${actionId}/approve`, { approvedBy }),
  rejectAction: (actionId: string, rejectedBy: string, reason?: string) =>
    http.post<void>(`${API_BASE}/actions/${actionId}/reject`, { rejectedBy, reason }),
};
