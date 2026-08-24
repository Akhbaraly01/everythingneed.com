import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../api";
import type { CreateNotificationInput } from "../validators";

export function useNotification(id: string) {
  return useQuery({
    queryKey: ["notifications", id],
    queryFn: () => notificationsApi.getById(id),
    enabled: !!id,
  });
}

export function useUserNotifications(userId: string) {
  return useQuery({
    queryKey: ["notifications", "user", userId],
    queryFn: () => notificationsApi.getByUser(userId),
    enabled: !!userId,
  });
}

export function useUnreadNotifications(userId: string) {
  return useQuery({
    queryKey: ["notifications", "unread", userId],
    queryFn: () => notificationsApi.getUnreadByUser(userId),
    enabled: !!userId,
  });
}

export function useUnreadCount(userId: string) {
  return useQuery({
    queryKey: ["notifications", "unread-count", userId],
    queryFn: () => notificationsApi.getUnreadCount(userId),
    enabled: !!userId,
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNotificationInput) => notificationsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => notificationsApi.markAllAsRead(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
