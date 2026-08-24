import { http } from "@core/api";
import type { CreateDealInput, ApplyCouponInput } from "../validators";

const API_BASE = "/api/deals";

const qs = (params?: Record<string, unknown>) => {
  if (!params) return "";
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) search.set(key, String(value));
  });
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
};

export const dealsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getActive: (params?: any) => http.get<any[]>(`${API_BASE}/active${qs(params)}`),
  getByVendor: (vendorId: string, params?: any) => http.get<any[]>(`${API_BASE}/vendor/${vendorId}${qs(params)}`),
  getCouponByCode: (code: string) => http.get<any>(`${API_BASE}/coupons/code/${code}`),
  getCampaign: (id: string) => http.get<any>(`${API_BASE}/campaigns/${id}`),
  create: (data: CreateDealInput) => http.post<any>(API_BASE, data),
  activate: (id: string) => http.post<void>(`${API_BASE}/${id}/activate`),
  expire: (id: string) => http.post<void>(`${API_BASE}/${id}/expire`),
  applyCoupon: (data: ApplyCouponInput) => http.post<any>(`${API_BASE}/coupons/apply`, data),
  createCoupon: (data: any) => http.post<any>(`${API_BASE}/coupons`, data),
};
