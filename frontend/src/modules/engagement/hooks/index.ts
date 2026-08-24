import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { engagementApi } from "../api";
import type { FavoriteInput, RecordViewInput, AddToWishlistInput } from "../validators";

export function useFavorites(userId: string) {
  return useQuery({
    queryKey: ["engagement", "favorites", userId],
    queryFn: () => engagementApi.getFavorites(userId),
    enabled: !!userId,
  });
}

export function useRecentlyViewed(userId: string) {
  return useQuery({
    queryKey: ["engagement", "recently-viewed", userId],
    queryFn: () => engagementApi.getRecentlyViewed(userId),
    enabled: !!userId,
  });
}

export function useUserWishlists(userId: string) {
  return useQuery({
    queryKey: ["engagement", "wishlists", "user", userId],
    queryFn: () => engagementApi.getUserWishlists(userId),
    enabled: !!userId,
  });
}

export function useIsFavorited(userId: string, targetType: string, targetId: string) {
  return useQuery({
    queryKey: ["engagement", "favorites", "check", userId, targetType, targetId],
    queryFn: () => engagementApi.isFavorited(userId, targetType, targetId),
    enabled: !!userId && !!targetType && !!targetId,
  });
}

export function useFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FavoriteInput) => engagementApi.favorite(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["engagement"] }),
  });
}

export function useUnfavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, targetType, targetId }: { userId: string; targetType: string; targetId: string }) =>
      engagementApi.unfavorite(userId, targetType, targetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["engagement"] }),
  });
}

export function useRecordView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordViewInput) => engagementApi.recordView(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["engagement"] }),
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddToWishlistInput) => engagementApi.addToWishlist(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["engagement"] }),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ wishlistId, targetId }: { wishlistId: string; targetId: string }) =>
      engagementApi.removeFromWishlist(wishlistId, targetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["engagement"] }),
  });
}
