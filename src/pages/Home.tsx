import StaticTopBar from "@/components/home/StaticTopBar";
import { QuickAccessGrid } from "@/components/home/QuickAccessGrid";
import CampaignBanners from "@/components/home/CampaignBanners";
import BinanceStyleBanner from "@/components/home/BinanceStyleBanner";
import MasonryProductGrid from "@/components/home/MasonryProductGrid";
import SubmitNeedCarousel from "@/components/home/SubmitNeedCarousel";
import DiverseContentBanners from "@/components/home/DiverseContentBanners";
import PushNotificationPrompt from "@/components/notifications/PushNotificationPrompt";
import AIChatBot from "@/components/chat/AIChatBot";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* 1. Static Top Bar - User, Search, Scan, Support, Language, Notifications */}
      <StaticTopBar />

      <div className="container mx-auto px-3 py-3 space-y-6">
        {/* 2. Campaign Promotion Banners */}
        <CampaignBanners />

        {/* 3. Quick Access Categories */}
        <section>
          <QuickAccessGrid />
        </section>

        {/* 4. Submit Your Need - Keep here as requested */}
        <SubmitNeedCarousel />

        {/* 5. Triple Banner Layout */}
        <BinanceStyleBanner />

        {/* 6. Products & Services Section with Masonry Grid */}
        <MasonryProductGrid />

        {/* 7. Discover More Services - Moved to end before footer */}
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
