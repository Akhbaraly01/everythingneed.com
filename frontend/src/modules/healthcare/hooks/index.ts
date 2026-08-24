import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { healthcareApi } from "../api";
import type { BookAppointmentInput, CreateDoctorInput, UpdateDoctorInput, AssignDoctorInput, CompleteConsultationInput } from "../validators";

export function useAppointment(ticketId: string) {
  return useQuery({
    queryKey: ["healthcare", "appointments", ticketId],
    queryFn: () => healthcareApi.getAppointment(ticketId),
    enabled: !!ticketId,
  });
}

export function usePatientAppointments(patientId: string) {
  return useQuery({
    queryKey: ["healthcare", "appointments", "patient", patientId],
    queryFn: () => healthcareApi.getPatientAppointments(patientId),
    enabled: !!patientId,
  });
}

export function useDoctorAppointments(doctorId: string) {
  return useQuery({
    queryKey: ["healthcare", "appointments", "doctor", doctorId],
    queryFn: () => healthcareApi.getDoctorAppointments(doctorId),
    enabled: !!doctorId,
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BookAppointmentInput) => healthcareApi.bookAppointment(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["healthcare"] }),
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, reason }: { ticketId: string; reason?: string }) => healthcareApi.cancelAppointment(ticketId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["healthcare"] }),
  });
}

export function useAssignDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignDoctorInput) => healthcareApi.assignDoctor(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["healthcare"] }),
  });
}

export function useCompleteConsultation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CompleteConsultationInput) => healthcareApi.completeConsultation(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["healthcare"] }),
  });
}

export function useDoctor(doctorId: string) {
  return useQuery({
    queryKey: ["healthcare", "doctors", doctorId],
    queryFn: () => healthcareApi.getDoctor(doctorId),
    enabled: !!doctorId,
  });
}

export function useAvailableDoctors() {
  return useQuery({
    queryKey: ["healthcare", "doctors", "available"],
    queryFn: () => healthcareApi.getAvailableDoctors(),
  });
}

export function useSearchDoctors(query: string) {
  return useQuery({
    queryKey: ["healthcare", "doctors", "search", query],
    queryFn: () => healthcareApi.searchDoctors(query),
    enabled: query.length >= 2,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["healthcare", "departments"],
    queryFn: () => healthcareApi.getDepartments(),
  });
}
