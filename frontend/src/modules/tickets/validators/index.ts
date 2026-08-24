import { z } from "zod";

export const CreateTicketSchema = z.object({
  userId: z.string().uuid(),
  subject: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  departmentId: z.string().uuid().optional(),
});

export const AddTicketMessageSchema = z.object({
  ticketId: z.string().uuid(),
  senderId: z.string().uuid(),
  message: z.string().min(1).max(5000),
  isInternal: z.boolean().optional(),
});

export const AssignTicketSchema = z.object({
  ticketId: z.string().uuid(),
  assigneeId: z.string().uuid(),
});

export const ResolveTicketSchema = z.object({
  ticketId: z.string().uuid(),
  resolution: z.string().max(2000).optional(),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type AddTicketMessageInput = z.infer<typeof AddTicketMessageSchema>;
export type AssignTicketInput = z.infer<typeof AssignTicketSchema>;
export type ResolveTicketInput = z.infer<typeof ResolveTicketSchema>;
