/**
 * Payments Infrastructure - Concrete Repository Implementations
 *
 * Laravel mapping: app/Modules/Payments/Infrastructure/Repositories/*
 */

import type { DataClient } from "@core/contracts";
import { BaseRepository } from "@core/infrastructure";
import type { QueryParams, PaginatedResult } from "@core/domain";
import type {
  Payment,
  PaymentInsert,
  PaymentUpdate,
  Refund,
  RefundInsert,
  RefundUpdate,
  Wallet,
  WalletInsert,
  WalletUpdate,
  WalletTransaction,
  WalletTransactionInsert,
  WalletTransactionUpdate,
} from "@core/api/types";
import type {
  PaymentRepository,
  RefundRepository,
  WalletRepository,
  WalletTransactionRepository,
} from "@core/repositories";

// ── Payment Repository ───────────────────────────────────────────

export class PaymentRepositoryImpl
  extends BaseRepository<Payment, PaymentInsert, PaymentUpdate>
  implements PaymentRepository
{
  get TableName(): string {
    return "payments";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("order_id", "=", orderId)
      .orderBy("created_at", false);
    return (result as Payment[]) || [];
  }

  async findByUserId(userId: string, params?: QueryParams): Promise<PaginatedResult<Payment>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "user_id", operator: "=", value: userId },
      ],
    });
  }

  async findByReference(reference: string): Promise<Payment | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("reference", "=", reference)
      .single();
    return (result as Payment) || null;
  }

  async updateStatus(id: string, status: string): Promise<Payment> {
    return this.update(id, { status: status as any });
  }
}

// ── Refund Repository ────────────────────────────────────────────

export class RefundRepositoryImpl
  extends BaseRepository<Refund, RefundInsert, RefundUpdate>
  implements RefundRepository
{
  get TableName(): string {
    return "refunds";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByPaymentId(paymentId: string): Promise<Refund[]> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("payment_id", "=", paymentId)
      .orderBy("created_at", false);
    return (result as Refund[]) || [];
  }

  async findByStatus(status: string, params?: QueryParams): Promise<PaginatedResult<Refund>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "status", operator: "=", value: status },
      ],
    });
  }

  async updateStatus(id: string, status: string): Promise<Refund> {
    return this.update(id, { status: status as any });
  }
}

// ── Wallet Repository ────────────────────────────────────────────

export class WalletRepositoryImpl
  extends BaseRepository<Wallet, WalletInsert, WalletUpdate>
  implements WalletRepository
{
  get TableName(): string {
    return "wallets";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByUserId(userId: string): Promise<Wallet | null> {
    const result = await this.dataClient
      .from(this.TableName as any)
      .where("user_id", "=", userId)
      .single();
    return (result as Wallet) || null;
  }

  async updateBalance(id: string, balance: number): Promise<Wallet> {
    return this.update(id, { balance });
  }
}

// ── Wallet Transaction Repository ────────────────────────────────

export class WalletTransactionRepositoryImpl
  extends BaseRepository<WalletTransaction, WalletTransactionInsert, WalletTransactionUpdate>
  implements WalletTransactionRepository
{
  get TableName(): string {
    return "wallet_transactions";
  }

  constructor(dataClient: DataClient) {
    super(dataClient);
  }

  async findByWalletId(walletId: string, params?: QueryParams): Promise<PaginatedResult<WalletTransaction>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "wallet_id", operator: "=", value: walletId },
      ],
      sort: [{ field: "created_at", direction: "desc" }],
    });
  }

  async findByType(type: "credit" | "debit", params?: QueryParams): Promise<PaginatedResult<WalletTransaction>> {
    return this.findMany({
      ...params,
      filters: [
        ...(params?.filters || []),
        { field: "type", operator: "=", value: type },
      ],
    });
  }
}
