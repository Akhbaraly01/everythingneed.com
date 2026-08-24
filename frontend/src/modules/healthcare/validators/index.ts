import { z } from "zod";

export const BookAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  symptoms: z.string().min(1).max(2000),
  description: z.string().max(5000).optional(),
  consultationType: z.enum(["in_person", "virtual"]).optional(),
  consultationFee: z.number().positive().optional(),
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  isRandomAssignment: z.boolean().optional(),
});

export const CreateDoctorSchema = z.object({
  userId: z.string().uuid().optional(),
  fullName: z.string().min(2).max(100),
  specialization: z.string().min(1).max(100),
  qualification: z.string().min(1).max(200),
  experienceYears: z.number().int().min(0),
  consultationFee: z.number().positive(),
  virtualFee: z.number().positive().optional(),
  avatarUrl: z.string().url().optional(),
});

export const UpdateDoctorSchema = CreateDoctorSchema.partial().extend({
  isAvailable: z.boolean().optional(),
});

export const AssignDoctorSchema = z.object({
  ticketId: z.string().uuid(),
  doctorId: z.string().uuid(),
});

export const CompleteConsultationSchema = z.object({
  ticketId: z.string().uuid(),
  diagnosis: z.string().max(5000).optional(),
  prescription: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
});

export type BookAppointmentInput = z.infer<typeof BookAppointmentSchema>;
export type CreateDoctorInput = z.infer<typeof CreateDoctorSchema>;
export type UpdateDoctorInput = z.infer<typeof UpdateDoctorSchema>;
export type AssignDoctorInput = z.infer<typeof AssignDoctorSchema>;
export type CompleteConsultationInput = z.infer<typeof CompleteConsultationSchema>;
