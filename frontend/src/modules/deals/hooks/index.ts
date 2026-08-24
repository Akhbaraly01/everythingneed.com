import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dealsApi } from "../api";
import type { CreateDealInput, ApplyCouponInput } from "../validators";

export function useDeal(id: string) {
  return useQuery({
    queryKey: ["deals", id],
    queryFn: () => dealsApi.getById(id),
    enabled: !!id,
  });
}

export function useActiveDeals() {
  return useQuery({
    queryKey: ["deals", "active"],
    queryFn: () => dealsApi.getActive(),
  });
}

export function useDealsByVendor(vendorId: string) {
  return useQuery({
    queryKey: ["deals", "vendor", vendorId],
    queryFn: () => dealsApi.getByVendor(vendorId),
    enabled: !!vendorId,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDealInput) => dealsApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deals"] }),
  });
}

export function useActivateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dealsApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deals"] }),
  });
}

export function useExpireDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dealsApi.expire(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deals"] }),
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplyCouponInput) => dealsApi.applyCoupon(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deals"] }),
  });
}
