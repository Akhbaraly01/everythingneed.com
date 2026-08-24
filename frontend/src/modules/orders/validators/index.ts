import { z } from "zod";

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

export const CreateVendorOrderSchema = z.object({
  vendorId: z.string().uuid(),
  customerId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  productName: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  shippingAddress: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
  estimatedDelivery: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

export const AddTrackingSchema = z.object({
  orderId: z.string().uuid(),
  status: z.string().min(1),
  statusMessage: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

export type CreateMedicineOrderInput = z.infer<typeof CreateMedicineOrderSchema>;
export type CreateVendorOrderInput = z.infer<typeof CreateVendorOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type AddTrackingInput = z.infer<typeof AddTrackingSchema>;
