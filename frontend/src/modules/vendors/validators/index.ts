import { z } from "zod";

export const RegisterVendorSchema = z.object({
  userId: z.string().uuid(),
  storeName: z.string().min(2).max(100),
  category: z.string().min(1),
  description: z.string().max(2000).optional(),
});

export const UpdateVendorProfileSchema = z.object({
  storeName: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().min(1).optional(),
});

export const UpdateVendorSettingsSchema = z.object({
  commissionRate: z.number().min(0).max(100).optional(),
  minPayoutAmount: z.number().positive().optional(),
  payoutFrequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  autoPayoutEnabled: z.boolean().optional(),
});

export type RegisterVendorInput = z.infer<typeof RegisterVendorSchema>;
export type UpdateVendorProfileInput = z.infer<typeof UpdateVendorProfileSchema>;
export type UpdateVendorSettingsInput = z.infer<typeof UpdateVendorSettingsSchema>;
