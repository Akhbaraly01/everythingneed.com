import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolesApi } from "../api";
import type { CreateRoleInput, UpdateRoleInput, AssignRoleInput, RevokeRoleInput } from "../validators";

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.list(),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: () => rolesApi.getById(id),
    enabled: !!id,
  });
}

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: ["roles", "user", userId],
    queryFn: () => rolesApi.getUserRoles(userId),
    enabled: !!userId,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleInput) => rolesApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleInput }) => rolesApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignRoleInput) => rolesApi.assign(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}

export function useRevokeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RevokeRoleInput) => rolesApi.revoke(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });
}
