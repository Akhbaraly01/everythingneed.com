import { z } from "zod";

export const LeaveReviewSchema = z.object({
  userId: z.string().uuid(),
  targetType: z.enum(["product", "service", "vendor", "hotel", "restaurant", "expert"]),
  targetId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
  images: z.array(z.string().url()).optional(),
});

export const EditReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
  images: z.array(z.string().url()).optional(),
});

export const FlagReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reportedBy: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type LeaveReviewInput = z.infer<typeof LeaveReviewSchema>;
export type EditReviewInput = z.infer<typeof EditReviewSchema>;
export type FlagReviewInput = z.infer<typeof FlagReviewSchema>;
