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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  TrendingUp, Sparkles, Award, ShieldCheck, Users, Star, 
  ArrowRight
} from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* 1. Static Top Bar */}
      <StaticTopBar />

      <div className="container mx-auto px-3 py-4 space-y-6">
        {/* 2. Campaign Promotion Banners */}
        <CampaignBanners />

        {/* 3. Quick Access Categories (8-icon grid) */}
        <section>
          <QuickAccessGrid />
        </section>

        {/* 5. Submit Your Need */}
        <SubmitNeedCarousel />

        {/* 6. Triple Banner Layout */}
        <BinanceStyleBanner />

        {/* 7. Enhanced Products Grid with Image Sliders & Video Previews */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Trending Products</h2>
            </div>
            <Link to="/deals">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <EnhancedProductGrid />
        </section>

        {/* 8. Experts Showcase - ALL experts in horizontal scroll */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-bold">Top Experts</h2>
            </div>
            <Link to="/experts">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <ExpertsShowcase category="all" title="" showFilters={false} compact={true} />
        </section>

        {/* 9. Discover More Services */}
        <DiverseContentBanners />

        {/* Trust Badges */}
        <section className="py-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-success" />
              <span className="text-sm">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="text-sm">Verified Vendors</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-secondary" />
              <span className="text-sm">Quality Guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-warning" />
              <span className="text-sm">24/7 Support</span>
            </div>
          </div>
        </section>
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
