import { resolve, TOKENS } from "@core/di/container";
import { eventBus } from "@core/events/EventBus";
import type { PaymentService, WalletService } from "../domain";

export const paymentService: PaymentService = {
  async initiatePayment(data) {
    const repo = resolve<any>(TOKENS.PaymentRepository);
    const payment = await repo.create({
      order_id: data.orderId,
      user_id: data.userId,
      amount: data.amount,
      currency: data.currency,
      status: "pending",
      method: data.method,
      reference: data.reference,
    } as any);
    eventBus.emit("PaymentInitiated", { paymentId: payment.id, orderId: data.orderId, userId: data.userId, amount: data.amount, currency: data.currency });
    return payment;
  },

  async completePayment(paymentId, gatewayResponse) {
    const repo = resolve<any>(TOKENS.PaymentRepository);
    await repo.updateStatus(paymentId, "succeeded");
    const payment = await repo.findById(paymentId);
    eventBus.emit("PaymentCompleted", { orderId: payment?.order_id || "", paymentId, amount: payment?.amount || 0 });
  },

  async failPayment(paymentId, reason) {
    const repo = resolve<any>(TOKENS.PaymentRepository);
    await repo.updateStatus(paymentId, "failed");
    const payment = await repo.findById(paymentId);
    eventBus.emit("PaymentFailed", { orderId: payment?.order_id || "", reason });
  },

  async initiateRefund(data) {
    const refundRepo = resolve<any>(TOKENS.RefundRepository);
    const refund = await refundRepo.create({
      payment_id: data.paymentId,
      amount: data.amount || 0,
      reason: data.reason,
      status: "pending",
    } as any);
    eventBus.emit("RefundInitiated", { refundId: refund.id, paymentId: data.paymentId, amount: data.amount || 0 });
    return refund;
  },

  async completeRefund(refundId) {
    const repo = resolve<any>(TOKENS.RefundRepository);
    await repo.updateStatus(refundId, "completed");
    const refund = await repo.findById(refundId);
    eventBus.emit("RefundCompleted", { refundId, paymentId: refund?.payment_id || "", amount: refund?.amount || 0 });
  },

  async getPaymentById(paymentId) {
    const repo = resolve<any>(TOKENS.PaymentRepository);
    return repo.findById(paymentId);
  },

  async getPaymentsByOrderId(orderId) {
    const repo = resolve<any>(TOKENS.PaymentRepository);
    return repo.findByOrderId(orderId);
  },

  async getPaymentsByUserId(userId, params) {
    const repo = resolve<any>(TOKENS.PaymentRepository);
    return repo.findByUserId(userId, params);
  },
};

export const walletService: WalletService = {
  async getWalletByUserId(userId) {
    const repo = resolve<any>(TOKENS.WalletRepository);
    return repo.findByUserId(userId);
  },

  async getOrCreateWallet(userId) {
    const repo = resolve<any>(TOKENS.WalletRepository);
    let wallet = await repo.findByUserId(userId);
    if (!wallet) {
      wallet = await repo.create({ user_id: userId, balance: 0, currency: "USD" } as any);
    }
    return wallet;
  },

  async credit(userId, amount, reference, description) {
    const wallet = await this.getOrCreateWallet(userId);
    const walletRepo = resolve<any>(TOKENS.WalletRepository);
    const txRepo = resolve<any>(TOKENS.WalletTransactionRepository);
    const newBalance = wallet.balance + amount;
    await walletRepo.updateBalance(wallet.id, newBalance);
    const tx = await txRepo.create({
      wallet_id: wallet.id,
      type: "credit",
      amount,
      balance_after: newBalance,
      reference,
      description,
    } as any);
    eventBus.emit("WalletCredited", { userId, amount, reference });
    return tx;
  },

  async debit(userId, amount, reference, description) {
    const wallet = await this.getOrCreateWallet(userId);
    const walletRepo = resolve<any>(TOKENS.WalletRepository);
    const txRepo = resolve<any>(TOKENS.WalletTransactionRepository);
    const newBalance = wallet.balance - amount;
    await walletRepo.updateBalance(wallet.id, newBalance);
    const tx = await txRepo.create({
      wallet_id: wallet.id,
      type: "debit",
      amount,
      balance_after: newBalance,
      reference,
      description,
    } as any);
    eventBus.emit("WalletDebited", { userId, amount, reference });
    return tx;
  },

  async getBalance(userId) {
    const wallet = await this.getWalletByUserId(userId);
    return wallet?.balance || 0;
  },

  async getTransactions(walletId, params) {
    const repo = resolve<any>(TOKENS.WalletTransactionRepository);
    return repo.findByWalletId(walletId, params);
  },
};
