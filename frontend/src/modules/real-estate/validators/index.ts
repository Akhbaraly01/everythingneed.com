import { z } from "zod";

export const CreateListingSchema = z.object({
  propertyId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  listingType: z.enum(["sale", "rent", "lease"]),
  price: z.number().positive(),
  rentAmount: z.number().positive().optional(),
  rentPeriod: z.string().optional(),
  deposit: z.number().min(0).optional(),
  availableFrom: z.string().optional(),
  description: z.string().max(2000).optional(),
});

export const ScheduleViewingSchema = z.object({
  listingId: z.string().uuid(),
  userId: z.string().uuid(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().regex(/^\d{2}:\d{2}$/),
  message: z.string().max(1000).optional(),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;
export type ScheduleViewingInput = z.infer<typeof ScheduleViewingSchema>;
