import { z } from "zod";

export const CreateBookingSchema = z.object({
  userId: z.string().uuid(),
  serviceType: z.string().min(1),
  serviceId: z.string().uuid().optional(),
  details: z.record(z.unknown()),
});

export const CancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;
