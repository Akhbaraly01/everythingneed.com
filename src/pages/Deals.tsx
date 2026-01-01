import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CategoryGrid from "@/components/CategoryGrid";
import { dealCategories } from "@/data/mockData";
import { Calendar, Briefcase, Plane, Hotel, Building, Users, Tractor, UtensilsCrossed } from "lucide-react";

const Deals = () => {
  const dealServices = [
    { icon: Calendar, title: "Booking Services", description: "Book services and submit requests with our easy form system", action: "Start Booking", path: "/deals/booking" },
    { icon: Briefcase, title: "Task Center", description: "Participate in tasks to earn money or post your own tasks", action: "View Tasks", path: "/deals/tasks" },
    { icon: Plane, title: "Transportation", description: "Flights, cars, motorcycles - all transportation needs covered", action: "Find Transport", path: "/deals/transportation" },
    { icon: Hotel, title: "Hotel Management", description: "Book hotels worldwide with instant QR code confirmation", action: "Book Hotel", path: "/deals/hotels" },
    { icon: Building, title: "Building & Real Estate", description: "Find lands, buildings, materials, and rental properties", action: "Explore Listings", path: "/deals/real-estate" },
    { icon: Users, title: "Jobs & Careers", description: "Find jobs or post opportunities for talented professionals", action: "Browse Jobs", path: "/deals/jobs" },
    { icon: Tractor, title: "Agriculture Services", description: "Equipment, workers, and agricultural products marketplace", action: "View Services", path: "/deals/agriculture" },
    { icon: UtensilsCrossed, title: "Food & Delivery", description: "Order fresh food stocks, ready-made meals, and beverages", action: "Order Now", path: "/deals/food" },
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-primary py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">Deals & Services</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">Book services, find transportation, manage properties, discover jobs, and much more</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse Categories</h2>
          <CategoryGrid categories={dealCategories} />
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6">Available Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dealServices.map((service, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={service.path}>
                    <Button className="w-full">{service.action}</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Deals;
