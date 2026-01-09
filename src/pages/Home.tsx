import { QuickAccessGrid } from "@/components/home/QuickAccessGrid";
import CampaignCarousel from "@/components/home/CampaignCarousel";
import BannerSection from "@/components/home/BannerSection";
import ProductsServicesSection from "@/components/home/ProductsServicesSection";
import SubmitNeedCarousel from "@/components/home/SubmitNeedCarousel";
import PushNotificationPrompt from "@/components/notifications/PushNotificationPrompt";
import AIChatBot from "@/components/chat/AIChatBot";
import TrendingSection from "@/components/home/TrendingSection";

const Home = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Campaign Carousel - Main Slider (reduced size) */}
      <div className="pt-2 md:container md:mx-auto md:px-4">
        <CampaignCarousel />
      </div>

      <div className="container mx-auto px-4 py-4 md:py-6 space-y-4">
        {/* Quick Access Categories - 7 icons + See More */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base md:text-lg font-bold">Quick Access</h2>
          </div>
          <QuickAccessGrid />
        </section>

        {/* Submit Your Need - Sliding forms carousel */}
        <SubmitNeedCarousel />

        {/* Promotional Banners - Vertical layout like screenshot */}
        <BannerSection />

        {/* Trending Section */}
        <TrendingSection />

        {/* Products & Services Section with 500 items per page + pagination */}
        <ProductsServicesSection />
      </div>

      {/* Push Notification Prompt */}
      <PushNotificationPrompt />

      {/* AI Chatbot */}
      <AIChatBot context="general" title="AI Assistant" />
    </div>
  );
};

export default Home;
