import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
// eslint-disable-next-line no-restricted-imports -- FlightCard and BookingRequestForm are shared booking components
import { FlightCard, BookingRequestForm } from "@modules/bookings";
import { ArrowLeft, Search, Plane, Car, Bike, Truck, Bus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

interface Flight {
  id: string;
  from: string;
  from_code?: string;
  to: string;
  to_code?: string;
  price: number;
  airline?: string;
  flight_number?: string;
  departure?: string;
  arrival?: string;
  duration?: number;
  seats_available?: number;
}

const Transportation = () => {
  const [searchFrom, setSearchFrom] = useState("");
  const [searchTo, setSearchTo] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [applied, setApplied] = useState({ origin: "", destination: "", date: "" });
  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking dialog state
  const [bookingFlight, setBookingFlight] = useState<Flight | null>(null);
  const [travelDate, setTravelDate] = useState("");
  const [passengers, setPassengers] = useState([{ name: "", passport: "" }]);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      try {
        const res = await http.get<any>(`${API}/flights?per_page=100`);
        const raw = res?.data || res || [];
        setFlights((Array.isArray(raw) ? raw : []).map((f: any) => ({
          id: f.id,
          from: f.origin_city || f.origin || f.from,
          from_code: f.origin_code,
          to: f.destination_city || f.destination || f.to,
          to_code: f.destination_code,
          price: Number(f.price),
          airline: f.airline,
          flight_number: f.flight_number,
          departure: typeof f.departure_time === "string" ? f.departure_time.slice(0, 5) : undefined,
          arrival: typeof f.arrival_time === "string" ? f.arrival_time.slice(0, 5) : undefined,
          duration: f.duration_minutes,
          seats_available: f.seats_available,
        })));
      } catch (e) {
        console.error("Failed to load flights:", e);
      }
      setLoading(false);
    };
    fetchFlights();
  }, []);

  const runSearch = () => {
    setLoading(true);
    http.get<any>(`${API}/flights?per_page=100` +
      `&origin=${encodeURIComponent(searchFrom)}` +
      `&destination=${encodeURIComponent(searchTo)}` +
      (searchDate ? `&date=${searchDate}` : ""))
      .then((res) => {
        const raw = res?.data || [];
        setFlights((Array.isArray(raw) ? raw : []).map((f: any) => ({
          id: f.id,
          from: f.origin_city,
          from_code: f.origin_code,
          to: f.destination_city,
          to_code: f.destination_code,
          price: Number(f.price),
          airline: f.airline,
          flight_number: f.flight_number,
          departure: typeof f.departure_time === "string" ? f.departure_time.slice(0, 5) : undefined,
          arrival: typeof f.arrival_time === "string" ? f.arrival_time.slice(0, 5) : undefined,
          duration: f.duration_minutes,
          seats_available: f.seats_available,
        })));
        setApplied({ origin: searchFrom, destination: searchTo, date: searchDate });
      })
      .catch(() => toast({ title: "Search failed", variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  const filteredFlights = flights.filter(flight =>
    (applied.origin === "" ||
      flight.from.toLowerCase().includes(applied.origin.toLowerCase()) ||
      flight.from_code?.toLowerCase().includes(applied.origin.toLowerCase())) &&
    (applied.destination === "" ||
      flight.to.toLowerCase().includes(applied.destination.toLowerCase()) ||
      flight.to_code?.toLowerCase().includes(applied.destination.toLowerCase()))
  );

  const bookMutation = useMutation({
    mutationFn: () =>
      http.post(`${API}/flights/${bookingFlight!.id}/book`, {
        travel_date: travelDate,
        passengers: passengers
          .filter((p) => p.name.trim())
          .map((p) => ({ name: p.name, passport: p.passport || undefined })),
      }),
    onSuccess: (res: any) => {
      setBookingRef(res?.data?.reference ?? "confirmed");
    },
    onError: (error) =>
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      }),
  });

  const openBooking = (flight: Flight) => {
    setBookingFlight(flight);
    setBookingRef(null);
    setTravelDate("");
    setPassengers([{ name: "", passport: "" }]);
  };

  const handleBookFlight = (flight: Flight) => openBooking(flight);

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
                placeholder="To (e.g., Miami)"
                value={searchTo}
                onChange={(e) => setSearchTo(e.target.value)}
              />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
              <Button className="gap-2" onClick={runSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
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
                  <FlightCard
                    key={flight.id}
                    flight={{ ...flight, duration: flight.duration ? `${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m` : undefined } as any}
                    onBook={(f) => handleBookFlight(f as unknown as Flight)}
                  />
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

      {/* Flight booking dialog */}
      {bookingFlight && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBookingFlight(null)}>
          <div className="bg-background rounded-xl max-w-lg w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {bookingRef ? (
              <div className="text-center space-y-3 py-4">
                <Plane className="h-12 w-12 mx-auto text-emerald-500" />
                <h3 className="text-xl font-bold">Booking confirmed!</h3>
                <p className="text-sm text-muted-foreground">
                  Reference <span className="font-mono font-semibold text-foreground">{bookingRef}</span> — {bookingFlight.from} → {bookingFlight.to}
                </p>
                <Button onClick={() => setBookingFlight(null)}>Done</Button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{bookingFlight.flight_number} · {bookingFlight.airline}</h3>
                    <p className="text-sm text-muted-foreground">
                      {bookingFlight.from} → {bookingFlight.to} · departs {bookingFlight.departure}
                    </p>
                  </div>
                  <p className="font-bold text-primary">${bookingFlight.price.toFixed(0)}<span className="text-xs text-muted-foreground"> /passenger</span></p>
                </div>

                <div className="space-y-3">
                  <label className="block space-y-1">
                    <span className="text-sm font-medium">Travel date *</span>
                    <input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                  </label>

                  {passengers.map((p, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder={`Passenger ${i + 1} name *`}
                        value={p.name}
                        onChange={(e) => {
                          const next = [...passengers];
                          next[i] = { ...next[i], name: e.target.value };
                          setPassengers(next);
                        }}
                      />
                      <Input
                        placeholder="Passport (optional)"
                        value={p.passport}
                        onChange={(e) => {
                          const next = [...passengers];
                          next[i] = { ...next[i], passport: e.target.value };
                          setPassengers(next);
                        }}
                      />
                    </div>
                  ))}

                  {passengers.length < 6 && (
                    <Button variant="outline" size="sm" onClick={() => setPassengers([...passengers, { name: "", passport: "" }])}>
                      + Add passenger ({passengers.length} × ${bookingFlight.price.toFixed(0)})
                    </Button>
                  )}

                  <Button
                    className="w-full"
                    size="lg"
                    disabled={!travelDate || passengers.every((p) => !p.name.trim()) || bookMutation.isPending}
                    onClick={() => bookMutation.mutate()}
                  >
                    {bookMutation.isPending
                      ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      : `Confirm booking — $${(bookingFlight.price * Math.max(1, passengers.filter((p) => p.name.trim()).length)).toFixed(0)}`}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transportation;
