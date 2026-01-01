import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hotels } from "@/data/bookingData";
import HotelCard from "@/components/booking/HotelCard";
import BookingRequestForm from "@/components/booking/BookingRequestForm";
import { ArrowLeft, Search, MapPin, Calendar, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Hotels = () => {
  const [searchCity, setSearchCity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  const countries = [...new Set(hotels.map(h => h.country))];

  const filteredHotels = hotels.filter(hotel => 
    (searchCity === "" || hotel.city.toLowerCase().includes(searchCity.toLowerCase())) &&
    (selectedCountry === "" || selectedCountry === "all" || hotel.country === selectedCountry)
  );

  const handleBookHotel = (hotel: typeof hotels[0]) => {
    toast({
      title: "Hotel Selected!",
      description: `${hotel.name} in ${hotel.city} - $${hotel.pricePerNight}/night. Proceeding to booking...`,
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Hotel Booking</h1>
          <p className="text-white/90">Book luxury hotels worldwide with instant QR code confirmation</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Search Card */}
        <Card className="mb-8 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Your Perfect Stay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="City or destination"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input type="date" placeholder="Check-in" />
              </div>
              <Button className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">500+</p>
              <p className="text-sm text-muted-foreground">Hotels Worldwide</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">50+</p>
              <p className="text-sm text-muted-foreground">Countries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">24/7</p>
              <p className="text-sm text-muted-foreground">Support</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">QR</p>
              <p className="text-sm text-muted-foreground">Instant Check-in</p>
            </CardContent>
          </Card>
        </div>

        {/* Hotel Listings */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Available Hotels</h2>
          <BookingRequestForm 
            serviceTypes={["Luxury Suite", "Standard Room", "Family Room", "Penthouse", "Villa", "Resort"]}
            title="Request Custom Booking"
            description="Looking for something specific? Let us know your requirements."
          />
        </div>

        {filteredHotels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} onBook={handleBookHotel} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No hotels found matching your criteria.</p>
            <BookingRequestForm 
              serviceTypes={["Luxury Suite", "Standard Room", "Family Room", "Penthouse", "Villa"]}
              title="Request Custom Booking"
              description="Submit a request and we'll find the perfect accommodation for you."
            />
          </Card>
        )}
      </div>
    </div>
  );
};

export default Hotels;
