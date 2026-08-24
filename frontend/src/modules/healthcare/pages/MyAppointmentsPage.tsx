import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function MyAppointmentsPage() {
  const navigate = useNavigate();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments"],
    queryFn: () => http.get<{ data: any[] }>("/api/appointments").then((res) => res.data),
  });

  const statusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "default";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/healthcare")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-2xl font-bold">My Appointments</h1>

      {isLoading ? (
        <div className="text-center py-8">Loading appointments...</div>
      ) : !appointments || appointments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No appointments found.
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment: any) => (
            <Card key={appointment.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Dr. {appointment.doctor?.name || appointment.doctor_name || "Doctor"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {appointment.doctor?.specialization ||
                        appointment.specialty ||
                        "Specialty"}
                    </p>
                  </div>
                  <Badge variant={statusVariant(appointment.status)}>
                    {appointment.status || "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Date:{" "}
                  {new Date(
                    appointment.date || appointment.appointment_date
                  ).toLocaleDateString()}
                </p>
                {appointment.time && (
                  <p className="text-sm text-muted-foreground">
                    Time: {appointment.time}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
