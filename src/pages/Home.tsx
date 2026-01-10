import StaticTopBar from "@/components/home/StaticTopBar";
import { QuickAccessGrid } from "@/components/home/QuickAccessGrid";
import CampaignBanners from "@/components/home/CampaignBanners";
import BinanceStyleBanner from "@/components/home/BinanceStyleBanner";
import ProductsServicesSection from "@/components/home/ProductsServicesSection";
import SubmitNeedCarousel from "@/components/home/SubmitNeedCarousel";
import PushNotificationPrompt from "@/components/notifications/PushNotificationPrompt";
import AIChatBot from "@/components/chat/AIChatBot";

const Home = () => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* 1. Static Top Bar - User, Search, Scan, Support, Language, Notifications */}
      <StaticTopBar />

      <div className="container mx-auto px-3 py-3 space-y-4">
        {/* 2. Campaign Promotion Banners - 6 sliding banners */}
        <CampaignBanners />

        {/* 3. Quick Access Categories - 7 icons + See More (8th) */}
        <section>
          <QuickAccessGrid />
        </section>

        {/* 4. Submit Your Need - Slidable request forms */}
        <SubmitNeedCarousel />

        {/* 5. Triple Banner Layout - Left 2x, Right 2 stacked, each slides independently */}
        <BinanceStyleBanner />

        {/* 6. Products & Services Section - No search/filter here */}
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
