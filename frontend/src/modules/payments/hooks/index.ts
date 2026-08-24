import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentsApi } from "../api";
import type { InitiatePaymentInput, InitiateRefundInput } from "../validators";

export function usePayment(id: string) {
  return useQuery({
    queryKey: ["payments", id],
    queryFn: () => paymentsApi.getPaymentById(id),
    enabled: !!id,
  });
}

export function usePaymentsByOrder(orderId: string) {
  return useQuery({
    queryKey: ["payments", "order", orderId],
    queryFn: () => paymentsApi.getPaymentsByOrderId(orderId),
    enabled: !!orderId,
  });
}

export function usePaymentsByUser(userId: string) {
  return useQuery({
    queryKey: ["payments", "user", userId],
    queryFn: () => paymentsApi.getPaymentsByUserId(userId),
    enabled: !!userId,
  });
}

export function useInitiatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InitiatePaymentInput) => paymentsApi.initiatePayment(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });
}

export function useInitiateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InitiateRefundInput) => paymentsApi.initiateRefund(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });
}

export function useWallet(userId: string) {
  return useQuery({
    queryKey: ["wallets", userId],
    queryFn: () => paymentsApi.getWallet(userId),
    enabled: !!userId,
  });
}

export function useWalletBalance(userId: string) {
  return useQuery({
    queryKey: ["wallets", userId, "balance"],
    queryFn: () => paymentsApi.getWalletBalance(userId),
    enabled: !!userId,
  });
}
