/**
 * Wallets Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Wallets/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface WalletId {
  value: string;
}

export interface WalletTransactionId {
  value: string;
}

export interface TransactionType {
  value: "credit" | "debit" | "transfer_in" | "transfer_out" | "refund" | "withdrawal";
}

export interface WalletStatus {
  value: "active" | "frozen" | "closed";
}

// ── Entities ─────────────────────────────────────────────────────

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  status: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface WalletCreditedEvent {
  type: "WalletCredited";
  walletId: string;
  amount: number;
  balance: number;
  referenceType?: string;
  referenceId?: string;
  timestamp: Date;
}

export interface WalletDebitedEvent {
  type: "WalletDebited";
  walletId: string;
  amount: number;
  balance: number;
  referenceType?: string;
  referenceId?: string;
  timestamp: Date;
}

export interface WalletTransferredEvent {
  type: "WalletTransferred";
  sourceWalletId: string;
  destinationWalletId: string;
  amount: number;
  timestamp: Date;
}

export interface WalletFrozenEvent {
  type: "WalletFrozen";
  walletId: string;
  reason?: string;
  timestamp: Date;
}

export interface WalletUnfrozenEvent {
  type: "WalletUnfrozen";
  walletId: string;
  timestamp: Date;
}

export interface LowBalanceAlertEvent {
  type: "LowBalanceAlert";
  walletId: string;
  userId: string;
  balance: number;
  threshold: number;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface WalletService {
  createWallet(userId: string, currency?: string): Promise<Wallet>;
  getWalletByUserId(userId: string): Promise<Wallet | null>;
  getWalletById(walletId: string): Promise<Wallet | null>;

  topUp(walletId: string, data: {
    amount: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
  }): Promise<WalletTransaction>;

  debit(walletId: string, data: {
    amount: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
  }): Promise<WalletTransaction>;

  transfer(sourceWalletId: string, destinationWalletId: string, data: {
    amount: number;
    description?: string;
  }): Promise<{ source: WalletTransaction; destination: WalletTransaction }>;

  getBalance(walletId: string): Promise<number>;
  getTransactions(walletId: string, params?: any): Promise<{ items: WalletTransaction[]; total: number }>;

  freezeWallet(walletId: string, reason?: string): Promise<void>;
  unfreezeWallet(walletId: string): Promise<void>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class WalletNotFoundError extends DomainError {
  constructor(walletId: string) {
    super(`Wallet ${walletId} not found`, "WALLET_NOT_FOUND");
    this.name = "WalletNotFoundError";
  }
}

export class WalletByUserNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`Wallet for user ${userId} not found`, "WALLET_BY_USER_NOT_FOUND");
    this.name = "WalletByUserNotFoundError";
  }
}

export class InsufficientBalanceError extends DomainError {
  constructor(walletId: string, requested: number, available: number) {
    super(`Insufficient balance in wallet ${walletId}: requested ${requested}, available ${available}`, "INSUFFICIENT_BALANCE");
    this.name = "InsufficientBalanceError";
  }
}

export class WalletFrozenError extends DomainError {
  constructor(walletId: string) {
    super(`Wallet ${walletId} is frozen`, "WALLET_FROZEN");
    this.name = "WalletFrozenError";
  }
}

export class DailyLimitExceededError extends DomainError {
  constructor(walletId: string, limit: number) {
    super(`Daily limit of ${limit} exceeded for wallet ${walletId}`, "DAILY_LIMIT_EXCEEDED");
    this.name = "DailyLimitExceededError";
  }
}

export class MonthlyLimitExceededError extends DomainError {
  constructor(walletId: string, limit: number) {
    super(`Monthly limit of ${limit} exceeded for wallet ${walletId}`, "MONTHLY_LIMIT_EXCEEDED");
    this.name = "MonthlyLimitExceededError";
  }
}

export class SelfTransferError extends DomainError {
  constructor(walletId: string) {
    super(`Cannot transfer to the same wallet ${walletId}`, "SELF_TRANSFER");
    this.name = "SelfTransferError";
  }
}
