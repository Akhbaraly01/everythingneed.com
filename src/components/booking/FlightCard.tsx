import { Flight } from "@/data/bookingData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Clock, ArrowRight } from "lucide-react";

interface FlightCardProps {
  flight: Flight;
  onBook: (flight: Flight) => void;
}

const FlightCard = ({ flight, onBook }: FlightCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-muted-foreground">{flight.airline}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold">{flight.from}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="font-bold">{flight.to}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="font-bold">{flight.departureTime}</p>
              <p className="text-muted-foreground text-xs">Departure</p>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{flight.duration}</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{flight.arrivalTime}</p>
              <p className="text-muted-foreground text-xs">Arrival</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">${flight.price}</p>
              <Badge variant={flight.stops === 0 ? "default" : "secondary"}>
                {flight.stops === 0 ? "Direct" : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
              </Badge>
            </div>
            <Button onClick={() => onBook(flight)} disabled={!flight.available}>
              {flight.available ? "Book Now" : "Unavailable"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightCard;
