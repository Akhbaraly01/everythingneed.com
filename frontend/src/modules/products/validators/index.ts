import { z } from "zod";

export const CreateProductSchema = z.object({
  vendorId: z.string().uuid(),
  name: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  category: z.string().min(1),
  subcategory: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  stockQuantity: z.number().int().min(0),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const CreateReviewSchema = z.object({
  productId: z.string().uuid(),
  userId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
