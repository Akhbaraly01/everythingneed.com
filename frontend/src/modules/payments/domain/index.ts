/**
 * Payments Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Payments/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Money } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface PaymentId {
  value: string;
}

export interface TransactionId {
  value: string;
}

export interface PaymentStatus {
  value: "pending" | "processing" | "succeeded" | "failed" | "refunded" | "partially_refunded";
}

export interface PaymentMethod {
  type: "card" | "bank_transfer" | "wallet" | "cash_on_delivery";
  provider?: string;
  last4?: string;
}

export interface RefundId {
  value: string;
}

// ── Entities ─────────────────────────────────────────────────────

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  reference: string;
  gatewayResponse?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason?: string;
  status: string;
  createdAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  reference: string;
  description?: string;
  createdAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface PaymentInitiatedEvent {
  type: "PaymentInitiated";
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  timestamp: Date;
}

export interface PaymentCompletedEvent {
  type: "PaymentCompleted";
  orderId: string;
  paymentId: string;
  amount: number;
  timestamp: Date;
}

export interface PaymentFailedEvent {
  type: "PaymentFailed";
  orderId: string;
  reason: string;
  timestamp: Date;
}

export interface RefundInitiatedEvent {
  type: "RefundInitiated";
  refundId: string;
  paymentId: string;
  amount: number;
  timestamp: Date;
}

export interface RefundCompletedEvent {
  type: "RefundCompleted";
  refundId: string;
  paymentId: string;
  amount: number;
  timestamp: Date;
}

export interface WalletCreditedEvent {
  type: "WalletCredited";
  userId: string;
  amount: number;
  reference: string;
  timestamp: Date;
}

export interface WalletDebitedEvent {
  type: "WalletDebited";
  userId: string;
  amount: number;
  reference: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface PaymentService {
  initiatePayment(data: {
    orderId: string;
    userId: string;
    amount: number;
    currency: string;
    method: string;
    reference: string;
  }): Promise<Payment>;

  completePayment(paymentId: string, gatewayResponse?: Record<string, unknown>): Promise<void>;
  failPayment(paymentId: string, reason: string): Promise<void>;

  initiateRefund(data: {
    paymentId: string;
    amount?: number;
    reason?: string;
  }): Promise<Refund>;

  completeRefund(refundId: string): Promise<void>;

  getPaymentById(paymentId: string): Promise<Payment | null>;
  getPaymentsByOrderId(orderId: string): Promise<Payment[]>;
  getPaymentsByUserId(userId: string, params?: any): Promise<{ items: Payment[]; total: number }>;
}

export interface WalletService {
  getWalletByUserId(userId: string): Promise<Wallet | null>;
  getOrCreateWallet(userId: string): Promise<Wallet>;

  credit(userId: string, amount: number, reference: string, description?: string): Promise<WalletTransaction>;
  debit(userId: string, amount: number, reference: string, description?: string): Promise<WalletTransaction>;

  getBalance(userId: string): Promise<number>;
  getTransactions(walletId: string, params?: any): Promise<{ items: WalletTransaction[]; total: number }>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class PaymentNotFoundError extends DomainError {
  constructor(paymentId: string) {
    super(`Payment ${paymentId} not found`, "PAYMENT_NOT_FOUND");
    this.name = "PaymentNotFoundError";
  }
}

export class PaymentFailedError extends DomainError {
  constructor(reason: string) {
    super(`Payment failed: ${reason}`, "PAYMENT_FAILED");
    this.name = "PaymentFailedError";
  }
}

export class WalletNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`Wallet not found for user ${userId}`, "WALLET_NOT_FOUND");
    this.name = "WalletNotFoundError";
  }
}

export class InvalidAmountError extends DomainError {
  constructor(amount: number) {
    super(`Invalid amount: ${amount}`, "INVALID_AMOUNT");
    this.name = "InvalidAmountError";
  }
}

export class RefundAlreadyProcessedError extends DomainError {
  constructor(refundId: string) {
    super(`Refund ${refundId} already processed`, "REFUND_ALREADY_PROCESSED");
    this.name = "RefundAlreadyProcessedError";
  }
}
