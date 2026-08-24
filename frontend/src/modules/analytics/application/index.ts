/**
 * Analytics Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Analytics/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { AnalyticsEvent, AnalyticsReport, DashboardMetric } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface TrackEventDTO {
  eventType: string;
  userId?: string;
  sessionId?: string;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface GenerateReportDTO {
  name: string;
  type: string;
  filters?: Record<string, unknown>;
  dateRange?: { start: string; end: string };
}

// ── Commands ─────────────────────────────────────────────────────

export interface TrackEventCommand {
  type: "TrackEvent";
  payload: TrackEventDTO;
}

export interface GenerateReportCommand {
  type: "GenerateReport";
  payload: GenerateReportDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetEventsQuery {
  type: "GetEvents";
  payload: {
    params?: QueryParams;
  };
}

export interface GetEventsByTypeQuery {
  type: "GetEventsByType";
  payload: {
    eventType: string;
    params?: QueryParams;
  };
}

export interface GetEventsByUserQuery {
  type: "GetEventsByUser";
  payload: {
    userId: string;
    params?: QueryParams;
  };
}

export interface GetDashboardMetricsQuery {
  type: "GetDashboardMetrics";
  payload: {
    filters?: Record<string, unknown>;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface AnalyticsApplicationService {
  trackEvent(command: TrackEventCommand): Promise<AnalyticsEvent>;
  generateReport(command: GenerateReportCommand): Promise<AnalyticsReport>;

  getEvents(query: GetEventsQuery): Promise<PaginatedResult<AnalyticsEvent>>;
  getEventsByType(query: GetEventsByTypeQuery): Promise<PaginatedResult<AnalyticsEvent>>;
  getEventsByUser(query: GetEventsByUserQuery): Promise<PaginatedResult<AnalyticsEvent>>;
  getDashboardMetrics(query: GetDashboardMetricsQuery): Promise<DashboardMetric[]>;
}
