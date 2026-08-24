import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export interface AdminVendor {
  id: string;
  user_id: string;
  store_name: string;
  category: string;
  description: string;
  is_verified: boolean;
  is_suspended: boolean;
  rating: number;
  created_at: string;
}

export const vendorsApi = {
  list: (params?: { search?: string; status?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.status && params.status !== "all") query.set("status", params.status);
    if (params?.page) query.set("page", String(params.page));
    return http.get<{ data: AdminVendor[]; total: number }>(`${API}/admin/vendors?${query.toString()}`);
  },

  show: (id: string) => http.get<{ data: AdminVendor }>(`${API}/admin/vendors/${id}`),

  approve: (id: string) => http.post<{ message: string }>(`${API}/admin/vendors/${id}/approve`),

  reject: (id: string) => http.post<{ message: string }>(`${API}/admin/vendors/${id}/reject`),

  suspend: (id: string) => http.post<{ message: string }>(`${API}/admin/vendors/${id}/suspend`),

  restore: (id: string) => http.post<{ message: string }>(`${API}/admin/vendors/${id}/restore`),
};
