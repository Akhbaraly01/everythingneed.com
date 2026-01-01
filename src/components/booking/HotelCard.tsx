import { HotelListing } from "@/data/bookingData";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Wifi, Waves } from "lucide-react";

interface HotelCardProps {
  hotel: HotelListing;
  onBook: (hotel: HotelListing) => void;
}

const HotelCard = ({ hotel, onBook }: HotelCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={hotel.image} 
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <Badge className="absolute top-2 right-2 bg-background/90">
          <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
          {hotel.rating}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-1">{hotel.name}</h3>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
          <MapPin className="h-4 w-4" />
          {hotel.city}, {hotel.country}
        </p>
        <div className="flex flex-wrap gap-1">
          {hotel.amenities.slice(0, 3).map((amenity, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {hotel.amenities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{hotel.amenities.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-primary">${hotel.pricePerNight}</p>
          <p className="text-xs text-muted-foreground">per night</p>
        </div>
        <Button onClick={() => onBook(hotel)}>
          Book Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default HotelCard;
