import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
// eslint-disable-next-line no-restricted-imports -- BookingRequestForm is a shared booking component
import { BookingRequestForm } from "@modules/bookings";
import { ArrowLeft, Search, Home, Building2, TreePine, Key, MapPin, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

interface Property {
  id: string;
  title: string;
  type: string;
  location: string;
  price: number;
  description?: string;
  image?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  size?: string | number;
  features?: string[];
}

const RealEstate = () => {
  const [selectedType, setSelectedType] = useState("all");
  const [searchLocation, setSearchLocation] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const res = await http.get<any>(`${API}/properties?per_page=100`);
        const raw = res?.data || res || [];
        setProperties((Array.isArray(raw) ? raw : []).map((p: any) => ({
          id: p.id,
          title: p.title,
          type: p.type || p.property_type,
          location: p.location || p.address,
          price: p.price,
          description: p.description,
          image: p.image || p.photos?.[0],
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          area: p.area || p.square_feet,
        })));
      } catch (e) {
        console.error("Failed to load properties:", e);
      }
      setLoading(false);
    };
    fetchProperties();
  }, []);

  const propertyTypes = ["all", "Land", "House", "Apartment", "Commercial", "Rent"];

  const filteredProperties = properties.filter(prop => 
    (selectedType === "all" || prop.type === selectedType) &&
    (searchLocation === "" || prop.location.toLowerCase().includes(searchLocation.toLowerCase()))
  );

  const handleInquire = (property: Property) => {
    toast({
      title: "Inquiry Sent!",
      description: `Interest in ${property.title} has been noted. Our team will contact you shortly.`,
    });
  };

  const typeIcons = {
    Land: TreePine,
    House: Home,
    Apartment: Building2,
    Commercial: Building2,
    Rent: Key,
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Building & Real Estate</h1>
          <p className="text-white/90">Find lands, buildings, materials, and rental properties</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Categories */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {propertyTypes.filter(t => t !== "all").map((type) => {
            const Icon = typeIcons[type as keyof typeof typeIcons] || Building2;
            return (
              <Card 
                key={type} 
                className={`cursor-pointer hover:shadow-lg transition-all hover:scale-105 ${selectedType === type ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedType(type)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-semibold">{type}</p>
                  <p className="text-sm text-muted-foreground">
                    {properties.filter(p => p.type === type).length} listings
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {propertyTypes.filter(t => t !== "all").map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Property Listings */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{filteredProperties.length} Properties Found</h2>
          <BookingRequestForm 
            serviceTypes={[
              "Land Purchase",
              "House Purchase",
              "Apartment Rental",
              "Commercial Space",
              "Building Materials",
              "Construction Services"
            ]}
            title="Property Inquiry"
            description="Looking for something specific? Let us know your requirements."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-all group">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={property.image} 
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <Badge className="absolute top-2 left-2">{property.type}</Badge>
                <Badge variant="secondary" className="absolute top-2 right-2">{property.size}</Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-1">{property.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                  <MapPin className="h-4 w-4" />
                  {property.location}
                </p>
                <div className="flex flex-wrap gap-1">
                  {property.features.slice(0, 3).map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    ${property.price.toLocaleString()}
                    {property.type === "Rent" && <span className="text-sm font-normal">/mo</span>}
                  </p>
                </div>
                <Button onClick={() => handleInquire(property)}>
                  Inquire
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No properties found matching your criteria.</p>
          </Card>
        )}

        {/* Building Materials Section */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-2">Need Building Materials?</h3>
            <p className="text-muted-foreground mb-6">
              We also supply construction materials like cement, steel, sand, and more at competitive prices.
            </p>
            <BookingRequestForm 
              serviceTypes={[
                "Cement & Concrete",
                "Steel & Rebar",
                "Sand & Gravel",
                "Lumber & Wood",
                "Roofing Materials",
                "Plumbing Supplies",
                "Electrical Supplies",
                "Complete Building Kit"
              ]}
              title="Request Building Materials"
              description="Tell us what materials you need, quantity, and delivery location."
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RealEstate;
