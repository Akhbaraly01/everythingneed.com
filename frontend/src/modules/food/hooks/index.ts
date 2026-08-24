import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { foodApi } from "../api";
import type { CreateRestaurantInput, CreateMenuItemInput, PlaceFoodOrderInput } from "../validators";

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: ["food", "restaurants", id],
    queryFn: () => foodApi.getRestaurant(id),
    enabled: !!id,
  });
}

export function useActiveRestaurants() {
  return useQuery({
    queryKey: ["food", "restaurants"],
    queryFn: () => foodApi.getActiveRestaurants(),
  });
}

export function useMenuItems(restaurantId: string) {
  return useQuery({
    queryKey: ["food", "menu", restaurantId],
    queryFn: () => foodApi.getMenuItems(restaurantId),
    enabled: !!restaurantId,
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRestaurantInput) => foodApi.createRestaurant(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["food", "restaurants"] }),
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ restaurantId, data }: { restaurantId: string; data: CreateMenuItemInput }) =>
      foodApi.createMenuItem(restaurantId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["food"] }),
  });
}

export function usePlaceFoodOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlaceFoodOrderInput) => foodApi.placeOrder(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["food", "orders"] }),
  });
}

export function useFoodOrder(orderId: string) {
  return useQuery({
    queryKey: ["food", "orders", orderId],
    queryFn: () => foodApi.getOrder(orderId),
    enabled: !!orderId,
  });
}
