import { http } from "@core/api";
import { qs } from "@core/api";
import type { InitiatePaymentInput, InitiateRefundInput } from "../validators";

const API_BASE = "/api/payments";

export const paymentsApi = {
  getPaymentById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getPaymentsByOrderId: (orderId: string) => http.get<any[]>(`${API_BASE}/order/${orderId}`),
  getPaymentsByUserId: (userId: string, params?: any) => http.get<any[]>(`${API_BASE}/user/${userId}${qs(params)}`),
  initiatePayment: (data: InitiatePaymentInput) => http.post<any>(API_BASE, data),
  completePayment: (paymentId: string, gatewayResponse?: Record<string, unknown>) => http.post<void>(`${API_BASE}/${paymentId}/complete`, { gatewayResponse }),
  failPayment: (paymentId: string, reason: string) => http.post<void>(`${API_BASE}/${paymentId}/fail`, { reason }),
  initiateRefund: (data: InitiateRefundInput) => http.post<any>(`${API_BASE}/refunds`, data),
  completeRefund: (refundId: string) => http.post<void>(`${API_BASE}/refunds/${refundId}/complete`),
  getWallet: (userId: string) => http.get<any>(`/api/wallets/${userId}`),
  getWalletBalance: (userId: string) => http.get<number>(`/api/wallets/${userId}/balance`),
  getWalletTransactions: (walletId: string, params?: any) => http.get<any[]>(`/api/wallets/${walletId}/transactions${qs(params)}`),
};
