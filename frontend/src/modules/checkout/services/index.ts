import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { CartItemRepository } from "@core/repositories";
import type { CheckoutService } from "../domain";

export const checkoutService: CheckoutService = {
  async getCart(userId) {
    const repo = resolve<CartItemRepository>(TOKENS.CartItemRepository);
    const items = (await repo.findByUserId(userId)) as any;
    if (items.length === 0) return null;
    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    return {
      id: `cart-${userId}`,
      userId,
      status: "active",
      subtotal,
      discount: 0,
      total: subtotal,
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  },

  async getCartById(cartId) {
    return this.getCart(cartId.replace("cart-", ""));
  },

  async getCartItems(cartId) {
    const repo = resolve<CartItemRepository>(TOKENS.CartItemRepository);
    const userId = cartId.replace("cart-", "");
    return repo.findByUserId(userId) as any;
  },

  async addToCart(userId, data) {
    const repo = resolve<CartItemRepository>(TOKENS.CartItemRepository);
    const item = await repo.create({
      user_id: userId,
      product_id: data.productId,
      product_name: data.productName,
      product_image: data.productImage,
      quantity: data.quantity,
      unit_price: data.unitPrice,
      total_price: data.unitPrice * data.quantity,
      options: data.options ? JSON.stringify(data.options) : undefined,
    } as any);
    eventBus.emit("ItemAddedToCart", { userId, productId: data.productId, quantity: data.quantity });
    return item as any;
  },

  async removeFromCart(cartId, productId) {
    const repo = resolve<CartItemRepository>(TOKENS.CartItemRepository);
    const userId = cartId.replace("cart-", "");
    const items = (await repo.findByUserId(userId)) as any;
    const item = items.find(i => i.product_id === productId);
    if (item) await repo.delete(item.id);
  },

  async updateCartItemQuantity(cartId, productId, quantity) {
    const repo = resolve<CartItemRepository>(TOKENS.CartItemRepository);
    const userId = cartId.replace("cart-", "");
    const items = (await repo.findByUserId(userId)) as any;
    const item = items.find(i => i.product_id === productId);
    if (!item) throw new Error("Cart item not found");
    return repo.update(item.id, { quantity, total_price: item.unit_price * quantity } as any) as any;
  },

  async clearCart(cartId) {
    const repo = resolve<CartItemRepository>(TOKENS.CartItemRepository);
    const userId = cartId.replace("cart-", "");
    await repo.clearByUserId(userId);
  },

  async applyCoupon(cartId, couponCode) {
    const cart = await this.getCart(cartId.replace("cart-", ""));
    if (!cart) throw new Error("Cart not found");
    eventBus.emit("CouponApplied", { userId: cart.userId, couponCode, discount: 0 });
    return { ...cart, couponCode };
  },

  async removeCoupon(cartId) {
    const cart = await this.getCart(cartId.replace("cart-", ""));
    if (!cart) throw new Error("Cart not found");
    return { ...cart, couponCode: undefined, couponDiscount: undefined };
  },

  async beginCheckout(cartId) {
    const cart = await this.getCart(cartId.replace("cart-", ""));
    if (!cart) throw new Error("Cart not found");
    eventBus.emit("ItemAddedToCart" as any, { userId: cart.userId, productId: "", quantity: 0, timestamp: new Date() });
    return { ...cart, status: "checkout" };
  },

  async completeCheckout(cartId) {
    const cart = await this.getCart(cartId.replace("cart-", ""));
    if (!cart) throw new Error("Cart not found");
    await this.clearCart(cartId);
    return { ...cart, status: "completed" };
  },

  async validateCoupon(couponCode, cartTotal) {
    const repo = resolve<CartItemRepository>(TOKENS.CartItemRepository);
    return {
      id: "coupon-1",
      code: couponCode,
      type: "percentage",
      value: 10,
      minPurchase: 50,
      usedCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  },
};
