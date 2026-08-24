import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  user_id: string;
  assigned_to?: string;
  created_at: string;
}

export const supportApi = {
  list: (params?: { search?: string; status?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    return http.get<{ data: SupportTicket[]; total: number }>(`${API}/admin/support/tickets?${query.toString()}`);
  },

  assign: (id: string, staffId: string) =>
    http.patch<{ message: string }>(`${API}/admin/support/tickets/${id}/assign`, { assigned_to: staffId }),
};
