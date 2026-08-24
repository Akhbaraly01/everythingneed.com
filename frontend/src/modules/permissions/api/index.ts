import { qs } from "@core/api";
import { http } from "@core/api";
import type { CreatePermissionInput, UpdatePermissionInput, GrantPermissionInput, RevokePermissionInput } from "../validators";

const API_BASE = "/api/permissions";

export const permissionsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getByName: (name: string) => http.get<any>(`${API_BASE}/name/${name}`),
  list: (params?: any) => http.get<any[]>(`${API_BASE}${qs(params)}`),
  getByGroup: (group: string) => http.get<any[]>(`${API_BASE}/group/${group}`),
  getRolePermissions: (roleId: string) => http.get<any[]>(`${API_BASE}/role/${roleId}`),
  hasPermission: (roleName: string, permissionName: string) =>
    http.get<boolean>(`${API_BASE}/check${qs({ roleName, permissionName })}`),
  create: (data: CreatePermissionInput) => http.post<any>(API_BASE, data),
  update: (id: string, data: UpdatePermissionInput) => http.put<any>(`${API_BASE}/${id}`, data),
  delete: (id: string) => http.delete<void>(`${API_BASE}/${id}`),
  grant: (data: GrantPermissionInput) => http.post<any>(`${API_BASE}/grant`, data),
  revoke: (data: RevokePermissionInput) => http.post<void>(`${API_BASE}/revoke`, data),
};
