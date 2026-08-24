/**
 * Analytics Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Analytics/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface AnalyticsEventId {
  value: string;
}

export interface EventType {
  value: string;
}

export interface EventPayload {
  [key: string]: unknown;
}

// ── Entities ─────────────────────────────────────────────────────

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  userId?: string;
  sessionId?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  type: string;
  data: Record<string, unknown>;
  generatedAt: Date;
  expiresAt?: Date;
}

export interface DashboardMetric {
  name: string;
  value: number;
  change?: number;
  changePercent?: number;
  period: string;
}

// ── Domain Events ────────────────────────────────────────────────

export interface AnalyticsEventTrackedEvent {
  type: "AnalyticsEventTracked";
  eventId: string;
  eventType: string;
  userId?: string;
  timestamp: Date;
}

export interface ReportGeneratedEvent {
  type: "ReportGenerated";
  reportId: string;
  reportType: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface AnalyticsService {
  trackEvent(data: {
    eventType: string;
    userId?: string;
    sessionId?: string;
    payload: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }): Promise<AnalyticsEvent>;

  getEvents(params?: any): Promise<{ items: AnalyticsEvent[]; total: number }>;
  getEventsByType(eventType: string, params?: any): Promise<{ items: AnalyticsEvent[]; total: number }>;
  getEventsByUserId(userId: string, params?: any): Promise<{ items: AnalyticsEvent[]; total: number }>;

  generateReport(data: {
    name: string;
    type: string;
    filters?: Record<string, unknown>;
    dateRange?: { start: string; end: string };
  }): Promise<AnalyticsReport>;

  getDashboardMetrics(filters?: Record<string, unknown>): Promise<DashboardMetric[]>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class AnalyticsEventError extends DomainError {
  constructor(message: string) {
    super(message, "ANALYTICS_EVENT_ERROR");
    this.name = "AnalyticsEventError";
  }
}

export class ReportGenerationError extends DomainError {
  constructor(message: string) {
    super(message, "REPORT_GENERATION_ERROR");
    this.name = "ReportGenerationError";
  }
}
