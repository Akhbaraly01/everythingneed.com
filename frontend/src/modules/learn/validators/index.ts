import { z } from "zod";

export const CreatePostSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(2).max(200),
  content: z.string().min(10).max(10000),
  category: z.string().min(1),
  mediaType: z.enum(["text", "image", "video", "audio", "document"]).optional(),
  mediaUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  durationMinutes: z.number().int().positive().optional(),
});

export const UpdatePostSchema = CreatePostSchema.omit({ userId: true }).partial();

export const SendDirectMessageSchema = z.object({
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  postId: z.string().uuid().optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
export type SendDirectMessageInput = z.infer<typeof SendDirectMessageSchema>;
