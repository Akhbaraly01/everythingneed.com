import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { BuildingServiceBookingRepository, ServiceWorkerRepository } from "@core/repositories";
import type { BuildingServicesService } from "../domain";

export const buildingServicesService: BuildingServicesService = {
  async registerWorker(data) {
    const worker = { id: crypto.randomUUID(), ...data, isAvailable: true, completedJobs: 0, createdAt: new Date(), updatedAt: new Date() } as any;
    eventBus.emit("ServiceWorkerRegistered", { workerId: worker.id, userId: data.userId, workerType: data.workerType });
    return worker;
  },

  async updateWorker(workerId, data) {
    return { id: workerId, ...data } as any;
  },

  async getWorkerById(workerId) {
    const repo = resolve<ServiceWorkerRepository>(TOKENS.ServiceWorkerRepository);
    return repo.findById(workerId) as any;
  },

  async getWorkerByUserId(userId) {
    const repo = resolve<ServiceWorkerRepository>(TOKENS.ServiceWorkerRepository);
    return repo.findByUserId(userId) as any;
  },

  async getWorkersByType(workerType, params) {
    const repo = resolve<ServiceWorkerRepository>(TOKENS.ServiceWorkerRepository);
    return repo.findByWorkerType(workerType, params) as any;
  },

  async getAvailableWorkers(params) {
    const repo = resolve<ServiceWorkerRepository>(TOKENS.ServiceWorkerRepository);
    return repo.findAvailable(params) as any;
  },

  async updateWorkerAvailability(workerId, isAvailable) {
    const repo = resolve<ServiceWorkerRepository>(TOKENS.ServiceWorkerRepository);
    await repo.updateAvailability(workerId, isAvailable);
    eventBus.emit("WorkerAvailabilityChanged", { workerId, isAvailable });
  },

  async createBooking(data) {
    const booking = { id: crypto.randomUUID(), ...data, status: "pending", createdAt: new Date(), updatedAt: new Date() } as any;
    eventBus.emit("ServiceBookingCreated", { bookingId: booking.id, userId: data.userId, workerType: data.workerType });
    return booking;
  },

  async updateBooking(bookingId, data) {
    return { id: bookingId, ...data } as any;
  },

  async cancelBooking(bookingId) {
    return;
  },

  async getBookingById(bookingId) {
    const repo = resolve<BuildingServiceBookingRepository>(TOKENS.BuildingServiceBookingRepository);
    return repo.findById(bookingId) as any;
  },

  async getBookingsByUserId(userId, params) {
    const repo = resolve<BuildingServiceBookingRepository>(TOKENS.BuildingServiceBookingRepository);
    return repo.findByUserId(userId, params) as any;
  },

  async getBookingsByWorkerType(workerType, params) {
    const repo = resolve<BuildingServiceBookingRepository>(TOKENS.BuildingServiceBookingRepository);
    return repo.findByWorkerType(workerType, params) as any;
  },

  async registerDeliveryManager(data) {
    const manager = { id: crypto.randomUUID(), ...data, isAvailable: true, completedDeliveries: 0, createdAt: new Date(), updatedAt: new Date() } as any;
    return manager;
  },

  async getDeliveryManagerById(managerId) {
    return null;
  },

  async getAvailableDeliveryManagers(params) {
    return { items: [], total: 0 };
  },
};
