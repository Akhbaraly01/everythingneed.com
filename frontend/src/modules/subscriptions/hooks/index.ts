import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionsApi } from "../api";
import type { CreatePlanInput, SubscribeInput, CancelSubscriptionInput } from "../validators";

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscriptions", "plans"],
    queryFn: () => subscriptionsApi.getAllPlans(),
  });
}

export function useActiveSubscription(userId: string) {
  return useQuery({
    queryKey: ["subscriptions", "active", userId],
    queryFn: () => subscriptionsApi.getActiveByUser(userId),
    enabled: !!userId,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlanInput) => subscriptionsApi.createPlan(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions", "plans"] }),
  });
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubscribeInput) => subscriptionsApi.subscribe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CancelSubscriptionInput) => subscriptionsApi.cancel(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}

export function useRenewSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionsApi.renew(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions"] }),
  });
}
