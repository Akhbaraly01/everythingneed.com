/**
 * Subscriptions Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Subscriptions/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Money, DateRange } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface SubscriptionId {
  value: string;
}

export interface PlanId {
  value: string;
}

export interface SubscriptionStatus {
  value: "active" | "cancelled" | "expired" | "past_due";
}

export interface BillingInterval {
  value: "monthly" | "yearly" | "weekly";
}

// ── Entities ─────────────────────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingInterval: string;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: Date;
  createdAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface SubscriptionCreatedEvent {
  type: "SubscriptionCreated";
  subscriptionId: string;
  userId: string;
  planId: string;
  timestamp: Date;
}

export interface SubscriptionRenewedEvent {
  type: "SubscriptionRenewed";
  subscriptionId: string;
  timestamp: Date;
}

export interface SubscriptionCancelledEvent {
  type: "SubscriptionCancelled";
  subscriptionId: string;
  reason?: string;
  timestamp: Date;
}

export interface SubscriptionExpiredEvent {
  type: "SubscriptionExpired";
  subscriptionId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface SubscriptionService {
  createPlan(data: {
    name: string;
    description?: string;
    price: number;
    currency: string;
    billingInterval: string;
    features: string[];
  }): Promise<SubscriptionPlan>;

  updatePlan(planId: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>;
  getPlanById(planId: string): Promise<SubscriptionPlan | null>;
  getAllPlans(): Promise<SubscriptionPlan[]>;

  subscribe(userId: string, planId: string): Promise<Subscription>;
  cancel(subscriptionId: string, reason?: string): Promise<void>;
  renew(subscriptionId: string): Promise<void>;

  getSubscriptionById(subscriptionId: string): Promise<Subscription | null>;
  getActiveByUserId(userId: string): Promise<Subscription | null>;
  getHistoryByUserId(userId: string, params?: any): Promise<{ items: Subscription[]; total: number }>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class SubscriptionPlanNotFoundError extends DomainError {
  constructor(planId: string) {
    super(`Subscription plan ${planId} not found`, "SUBSCRIPTION_PLAN_NOT_FOUND");
    this.name = "SubscriptionPlanNotFoundError";
  }
}

export class SubscriptionNotFoundError extends DomainError {
  constructor(subscriptionId: string) {
    super(`Subscription ${subscriptionId} not found`, "SUBSCRIPTION_NOT_FOUND");
    this.name = "SubscriptionNotFoundError";
  }
}

export class ActiveSubscriptionExistsError extends DomainError {
  constructor(userId: string) {
    super(`User ${userId} already has an active subscription`, "ACTIVE_SUBSCRIPTION_EXISTS");
    this.name = "ActiveSubscriptionExistsError";
  }
}

export class SubscriptionExpiredError extends DomainError {
  constructor(subscriptionId: string) {
    super(`Subscription ${subscriptionId} has expired`, "SUBSCRIPTION_EXPIRED");
    this.name = "SubscriptionExpiredError";
  }
}
