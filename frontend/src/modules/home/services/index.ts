import type { HomeService } from "../domain";

export const homeService: HomeService = {
  async getHomepageData(userId) {
    return {
      heroBanner: undefined,
      featuredProducts: undefined,
      trendingDeals: undefined,
      popularServices: undefined,
      recentActivity: undefined,
    };
  },

  async getFeaturedItems() {
    return { id: "featured", title: "Featured", type: "featured", items: [] };
  },

  async getTrendingItems() {
    return { id: "trending", title: "Trending", type: "trending", items: [] };
  },
};
