import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export interface AdminCourse {
  id: string;
  title: string;
  instructor: string;
  enrolled_count: number;
  status: string;
  revenue: number;
}

export interface AdminEnrollment {
  id: string;
  user_name: string;
  course_title: string;
  enrolled_at: string;
  progress: number;
}

export interface AdminCertificate {
  id: string;
  user_name: string;
  course_title: string;
  issued_at: string;
}

export const learningApi = {
  courses: (params?: { search?: string }) => {
    const query = params?.search ? `?search=${params.search}` : "";
    return http.get<{ data: AdminCourse[] }>(`${API}/admin/learning/courses${query}`);
  },
  enrollments: (params?: { search?: string }) => {
    const query = params?.search ? `?search=${params.search}` : "";
    return http.get<{ data: AdminEnrollment[] }>(`${API}/admin/learning/enrollments${query}`);
  },
  certificates: () => http.get<{ data: AdminCertificate[] }>(`${API}/admin/learning/certificates`),
};
