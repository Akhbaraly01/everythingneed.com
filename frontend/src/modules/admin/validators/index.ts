import { z } from "zod";

export const LogAdminActionSchema = z.object({
  adminId: z.string().uuid(),
  action: z.string().min(1),
  targetType: z.string().min(1),
  targetId: z.string().uuid().optional(),
  description: z.string().min(1).max(2000),
  metadata: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export type LogAdminActionInput = z.infer<typeof LogAdminActionSchema>;
