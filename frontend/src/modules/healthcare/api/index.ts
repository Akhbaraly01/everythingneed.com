import { http, qs } from "@core/api";
import type { BookAppointmentInput, CreateDoctorInput, UpdateDoctorInput, AssignDoctorInput, CompleteConsultationInput } from "../validators";

const API_BASE = "/api/healthcare";

export const healthcareApi = {
  bookAppointment: (data: BookAppointmentInput) => http.post<any>(`${API_BASE}/appointments`, data),
  cancelAppointment: (ticketId: string, reason?: string) => http.post<void>(`${API_BASE}/appointments/${ticketId}/cancel`, { reason }),
  assignDoctor: (data: AssignDoctorInput) => http.post<void>(`${API_BASE}/appointments/${data.ticketId}/assign`, { doctorId: data.doctorId }),
  startConsultation: (ticketId: string, doctorId: string) => http.post<void>(`${API_BASE}/appointments/${ticketId}/start`, { doctorId }),
  completeConsultation: (data: CompleteConsultationInput) => http.post<void>(`${API_BASE}/appointments/${data.ticketId}/complete`, data),
  getAppointment: (ticketId: string) => http.get<any>(`${API_BASE}/appointments/${ticketId}`),
  getPatientAppointments: (patientId: string, params?: any) => http.get<any[]>(`${API_BASE}/appointments/patient/${patientId}${qs(params)}`),
  getDoctorAppointments: (doctorId: string, params?: any) => http.get<any[]>(`${API_BASE}/appointments/doctor/${doctorId}${qs(params)}`),
  createDoctor: (data: CreateDoctorInput) => http.post<any>(`${API_BASE}/doctors`, data),
  updateDoctor: (doctorId: string, data: UpdateDoctorInput) => http.put<any>(`${API_BASE}/doctors/${doctorId}`, data),
  getDoctor: (doctorId: string) => http.get<any>(`${API_BASE}/doctors/${doctorId}`),
  getDoctorsBySpecialization: (specialization: string, params?: any) => http.get<any[]>(`${API_BASE}/doctors/specialization/${specialization}${qs(params)}`),
  getAvailableDoctors: (params?: any) => http.get<any[]>(`${API_BASE}/doctors/available${qs(params)}`),
  searchDoctors: (query: string) => http.get<any[]>(`${API_BASE}/doctors/search${qs({ q: query })}`),
  getDepartments: () => http.get<any[]>(`${API_BASE}/departments`),
};
