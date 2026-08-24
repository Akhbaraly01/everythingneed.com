import { http } from "@core/api";
import { qs } from "@core/api";
import type { TopUpWalletInput, DebitWalletInput, TransferWalletInput } from "../validators";

const API_BASE = "/api/wallets";

export const walletsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getByUserId: (userId: string) => http.get<any>(`${API_BASE}/user/${userId}`),
  getBalance: (id: string) => http.get<number>(`${API_BASE}/${id}/balance`),
  getTransactions: (id: string, params?: any) => http.get<any[]>(`${API_BASE}/${id}/transactions${qs(params)}`),
  create: (userId: string, currency?: string) => http.post<any>(API_BASE, { userId, currency }),
  topUp: (data: TopUpWalletInput) => http.post<any>(`${API_BASE}/top-up`, data),
  debit: (data: DebitWalletInput) => http.post<any>(`${API_BASE}/debit`, data),
  transfer: (data: TransferWalletInput) => http.post<any>(`${API_BASE}/transfer`, data),
  freeze: (id: string) => http.post<void>(`${API_BASE}/${id}/freeze`),
  unfreeze: (id: string) => http.post<void>(`${API_BASE}/${id}/unfreeze`),
};
