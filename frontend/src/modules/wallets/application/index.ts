/**
 * Wallets Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Wallets/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { Wallet, WalletTransaction } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface TopUpWalletDTO {
  walletId: string;
  amount: number;
  referenceType?: string;
  referenceId?: string;
  description?: string;
}

export interface DebitWalletDTO {
  walletId: string;
  amount: number;
  referenceType?: string;
  referenceId?: string;
  description?: string;
}

export interface TransferWalletDTO {
  sourceWalletId: string;
  destinationWalletId: string;
  amount: number;
  description?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateWalletCommand {
  type: "CreateWallet";
  payload: {
    userId: string;
    currency?: string;
  };
}

export interface TopUpWalletCommand {
  type: "TopUpWallet";
  payload: TopUpWalletDTO;
}

export interface DebitWalletCommand {
  type: "DebitWallet";
  payload: DebitWalletDTO;
}

export interface TransferWalletCommand {
  type: "TransferWallet";
  payload: TransferWalletDTO;
}

export interface FreezeWalletCommand {
  type: "FreezeWallet";
  payload: {
    walletId: string;
    reason?: string;
  };
}

export interface UnfreezeWalletCommand {
  type: "UnfreezeWallet";
  payload: { walletId: string };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetWalletQuery {
  type: "GetWallet";
  payload: { walletId: string };
}

export interface GetWalletByUserQuery {
  type: "GetWalletByUser";
  payload: { userId: string };
}

export interface GetBalanceQuery {
  type: "GetBalance";
  payload: { walletId: string };
}

export interface GetTransactionsQuery {
  type: "GetTransactions";
  payload: {
    walletId: string;
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface WalletApplicationService {
  createWallet(command: CreateWalletCommand): Promise<Wallet>;
  topUpWallet(command: TopUpWalletCommand): Promise<WalletTransaction>;
  debitWallet(command: DebitWalletCommand): Promise<WalletTransaction>;
  transferWallet(command: TransferWalletCommand): Promise<{ source: WalletTransaction; destination: WalletTransaction }>;
  freezeWallet(command: FreezeWalletCommand): Promise<void>;
  unfreezeWallet(command: UnfreezeWalletCommand): Promise<void>;

  getWallet(query: GetWalletQuery): Promise<Wallet | null>;
  getWalletByUser(query: GetWalletByUserQuery): Promise<Wallet | null>;
  getBalance(query: GetBalanceQuery): Promise<number>;
  getTransactions(query: GetTransactionsQuery): Promise<PaginatedResult<WalletTransaction>>;
}
