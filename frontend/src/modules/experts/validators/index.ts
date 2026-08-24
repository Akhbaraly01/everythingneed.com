import { z } from "zod";

export const RegisterExpertSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(2).max(100),
  specialization: z.string().min(1).max(100),
  expertise: z.array(z.string()).min(1),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  hourlyRate: z.number().positive().optional(),
});

export const AddExpertReviewSchema = z.object({
  expertId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const AddToWishlistSchema = z.object({
  userId: z.string().uuid(),
  expertId: z.string().uuid(),
});

export type RegisterExpertInput = z.infer<typeof RegisterExpertSchema>;
export type AddExpertReviewInput = z.infer<typeof AddExpertReviewSchema>;
export type AddToWishlistInput = z.infer<typeof AddToWishlistSchema>;
