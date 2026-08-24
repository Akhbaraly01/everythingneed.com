import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "../api";
import type { AdjustStockInput, ReserveStockInput, ReleaseStockInput } from "../validators";

export function useStockLevel(productId: string, warehouseId?: string) {
  return useQuery({
    queryKey: ["inventory", "stock", productId, warehouseId],
    queryFn: () => inventoryApi.getStockLevel(productId, warehouseId),
    enabled: !!productId,
  });
}

export function useStockMovements(productId: string) {
  return useQuery({
    queryKey: ["inventory", "movements", productId],
    queryFn: () => inventoryApi.getMovements(productId),
    enabled: !!productId,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: () => inventoryApi.getLowStock(),
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdjustStockInput) => inventoryApi.adjustStock(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useReserveStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReserveStockInput) => inventoryApi.reserveStock(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });
}

export function useReleaseStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReleaseStockInput) => inventoryApi.releaseStock(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inventory"] }),
  });
}
