import { z } from "zod";

export const CreateConversationSchema = z.object({
  customerId: z.string().uuid(),
  workerId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
});

export const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  messageType: z.enum(["text", "image", "file", "system"]).optional(),
});

export const AssignWorkerSchema = z.object({
  conversationId: z.string().uuid(),
  workerId: z.string().uuid(),
});

export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type AssignWorkerInput = z.infer<typeof AssignWorkerSchema>;
