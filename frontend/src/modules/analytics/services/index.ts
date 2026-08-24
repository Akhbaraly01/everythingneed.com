import { http } from "@/core/api/client";
import { eventBus } from "@core/events/EventBus";
import type { AnalyticsService, AnalyticsEvent, AnalyticsReport, DashboardMetric } from "../domain";

const qs = (params?: Record<string, unknown>) => {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
};

export const analyticsService: AnalyticsService = {
  async trackEvent(data) {
    const result = await http.post<{ data: AnalyticsEvent }>("/api/analytics/events", {
      event_type: data.eventType,
      metadata: data.metadata,
    });
    const event = result.data;
    eventBus.emit("AnalyticsEventTracked", { eventId: event.id, eventType: data.eventType, userId: data.userId });
    return event;
  },

  async getEvents(params) {
    const data = await http.get<{ data?: AnalyticsEvent[]; meta?: { total?: number } }>(`/api/analytics/events${qs(params as Record<string, unknown>)}`);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getEventsByType(eventType, params) {
    const data = await http.get<{ data?: AnalyticsEvent[]; meta?: { total?: number } }>(`/api/analytics/events${qs({ type: eventType, ...params })}`);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getEventsByUserId(userId, params) {
    const data = await http.get<{ data?: AnalyticsEvent[]; meta?: { total?: number } }>(`/api/analytics/events${qs({ user_id: userId, ...params })}`);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async generateReport(data) {
    const result = await http.post<{ data: AnalyticsReport }>("/api/analytics/reports", data);
    const report = result.data;
    eventBus.emit("ReportGenerated", { reportId: report.id, reportType: data.type });
    return report;
  },

  async getDashboardMetrics(filters) {
    const data = await http.get<{ data?: DashboardMetric[] }>(`/api/analytics/summary${qs(filters)}`);
    return data.data || [];
  },
};
