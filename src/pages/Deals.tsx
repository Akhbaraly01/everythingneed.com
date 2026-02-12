import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { CategoryCardSkeleton, StatCardSkeleton } from "@/components/ui/card-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  Search, ChevronRight, Plane, Hotel, Building, Briefcase, 
  Tractor, UtensilsCrossed, Heart, GraduationCap, Laptop, Shirt,
  Sparkles, Home, Music, Dumbbell, Car, Wallet, Scale, Sparkle,
  Shield, Dog, Compass, Calendar, Camera, Printer, Truck, HardHat,
  Wrench, Baby, HeartHandshake, Phone, PackageSearch
} from "lucide-react";

interface NeedCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  sort_order: number;
}

const iconMap: { [key: string]: any } = {
  Plane, Hotel, Building, Briefcase, Tractor, UtensilsCrossed, Heart,
  GraduationCap, Laptop, Shirt, Sparkles, Home, Music, Dumbbell, Car,
  Wallet, Scale, Sparkle, Shield, Dog, Compass, Calendar, Camera,
  Printer, Truck, HardHat, Wrench, Baby, HeartHandshake, Phone,
};

const DealsPage = () => {
  const [categories, setCategories] = useState<NeedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from("need_categories")
        .select("*")
        .order("sort_order");
      if (data) setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Briefcase;
    return Icon;
  };

  const quickServices = [
    { icon: Plane, title: "Book Flight", path: "/deals/transportation", color: "#3B82F6" },
    { icon: Hotel, title: "Find Hotels", path: "/deals/hotels", color: "#8B5CF6" },
    { icon: Briefcase, title: "Browse Jobs", path: "/deals/jobs", color: "#F59E0B" },
    { icon: Heart, title: "Healthcare", path: "/healthcare", color: "#EC4899" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section className="bg-gradient-primary py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              All Your Needs, One Place
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8">
              30 categories covering every aspect of human needs
            </p>
            
            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 text-lg bg-background"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {quickServices.map((service, index) => (
              <Link key={index} to={service.path}>
                <Card className="shrink-0 hover:shadow-lg transition-all duration-300 hover:scale-105 hover:-translate-y-1 w-36">
                  <CardContent className="pt-6 text-center">
                    <div 
                      className="h-12 w-12 rounded-full mx-auto mb-3 flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: service.color + "20" }}
                    >
                      <service.icon className="h-6 w-6" style={{ color: service.color }} />
                    </div>
                    <p className="font-medium text-sm">{service.title}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : (
            <>
              <Card className="animate-fade-in">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">{categories.length}</p>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </CardContent>
              </Card>
              <Card className="animate-fade-in" style={{ animationDelay: "50ms" }}>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-secondary">500+</p>
                  <p className="text-sm text-muted-foreground">Services</p>
                </CardContent>
              </Card>
              <Card className="animate-fade-in" style={{ animationDelay: "100ms" }}>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-success">1000+</p>
                  <p className="text-sm text-muted-foreground">Vendors</p>
                </CardContent>
              </Card>
              <Card className="animate-fade-in" style={{ animationDelay: "150ms" }}>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-warning">24/7</p>
                  <p className="text-sm text-muted-foreground">Support</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* All Categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Browse All Categories</h2>
            <Badge variant="outline">{filteredCategories.length} categories</Badge>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => <CategoryCardSkeleton key={i} />)}
            </div>
          ) : filteredCategories.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No categories found"
              description="Try a different search term or browse all categories"
              actionLabel="Clear Search"
              onAction={() => setSearchTerm("")}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredCategories.map((category) => {
                const IconComponent = getIcon(category.icon);
                return (
                  <Link key={category.id} to={`/needs/${category.slug}`}>
                    <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                      <CardContent className="pt-6 text-center">
                        <div 
                          className="h-14 w-14 rounded-xl mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: category.color + "20" }}
                        >
                          <IconComponent className="h-7 w-7" style={{ color: category.color }} />
                        </div>
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Popular Services */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Popular Services</h2>
            <Button variant="ghost">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300">
              <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Plane className="h-16 w-16 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-lg mb-2">Flight Booking</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book domestic and international flights at the best prices
                </p>
                <Link to="/deals/transportation">
                  <Button className="w-full">Book Now</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300">
              <div className="h-40 bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                <Hotel className="h-16 w-16 text-secondary group-hover:scale-110 transition-transform" />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-lg mb-2">Hotel Reservations</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Find and book hotels worldwide with instant confirmation
                </p>
                <Link to="/deals/hotels">
                  <Button className="w-full">Find Hotels</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300">
              <div className="h-40 bg-gradient-to-br from-warning/20 to-primary/20 flex items-center justify-center">
                <Briefcase className="h-16 w-16 text-warning group-hover:scale-110 transition-transform" />
              </div>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-lg mb-2">Job Opportunities</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Find your dream job or post opportunities for talent
                </p>
                <Link to="/deals/jobs">
                  <Button className="w-full">Browse Jobs</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DealsPage;
