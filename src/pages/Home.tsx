import { QuickAccessGrid, ServicesGrid } from "@/components/home/QuickAccessGrid";
import CampaignCarousel from "@/components/home/CampaignCarousel";
import ProductsServicesSection from "@/components/home/ProductsServicesSection";
import PushNotificationPrompt from "@/components/notifications/PushNotificationPrompt";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Campaign Carousel */}
      <div className="pt-4 md:container md:mx-auto md:px-4">
        <CampaignCarousel />
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 space-y-8">
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

        {/* Products & Services Section with 50+ category tabs - RIGHT AFTER Popular Services */}
        <ProductsServicesSection />
      </div>

      {/* Push Notification Prompt */}
      <PushNotificationPrompt />
    </div>
  );
};

export default Home;
