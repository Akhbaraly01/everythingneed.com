import { z } from "zod";

export const AdjustStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int(),
  type: z.enum(["in", "out", "adjustment"]),
  warehouseId: z.string().uuid().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().max(500).optional(),
  performedBy: z.string().uuid().optional(),
});

export const ReserveStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
});

export const ReleaseStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
});

export type AdjustStockInput = z.infer<typeof AdjustStockSchema>;
export type ReserveStockInput = z.infer<typeof ReserveStockSchema>;
export type ReleaseStockInput = z.infer<typeof ReleaseStockSchema>;
