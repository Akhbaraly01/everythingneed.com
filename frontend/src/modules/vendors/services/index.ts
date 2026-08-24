import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { VendorRepository } from "@core/repositories";
import type { VendorService } from "../domain";

export const vendorService: VendorService = {
  async register(data) {
    const repo = resolve<VendorRepository>(TOKENS.VendorRepository);
    const vendor = (await repo.create({ ...data, isVerified: false } as any)) as any;
    eventBus.emit("VendorRegistered", { vendorId: vendor.id, userId: data.userId, storeName: data.storeName });
    return vendor;
  },

  async verify(vendorId) {
    const repo = resolve<VendorRepository>(TOKENS.VendorRepository);
    await repo.update(vendorId, { isVerified: true } as any);
    eventBus.emit("VendorVerified", { vendorId });
  },

  async suspend(vendorId, reason) {
    const repo = resolve<VendorRepository>(TOKENS.VendorRepository);
    await repo.update(vendorId, { isVerified: false } as any);
    eventBus.emit("VendorSuspended", { vendorId, reason });
  },

  async updateProfile(vendorId, data) {
    const repo = resolve<VendorRepository>(TOKENS.VendorRepository);
    const result = await repo.update(vendorId, data as any);
    return result as any;
  },

  async updateSettings(vendorId, data) {
    return data as any;
  },

  async getById(vendorId) {
    const repo = resolve<VendorRepository>(TOKENS.VendorRepository);
    return (await repo.findById(vendorId)) as any;
  },

  async getByUserId(userId) {
    const repo = resolve<VendorRepository>(TOKENS.VendorRepository);
    return (await repo.findByUserId(userId)) as any;
  },

  async getByCategory(category, params) {
    const repo = resolve<VendorRepository>(TOKENS.VendorRepository);
    return (await repo.findByCategory(category, params)) as any;
  },

  async getVerified(params) {
    const repo = resolve<VendorRepository>(TOKENS.VendorRepository);
    return (await repo.findVerified(params)) as any;
  },

  async search(query) {
    const repo = resolve<VendorRepository>(TOKENS.VendorRepository);
    return (await repo.search(query)) as any;
  },
};
