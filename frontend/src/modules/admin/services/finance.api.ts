import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export interface FinanceSummary {
  total_revenue: number;
  total_commissions: number;
  pending_payouts: number;
  active_subscriptions: number;
}

export interface FinanceTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  user_id: string;
  created_at: string;
}

export interface FinanceWithdrawal {
  id: string;
  vendor_id: string;
  amount: number;
  status: string;
  requested_at: string;
}

export const financeApi = {
  summary: () => http.get<{ data: FinanceSummary }>(`${API}/admin/finance/summary`),

  transactions: (params?: { page?: number; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.type) query.set("type", params.type);
    return http.get<{ data: FinanceTransaction[]; total: number }>(`${API}/admin/finance/transactions?${query.toString()}`);
  },

  withdrawals: (params?: { page?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.status) query.set("status", params.status);
    return http.get<{ data: FinanceWithdrawal[]; total: number }>(`${API}/admin/finance/withdrawals?${query.toString()}`);
  },
};
