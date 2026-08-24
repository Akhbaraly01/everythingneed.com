/**
 * Subscriptions Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Subscriptions/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { SubscriptionPlan, Subscription, SubscriptionPayment } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface CreateSubscriptionPlanDTO {
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingInterval: string;
  features: string[];
}

export interface UpdateSubscriptionPlanDTO {
  name?: string;
  description?: string;
  price?: number;
  features?: string[];
  isActive?: boolean;
}

// ── Commands ─────────────────────────────────────────────────────

export interface CreateSubscriptionPlanCommand {
  type: "CreateSubscriptionPlan";
  payload: CreateSubscriptionPlanDTO;
}

export interface UpdateSubscriptionPlanCommand {
  type: "UpdateSubscriptionPlan";
  payload: {
    planId: string;
    data: UpdateSubscriptionPlanDTO;
  };
}

export interface SubscribeCommand {
  type: "Subscribe";
  payload: {
    userId: string;
    planId: string;
  };
}

export interface CancelSubscriptionCommand {
  type: "CancelSubscription";
  payload: {
    subscriptionId: string;
    reason?: string;
  };
}

export interface RenewSubscriptionCommand {
  type: "RenewSubscription";
  payload: { subscriptionId: string };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetSubscriptionPlanQuery {
  type: "GetSubscriptionPlan";
  payload: { planId: string };
}

export interface GetAllSubscriptionPlansQuery {
  type: "GetAllSubscriptionPlans";
  payload: {};
}

export interface GetSubscriptionQuery {
  type: "GetSubscription";
  payload: { subscriptionId: string };
}

export interface GetActiveByUserQuery {
  type: "GetActiveByUser";
  payload: { userId: string };
}

export interface GetUserSubscriptionHistoryQuery {
  type: "GetUserSubscriptionHistory";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface SubscriptionApplicationService {
  createPlan(command: CreateSubscriptionPlanCommand): Promise<SubscriptionPlan>;
  updatePlan(command: UpdateSubscriptionPlanCommand): Promise<SubscriptionPlan>;
  subscribe(command: SubscribeCommand): Promise<Subscription>;
  cancel(command: CancelSubscriptionCommand): Promise<void>;
  renew(command: RenewSubscriptionCommand): Promise<void>;

  getPlan(query: GetSubscriptionPlanQuery): Promise<SubscriptionPlan | null>;
  getAllPlans(query: GetAllSubscriptionPlansQuery): Promise<SubscriptionPlan[]>;
  getSubscription(query: GetSubscriptionQuery): Promise<Subscription | null>;
  getActiveByUser(query: GetActiveByUserQuery): Promise<Subscription | null>;
  getHistoryByUser(query: GetUserSubscriptionHistoryQuery): Promise<PaginatedResult<Subscription>>;
}
