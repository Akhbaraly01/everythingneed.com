/**
 * Messaging Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Messaging/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface ConversationId {
  value: string;
}

export interface MessageId {
  value: string;
}

export interface MessageType {
  value: "text" | "image" | "file" | "system";
}

// ── Entities ─────────────────────────────────────────────────────

export interface ChatConversation {
  id: string;
  customerId: string;
  workerId?: string;
  bookingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  message: string;
  messageType: string;
  isRead: boolean;
  createdAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface ConversationCreatedEvent {
  type: "ConversationCreated";
  conversationId: string;
  customerId: string;
  workerId?: string;
  timestamp: Date;
}

export interface MessageSentEvent {
  type: "MessageSent";
  conversationId: string;
  messageId: string;
  senderId: string;
  timestamp: Date;
}

export interface MessageReadEvent {
  type: "MessageRead";
  conversationId: string;
  messageId: string;
  userId: string;
  timestamp: Date;
}

export interface WorkerAssignedEvent {
  type: "WorkerAssigned";
  conversationId: string;
  workerId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface MessagingService {
  createConversation(data: {
    customerId: string;
    workerId?: string;
    bookingId?: string;
  }): Promise<ChatConversation>;

  sendMessage(data: {
    conversationId: string;
    senderId: string;
    body: string;
    messageType?: string;
  }): Promise<ChatMessage>;

  getConversationById(conversationId: string): Promise<ChatConversation | null>;
  getConversationsByCustomerId(customerId: string, params?: any): Promise<{ items: ChatConversation[]; total: number }>;
  getConversationsByWorkerId(workerId: string, params?: any): Promise<{ items: ChatConversation[]; total: number }>;
  getMessages(conversationId: string, params?: any): Promise<{ items: ChatMessage[]; total: number }>;

  markAsRead(conversationId: string, userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  assignWorker(conversationId: string, workerId: string): Promise<void>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class ConversationNotFoundError extends DomainError {
  constructor(conversationId: string) {
    super(`Conversation ${conversationId} not found`, "CONVERSATION_NOT_FOUND");
    this.name = "ConversationNotFoundError";
  }
}

export class MessageDeliveryError extends DomainError {
  constructor(message: string) {
    super(message, "MESSAGE_DELIVERY_ERROR");
    this.name = "MessageDeliveryError";
  }
}

export class UnauthorizedMessageAccessError extends DomainError {
  constructor(userId: string, conversationId: string) {
    super(`User ${userId} is not authorized to access conversation ${conversationId}`, "UNAUTHORIZED_MESSAGE_ACCESS");
    this.name = "UnauthorizedMessageAccessError";
  }
}
