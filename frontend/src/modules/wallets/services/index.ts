import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { WalletService } from "../domain";

export const walletService: WalletService = {
  async createWallet(userId, currency) {
    const wallet = { id: crypto.randomUUID(), userId, balance: 0, currency: currency || "NGN", status: "active", createdAt: new Date(), updatedAt: new Date() } as any;
    return wallet;
  },

  async getWalletByUserId(userId) {
    const repo = resolve<any>(TOKENS.WalletRepository);
    return repo.findByUserId(userId);
  },

  async getWalletById(walletId) {
    const repo = resolve<any>(TOKENS.WalletRepository);
    return repo.findById(walletId);
  },

  async topUp(walletId, data) {
    const tx = { id: crypto.randomUUID(), walletId, type: "credit", amount: data.amount, balanceBefore: 0, balanceAfter: data.amount, currency: "NGN", referenceType: data.referenceType, referenceId: data.referenceId, description: data.description, createdAt: new Date() } as any;
    eventBus.emit("WalletCredited", { userId: "", amount: data.amount, reference: data.referenceType || "top_up" });
    return tx;
  },

  async debit(walletId, data) {
    const tx = { id: crypto.randomUUID(), walletId, type: "debit", amount: data.amount, balanceBefore: data.amount, balanceAfter: 0, currency: "NGN", referenceType: data.referenceType, referenceId: data.referenceId, description: data.description, createdAt: new Date() } as any;
    eventBus.emit("WalletDebited", { userId: "", amount: data.amount, reference: data.referenceType || "debit" });
    return tx;
  },

  async transfer(sourceWalletId, destinationWalletId, data) {
    const source = { id: crypto.randomUUID(), walletId: sourceWalletId, type: "transfer_out", amount: data.amount, balanceBefore: data.amount, balanceAfter: 0, currency: "NGN", description: data.description, createdAt: new Date() } as any;
    const destination = { id: crypto.randomUUID(), walletId: destinationWalletId, type: "transfer_in", amount: data.amount, balanceBefore: 0, balanceAfter: data.amount, currency: "NGN", description: data.description, createdAt: new Date() } as any;
    return { source, destination };
  },

  async getBalance(walletId) {
    const repo = resolve<any>(TOKENS.WalletRepository);
    const wallet = await repo.findById(walletId);
    return wallet?.balance || 0;
  },

  async getTransactions(walletId, params) {
    const repo = resolve<any>(TOKENS.WalletTransactionRepository);
    return repo.findByWalletId(walletId, params);
  },

  async freezeWallet(walletId, reason) {
    eventBus.emit("WalletFrozen", { walletId, reason, timestamp: new Date() });
  },

  async unfreezeWallet(walletId) {
    eventBus.emit("WalletUnfrozen", { walletId, timestamp: new Date() });
  },
};
