/**
 * Messaging Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Messaging/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { ChatConversation, ChatMessage } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateConversationDTO {
  customerId: string;
  workerId?: string;
  bookingId?: string;
}

export interface SendMessageDTO {
  conversationId: string;
  senderId: string;
  body: string;
  messageType?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateConversationCommand {
  type: "CreateConversation";
  payload: CreateConversationDTO;
}

export interface SendMessageCommand {
  type: "SendMessage";
  payload: SendMessageDTO;
}

export interface MarkAsReadCommand {
  type: "MarkAsRead";
  payload: {
    conversationId: string;
    userId: string;
  };
}

export interface AssignWorkerCommand {
  type: "AssignWorker";
  payload: {
    conversationId: string;
    workerId: string;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetConversationQuery {
  type: "GetConversation";
  payload: { conversationId: string };
}

export interface GetCustomerConversationsQuery {
  type: "GetCustomerConversations";
  payload: {
    customerId: string;
    params?: QueryParams;
  };
}

export interface GetWorkerConversationsQuery {
  type: "GetWorkerConversations";
  payload: {
    workerId: string;
    params?: QueryParams;
  };
}

export interface GetMessagesQuery {
  type: "GetMessages";
  payload: {
    conversationId: string;
    params?: QueryParams;
  };
}

export interface GetUnreadCountQuery {
  type: "GetUnreadCount";
  payload: { userId: string };
}

// ── Application Services ─────────────────────────────────────────

export interface MessagingApplicationService {
  createConversation(command: CreateConversationCommand): Promise<ChatConversation>;
  sendMessage(command: SendMessageCommand): Promise<ChatMessage>;
  markAsRead(command: MarkAsReadCommand): Promise<void>;
  assignWorker(command: AssignWorkerCommand): Promise<void>;

  getConversation(query: GetConversationQuery): Promise<ChatConversation | null>;
  getCustomerConversations(query: GetCustomerConversationsQuery): Promise<PaginatedResult<ChatConversation>>;
  getWorkerConversations(query: GetWorkerConversationsQuery): Promise<PaginatedResult<ChatConversation>>;
  getMessages(query: GetMessagesQuery): Promise<PaginatedResult<ChatMessage>>;
  getUnreadCount(query: GetUnreadCountQuery): Promise<number>;
}
