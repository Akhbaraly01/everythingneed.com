import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { HealthTicketRepository, DoctorRepository, DepartmentRepository } from "@core/repositories";
import type { HealthcareService } from "../domain";

export const healthcareService: HealthcareService = {
  async bookAppointment(data) {
    const repo = resolve<HealthTicketRepository>(TOKENS.HealthTicketRepository);
    const ticket = await repo.create({
      patient_id: data.patientId,
      symptoms: data.symptoms,
      description: data.description,
      consultation_type: data.consultationType,
      appointment_date: data.appointmentDate,
      appointment_time: data.appointmentTime,
      is_random_assignment: data.isRandomAssignment ?? true,
      ticket_number: `HT-${Date.now()}`,
      status: "pending",
    } as any) as any;
    eventBus.emit("AppointmentBooked", { ticketId: ticket.id, doctorId: ticket.doctor_id || null, userId: data.patientId });
    return ticket;
  },

  async cancelAppointment(ticketId, reason) {
    const repo = resolve<HealthTicketRepository>(TOKENS.HealthTicketRepository);
    await repo.updateStatus(ticketId, "cancelled");
    eventBus.emit("AppointmentCancelled", { ticketId });
  },

  async assignDoctor(ticketId, doctorId) {
    const repo = resolve<HealthTicketRepository>(TOKENS.HealthTicketRepository);
    await repo.assignDoctor(ticketId, doctorId);
    eventBus.emit("DoctorAssigned", { ticketId, doctorId });
  },

  async startConsultation(ticketId, doctorId) {
    const repo = resolve<HealthTicketRepository>(TOKENS.HealthTicketRepository);
    await repo.updateStatus(ticketId, "in_consultation");
    const ticket = await repo.findById(ticketId);
    eventBus.emit("ConsultationStarted", { ticketId, doctorId, patientId: ticket?.patient_id || "" });
  },

  async completeConsultation(ticketId, data) {
    const repo = resolve<HealthTicketRepository>(TOKENS.HealthTicketRepository);
    await repo.updateStatus(ticketId, "completed");
    const ticket = await repo.findById(ticketId);
    eventBus.emit("ConsultationCompleted", { ticketId, doctorId: ticket?.doctor_id || "", patientId: ticket?.patient_id || "" });
  },

  async getTicketById(ticketId) {
    const repo = resolve<HealthTicketRepository>(TOKENS.HealthTicketRepository);
    return (await repo.findById(ticketId)) as any;
  },

  async getTicketsByPatient(patientId, params) {
    const repo = resolve<HealthTicketRepository>(TOKENS.HealthTicketRepository);
    return (await repo.findByPatientId(patientId, params)) as any;
  },

  async getTicketsByDoctor(doctorId, params) {
    const repo = resolve<HealthTicketRepository>(TOKENS.HealthTicketRepository);
    return (await repo.findByDoctorId(doctorId, params)) as any;
  },

  async getDoctorById(doctorId) {
    const repo = resolve<DoctorRepository>(TOKENS.DoctorRepository);
    return (await repo.findById(doctorId)) as any;
  },

  async getDoctorsBySpecialization(specialization, params) {
    const repo = resolve<DoctorRepository>(TOKENS.DoctorRepository);
    return (await repo.findBySpecialization(specialization, params)) as any;
  },

  async getAvailableDoctors(params) {
    const repo = resolve<DoctorRepository>(TOKENS.DoctorRepository);
    return (await repo.findAvailable(params)) as any;
  },

  async searchDoctors(query) {
    const repo = resolve<DoctorRepository>(TOKENS.DoctorRepository);
    return (await repo.search(query)) as any;
  },

  async getDepartmentById(departmentId) {
    const repo = resolve<DepartmentRepository>(TOKENS.DepartmentRepository);
    return (await repo.findById(departmentId)) as any;
  },

  async getAllDepartments() {
    const repo = resolve<DepartmentRepository>(TOKENS.DepartmentRepository);
    const result = await repo.findMany();
    return result.items as any;
  },
};
