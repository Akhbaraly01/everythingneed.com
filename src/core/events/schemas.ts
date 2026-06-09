/**
 * Runtime (zod) schemas for DomainEventMap.
 *
 * Source of truth: keep keys in sync with `DomainEventMap` in EventBus.ts.
 * Used by `scripts/check-event-contracts.mjs` to assert the two stay aligned
 * before build, and (optionally) by emitters in dev to validate payloads.
 */
import { z } from "zod";

export const domainEventSchemas = {
  OrderCreated: z.object({
    orderId: z.string(),
    userId: z.string(),
    total: z.number(),
    currency: z.string(),
  }),
  OrderCancelled: z.object({ orderId: z.string(), reason: z.string().optional() }),

  PaymentCompleted: z.object({
    orderId: z.string(),
    paymentId: z.string(),
    amount: z.number(),
  }),
  PaymentFailed: z.object({ orderId: z.string(), reason: z.string() }),

  DeliveryCreated: z.object({ orderId: z.string(), deliveryId: z.string() }),
  DeliveryStatusChanged: z.object({ deliveryId: z.string(), status: z.string() }),

  WalletDebited: z.object({
    userId: z.string(),
    amount: z.number(),
    reference: z.string(),
  }),
  WalletCredited: z.object({
    userId: z.string(),
    amount: z.number(),
    reference: z.string(),
  }),

  AppointmentBooked: z.object({
    ticketId: z.string(),
    doctorId: z.string().nullable(),
    userId: z.string(),
  }),
  AppointmentCancelled: z.object({ ticketId: z.string() }),

  NotificationRequested: z.object({
    userId: z.string(),
    channel: z.enum(["email", "push", "in_app", "sms"]),
    template: z.string(),
    data: z.record(z.unknown()),
  }),

  UserSignedIn: z.object({ userId: z.string() }),
  UserSignedOut: z.object({ userId: z.string() }),
} as const;

export type DomainEventName = keyof typeof domainEventSchemas;
