import { z } from "zod";

export const CreateStoreSchema = z.object({
  vendorId: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().max(2000).optional(),
  categoryId: z.string().uuid().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

export const UpdateStoreSchema = CreateStoreSchema.partial().omit({ vendorId: true });

export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;
export type UpdateStoreInput = z.infer<typeof UpdateStoreSchema>;
