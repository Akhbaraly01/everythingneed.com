import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Reservation {
  id: string;
  hotel?: { id: string; name: string; city: string } | null;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: number;
}

export default function ReservationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["hotel-reservations", "mine"],
    queryFn: async () => {
      const res = await http.get<any>("/api/hotels/reservations/mine");
      return res.data || [];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => http.post(`/api/hotels/reservations/${id}/cancel`),
    onSuccess: () => {
      toast({ title: "Reservation cancelled" });
      queryClient.invalidateQueries({ queryKey: ["hotel-reservations"] });
    },
    onError: (error) =>
      toast({
        title: "Cancellation failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      }),
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <h1 className="text-2xl font-bold">My Reservations</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
        </div>
      ) : (
        <div className="space-y-4">
          {(reservations ?? []).map((r: Reservation) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{r.hotel?.name ?? "Hotel"}</h3>
                  {r.hotel?.city && (
                    <p className="text-xs text-muted-foreground">{r.hotel.city}</p>
                  )}
                  <p className="text-sm flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(r.check_in_date).toLocaleDateString()} – {new Date(r.check_out_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right space-y-1.5">
                  <Badge variant={r.status === "confirmed" ? "default" : r.status === "cancelled" ? "destructive" : "secondary"}>
                    {r.status}
                  </Badge>
                  <p className="font-bold">${Number(r.total_amount).toFixed(2)}</p>
                  {["pending", "confirmed"].includes(r.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(r.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {reservations?.length === 0 && (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground">No reservations yet</p>
              <Button onClick={() => navigate("/hotels")}>Browse hotels</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
