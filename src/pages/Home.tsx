import { QuickAccessGrid, ServicesGrid } from "@/components/home/QuickAccessGrid";
import CampaignCarousel from "@/components/home/CampaignCarousel";
import ProductsServicesSection from "@/components/home/ProductsServicesSection";
import HomeRequestForm from "@/components/home/HomeRequestForm";
import PushNotificationPrompt from "@/components/notifications/PushNotificationPrompt";
import AIChatBot from "@/components/chat/AIChatBot";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen pb-20">
      {/* Campaign Carousel */}
      <div className="pt-4 md:container md:mx-auto md:px-4">
        <CampaignCarousel />
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Request Form - At the top for easy access */}
        <HomeRequestForm />

        {/* Quick Access Categories - Shows 8 initially */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Quick Access</h2>
          </div>
          <QuickAccessGrid />
        </section>

        {/* Popular Services - Shows 4 dynamic */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Popular Services</h2>
            <Link to="/deals">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <ServicesGrid />
        </section>

        {/* Products & Services Section with 50+ category tabs and infinite scroll */}
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
