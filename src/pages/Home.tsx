import StaticTopBar from "@/components/home/StaticTopBar";
import { QuickAccessGrid } from "@/components/home/QuickAccessGrid";
import BinanceStyleBanner from "@/components/home/BinanceStyleBanner";
import ProductsServicesSection from "@/components/home/ProductsServicesSection";
import SubmitNeedCarousel from "@/components/home/SubmitNeedCarousel";
import PushNotificationPrompt from "@/components/notifications/PushNotificationPrompt";
import AIChatBot from "@/components/chat/AIChatBot";
import TrendingSection from "@/components/home/TrendingSection";

const Home = () => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Static Top Bar - Always visible */}
      <StaticTopBar />

      <div className="container mx-auto px-3 py-3 space-y-4">
        {/* Quick Access Categories - 7 icons + See More */}
        <section>
          <QuickAccessGrid />
        </section>

        {/* Binance-style Banners - Big left, 2 small right */}
        <BinanceStyleBanner />

        {/* Submit Your Need - Sliding forms carousel */}
        <SubmitNeedCarousel />

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
