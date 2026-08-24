import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { ProductService } from "../domain";

export const productService: ProductService = {
  async create(data) {
    const repo = resolve<any>(TOKENS.ProductRepository);
    const product = await repo.create({ ...data, is_active: true, stock_quantity: data.stockQuantity } as any);
    eventBus.emit("ProductCreated", { productId: product.id, vendorId: data.vendorId, name: data.name, price: data.price });
    return product;
  },

  async update(productId, data) {
    const repo = resolve<any>(TOKENS.ProductRepository);
    const product = await repo.update(productId, data as any);
    eventBus.emit("ProductUpdated", { productId, changes: data as Record<string, unknown> });
    return product;
  },

  async delete(productId) {
    const repo = resolve<any>(TOKENS.ProductRepository);
    await repo.delete(productId);
    eventBus.emit("ProductDeleted", { productId });
  },

  async getById(productId) {
    const repo = resolve<any>(TOKENS.ProductRepository);
    return repo.findById(productId);
  },

  async getByVendorId(vendorId, params) {
    const repo = resolve<any>(TOKENS.ProductRepository);
    return repo.findByVendorId(vendorId, params);
  },

  async getByCategory(category, params) {
    const repo = resolve<any>(TOKENS.ProductRepository);
    return repo.findByCategory(category, params);
  },

  async getActive(params) {
    const repo = resolve<any>(TOKENS.ProductRepository);
    return repo.findActive(params);
  },

  async search(query, params) {
    const repo = resolve<any>(TOKENS.ProductRepository);
    return repo.search(query, params);
  },

  async updateStock(productId, quantityChange) {
    const repo = resolve<any>(TOKENS.ProductRepository);
    const product = await repo.findById(productId);
    if (!product) throw new Error("Product not found");
    const newQuantity = product.stock_quantity + quantityChange;
    return repo.updateStock(productId, newQuantity);
  },

  async activate(productId) {
    const repo = resolve<any>(TOKENS.ProductRepository);
    await repo.update(productId, { is_active: true } as any);
    eventBus.emit("ProductActivated", { productId, timestamp: new Date() });
  },

  async deactivate(productId) {
    const repo = resolve<any>(TOKENS.ProductRepository);
    await repo.update(productId, { is_active: false } as any);
    eventBus.emit("ProductDeactivated", { productId, timestamp: new Date() });
  },
};
