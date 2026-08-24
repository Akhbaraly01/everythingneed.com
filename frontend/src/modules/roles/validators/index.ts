import { z } from "zod";

export const CreateRoleSchema = z.object({
  name: z.string().min(2).max(50),
  displayName: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const UpdateRoleSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const AssignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  assignedBy: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const RevokeRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;
export type RevokeRoleInput = z.infer<typeof RevokeRoleSchema>;
