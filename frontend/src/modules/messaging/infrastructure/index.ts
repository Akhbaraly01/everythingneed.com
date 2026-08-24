/**
 * Messaging Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Messaging/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  ChatConversation,
  ChatConversationInsert,
  ChatConversationUpdate,
  ChatMessage,
  ChatMessageInsert,
  ChatMessageUpdate,
  Notification,
  NotificationInsert,
  NotificationUpdate,
} from "@core/api/types";
import type {
  ChatConversationRepository,
  ChatMessageRepository,
  NotificationRepository,
} from "@core/repositories";

// ── Chat Conversation Repository ─────────────────────────────────

export class ChatConversationRepositoryImpl
  extends BaseRepository<ChatConversation, ChatConversationInsert, ChatConversationUpdate>
  implements ChatConversationRepository
{
  get TableName(): string {
    return "chat_conversations";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByCustomerId(customerId: string, params?: QueryParams): Promise<PaginatedResult<ChatConversation>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "customer_id", operator: "=", value: customerId },
      ],
    });
  }

  async findByWorkerId(workerId: string, params?: QueryParams): Promise<PaginatedResult<ChatConversation>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "worker_id", operator: "=", value: workerId },
      ],
    });
  }

  async findByBookingId(bookingId: string): Promise<ChatConversation | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("booking_id", "=", bookingId)
      .single();
    return (result as ChatConversation) || null;
  }
}

// ── Chat Message Repository ──────────────────────────────────────

export class ChatMessageRepositoryImpl
  extends BaseRepository<ChatMessage, ChatMessageInsert, ChatMessageUpdate>
  implements ChatMessageRepository
{
  get TableName(): string {
    return "chat_messages";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByConversationId(conversationId: string, params?: QueryParams): Promise<PaginatedResult<ChatMessage>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "conversation_id", operator: "=", value: conversationId },
      ],
      sort: [{ field: "created_at", direction: "asc" }],
    });
  }

  async markAsRead(conversationId: string, userId: string): Promise<boolean> {
    const messages = await this.findByConversationId(conversationId);
    for (const msg of messages.items) {
      if (msg.sender_id !== userId && !msg.is_read) {
        await this.update(msg.id, { is_read: true });
      }
    }
    return true;
  }

  async countUnread(userId: string): Promise<number> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("sender_id", "!=", userId)
      .where("is_read", "=", false);
    return Array.isArray(result) ? result.length : 0;
  }
}

// ── Notification Repository ──────────────────────────────────────

export class NotificationRepositoryImpl
  extends BaseRepository<Notification, NotificationInsert, NotificationUpdate>
  implements NotificationRepository
{
  get TableName(): string {
    return "notifications";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Notification>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "user_id", operator: "=", value: userId },
      ],
    });
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .where("is_read", "=", false)
      .orderBy("created_at", false);
    return (result as Notification[]) || [];
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.update(id, { is_read: true });
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    const unread = await this.findUnreadByUserId(userId);
    for (const n of unread) {
      await this.update(n.id, { is_read: true });
    }
    return true;
  }

  async countUnread(userId: string): Promise<number> {
    const unread = await this.findUnreadByUserId(userId);
    return unread.length;
  }
}
