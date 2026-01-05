import { useState } from "react";
import { Button } from "@/components/ui/button";
import CampaignCarousel from "@/components/home/CampaignCarousel";
import { QuickAccessGrid, ServicesGrid } from "@/components/home/QuickAccessGrid";
import TrendingSection from "@/components/home/TrendingSection";
import ProductCard from "@/components/ProductCard";
import { products, services } from "@/data/mockData";
import { ChevronRight, Zap, Clock, Shield, Headphones } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Campaign Carousel */}
      <div className="pt-4 md:container md:mx-auto md:px-4">
        <CampaignCarousel />
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 space-y-10">
        {/* Quick Access Categories - Binance Style */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Quick Access</h2>
            <Link to="/deals">
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <QuickAccessGrid />
        </section>

        {/* Services Grid */}
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

        {/* Stats Banner */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-3 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="p-2 rounded-lg bg-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">10K+</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3 bg-gradient-to-br from-secondary/10 to-secondary/5">
            <div className="p-2 rounded-lg bg-secondary/20">
              <Clock className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-muted-foreground">Delivery</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3 bg-gradient-to-br from-success/10 to-success/5">
            <div className="p-2 rounded-lg bg-success/20">
              <Shield className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">100%</p>
              <p className="text-xs text-muted-foreground">Secure</p>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3 bg-gradient-to-br from-warning/10 to-warning/5">
            <div className="p-2 rounded-lg bg-warning/20">
              <Headphones className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-xs text-muted-foreground">Support</p>
            </div>
          </Card>
        </section>

        {/* Trending Now */}
        <TrendingSection />

        {/* Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Featured Products</h2>
            <Link to="/deals">
              <Button variant="ghost" size="sm">
                See All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Featured Services */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4">Featured Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <Card
                key={service.id}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer group"
              >
                <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ${service.price}
                  </span>
                  <Button size="sm" variant="outline">
                    Book Now
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
