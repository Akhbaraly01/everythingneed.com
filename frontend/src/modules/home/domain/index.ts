/**
 * Home Domain - Composition Module (minimal DDD)
 *
 * Laravel mapping: app/Modules/Home/Domain/*
 *
 * This is a composition module that aggregates data from other modules.
 * It has no domain entities of its own.
 */

// ── Composed Data Structures ─────────────────────────────────────

export interface DashboardSection {
  id: string;
  title: string;
  type: "featured" | "trending" | "recent" | "promoted";
  items: DashboardItem[];
}

export interface DashboardItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  metadata?: Record<string, any>;
}

export interface HomepageData {
  heroBanner?: DashboardSection;
  featuredProducts?: DashboardSection;
  trendingDeals?: DashboardSection;
  popularServices?: DashboardSection;
  recentActivity?: DashboardSection;
}

// ── Domain Service ───────────────────────────────────────────────

export interface HomeService {
  getHomepageData(userId?: string): Promise<HomepageData>;
  getFeaturedItems(): Promise<DashboardSection>;
  getTrendingItems(): Promise<DashboardSection>;
}
