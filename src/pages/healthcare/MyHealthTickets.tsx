import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, User, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface HealthTicket {
  id: string;
  ticket_number: string;
  symptoms: string;
  description: string | null;
  status: string;
  appointment_date: string | null;
  appointment_time: string | null;
  is_random_assignment: boolean;
  created_at: string;
  doctor: {
    full_name: string;
    specialization: string;
  } | null;
}

const MyHealthTickets = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState<HealthTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    fetchTickets();
  }, [isAuthenticated, user]);

  const fetchTickets = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("health_tickets")
      .select(`
        *,
        doctor:doctors (
          full_name,
          specialization
        )
      `)
      .eq("patient_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets:", error);
      return;
    }

    setTickets(data || []);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/20 text-warning border-warning/30";
      case "assigned":
        return "bg-primary/20 text-primary border-primary/30";
      case "in_progress":
        return "bg-secondary/20 text-secondary border-secondary/30";
      case "completed":
        return "bg-success/20 text-success border-success/30";
      case "cancelled":
        return "bg-destructive/20 text-destructive border-destructive/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
      case "assigned":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading your health tickets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">My Health Tickets</h1>
          <Button onClick={() => navigate("/healthcare/book")}>
            Book Appointment
          </Button>
        </div>

        {tickets.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No appointments yet</h3>
            <p className="text-muted-foreground mb-4">
              Book your first appointment with a doctor
            </p>
            <Button onClick={() => navigate("/healthcare/book")}>
              Book Now
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-sm text-primary font-bold">
                        {ticket.ticket_number}
                      </span>
                      <Badge
                        variant="outline"
                        className={getStatusColor(ticket.status)}
                      >
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1 capitalize">{ticket.status}</span>
                      </Badge>
                    </div>

                    <p className="font-medium mb-2">{ticket.symptoms}</p>
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {ticket.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {ticket.doctor ? (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>
                            Dr. {ticket.doctor.full_name} ({ticket.doctor.specialization})
                          </span>
                        </div>
                      ) : ticket.is_random_assignment ? (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>Awaiting doctor assignment</span>
                        </div>
                      ) : null}

                      {ticket.appointment_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(ticket.appointment_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      )}

                      {ticket.appointment_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{ticket.appointment_time}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Created{" "}
                      {format(new Date(ticket.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyHealthTickets;
