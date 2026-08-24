/**
 * Notifications Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Notifications/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface NotificationId {
  value: string;
}

export interface NotificationType {
  value: string;
}

export interface NotificationChannel {
  value: "email" | "push" | "in_app" | "sms";
}

// ── Entities ─────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface NotificationCreatedEvent {
  type: "NotificationCreated";
  notificationId: string;
  userId: string;
  title: string;
  notificationType: string;
  timestamp: Date;
}

export interface NotificationReadEvent {
  type: "NotificationRead";
  notificationId: string;
  userId: string;
  timestamp: Date;
}

export interface NotificationSentEvent {
  type: "NotificationSent";
  notificationId: string;
  userId: string;
  channel: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface NotificationService {
  create(data: {
    userId: string;
    title: string;
  message: string;
    type: string;
    relatedId?: string;
  }): Promise<Notification>;

  markAsRead(notificationId: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;

  getById(notificationId: string): Promise<Notification | null>;
  getByUserId(userId: string, params?: any): Promise<{ items: Notification[]; total: number }>;
  getUnreadByUserId(userId: string): Promise<Notification[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class NotificationNotFoundError extends DomainError {
  constructor(notificationId: string) {
    super(`Notification ${notificationId} not found`, "NOTIFICATION_NOT_FOUND");
    this.name = "NotificationNotFoundError";
  }
}

export class NotificationDeliveryError extends DomainError {
  constructor(message: string) {
    super(message, "NOTIFICATION_DELIVERY_ERROR");
    this.name = "NotificationDeliveryError";
  }
}
