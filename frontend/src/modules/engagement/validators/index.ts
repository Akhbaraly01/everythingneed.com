import { z } from "zod";

export const FavoriteSchema = z.object({
  userId: z.string().uuid(),
  targetType: z.enum(["product", "service", "vendor", "hotel", "listing", "course", "expert"]),
  targetId: z.string().uuid(),
});

export const RecordViewSchema = z.object({
  userId: z.string().uuid(),
  targetType: z.enum(["product", "service", "vendor", "hotel", "listing", "course", "expert"]),
  targetId: z.string().uuid(),
});

export const AddToWishlistSchema = z.object({
  userId: z.string().uuid(),
  wishlistId: z.string().uuid(),
  targetId: z.string().uuid(),
});

export type FavoriteInput = z.infer<typeof FavoriteSchema>;
export type RecordViewInput = z.infer<typeof RecordViewSchema>;
export type AddToWishlistInput = z.infer<typeof AddToWishlistSchema>;
