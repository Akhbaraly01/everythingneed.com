import { http } from "@core/api";
import { qs } from "@core/api";
import type { CreatePlanInput, UpdatePlanInput, SubscribeInput, CancelSubscriptionInput } from "../validators";

const API_BASE = "/api/subscriptions";

export const subscriptionsApi = {
  getPlan: (id: string) => http.get<any>(`${API_BASE}/plans/${id}`),
  getAllPlans: () => http.get<any[]>(`${API_BASE}/plans`),
  getSubscription: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getActiveByUser: (userId: string) => http.get<any>(`${API_BASE}/user/${userId}/active`),
  getHistoryByUser: (userId: string, params?: any) => http.get<any[]>(`${API_BASE}/user/${userId}/history${qs(params)}`),
  createPlan: (data: CreatePlanInput) => http.post<any>(`${API_BASE}/plans`, data),
  updatePlan: (id: string, data: UpdatePlanInput) => http.put<any>(`${API_BASE}/plans/${id}`, data),
  subscribe: (data: SubscribeInput) => http.post<any>(API_BASE, data),
  cancel: (data: CancelSubscriptionInput) => http.post<void>(`${API_BASE}/cancel`, data),
  renew: (id: string) => http.post<void>(`${API_BASE}/${id}/renew`),
};
