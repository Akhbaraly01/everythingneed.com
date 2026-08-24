import { http } from "@core/api";
import { qs } from "@core/api";
import type { CreateRoleInput, UpdateRoleInput, AssignRoleInput, RevokeRoleInput } from "../validators";

const API_BASE = "/api/roles";

export const rolesApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getByName: (name: string) => http.get<any>(`${API_BASE}/name/${name}`),
  list: (params?: any) => http.get<any[]>(`${API_BASE}${qs(params)}`),
  getUserRoles: (userId: string) => http.get<any[]>(`${API_BASE}/user/${userId}`),
  getUsersByRole: (roleId: string, params?: any) => http.get<any[]>(`${API_BASE}/${roleId}/users${qs(params)}`),
  hasRole: (userId: string, roleName: string) => http.get<boolean>(`${API_BASE}/check${qs({ userId, roleName })}`),
  create: (data: CreateRoleInput) => http.post<any>(API_BASE, data),
  update: (id: string, data: UpdateRoleInput) => http.put<any>(`${API_BASE}/${id}`, data),
  delete: (id: string) => http.delete<void>(`${API_BASE}/${id}`),
  assign: (data: AssignRoleInput) => http.post<any>(`${API_BASE}/assign`, data),
  revoke: (data: RevokeRoleInput) => http.post<void>(`${API_BASE}/revoke`, data),
};
