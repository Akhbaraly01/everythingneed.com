import { z } from "zod";

export const CreateSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
  group: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

export const UpdateSettingSchema = z.object({
  value: z.unknown(),
});

export const SetUserSettingSchema = z.object({
  userId: z.string().uuid(),
  key: z.string().min(1).max(100),
  value: z.unknown(),
});

export type CreateSettingInput = z.infer<typeof CreateSettingSchema>;
export type UpdateSettingInput = z.infer<typeof UpdateSettingSchema>;
export type SetUserSettingInput = z.infer<typeof SetUserSettingSchema>;
