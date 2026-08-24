import { z } from "zod";

export const CreateShipmentSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  carrierId: z.string().uuid().optional(),
  shippingMethod: z.string().optional(),
  shippingCost: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  destinationAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    postalCode: z.string().min(1),
  }),
  estimatedDelivery: z.string().datetime().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const UpdateTrackingSchema = z.object({
  status: z.string().min(1),
  location: z.string().optional(),
  description: z.string().max(500).optional(),
  carrier: z.string().optional(),
});

export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;
export type UpdateTrackingInput = z.infer<typeof UpdateTrackingSchema>;
