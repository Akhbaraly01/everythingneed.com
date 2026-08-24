import { http, qs } from "@core/api";

const API_BASE = "/api/home";

export const homeApi = {
  getHomepageData: (userId?: string) => http.get<any>(`${API_BASE}${qs({ userId })}`),
  getFeaturedItems: () => http.get<any>(`${API_BASE}/featured`),
  getTrendingItems: () => http.get<any>(`${API_BASE}/trending`),
};
