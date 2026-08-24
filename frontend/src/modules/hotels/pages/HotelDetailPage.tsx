import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Star, Wifi, Car, Utensils } from "lucide-react";

interface Room { id: string; room_type: string; price_per_night: number; capacity: number; is_available: boolean; amenities?: string[]; }
interface Hotel { id: string; name: string; location: string; star_rating: number; description: string; price_per_night: number; amenities?: string[]; }

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: hotel, isLoading: loadingHotel } = useQuery<Hotel>({
    queryKey: ["hotel", id], enabled: !!id,
    queryFn: async () => { const { data } = await http.get<any>(`/api/hotels/${id}`); return data.data; },
  });

  const { data: rooms, isLoading: loadingRooms } = useQuery<Room[]>({
    queryKey: ["hotel-rooms", id], enabled: !!id,
    queryFn: async () => { const { data } = await http.get<any>(`/api/hotels/${id}/rooms`); return data.data || []; },
  });

  if (loadingHotel) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" /></div>;
  if (!hotel) return <div className="text-center py-12"><p>Hotel not found</p><Button variant="link" onClick={() => navigate("/hotels")}>Back</Button></div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/hotels")}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{hotel.name}</h1>
          <p className="text-muted-foreground flex items-center gap-1"><MapPin className="h-4 w-4" />{hotel.location}</p>
        </div>
        <div className="flex">{Array.from({ length: hotel.star_rating || 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}</div>
      </div>

      <Card><CardContent className="pt-6"><p className="text-muted-foreground">{hotel.description}</p></CardContent></Card>

      {hotel.amenities && hotel.amenities.length > 0 && (
        <div className="flex gap-3 flex-wrap">{hotel.amenities.map((a, i) => <Badge key={i} variant="outline">{a}</Badge>)}</div>
      )}

      <h2 className="text-xl font-bold">Available Rooms</h2>
      {loadingRooms ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500" /></div> :
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms?.filter(r => r.is_available).map((room) => (
            <Card key={room.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start"><h3 className="font-semibold capitalize">{room.room_type}</h3><Badge variant="outline">{room.capacity} guests</Badge></div>
                <p className="text-2xl font-bold">${room.price_per_night}/night</p>
                <Button className="w-full" onClick={() => navigate(`/hotels/${id}/book?room=${room.id}`)}>Book Now</Button>
              </CardContent>
            </Card>
          ))}
          {rooms?.filter(r => r.is_available).length === 0 && <p className="text-muted-foreground">No rooms available</p>}
        </div>}
    </div>
  );
}
