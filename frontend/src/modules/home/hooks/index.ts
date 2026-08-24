import { useQuery } from "@tanstack/react-query";
import { homeApi } from "../api";

export function useHomepageData(userId?: string) {
  return useQuery({
    queryKey: ["home", "data", userId],
    queryFn: () => homeApi.getHomepageData(userId),
  });
}

export function useFeaturedItems() {
  return useQuery({
    queryKey: ["home", "featured"],
    queryFn: () => homeApi.getFeaturedItems(),
  });
}

export function useTrendingItems() {
  return useQuery({
    queryKey: ["home", "trending"],
    queryFn: () => homeApi.getTrendingItems(),
  });
}
