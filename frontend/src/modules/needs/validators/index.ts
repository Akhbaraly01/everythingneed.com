import { z } from "zod";

export const CreateNeedCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  icon: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  sortOrder: z.number().int().min(0),
});

export const CreateNeedItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  price: z.number().min(0).optional(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().optional(),
  vendorId: z.string().uuid().optional(),
});

export type CreateNeedCategoryInput = z.infer<typeof CreateNeedCategorySchema>;
export type CreateNeedItemInput = z.infer<typeof CreateNeedItemSchema>;
