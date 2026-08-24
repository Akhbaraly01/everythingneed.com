import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { ChatConversationRepository, ChatMessageRepository } from "@core/repositories";
import type { MessagingService } from "../domain";

export const messagingService: MessagingService = {
  async createConversation(data) {
    const conversation = { id: crypto.randomUUID(), ...data, createdAt: new Date(), updatedAt: new Date() } as any;
    eventBus.emit("ConversationCreated", { conversationId: conversation.id, customerId: data.customerId, workerId: data.workerId });
    return conversation;
  },

  async sendMessage(data) {
    const message = { id: crypto.randomUUID(), conversationId: data.conversationId, senderId: data.senderId, message: data.body, messageType: data.messageType || "text", isRead: false, createdAt: new Date() } as any;
    eventBus.emit("MessageSent", { conversationId: data.conversationId, messageId: message.id, senderId: data.senderId });
    return message;
  },

  async getConversationById(conversationId) {
    const repo = resolve<ChatConversationRepository>(TOKENS.ChatConversationRepository);
    return (await repo.findById(conversationId)) as any;
  },

  async getConversationsByCustomerId(customerId, params) {
    const repo = resolve<ChatConversationRepository>(TOKENS.ChatConversationRepository);
    return (await repo.findByCustomerId(customerId, params)) as any;
  },

  async getConversationsByWorkerId(workerId, params) {
    const repo = resolve<ChatConversationRepository>(TOKENS.ChatConversationRepository);
    return (await repo.findByWorkerId(workerId, params)) as any;
  },

  async getMessages(conversationId, params) {
    const repo = resolve<ChatMessageRepository>(TOKENS.ChatMessageRepository);
    return (await repo.findByConversationId(conversationId, params)) as any;
  },

  async markAsRead(conversationId, userId) {
    return;
  },

  async getUnreadCount(userId) {
    return 0;
  },

  async assignWorker(conversationId, workerId) {
    eventBus.emit("WorkerAssigned", { conversationId, workerId, timestamp: new Date() });
  },
};
