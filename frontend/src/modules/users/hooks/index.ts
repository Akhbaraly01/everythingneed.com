import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../api";
import type { UpdateUserProfileInput } from "../validators";

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "profile"],
    queryFn: () => usersApi.getProfile(userId),
    enabled: !!userId,
  });
}

export function useUpdateUserProfile(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserProfileInput) => usersApi.updateProfile(userId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", userId] }),
  });
}

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "roles"],
    queryFn: () => usersApi.getUserRoles(userId),
    enabled: !!userId,
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: () => usersApi.searchUsers(query),
    enabled: query.length >= 2,
  });
}
