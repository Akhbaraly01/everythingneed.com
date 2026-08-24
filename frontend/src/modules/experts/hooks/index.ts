import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expertsApi } from "../api";
import type { RegisterExpertInput, AddExpertReviewInput, AddToWishlistInput } from "../validators";

export function useExpert(id: string) {
  return useQuery({
    queryKey: ["experts", id],
    queryFn: () => expertsApi.getById(id),
    enabled: !!id,
  });
}

export function useExpertByUser(userId: string) {
  return useQuery({
    queryKey: ["experts", "user", userId],
    queryFn: () => expertsApi.getByUserId(userId),
    enabled: !!userId,
  });
}

export function useExpertReviews(expertId: string) {
  return useQuery({
    queryKey: ["experts", expertId, "reviews"],
    queryFn: () => expertsApi.getReviews(expertId),
    enabled: !!expertId,
  });
}

export function useExpertWishlist(userId: string) {
  return useQuery({
    queryKey: ["experts", "wishlist", userId],
    queryFn: () => expertsApi.getWishlist(userId),
    enabled: !!userId,
  });
}

export function useRegisterExpert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterExpertInput) => expertsApi.register(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["experts"] }),
  });
}

export function useAddExpertReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddExpertReviewInput) => expertsApi.addReview(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["experts"] }),
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddToWishlistInput) => expertsApi.addToWishlist(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["experts"] }),
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, expertId }: { userId: string; expertId: string }) =>
      expertsApi.removeFromWishlist(userId, expertId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["experts"] }),
  });
}

export function useSearchExperts(query: string) {
  return useQuery({
    queryKey: ["experts", "search", query],
    queryFn: () => expertsApi.search(query),
    enabled: query.length >= 2,
  });
}
