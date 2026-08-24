/**
 * Healthcare Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Healthcare/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { HealthTicket, Doctor, Department } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface BookAppointmentDTO {
  patientId: string;
  symptoms: string;
  description?: string;
  consultationType?: string;
  consultationFee?: number;
  appointmentDate?: string;
  appointmentTime?: string;
  isRandomAssignment?: boolean;
}

export interface CreateDoctorDTO {
  userId?: string;
  fullName: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  virtualFee?: number;
  avatarUrl?: string;
}

export interface UpdateDoctorDTO {
  fullName?: string;
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  consultationFee?: number;
  virtualFee?: number;
  avatarUrl?: string;
  isAvailable?: boolean;
}

export interface UpdateAppointmentStatusDTO {
  ticketId: string;
  status: string;
  diagnosis?: string;
  prescription?: string;
  notes?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface BookAppointmentCommand {
  type: "BookAppointment";
  payload: BookAppointmentDTO;
}

export interface CancelAppointmentCommand {
  type: "CancelAppointment";
  payload: {
    ticketId: string;
    reason?: string;
  };
}

export interface AssignDoctorCommand {
  type: "AssignDoctor";
  payload: {
    ticketId: string;
    doctorId: string;
  };
}

export interface StartConsultationCommand {
  type: "StartConsultation";
  payload: {
    ticketId: string;
    doctorId: string;
  };
}

export interface CompleteConsultationCommand {
  type: "CompleteConsultation";
  payload: {
    ticketId: string;
    diagnosis?: string;
    prescription?: string;
    notes?: string;
  };
}

export interface CreateDoctorCommand {
  type: "CreateDoctor";
  payload: CreateDoctorDTO;
}

export interface UpdateDoctorCommand {
  type: "UpdateDoctor";
  payload: {
    doctorId: string;
    data: UpdateDoctorDTO;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetAppointmentQuery {
  type: "GetAppointment";
  payload: {
    ticketId: string;
  };
}

export interface GetPatientAppointmentsQuery {
  type: "GetPatientAppointments";
  payload: {
    patientId: string;
    params?: QueryParams;
  };
}

export interface GetDoctorAppointmentsQuery {
  type: "GetDoctorAppointments";
  payload: {
    doctorId: string;
    params?: QueryParams;
  };
}

export interface GetDoctorQuery {
  type: "GetDoctor";
  payload: {
    doctorId: string;
  };
}

export interface GetDoctorsBySpecializationQuery {
  type: "GetDoctorsBySpecialization";
  payload: {
    specialization: string;
    params?: QueryParams;
  };
}

export interface GetAvailableDoctorsQuery {
  type: "GetAvailableDoctors";
  payload: {
    params?: QueryParams;
  };
}

export interface SearchDoctorsQuery {
  type: "SearchDoctors";
  payload: {
    query: string;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface HealthcareApplicationService {
  bookAppointment(command: BookAppointmentCommand): Promise<HealthTicket>;
  cancelAppointment(command: CancelAppointmentCommand): Promise<void>;
  assignDoctor(command: AssignDoctorCommand): Promise<void>;
  startConsultation(command: StartConsultationCommand): Promise<void>;
  completeConsultation(command: CompleteConsultationCommand): Promise<void>;

  getAppointment(query: GetAppointmentQuery): Promise<HealthTicket | null>;
  getPatientAppointments(query: GetPatientAppointmentsQuery): Promise<PaginatedResult<HealthTicket>>;
  getDoctorAppointments(query: GetDoctorAppointmentsQuery): Promise<PaginatedResult<HealthTicket>>;

  createDoctor(command: CreateDoctorCommand): Promise<Doctor>;
  updateDoctor(command: UpdateDoctorCommand): Promise<Doctor>;
  getDoctor(query: GetDoctorQuery): Promise<Doctor | null>;
  getDoctorsBySpecialization(query: GetDoctorsBySpecializationQuery): Promise<PaginatedResult<Doctor>>;
  getAvailableDoctors(query: GetAvailableDoctorsQuery): Promise<PaginatedResult<Doctor>>;
  searchDoctors(query: SearchDoctorsQuery): Promise<Doctor[]>;
}
