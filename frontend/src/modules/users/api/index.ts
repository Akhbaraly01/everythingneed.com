import { http, qs } from "@core/api";
import type { UpdateUserProfileInput } from "../validators";

const API_BASE = "/api/users";

export const usersApi = {
  getProfile: (userId: string) => http.get<any>(`${API_BASE}/${userId}/profile`),
  updateProfile: (userId: string, data: UpdateUserProfileInput) => http.put<any>(`${API_BASE}/${userId}/profile`, data),
  getUserRoles: (userId: string) => http.get<any[]>(`${API_BASE}/${userId}/roles`),
  assignRole: (userId: string, role: string, categoryId?: string) => http.post<any>(`${API_BASE}/${userId}/roles`, { role, categoryId }),
  removeRole: (userId: string, role: string) => http.delete<void>(`${API_BASE}/${userId}/roles/${role}`),
  searchUsers: (query: string) => http.get<any[]>(`${API_BASE}/search${qs({ q: query })}`),
};
