/**
 * Home Application Layer - Composition Queries for Dashboard Data
 *
 * Laravel mapping: app/Modules/Home/Application/*
 *
 * This is a composition module that aggregates queries from other modules.
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { HomepageData, DashboardSection } from "../domain";

// ── Queries ──────────────────────────────────────────────────────

export interface GetHomepageDataQuery {
  type: "GetHomepageData";
  payload: {
    userId?: string;
  };
}

export interface GetFeaturedItemsQuery {
  type: "GetFeaturedItems";
  payload: {};
}

export interface GetTrendingItemsQuery {
  type: "GetTrendingItems";
  payload: {};
}

export interface GetRecentActivityQuery {
  type: "GetRecentActivity";
  payload: {
    userId?: string;
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface HomeApplicationService {
  getHomepageData(query: GetHomepageDataQuery): Promise<HomepageData>;
  getFeaturedItems(query: GetFeaturedItemsQuery): Promise<DashboardSection>;
  getTrendingItems(query: GetTrendingItemsQuery): Promise<DashboardSection>;
  getRecentActivity(query: GetRecentActivityQuery): Promise<DashboardSection>;
}
