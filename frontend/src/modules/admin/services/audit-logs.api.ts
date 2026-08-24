import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string;
  details?: string;
  created_at: string;
}

export const auditLogsApi = {
  list: (params?: { search?: string; action?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.action && params.action !== "all") query.set("action", params.action);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    return http.get<{ data: AuditLog[]; total: number }>(`${API}/admin/audit-logs?${query.toString()}`);
  },

  stats: () => http.get<{ data: { total: number; today: number; by_action: Record<string, number> } }>(`${API}/admin/audit-logs/stats`),
};
