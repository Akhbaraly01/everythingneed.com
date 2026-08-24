import { http } from "@core/api";
import type { AddToCartInput, RemoveFromCartInput, UpdateCartItemInput, ApplyCouponInput } from "../validators";

const API_BASE = "/api/checkout";

export const checkoutApi = {
  getCart: (userId: string) => http.get<any>(`${API_BASE}/cart/${userId}`),
  getCartById: (cartId: string) => http.get<any>(`${API_BASE}/cart/${cartId}`),
  getCartItems: (cartId: string) => http.get<any[]>(`${API_BASE}/cart/${cartId}/items`),
  addToCart: (data: AddToCartInput) => http.post<any>(`${API_BASE}/cart/items`, data),
  removeFromCart: (cartId: string, productId: string) => http.delete<void>(`${API_BASE}/cart/${cartId}/items/${productId}`),
  updateCartItemQuantity: (cartId: string, productId: string, quantity: number) => http.put<any>(`${API_BASE}/cart/${cartId}/items/${productId}`, { quantity }),
  clearCart: (cartId: string) => http.delete<void>(`${API_BASE}/cart/${cartId}/clear`),
  applyCoupon: (data: ApplyCouponInput) => http.post<any>(`${API_BASE}/cart/${data.cartId}/coupon`, { couponCode: data.couponCode }),
  removeCoupon: (cartId: string) => http.delete<any>(`${API_BASE}/cart/${cartId}/coupon`),
  beginCheckout: (cartId: string) => http.post<any>(`${API_BASE}/cart/${cartId}/begin`),
  completeCheckout: (cartId: string) => http.post<any>(`${API_BASE}/cart/${cartId}/complete`),
  validateCoupon: (couponCode: string, cartTotal: number) => http.post<any>(`${API_BASE}/coupons/validate`, { couponCode, cartTotal }),
};
