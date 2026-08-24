import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { analyticsApi } from "../api";
import type { TrackEventInput, GenerateReportInput } from "../validators";

export function useAnalyticsEvents(params?: any) {
  return useQuery({
    queryKey: ["analytics", "events", params],
    queryFn: () => analyticsApi.getEvents(params),
  });
}

export function useAnalyticsEventsByType(eventType: string) {
  return useQuery({
    queryKey: ["analytics", "events", "type", eventType],
    queryFn: () => analyticsApi.getEventsByType(eventType),
    enabled: !!eventType,
  });
}

export function useDashboardMetrics(filters?: any) {
  return useQuery({
    queryKey: ["analytics", "dashboard", filters],
    queryFn: () => analyticsApi.getDashboardMetrics(filters),
  });
}

export function useTrackEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TrackEventInput) => analyticsApi.trackEvent(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analytics"] }),
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateReportInput) => analyticsApi.generateReport(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["analytics"] }),
  });
}
