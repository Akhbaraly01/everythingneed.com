import { z } from "zod";

export const CreateDealSchema = z.object({
  vendorId: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  dealType: z.enum(["percentage", "fixed", "bogo", "free_shipping", "bundle"]),
  discountValue: z.number().positive(),
  minimumPurchase: z.number().min(0).optional(),
  maximumDiscount: z.number().min(0).optional(),
  applicableCategories: z.array(z.string()).optional(),
  applicableProducts: z.array(z.string()).optional(),
  usageLimit: z.number().int().positive().optional(),
  startsAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const ApplyCouponSchema = z.object({
  code: z.string().min(1),
  userId: z.string().uuid(),
  purchaseAmount: z.number().positive(),
  categories: z.array(z.string()).optional(),
});

export type CreateDealInput = z.infer<typeof CreateDealSchema>;
export type ApplyCouponInput = z.infer<typeof ApplyCouponSchema>;
