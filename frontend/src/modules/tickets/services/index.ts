import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { TicketService } from "../domain";

export const ticketService: TicketService = {
  async create(data) {
    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}`;
    const repo = resolve<any>(TOKENS.TicketRepository);
    const ticket = await repo.create({
      user_id: data.userId,
      subject: data.subject,
      description: data.description,
      priority: data.priority,
      department_id: data.departmentId || null,
      ticket_number: ticketNumber,
      status: "open",
    } as any);
    eventBus.emit("TicketCreated", { ticketId: ticket.id, ticketNumber, userId: data.userId, priority: data.priority });
    return ticket;
  },

  async assign(ticketId, assigneeId) {
    eventBus.emit("TicketAssigned", { ticketId, assigneeId });
  },

  async updateStatus(ticketId, status) {
    eventBus.emit("TicketStatusChanged", { ticketId, oldStatus: "open", newStatus: status });
  },

  async resolve(ticketId, resolution) {
    eventBus.emit("TicketResolved", { ticketId, resolution });
  },

  async close(ticketId) {
    eventBus.emit("TicketStatusChanged", { ticketId, oldStatus: "open", newStatus: "closed" });
  },

  async addMessage(data) {
    const repo = resolve<any>(TOKENS.TicketMessageRepository);
    const message = await repo.create({ ...data, is_internal: data.isInternal || false } as any);
    eventBus.emit("MessageSent", { conversationId: data.ticketId, messageId: message.id, senderId: data.senderId });
    return message;
  },

  async getById(ticketId) {
    const repo = resolve<any>(TOKENS.TicketRepository);
    return repo.findById(ticketId);
  },

  async getByTicketNumber(ticketNumber) {
    const repo = resolve<any>(TOKENS.TicketRepository);
    return repo.findByTicketNumber(ticketNumber);
  },

  async getByUserId(userId, params) {
    const repo = resolve<any>(TOKENS.TicketRepository);
    return repo.findByUserId(userId, params);
  },

  async getByAssignee(assigneeId, params) {
    const repo = resolve<any>(TOKENS.TicketRepository);
    return repo.findByAssignee(assigneeId, params);
  },

  async getMessages(ticketId, params) {
    const repo = resolve<any>(TOKENS.TicketMessageRepository);
    return repo.findByTicketId(ticketId, params);
  },

  async getDepartmentById(departmentId) {
    const repo = resolve<any>(TOKENS.DepartmentRepository);
    return repo.findById(departmentId);
  },

  async getAllDepartments() {
    const repo = resolve<any>(TOKENS.DepartmentRepository);
    const result = await repo.findMany();
    return result.items;
  },
};
