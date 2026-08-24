import { z } from "zod";

export const CreateCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  icon: z.string().optional(),
  imageUrl: z.string().url().optional(),
  parentId: z.string().uuid().optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const ReorderCategorySchema = z.object({
  categoryId: z.string().uuid(),
  newSortOrder: z.number().int().min(0),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type ReorderCategoryInput = z.infer<typeof ReorderCategorySchema>;
