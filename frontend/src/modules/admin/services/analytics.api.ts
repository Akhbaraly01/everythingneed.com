import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export interface AnalyticsOverview {
  total_users: number;
  total_revenue: number;
  total_orders: number;
  active_vendors: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export const analyticsApi = {
  overview: (range?: string) => {
    const query = range ? `?range=${range}` : "";
    return http.get<{ data: AnalyticsOverview }>(`${API}/admin/analytics/overview${query}`);
  },

  userGrowth: (range?: string) => {
    const query = range ? `?range=${range}` : "";
    return http.get<{ data: ChartDataPoint[] }>(`${API}/admin/analytics/user-growth${query}`);
  },

  revenue: (range?: string) => {
    const query = range ? `?range=${range}` : "";
    return http.get<{ data: ChartDataPoint[] }>(`${API}/admin/analytics/revenue${query}`);
  },

  categories: (range?: string) => {
    const query = range ? `?range=${range}` : "";
    return http.get<{ data: ChartDataPoint[] }>(`${API}/admin/analytics/categories${query}`);
  },

  traffic: (range?: string) => {
    const query = range ? `?range=${range}` : "";
    return http.get<{ data: ChartDataPoint[] }>(`${API}/admin/analytics/traffic${query}`);
  },
};
