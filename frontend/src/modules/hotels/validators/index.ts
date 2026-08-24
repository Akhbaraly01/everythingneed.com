import { z } from "zod";

export const CreateReservationSchema = z.object({
  hotelId: z.string().uuid(),
  roomId: z.string().uuid(),
  userId: z.string().uuid(),
  guestName: z.string().min(1).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().positive(),
  specialRequests: z.string().max(1000).optional(),
});

export const CancelReservationSchema = z.object({
  reservationId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;
export type CancelReservationInput = z.infer<typeof CancelReservationSchema>;
