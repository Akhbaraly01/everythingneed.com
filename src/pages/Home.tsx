import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import CategoryGrid from "@/components/CategoryGrid";
import ProductCard from "@/components/ProductCard";
import { categories, products, services, dealCategories } from "@/data/mockData";
import { ChevronRight } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const Home = () => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="min-h-screen">
      {/* Hero/Advertisement Section */}
      <section className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
        <img
          src={heroBanner}
          alt="Promotional Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80 flex items-center">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4">
              Everything You Need, All in One Place
            </h1>
            <p className="text-sm md:text-lg text-white/90 mb-4 md:mb-6 max-w-2xl">
              Shop products, book services, learn new skills, access healthcare - your complete marketplace
            </p>
            <Button size="lg" variant="secondary">
              Explore Now
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Quick Access Categories */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Quick Access</h2>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <CategoryGrid categories={categories} />
        </section>

        {/* Deals Categories Preview */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Popular Services</h2>
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <CategoryGrid categories={dealCategories.slice(0, 8)} baseUrl="/deals" />
        </section>

        {/* All Products & Services Section */}
        <section>
          <h2 className="text-xl md:text-2xl font-bold mb-4">All Products & Services</h2>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full md:w-auto overflow-x-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="electronics">Electronics</TabsTrigger>
              <TabsTrigger value="fashion">Fashion</TabsTrigger>
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>

        {/* Service Highlights */}
        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold mb-4">Featured Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="p-6 rounded-lg border border-border hover:border-primary transition-colors cursor-pointer bg-card"
              >
                <h3 className="font-semibold mb-2">{service.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">${service.price}</span>
                  <Button size="sm" variant="outline">Book Now</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
