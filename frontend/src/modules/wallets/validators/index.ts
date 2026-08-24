import { z } from "zod";

export const TopUpWalletSchema = z.object({
  walletId: z.string().uuid(),
  amount: z.number().positive(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  description: z.string().max(500).optional(),
});

export const DebitWalletSchema = z.object({
  walletId: z.string().uuid(),
  amount: z.number().positive(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  description: z.string().max(500).optional(),
});

export const TransferWalletSchema = z.object({
  sourceWalletId: z.string().uuid(),
  destinationWalletId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
});

export type TopUpWalletInput = z.infer<typeof TopUpWalletSchema>;
export type DebitWalletInput = z.infer<typeof DebitWalletSchema>;
export type TransferWalletInput = z.infer<typeof TransferWalletSchema>;
