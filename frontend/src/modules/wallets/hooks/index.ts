import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { walletsApi } from "../api";
import type { TopUpWalletInput, DebitWalletInput, TransferWalletInput } from "../validators";

export function useWallet(userId: string) {
  return useQuery({
    queryKey: ["wallets", "user", userId],
    queryFn: () => walletsApi.getByUserId(userId),
    enabled: !!userId,
  });
}

export function useWalletBalance(walletId: string) {
  return useQuery({
    queryKey: ["wallets", walletId, "balance"],
    queryFn: () => walletsApi.getBalance(walletId),
    enabled: !!walletId,
  });
}

export function useWalletTransactions(walletId: string) {
  return useQuery({
    queryKey: ["wallets", walletId, "transactions"],
    queryFn: () => walletsApi.getTransactions(walletId),
    enabled: !!walletId,
  });
}

export function useTopUpWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TopUpWalletInput) => walletsApi.topUp(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });
}

export function useDebitWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DebitWalletInput) => walletsApi.debit(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });
}

export function useTransferWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TransferWalletInput) => walletsApi.transfer(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });
}

export function useFreezeWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletsApi.freeze(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });
}

export function useUnfreezeWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => walletsApi.unfreeze(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });
}
