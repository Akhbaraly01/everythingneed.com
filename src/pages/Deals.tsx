import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CategoryGrid from "@/components/CategoryGrid";
import { dealCategories } from "@/data/mockData";
import { Calendar, Briefcase, Plane, Hotel, Building, Users, Tractor, UtensilsCrossed } from "lucide-react";

const Deals = () => {
  const dealServices = [
    {
      icon: Calendar,
      title: "Booking Services",
      description: "Book services and submit requests with our easy form system",
      action: "Start Booking",
    },
    {
      icon: Briefcase,
      title: "Task Center",
      description: "Participate in tasks to earn money or post your own tasks",
      action: "View Tasks",
    },
    {
      icon: Plane,
      title: "Transportation",
      description: "Flights, cars, motorcycles - all transportation needs covered",
      action: "Find Transport",
    },
    {
      icon: Hotel,
      title: "Hotel Management",
      description: "Book hotels worldwide with instant QR code confirmation",
      action: "Book Hotel",
    },
    {
      icon: Building,
      title: "Building & Real Estate",
      description: "Find lands, buildings, materials, and rental properties",
      action: "Explore Listings",
    },
    {
      icon: Users,
      title: "Jobs & Careers",
      description: "Find jobs or post opportunities for talented professionals",
      action: "Browse Jobs",
    },
    {
      icon: Tractor,
      title: "Agriculture Services",
      description: "Equipment, workers, and agricultural products marketplace",
      action: "View Services",
    },
    {
      icon: UtensilsCrossed,
      title: "Food & Delivery",
      description: "Order fresh food stocks, ready-made meals, and beverages",
      action: "Order Now",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-primary py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Deals & Services
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Book services, find transportation, manage properties, discover jobs, and much more
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse Categories</h2>
          <CategoryGrid categories={dealCategories} />
        </section>

        {/* Service Cards */}
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
                  <Button className="w-full">{service.action}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Featured Deals */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Hot Deals Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardHeader>
                <CardTitle>Airport Transfer Special</CardTitle>
                <CardDescription>Save 30% on airport shuttles this week</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary mb-4">$31.50</p>
                <p className="text-sm text-muted-foreground line-through mb-2">Regular: $45.00</p>
                <Button className="w-full">Book Now</Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-accent/10">
              <CardHeader>
                <CardTitle>Hotel Bundle Offer</CardTitle>
                <CardDescription>3 nights for the price of 2 at luxury hotels</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-secondary mb-4">$500</p>
                <p className="text-sm text-muted-foreground line-through mb-2">Regular: $750</p>
                <Button className="w-full">View Details</Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-primary/10">
              <CardHeader>
                <CardTitle>Task Completion Bonus</CardTitle>
                <CardDescription>Complete 5 tasks and earn 20% bonus rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent mb-4">+20%</p>
                <p className="text-sm text-muted-foreground mb-2">Limited time offer</p>
                <Button className="w-full">Start Tasks</Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Deals;
