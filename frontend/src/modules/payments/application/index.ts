/**
 * Payments Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Payments/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Payment, Refund, Wallet, WalletTransaction } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface InitiatePaymentDTO {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  method: string;
  reference: string;
}

export interface InitiateRefundDTO {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface CreditWalletDTO {
  userId: string;
  amount: number;
  reference: string;
  description?: string;
}

export interface DebitWalletDTO {
  userId: string;
  amount: number;
  reference: string;
  description?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface InitiatePaymentCommand {
  type: "InitiatePayment";
  payload: InitiatePaymentDTO;
}

export interface CompletePaymentCommand {
  type: "CompletePayment";
  payload: {
    paymentId: string;
    gatewayResponse?: Record<string, unknown>;
  };
}

export interface FailPaymentCommand {
  type: "FailPayment";
  payload: {
    paymentId: string;
    reason: string;
  };
}

export interface InitiateRefundCommand {
  type: "InitiateRefund";
  payload: InitiateRefundDTO;
}

export interface CompleteRefundCommand {
  type: "CompleteRefund";
  payload: { refundId: string };
}

export interface CreditWalletCommand {
  type: "CreditWallet";
  payload: CreditWalletDTO;
}

export interface DebitWalletCommand {
  type: "DebitWallet";
  payload: DebitWalletDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetPaymentQuery {
  type: "GetPayment";
  payload: { paymentId: string };
}

export interface GetPaymentsByOrderQuery {
  type: "GetPaymentsByOrder";
  payload: { orderId: string };
}

export interface GetPaymentsByUserQuery {
  type: "GetPaymentsByUser";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetWalletQuery {
  type: "GetWallet";
  payload: { userId: string };
}

export interface GetWalletBalanceQuery {
  type: "GetWalletBalance";
  payload: { userId: string };
}

export interface GetWalletTransactionsQuery {
  type: "GetWalletTransactions";
  payload: {
    walletId: string;
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface PaymentApplicationService {
  initiatePayment(command: InitiatePaymentCommand): Promise<Payment>;
  completePayment(command: CompletePaymentCommand): Promise<void>;
  failPayment(command: FailPaymentCommand): Promise<void>;

  initiateRefund(command: InitiateRefundCommand): Promise<Refund>;
  completeRefund(command: CompleteRefundCommand): Promise<void>;

  creditWallet(command: CreditWalletCommand): Promise<WalletTransaction>;
  debitWallet(command: DebitWalletCommand): Promise<WalletTransaction>;

  getPayment(query: GetPaymentQuery): Promise<Payment | null>;
  getPaymentsByOrder(query: GetPaymentsByOrderQuery): Promise<Payment[]>;
  getPaymentsByUser(query: GetPaymentsByUserQuery): Promise<PaginatedResult<Payment>>;

  getWallet(query: GetWalletQuery): Promise<Wallet | null>;
  getWalletBalance(query: GetWalletBalanceQuery): Promise<number>;
  getWalletTransactions(query: GetWalletTransactionsQuery): Promise<PaginatedResult<WalletTransaction>>;
}
