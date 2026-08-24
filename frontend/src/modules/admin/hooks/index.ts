import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api";
import type { LogAdminActionInput } from "../validators";

export function useAuditLogsByAdmin(adminId: string) {
  return useQuery({
    queryKey: ["admin", "audit", "admin", adminId],
    queryFn: () => adminApi.getAuditLogsByAdmin(adminId),
    enabled: !!adminId,
  });
}

export function useAuditLogsByTarget(targetType: string, targetId: string) {
  return useQuery({
    queryKey: ["admin", "audit", "target", targetType, targetId],
    queryFn: () => adminApi.getAuditLogsByTarget(targetType, targetId),
    enabled: !!targetType && !!targetId,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["admin", "activity", "recent"],
    queryFn: () => adminApi.getRecentActivity(),
  });
}

export function useLogAdminAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LogAdminActionInput) => adminApi.logAction(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useApproveAdminAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId, approvedBy }: { actionId: string; approvedBy: string }) =>
      adminApi.approveAction(actionId, approvedBy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useRejectAdminAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ actionId, rejectedBy, reason }: { actionId: string; rejectedBy: string; reason?: string }) =>
      adminApi.rejectAction(actionId, rejectedBy, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
}
