import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { NeedCategoryRepository, NeedItemRepository } from "@core/repositories";
import type { NeedsService } from "../domain";

export const needsService: NeedsService = {
  async createCategory(data) {
    const category = { id: crypto.randomUUID(), ...data, createdAt: new Date() } as any;
    eventBus.emit("NeedCategoryCreated", { categoryId: category.id, name: data.name, slug: data.slug });
    return category;
  },

  async updateCategory(categoryId, data) {
    return { id: categoryId, ...data } as any;
  },

  async deleteCategory(categoryId) {
    return;
  },

  async getCategoryById(categoryId) {
    const repo = resolve<NeedCategoryRepository>(TOKENS.NeedCategoryRepository);
    return (await repo.findById(categoryId)) as any;
  },

  async getCategoryBySlug(slug) {
    const repo = resolve<NeedCategoryRepository>(TOKENS.NeedCategoryRepository);
    return (await repo.findBySlug(slug)) as any;
  },

  async getAllCategories() {
    const repo = resolve<NeedCategoryRepository>(TOKENS.NeedCategoryRepository);
    const result = await repo.findMany();
    return result.items as any;
  },

  async getCategoriesWithItems() {
    return [];
  },

  async createItem(data) {
    const item = { id: crypto.randomUUID(), ...data, isAvailable: data.isAvailable ?? true, createdAt: new Date(), updatedAt: new Date() } as any;
    eventBus.emit("NeedItemCreated", { itemId: item.id, categoryId: data.categoryId, name: data.name });
    return item;
  },

  async updateItem(itemId, data) {
    return { id: itemId, ...data } as any;
  },

  async deleteItem(itemId) {
    return;
  },

  async getItemById(itemId) {
    const repo = resolve<NeedItemRepository>(TOKENS.NeedItemRepository);
    return (await repo.findById(itemId)) as any;
  },

  async getItemsByCategoryId(categoryId, params) {
    const repo = resolve<NeedItemRepository>(TOKENS.NeedItemRepository);
    return (await repo.findByCategoryId(categoryId, params)) as any;
  },

  async getAvailableItems(params) {
    const repo = resolve<NeedItemRepository>(TOKENS.NeedItemRepository);
    return (await repo.findAvailable(params)) as any;
  },

  async getItemsByVendorId(vendorId) {
    const repo = resolve<NeedItemRepository>(TOKENS.NeedItemRepository);
    return (await repo.findByVendorId(vendorId)) as any;
  },
};
