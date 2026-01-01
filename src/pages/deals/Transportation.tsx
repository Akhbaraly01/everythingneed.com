import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { flights } from "@/data/bookingData";
import FlightCard from "@/components/booking/FlightCard";
import BookingRequestForm from "@/components/booking/BookingRequestForm";
import { ArrowLeft, Search, Plane, Car, Bike, Truck, Bus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Transportation = () => {
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");

  const filteredFlights = flights.filter(flight => 
    (searchFrom === "" || flight.from.toLowerCase().includes(searchFrom.toLowerCase())) &&
    (searchTo === "" || flight.to.toLowerCase().includes(searchTo.toLowerCase()))
  );

  const handleBookFlight = (flight: typeof flights[0]) => {
    toast({
      title: "Flight Selected!",
      description: `${flight.from} → ${flight.to} for $${flight.price}. Proceeding to checkout...`,
    });
  };

  const transportModes = [
    { icon: Plane, name: "Flights", count: 156 },
    { icon: Car, name: "Cars", count: 89 },
    { icon: Bike, name: "Motorcycles", count: 45 },
    { icon: Truck, name: "Lorries", count: 23 },
    { icon: Bus, name: "Buses", count: 34 },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-primary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <Link to="/deals" className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Transportation</h1>
          <p className="text-white/90">Flights, cars, motorcycles - all your transportation needs</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Transport Modes */}
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {transportModes.map((mode) => (
              <Card key={mode.name} className="cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <CardContent className="p-4 text-center">
                  <mode.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">{mode.name}</p>
                  <p className="text-sm text-muted-foreground">{mode.count} available</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Search & Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Flights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="From (e.g., New York)"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
              />
              <Input
                placeholder="To (e.g., London)"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
              />
              <Input type="date" />
              <Button className="gap-2">
                <Search className="h-4 w-4" />
                Search Flights
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different content */}
        <Tabs defaultValue="available" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="available">Available Flights</TabsTrigger>
            <TabsTrigger value="request">Request Custom Trip</TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {/* Flight Listings */}
            <div className="space-y-4">
              {filteredFlights.length > 0 ? (
                filteredFlights.map((flight) => (
                  <FlightCard key={flight.id} flight={flight} onBook={handleBookFlight} />
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No flights found matching your criteria.</p>
                  <BookingRequestForm 
                    serviceTypes={["International Flight", "Domestic Flight", "Charter Flight", "Private Jet"]}
                    title="Request Custom Flight"
                    description="Can't find your route? Submit a request and we'll find the best options for you."
                  />
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="request">
            <Card className="p-6">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-xl font-bold mb-2">Can't find what you're looking for?</h3>
                <p className="text-muted-foreground mb-6">
                  Submit a custom request with your travel details and we'll find the best transportation options for you.
                </p>
                <BookingRequestForm 
                  serviceTypes={[
                    "International Flight",
                    "Domestic Flight", 
                    "Car Rental",
                    "Motorcycle Rental",
                    "Truck/Lorry Rental",
                    "Bus Charter",
                    "Airport Transfer",
                    "City Tour",
                    "Other"
                  ]}
                  title="Request Custom Transportation"
                  description="Fill out the form with your requirements and our team will get back to you within 24 hours."
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Transportation;
