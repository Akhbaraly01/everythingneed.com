import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { realEstateApi } from "../api";
import type { CreateListingInput, ScheduleViewingInput } from "../validators";

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["real-estate", "properties", id],
    queryFn: () => realEstateApi.getProperty(id),
    enabled: !!id,
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ["real-estate", "listings", id],
    queryFn: () => realEstateApi.getListing(id),
    enabled: !!id,
  });
}

export function useActiveListings() {
  return useQuery({
    queryKey: ["real-estate", "listings"],
    queryFn: () => realEstateApi.getActiveListings(),
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListingInput) => realEstateApi.createListing(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["real-estate"] }),
  });
}

export function useScheduleViewing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ScheduleViewingInput) => realEstateApi.scheduleViewing(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["real-estate"] }),
  });
}

export function useCancelViewing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => realEstateApi.cancelViewing(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["real-estate"] }),
  });
}

export function useUserViewingRequests(userId: string) {
  return useQuery({
    queryKey: ["real-estate", "viewings", "user", userId],
    queryFn: () => realEstateApi.getViewingRequests(userId),
    enabled: !!userId,
  });
}
