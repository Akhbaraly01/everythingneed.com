import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { agricultureServices } from "@/data/bookingData";
import BookingRequestForm from "@/components/booking/BookingRequestForm";
import { ArrowLeft, Search, Tractor, Users, Wheat, MessageSquare, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const Agriculture = () => {
  const [selectedType, setSelectedType] = useState("all");

  const types = ["all", "Equipment", "Workers", "Products", "Consultation"];

  const filteredServices = selectedType === "all" 
    ? agricultureServices 
    : agricultureServices.filter(s => s.type === selectedType);

  const handleOrder = (service: typeof agricultureServices[0]) => {
    toast({
      title: "Service Selected!",
      description: `${service.name} - $${service.price}. Proceeding to booking...`,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-primary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Link to="/deals" className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Agriculture Services</h1>
          <p className="text-white/90">Equipment, workers, products, and expert consultation for your farm</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105" onClick={() => setSelectedType("Equipment")}>
            <CardContent className="p-4 text-center">
              <Tractor className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Equipment Rental</p>
              <p className="text-sm text-muted-foreground">Tractors, tools & more</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105" onClick={() => setSelectedType("Workers")}>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Farm Workers</p>
              <p className="text-sm text-muted-foreground">Skilled labor teams</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105" onClick={() => setSelectedType("Products")}>
            <CardContent className="p-4 text-center">
              <Wheat className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Farm Products</p>
              <p className="text-sm text-muted-foreground">Seeds, fertilizers & more</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:scale-105" onClick={() => setSelectedType("Consultation")}>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-semibold">Expert Advice</p>
              <p className="text-sm text-muted-foreground">Crop & farm consulting</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {types.map((type) => (
            <Badge 
              key={type}
              variant={selectedType === type ? "default" : "outline"}
              className="cursor-pointer capitalize"
              onClick={() => setSelectedType(type)}
            >
              {type === "all" ? "All Services" : type}
            </Badge>
          ))}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredServices.map((service) => (
            <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-all group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <Badge className="absolute top-2 right-2">{service.type}</Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">{service.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="text-sm font-medium">4.8</span>
                  <span className="text-sm text-muted-foreground">(120 reviews)</span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">${service.price}</p>
                  <p className="text-xs text-muted-foreground">per day/unit</p>
                </div>
                <Button onClick={() => handleOrder(service)} disabled={!service.available}>
                  {service.available ? "Book Now" : "Unavailable"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Request Workers Section */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-2">Need Farm Workers?</h3>
            <p className="text-muted-foreground mb-6">
              Request workers for your farm - specify the number of people, location, and pay rate. 
              Our team will coordinate everything and ensure secure payment after job completion.
            </p>
            <BookingRequestForm 
              serviceTypes={[
                "Planting Workers",
                "Harvesting Team",
                "Farm Maintenance",
                "Livestock Care",
                "Equipment Operators",
                "General Farm Labor"
              ]}
              title="Request Farm Workers"
              description="Tell us how many workers you need, location, duration, and pay rate. We'll handle the rest."
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Agriculture;
