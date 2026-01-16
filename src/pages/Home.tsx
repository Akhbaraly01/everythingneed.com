import StaticTopBar from "@/components/home/StaticTopBar";
import { QuickAccessGrid } from "@/components/home/QuickAccessGrid";
import CampaignBanners from "@/components/home/CampaignBanners";
import BinanceStyleBanner from "@/components/home/BinanceStyleBanner";
import EnhancedProductGrid from "@/components/home/EnhancedProductGrid";
import SubmitNeedCarousel from "@/components/home/SubmitNeedCarousel";
import DiverseContentBanners from "@/components/home/DiverseContentBanners";
import ExpertsShowcase from "@/components/experts/ExpertsShowcase";
import PushNotificationPrompt from "@/components/notifications/PushNotificationPrompt";
import AIChatBot from "@/components/chat/AIChatBot";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* 1. Static Top Bar */}
      <StaticTopBar />

      <div className="container mx-auto px-3 py-3 space-y-6">
        {/* 2. Campaign Promotion Banners */}
        <CampaignBanners />

        {/* 3. Quick Access Categories */}
        <section>
          <QuickAccessGrid />
        </section>

        {/* 4. Submit Your Need */}
        <SubmitNeedCarousel />

        {/* 5. Triple Banner Layout */}
        <BinanceStyleBanner />

        {/* 6. Enhanced Products Grid with Image Sliders & Video Previews */}
        <EnhancedProductGrid />

        {/* 7. Experts Showcase - ALL experts in horizontal scroll */}
        <ExpertsShowcase category="all" title="Meet Our Experts" showFilters={false} compact={true} />

        {/* 8. Discover More Services */}
        <DiverseContentBanners />
      </div>

      {/* Footer */}
      <Footer />

      {/* Push Notification Prompt */}
      <PushNotificationPrompt />

      {/* AI Chatbot */}
      <AIChatBot context="general" title="AI Assistant" />
    </div>
  );
};

export default Home;
