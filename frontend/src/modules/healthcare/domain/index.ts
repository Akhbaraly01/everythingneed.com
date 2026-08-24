/**
 * Healthcare Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Healthcare/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Money, Address, DateRange, TimeSlot } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface DoctorId {
  value: string;
}

export interface HealthTicketId {
  value: string;
}

export interface TicketNumber {
  value: string;
}

export interface Specialization {
  value: string;
}

export interface ConsultationType {
  value: "in_person" | "virtual";
}

export interface TicketStatus {
  value: "pending" | "assigned" | "in_consultation" | "completed" | "cancelled";
}

export interface DoctorAvailability {
  isAvailable: boolean;
  nextAvailableAt?: Date;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  userId?: string;
  fullName: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  consultationFee: number;
  virtualFee?: number;
  avatarUrl?: string;
  isAvailable: boolean;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthTicket {
  id: string;
  patientId: string;
  doctorId?: string;
  ticketNumber: string;
  symptoms: string;
  description?: string;
  consultationType?: string;
  consultationFee?: number;
  appointmentDate?: string;
  appointmentTime?: string;
  isRandomAssignment: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface AppointmentBookedEvent {
  type: "AppointmentBooked";
  ticketId: string;
  doctorId: string | null;
  userId: string;
  timestamp: Date;
}

export interface AppointmentCancelledEvent {
  type: "AppointmentCancelled";
  ticketId: string;
  reason?: string;
  timestamp: Date;
}

export interface DoctorAssignedEvent {
  type: "DoctorAssigned";
  ticketId: string;
  doctorId: string;
  timestamp: Date;
}

export interface ConsultationStartedEvent {
  type: "ConsultationStarted";
  ticketId: string;
  doctorId: string;
  patientId: string;
  timestamp: Date;
}

export interface ConsultationCompletedEvent {
  type: "ConsultationCompleted";
  ticketId: string;
  doctorId: string;
  patientId: string;
  diagnosis?: string;
  prescription?: string;
  timestamp: Date;
}

export interface DoctorAvailabilityChangedEvent {
  type: "DoctorAvailabilityChanged";
  doctorId: string;
  isAvailable: boolean;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface HealthcareService {
  bookAppointment(data: {
    patientId: string;
    symptoms: string;
    description?: string;
    consultationType?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    isRandomAssignment?: boolean;
  }): Promise<HealthTicket>;

  cancelAppointment(ticketId: string, reason?: string): Promise<void>;
  assignDoctor(ticketId: string, doctorId: string): Promise<void>;
  startConsultation(ticketId: string, doctorId: string): Promise<void>;
  completeConsultation(ticketId: string, data: {
    diagnosis?: string;
    prescription?: string;
    notes?: string;
  }): Promise<void>;

  getTicketById(ticketId: string): Promise<HealthTicket | null>;
  getTicketsByPatient(patientId: string, params?: any): Promise<{ items: HealthTicket[]; total: number }>;
  getTicketsByDoctor(doctorId: string, params?: any): Promise<{ items: HealthTicket[]; total: number }>;

  getDoctorById(doctorId: string): Promise<Doctor | null>;
  getDoctorsBySpecialization(specialization: string, params?: any): Promise<{ items: Doctor[]; total: number }>;
  getAvailableDoctors(params?: any): Promise<{ items: Doctor[]; total: number }>;
  searchDoctors(query: string): Promise<Doctor[]>;

  getDepartmentById(departmentId: string): Promise<Department | null>;
  getAllDepartments(): Promise<Department[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class HealthTicketNotFoundError extends DomainError {
  constructor(ticketId: string) {
    super(`Health ticket ${ticketId} not found`, "HEALTH_TICKET_NOT_FOUND");
    this.name = "HealthTicketNotFoundError";
  }
}

export class DoctorNotFoundError extends DomainError {
  constructor(doctorId: string) {
    super(`Doctor ${doctorId} not found`, "DOCTOR_NOT_FOUND");
    this.name = "DoctorNotFoundError";
  }
}

export class DoctorNotAvailableError extends DomainError {
  constructor(doctorId: string) {
    super(`Doctor ${doctorId} is not available`, "DOCTOR_NOT_AVAILABLE");
    this.name = "DoctorNotAvailableError";
  }
}

export class AppointmentAlreadyBookedError extends DomainError {
  constructor(patientId: string, date: string) {
    super(`Patient ${patientId} already has an appointment on ${date}`, "APPOINTMENT_ALREADY_BOOKED");
    this.name = "AppointmentAlreadyBookedError";
  }
}

export class ConsultationFeeRequiredError extends DomainError {
  constructor() {
    super("Consultation fee is required for virtual consultations", "CONSULTATION_FEE_REQUIRED");
    this.name = "ConsultationFeeRequiredError";
  }
}
