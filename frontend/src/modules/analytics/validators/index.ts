import { z } from "zod";

export const TrackEventSchema = z.object({
  eventType: z.string().min(1),
  userId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  payload: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});

export const GenerateReportSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.string().min(1),
  filters: z.record(z.unknown()).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }).optional(),
});

export type TrackEventInput = z.infer<typeof TrackEventSchema>;
export type GenerateReportInput = z.infer<typeof GenerateReportSchema>;
