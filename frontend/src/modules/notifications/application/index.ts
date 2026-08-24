/**
 * Notifications Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Notifications/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Notification } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateNotificationDTO {
  userId: string;
  title: string;
  message: string;
  type: string;
  relatedId?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateNotificationCommand {
  type: "CreateNotification";
  payload: CreateNotificationDTO;
}

export interface MarkAsReadCommand {
  type: "MarkAsRead";
  payload: { notificationId: string };
}

export interface MarkAllAsReadCommand {
  type: "MarkAllAsRead";
  payload: { userId: string };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetNotificationQuery {
  type: "GetNotification";
  payload: { notificationId: string };
}

export interface GetUserNotificationsQuery {
  type: "GetUserNotifications";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetUnreadNotificationsQuery {
  type: "GetUnreadNotifications";
  payload: { userId: string };
}

export interface GetUnreadCountQuery {
  type: "GetUnreadCount";
  payload: { userId: string };
}

// ── Application Services ─────────────────────────────────────────

export interface NotificationApplicationService {
  createNotification(command: CreateNotificationCommand): Promise<Notification>;
  markAsRead(command: MarkAsReadCommand): Promise<Notification>;
  markAllAsRead(command: MarkAllAsReadCommand): Promise<void>;

  getNotification(query: GetNotificationQuery): Promise<Notification | null>;
  getUserNotifications(query: GetUserNotificationsQuery): Promise<PaginatedResult<Notification>>;
  getUnreadNotifications(query: GetUnreadNotificationsQuery): Promise<Notification[]>;
  getUnreadCount(query: GetUnreadCountQuery): Promise<number>;
}
