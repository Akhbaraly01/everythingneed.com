import { z } from "zod";

export const CreatePlanSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  currency: z.string().length(3),
  billingInterval: z.enum(["monthly", "yearly", "weekly"]),
  features: z.array(z.string()).min(1),
});

export const UpdatePlanSchema = CreatePlanSchema.partial();

export const SubscribeSchema = z.object({
  userId: z.string().uuid(),
  planId: z.string().uuid(),
});

export const CancelSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;
export type SubscribeInput = z.infer<typeof SubscribeSchema>;
export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionSchema>;
