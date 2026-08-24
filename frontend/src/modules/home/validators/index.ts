import { z } from "zod";

export const GetHomepageDataSchema = z.object({
  userId: z.string().uuid().optional(),
});

export type GetHomepageDataInput = z.infer<typeof GetHomepageDataSchema>;
