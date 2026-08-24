import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkoutApi } from "../api";
import type { AddToCartInput, UpdateCartItemInput, ApplyCouponInput } from "../validators";

export function useCart(userId: string) {
  return useQuery({
    queryKey: ["checkout", "cart", userId],
    queryFn: () => checkoutApi.getCart(userId),
    enabled: !!userId,
  });
}

export function useCartItems(cartId: string) {
  return useQuery({
    queryKey: ["checkout", "cart", cartId, "items"],
    queryFn: () => checkoutApi.getCartItems(cartId),
    enabled: !!cartId,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddToCartInput) => checkoutApi.addToCart(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checkout"] }),
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartId, productId }: { cartId: string; productId: string }) => checkoutApi.removeFromCart(cartId, productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checkout"] }),
  });
}

export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartId, productId, quantity }: UpdateCartItemInput) => checkoutApi.updateCartItemQuantity(cartId, productId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checkout"] }),
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartId: string) => checkoutApi.clearCart(cartId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checkout"] }),
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplyCouponInput) => checkoutApi.applyCoupon(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checkout"] }),
  });
}

export function useBeginCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartId: string) => checkoutApi.beginCheckout(cartId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checkout"] }),
  });
}

export function useCompleteCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartId: string) => checkoutApi.completeCheckout(cartId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checkout"] }),
  });
}

export function useValidateCoupon() {
  return useMutation({
    mutationFn: ({ couponCode, cartTotal }: { couponCode: string; cartTotal: number }) => checkoutApi.validateCoupon(couponCode, cartTotal),
  });
}
