import { useQuery } from "@tanstack/react-query";
import { http, qs } from "@/core/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Hotel { id: string; name: string; location: string; star_rating: number; price_per_night: number; image?: string; }

export default function HotelSearchPage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const { data: hotels, isLoading } = useQuery({
    queryKey: ["hotels", location],
    queryFn: async () => { const res = await http.get<any>(`/api/hotels${qs({ location })}`); return res.data || []; },
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Hotels</h1>
      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by location..." value={location} onChange={(e) => setLocation(e.target.value)} className="pl-10" /></div>
        <Button>Search</Button>
      </div>
      {isLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" /></div> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels?.map((hotel: Hotel) => (
            <Card key={hotel.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/hotels/${hotel.id}`)}>
              <CardContent className="p-4">
                {hotel.image && <img src={hotel.image} alt={hotel.name} className="w-full h-48 object-cover rounded-md mb-3" />}
                <h3 className="font-semibold text-lg">{hotel.name}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{hotel.location}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex">{Array.from({ length: hotel.star_rating || 5 }).map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}</div>
                  <p className="font-bold">${hotel.price_per_night}/night</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {hotels?.length === 0 && <p className="col-span-full text-center py-12 text-muted-foreground">No hotels found</p>}
        </div>}
    </div>
  );
}
