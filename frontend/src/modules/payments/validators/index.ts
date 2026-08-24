import { z } from "zod";

export const InitiatePaymentSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  method: z.enum(["card", "bank_transfer", "wallet", "cash_on_delivery"]),
  reference: z.string().min(1),
});

export const InitiateRefundSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

export const CreditWalletSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  reference: z.string().min(1),
  description: z.string().max(500).optional(),
});

export const DebitWalletSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  reference: z.string().min(1),
  description: z.string().max(500).optional(),
});

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentSchema>;
export type InitiateRefundInput = z.infer<typeof InitiateRefundSchema>;
export type CreditWalletInput = z.infer<typeof CreditWalletSchema>;
export type DebitWalletInput = z.infer<typeof DebitWalletSchema>;
