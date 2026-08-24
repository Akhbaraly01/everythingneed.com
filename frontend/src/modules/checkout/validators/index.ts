import { z } from "zod";

export const AddToCartSchema = z.object({
  userId: z.string().uuid(),
  productId: z.string().uuid(),
  productName: z.string().min(1).max(200),
  productImage: z.string().url().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  options: z.record(z.string()).optional(),
});

export const RemoveFromCartSchema = z.object({
  cartId: z.string().uuid(),
  productId: z.string().uuid(),
});

export const UpdateCartItemSchema = z.object({
  cartId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const ApplyCouponSchema = z.object({
  cartId: z.string().uuid(),
  couponCode: z.string().min(1).max(50),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type RemoveFromCartInput = z.infer<typeof RemoveFromCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type ApplyCouponInput = z.infer<typeof ApplyCouponSchema>;
