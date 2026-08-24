import { z } from "zod";

export const CreateNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.string().min(1),
  relatedId: z.string().uuid().optional(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
