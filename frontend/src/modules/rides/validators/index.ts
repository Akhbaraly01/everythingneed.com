import { z } from "zod";

export const RequestRideSchema = z.object({
  riderId: z.string().uuid(),
  rideType: z.enum(["economy", "comfort", "premium", "pool"]),
  pickupLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  dropoffLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
});

export const AcceptRideSchema = z.object({
  rideId: z.string().uuid(),
  driverId: z.string().uuid(),
});

export const CompleteRideSchema = z.object({
  rideId: z.string().uuid(),
  fare: z.number().min(0).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  tip: z.number().min(0).optional(),
});

export const CancelRideSchema = z.object({
  rideId: z.string().uuid(),
  cancelledBy: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type RequestRideInput = z.infer<typeof RequestRideSchema>;
export type AcceptRideInput = z.infer<typeof AcceptRideSchema>;
export type CompleteRideInput = z.infer<typeof CompleteRideSchema>;
export type CancelRideInput = z.infer<typeof CancelRideSchema>;
