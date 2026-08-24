import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Room {
  id: string;
  room_type: string;
  price_per_night: string;
  currency: string;
  capacity: number;
}

const HotelBookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const preselectedRoom = searchParams.get("room") ?? "";

  const [roomId, setRoomId] = useState(preselectedRoom);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ id: string; total: string } | null>(null);

  const roomsRes = useQuery({
    queryKey: ["hotel-rooms", id],
    queryFn: async () => {
      const res = await http.get<any>(`/api/hotels/${id}/rooms`);
      return res.data || [];
    },
    enabled: !!id,
  });

  const selectedRoom = (roomsRes.data as Room[] | undefined)?.find((r) => r.id === roomId);

  const nights =
    checkIn && checkOut
      ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 0;

  const total = selectedRoom ? Number(selectedRoom.price_per_night) * Math.max(1, nights) : 0;

  const handleReserve = async () => {
    if (!roomId || !checkIn || !checkOut) {
      toast({ title: "Missing details", description: "Pick a room and dates.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await http.post<any>(`/api/hotels/${id}/reserve`, {
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        special_requests: specialRequests || undefined,
      });
      setConfirmed({ id: res.data.id, total: res.data.total_amount });
    } catch (error) {
      toast({
        title: "Reservation failed",
        description: error instanceof Error ? error.message : "Those dates may be taken.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Reservation confirmed</h1>
        <p className="text-muted-foreground text-sm mb-1">
          Total <span className="font-semibold text-foreground">${Number(confirmed.total).toFixed(2)}</span> · pay at the property.
        </p>
        <p className="text-xs text-muted-foreground mb-6 font-mono">{confirmed.id}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate("/hotels/reservations")}>View my reservations</Button>
          <Button variant="outline" onClick={() => navigate("/hotels")}>Back to hotels</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate(`/hotels/${id}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to hotel
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-primary" /> Book your stay
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Room *</Label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Choose a room…</option>
              {(roomsRes.data as Room[] | undefined)?.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_type} — ${Number(r.price_per_night).toFixed(0)}/night · up to {r.capacity} guests
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Check-in *</span>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Check-out *</span>
              <input
                type="date"
                min={checkIn || new Date().toISOString().slice(0, 10)}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Guests</span>
              <input
                type="number"
                min={1}
                max={selectedRoom?.capacity ?? 10}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </label>
            <div className="space-y-1">
              <span className="text-sm font-medium">Total</span>
              <div className="h-9 flex items-center font-bold text-primary">
                ${total.toFixed(2)}
                {nights > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {nights} night{nights > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="requests">Special requests</Label>
            <Textarea
              id="requests"
              rows={2}
              placeholder="Late check-in, high floor…"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            />
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!roomId || !checkIn || !checkOut || submitting}
            onClick={handleReserve}
          >
            {submitting ? "Reserving…" : `Reserve now — $${total.toFixed(2)}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HotelBookingPage;
