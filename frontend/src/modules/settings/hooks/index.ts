import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../api";
import type { CreateSettingInput, UpdateSettingInput, SetUserSettingInput } from "../validators";

export function useSetting(key: string) {
  return useQuery({
    queryKey: ["settings", key],
    queryFn: () => settingsApi.get(key),
    enabled: !!key,
  });
}

export function useAllSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.getAll(),
  });
}

export function usePublicSettings() {
  return useQuery({
    queryKey: ["settings", "public"],
    queryFn: () => settingsApi.getPublic(),
  });
}

export function useUserSettings(userId: string) {
  return useQuery({
    queryKey: ["settings", "user", userId],
    queryFn: () => settingsApi.getUserSettings(userId),
    enabled: !!userId,
  });
}

export function useCreateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSettingInput) => settingsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, data }: { key: string; data: UpdateSettingInput }) => settingsApi.update(key, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useDeleteSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => settingsApi.delete(key),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}

export function useSetUserSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetUserSettingInput) => settingsApi.setUserSetting(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });
}
