import { http, qs } from "@core/api";
import type { PostJobInput, ApplyToJobInput, ShortlistApplicantInput } from "../validators";

const API_BASE = "/api/jobs";

export const jobsApi = {
  getById: (id: string) => http.get<any>(`${API_BASE}/${id}`),
  getEmployerJobs: (employerId: string, params?: any) => http.get<any[]>(`${API_BASE}/employer/${employerId}${qs(params)}`),
  search: (query: string, params?: any) => http.get<any[]>(`${API_BASE}/search${qs({ q: query, ...params })}`),
  getApplications: (jobPostId: string, params?: any) => http.get<any[]>(`${API_BASE}/${jobPostId}/applications${qs(params)}`),
  getMyApplications: (applicantId: string, params?: any) => http.get<any[]>(`${API_BASE}/applications/user/${applicantId}${qs(params)}`),
  postJob: (data: PostJobInput) => http.post<any>(API_BASE, data),
  updateJob: (id: string, data: any) => http.put<any>(`${API_BASE}/${id}`, data),
  closeJob: (id: string) => http.post<void>(`${API_BASE}/${id}/close`),
  apply: (data: ApplyToJobInput) => http.post<any>(`${API_BASE}/applications`, data),
  shortlist: (data: ShortlistApplicantInput) => http.post<any>(`${API_BASE}/applications/shortlist`, data),
  reject: (applicationId: string, notes?: string) => http.post<void>(`${API_BASE}/applications/${applicationId}/reject`, { notes }),
};
