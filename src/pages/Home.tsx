import { QuickAccessGrid } from "@/components/home/QuickAccessGrid";
import CampaignCarousel from "@/components/home/CampaignCarousel";
import BannerSection from "@/components/home/BannerSection";
import ProductsServicesSection from "@/components/home/ProductsServicesSection";
import HomeRequestForm from "@/components/home/HomeRequestForm";
import PushNotificationPrompt from "@/components/notifications/PushNotificationPrompt";
import AIChatBot from "@/components/chat/AIChatBot";
import TrendingSection from "@/components/home/TrendingSection";

const Home = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Campaign Carousel - Main Slider */}
      <div className="pt-4 md:container md:mx-auto md:px-4">
        <CampaignCarousel />
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Request Form - At the top for easy access */}
        <HomeRequestForm />

        {/* Quick Access Categories - 7 icons + See More */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg md:text-xl font-bold">Quick Access</h2>
          </div>
          <QuickAccessGrid />
        </section>

        {/* Promotional Banners - 1 large + 2 small */}
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
