import { z } from "zod";

export const RegisterServiceWorkerSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(1),
  workerType: z.string().min(1),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  hourlyRate: z.number().positive().optional(),
  experienceYears: z.number().int().min(0).optional(),
});

export const CreateServiceBookingSchema = z.object({
  userId: z.string().uuid(),
  workerType: z.string().min(1),
  serviceCategory: z.string().min(1),
  description: z.string().min(10).max(2000),
  address: z.string().min(1),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  estimatedCost: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export const RegisterDeliveryManagerSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(1),
  vehicleType: z.string().optional(),
});

export type RegisterServiceWorkerInput = z.infer<typeof RegisterServiceWorkerSchema>;
export type CreateServiceBookingInput = z.infer<typeof CreateServiceBookingSchema>;
export type RegisterDeliveryManagerInput = z.infer<typeof RegisterDeliveryManagerSchema>;
