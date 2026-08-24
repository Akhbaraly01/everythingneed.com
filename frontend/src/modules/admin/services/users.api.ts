import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  avatar?: string;
}

export interface UsersResponse {
  data: AdminUser[];
  total: number;
  current_page?: number;
  last_page?: number;
}

export const usersApi = {
  list: (params?: { search?: string; role?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.role && params.role !== "all") query.set("role", params.role);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    return http.get<UsersResponse>(`${API}/admin/users?${query.toString()}`);
  },

  show: (id: string) => http.get<{ data: AdminUser }>(`${API}/admin/users/${id}`),

  updateRole: (id: string, role: string) =>
    http.put<{ message: string }>(`${API}/admin/users/${id}/role`, { role }),

  suspend: (id: string) =>
    http.post<{ message: string }>(`${API}/admin/users/${id}/suspend`),

  restore: (id: string) =>
    http.post<{ message: string }>(`${API}/admin/users/${id}/restore`),

  destroy: (id: string) =>
    http.delete<{ message: string }>(`${API}/admin/users/${id}`),
};
