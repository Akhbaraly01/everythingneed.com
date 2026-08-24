import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { BookingRepository } from "@core/repositories";
import type { BookingService } from "../domain";

export const bookingService: BookingService = {
  async create(data) {
    const booking = { id: crypto.randomUUID(), ...data, status: "pending", createdAt: new Date(), updatedAt: new Date() } as any;
    eventBus.emit("BookingCreated", { bookingId: booking.id, userId: data.userId, serviceType: data.serviceType });
    return booking;
  },

  async confirm(bookingId) {
    eventBus.emit("BookingConfirmed", { bookingId });
  },

  async complete(bookingId) {
    eventBus.emit("BookingCompleted", { bookingId });
  },

  async cancel(bookingId, reason) {
    eventBus.emit("BookingCancelled", { bookingId, reason });
  },

  async getById(bookingId) {
    const repo = resolve<BookingRepository>(TOKENS.BookingRepository);
    return repo.findById(bookingId) as any;
  },

  async getByUserId(userId, params) {
    const repo = resolve<BookingRepository>(TOKENS.BookingRepository);
    return repo.findByUserId(userId, params) as any;
  },

  async getByServiceType(serviceType, params) {
    const repo = resolve<BookingRepository>(TOKENS.BookingRepository);
    return repo.findByServiceType(serviceType, params) as any;
  },
};
