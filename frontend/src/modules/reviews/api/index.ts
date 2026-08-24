import { http } from "@core/api";
import { qs } from "@core/api";
import type { LeaveReviewInput, EditReviewInput, FlagReviewInput } from "../validators";

const API_BASE = "/api/reviews";

export const reviewsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getByTarget: (targetType: string, targetId: string, params?: any) =>
    http.get<any[]>(`${API_BASE}/target/${targetType}/${targetId}${qs(params)}`),
  getByUser: (userId: string, params?: any) => http.get<any[]>(`${API_BASE}/user/${userId}${qs(params)}`),
  getAverageRating: (targetType: string, targetId: string) =>
    http.get<number>(`${API_BASE}/average/${targetType}/${targetId}`),
  leave: (data: LeaveReviewInput) => http.post<any>(API_BASE, data),
  edit: (id: string, data: EditReviewInput) => http.put<any>(`${API_BASE}/${id}`, data),
  flag: (data: FlagReviewInput) => http.post<void>(`${API_BASE}/flag`, data),
  reply: (id: string, reply: string) => http.post<void>(`${API_BASE}/${id}/reply`, { reply }),
  vote: (id: string, userId: string, voteType: string) => http.post<void>(`${API_BASE}/${id}/vote`, { userId, voteType }),
};
