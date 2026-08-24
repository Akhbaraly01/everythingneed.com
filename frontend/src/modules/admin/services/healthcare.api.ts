import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export interface AdminDoctor {
  id: string;
  full_name: string;
  specialization: string;
  is_available: boolean;
  rating: number;
}

export interface AdminAppointment {
  id: string;
  patient_name: string;
  doctor_name: string;
  date: string;
  status: string;
}

export interface AdminMedicine {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

export const healthcareApi = {
  doctors: (params?: { search?: string }) => {
    const query = params?.search ? `?search=${params.search}` : "";
    return http.get<{ data: AdminDoctor[] }>(`${API}/admin/healthcare/doctors${query}`);
  },
  appointments: (params?: { search?: string }) => {
    const query = params?.search ? `?search=${params.search}` : "";
    return http.get<{ data: AdminAppointment[] }>(`${API}/admin/healthcare/appointments${query}`);
  },
  pharmacy: (params?: { search?: string }) => {
    const query = params?.search ? `?search=${params.search}` : "";
    return http.get<{ data: AdminMedicine[] }>(`${API}/admin/healthcare/pharmacy${query}`);
  },
};
