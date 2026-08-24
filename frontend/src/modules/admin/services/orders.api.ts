import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export interface AdminOrder {
  id: string;
  user_id: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  items_count?: number;
}

export const ordersApi = {
  list: (params?: { search?: string; status?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    return http.get<{ data: AdminOrder[]; total: number }>(`${API}/admin/orders?${query.toString()}`);
  },

  show: (id: string) => http.get<{ data: AdminOrder }>(`${API}/admin/orders/${id}`),

  updateStatus: (id: string, status: string) =>
    http.put<{ message: string }>(`${API}/admin/orders/${id}/status`, { status }),

  refund: (id: string, amount?: number) =>
    http.post<{ message: string }>(`${API}/admin/orders/${id}/refund`, { amount }),
};
