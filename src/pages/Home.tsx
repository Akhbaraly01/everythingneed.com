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
  ArrowRight, Zap, Heart, GraduationCap, Stethoscope, ShoppingBag
} from "lucide-react";

const Home = () => {
  const stats = [
    { icon: Users, label: "Active Users", value: "50K+", color: "text-primary" },
    { icon: ShoppingBag, label: "Products", value: "10K+", color: "text-success" },
    { icon: GraduationCap, label: "Courses", value: "500+", color: "text-secondary" },
    { icon: Award, label: "Experts", value: "200+", color: "text-warning" },
  ];

  const features = [
    {
      icon: ShoppingBag,
      title: "Shop",
      description: "Discover amazing products from verified vendors",
      link: "/deals",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: GraduationCap,
      title: "Learn",
      description: "Access courses, videos, and educational content",
      link: "/learn",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: Stethoscope,
      title: "Healthcare",
      description: "Book consultations with certified doctors",
      link: "/healthcare",
      color: "bg-success/10 text-success"
    },
    {
      icon: Heart,
      title: "Services",
      description: "Find professionals for any job or task",
      link: "/building-services",
      color: "bg-warning/10 text-warning"
    },
  ];

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* 1. Static Top Bar */}
      <StaticTopBar />

      {/* Hero Stats Section */}
      <section className="bg-gradient-to-br from-primary/5 via-secondary/5 to-background py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((stat, idx) => (
              <Card key={idx} className="border-0 shadow-sm bg-background/80 backdrop-blur">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-3 py-4 space-y-6">
        {/* 2. Campaign Promotion Banners */}
        <CampaignBanners />

        {/* 3. Quick Feature Access */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Quick Access
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {features.map((feature, idx) => (
              <Link key={idx} to={feature.link}>
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer h-full border-0 shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-3 ${feature.color} group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{feature.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Quick Access Categories */}
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
