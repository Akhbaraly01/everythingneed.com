import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewsApi } from "../api";
import type { LeaveReviewInput, EditReviewInput } from "../validators";

export function useReview(id: string) {
  return useQuery({
    queryKey: ["reviews", id],
    queryFn: () => reviewsApi.getById(id),
    enabled: !!id,
  });
}

export function useReviewsByTarget(targetType: string, targetId: string) {
  return useQuery({
    queryKey: ["reviews", "target", targetType, targetId],
    queryFn: () => reviewsApi.getByTarget(targetType, targetId),
    enabled: !!targetType && !!targetId,
  });
}

export function useAverageRating(targetType: string, targetId: string) {
  return useQuery({
    queryKey: ["reviews", "average", targetType, targetId],
    queryFn: () => reviewsApi.getAverageRating(targetType, targetId),
    enabled: !!targetType && !!targetId,
  });
}

export function useLeaveReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveReviewInput) => reviewsApi.leave(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useEditReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditReviewInput }) => reviewsApi.edit(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useFlagReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId, reportedBy, reason }: { reviewId: string; reportedBy: string; reason?: string }) =>
      reviewsApi.flag({ reviewId, reportedBy, reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}

export function useVoteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId, voteType }: { id: string; userId: string; voteType: string }) =>
      reviewsApi.vote(id, userId, voteType),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reviews"] }),
  });
}
