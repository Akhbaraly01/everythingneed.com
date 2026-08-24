import { http } from "@core/api";
import type { SignUpInput, SignInInput } from "../validators";

const API_BASE = "/api/auth";

export const authApi = {
  signUp: (data: SignUpInput) => http.post<{ userId: string; email: string }>(`${API_BASE}/register`, data),
  signIn: (data: SignInInput) => http.post<{ userId: string; accessToken: string; refreshToken: string }>(`${API_BASE}/login`, data),
  signOut: () => http.post<void>(`${API_BASE}/logout`),
  resetPassword: (email: string) => http.post<{ token: string }>(`${API_BASE}/reset-password`, { email }),
  confirmPasswordReset: (token: string, newPassword: string) => http.post<void>(`${API_BASE}/confirm-reset`, { token, newPassword }),
  verifyEmail: (token: string) => http.post<void>(`${API_BASE}/verify-email`, { token }),
  verifyPhone: (phone: string, code: string) => http.post<void>(`${API_BASE}/verify-phone`, { phone, code }),
  refreshSession: (refreshToken: string) => http.post<{ accessToken: string; refreshToken: string }>(`${API_BASE}/refresh`, { refreshToken }),
  getSession: () => http.get<{ userId: string; accessToken: string } | null>(`${API_BASE}/session`),
  getCurrentUser: () => http.get<{ userId: string; email: string } | null>(`${API_BASE}/me`),
};
