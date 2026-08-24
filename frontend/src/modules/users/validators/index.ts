import { z } from "zod";

export const UpdateUserProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/).optional(),
  avatarUrl: z.string().url().optional(),
});

export const AssignRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.string().min(1),
  categoryId: z.string().uuid().optional(),
});

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;
export type AssignRoleInput = z.infer<typeof AssignRoleSchema>;
