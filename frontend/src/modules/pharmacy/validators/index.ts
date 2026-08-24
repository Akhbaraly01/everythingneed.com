import { z } from "zod";

export const CreateMedicineSchema = z.object({
  name: z.string().min(2).max(200),
  genericName: z.string().max(200).optional(),
  category: z.string().min(1),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  requiresPrescription: z.boolean(),
  stockQuantity: z.number().int().min(0),
});

export const CreateMedicineOrderSchema = z.object({
  userId: z.string().uuid(),
  deliveryAddress: z.string().min(1),
  prescriptionUrl: z.string().url().optional(),
  items: z.array(z.object({
    medicineId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
});

export type CreateMedicineInput = z.infer<typeof CreateMedicineSchema>;
export type CreateMedicineOrderInput = z.infer<typeof CreateMedicineOrderSchema>;
