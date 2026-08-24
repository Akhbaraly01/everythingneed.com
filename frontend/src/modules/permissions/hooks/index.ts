import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { permissionsApi } from "../api";
import type { CreatePermissionInput, UpdatePermissionInput, GrantPermissionInput, RevokePermissionInput } from "../validators";

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionsApi.list(),
  });
}

export function usePermissionsByGroup(group: string) {
  return useQuery({
    queryKey: ["permissions", "group", group],
    queryFn: () => permissionsApi.getByGroup(group),
    enabled: !!group,
  });
}

export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: ["permissions", "role", roleId],
    queryFn: () => permissionsApi.getRolePermissions(roleId),
    enabled: !!roleId,
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePermissionInput) => permissionsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["permissions"] }),
  });
}

export function useUpdatePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePermissionInput }) => permissionsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["permissions"] }),
  });
}

export function useDeletePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permissionsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["permissions"] }),
  });
}

export function useGrantPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GrantPermissionInput) => permissionsApi.grant(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["permissions"] }),
  });
}

export function useRevokePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RevokePermissionInput) => permissionsApi.revoke(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["permissions"] }),
  });
}
