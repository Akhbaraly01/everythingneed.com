import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Video,
  MapPin,
  XCircle,
  RotateCw,
  Bell,
  DollarSign,
} from "lucide-react";
import { Button } from "@shared/ui/button";
import { Card } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shared/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@shared/ui/alert-dialog";
import { db } from "@core/api/laravelGateway";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format, isAfter, isBefore, differenceInHours, parseISO } from "date-fns";
import { toast } from "sonner";

interface HealthTicket {
  id: string;
  ticket_number: string;
  symptoms: string;
  description: string | null;
  status: string;
  appointment_date: string | null;
  appointment_time: string | null;
  is_random_assignment: boolean;
  consultation_type: string | null;
  consultation_fee: number | null;
  created_at: string;
  doctor_id: string | null;
  doctor: {
    full_name: string;
    specialization: string;
  } | null;
}

type TicketFilter = "upcoming" | "past" | "cancelled";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/20 text-warning border-warning/30",
  assigned: "bg-primary/20 text-primary border-primary/30",
  in_progress: "bg-secondary/20 text-secondary border-secondary/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const MyHealthTickets = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const [tickets, setTickets] = useState<HealthTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TicketFilter>("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  const fetchTickets = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const data = await db
        .from("health_tickets")
        .select("*")
        .where("patient_id", "=", user.id)
        .orderBy("appointment_date", false)
        .orderBy("created_at", false);

      setTickets((data as unknown as HealthTicket[]) || []);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Could not load appointments");
    }
    setLoading(false);
  };

  const { upcoming, past, cancelled } = useMemo(() => {
    const now = new Date();
    const up: HealthTicket[] = [];
    const pa: HealthTicket[] = [];
    const ca: HealthTicket[] = [];
    for (const t of tickets) {
      if (t.status === "cancelled") {
        ca.push(t);
        continue;
      }
      if (t.status === "completed") {
        pa.push(t);
        continue;
      }
      if (!t.appointment_date) {
        up.push(t);
        continue;
      }
      const apptStart = parseISO(
        `${t.appointment_date}T${t.appointment_time || "00:00"}:00`,
      );
      if (isAfter(apptStart, now)) up.push(t);
      else pa.push(t);
    }
    return { upcoming: up, past: pa, cancelled: ca };
  }, [tickets]);

  const visible =
    filter === "upcoming" ? upcoming : filter === "past" ? past : cancelled;

  const handleCancel = async (ticket: HealthTicket) => {
    setCancellingId(ticket.id);
    try {
      await db
        .from("health_tickets")
        .update({ status: "cancelled" })
        .where("id", "=", ticket.id)
        .where("patient_id", "=", user!.id);

      toast.success(`Appointment ${ticket.ticket_number} cancelled`);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: "cancelled" } : t)),
      );
    } catch {
      toast.error("Could not cancel appointment");
    }
    setCancellingId(null);
  };

  const handleReschedule = (ticket: HealthTicket) => {
    if (ticket.doctor_id) {
      navigate(`/healthcare/book/${ticket.doctor_id}`);
    } else {
      navigate("/healthcare/book");
    }
  };

  const renderReminderBadge = (ticket: HealthTicket) => {
    if (!ticket.appointment_date || filter !== "upcoming") return null;
    const apptStart = parseISO(
      `${ticket.appointment_date}T${ticket.appointment_time || "00:00"}:00`,
    );
    const hours = differenceInHours(apptStart, new Date());
    if (hours < 0 || hours > 24) return null;
    return (
      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1">
        <Bell className="h-3 w-3" />
        {hours <= 1 ? "Soon" : `In ${hours}h`}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading your appointments…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">My Appointments</h1>
          <Button onClick={() => navigate("/healthcare/book")} data-testid="book-appointment-cta">
            Book Appointment
          </Button>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as TicketFilter)} className="mb-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Past ({past.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" data-testid="tab-cancelled">
              Cancelled ({cancelled.length})
            </TabsTrigger>
          </TabsList>

          {(["upcoming", "past", "cancelled"] as TicketFilter[]).map((f) => (
            <TabsContent key={f} value={f} className="mt-6">
              {visible.length === 0 ? (
                <Card className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No {f} appointments
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {f === "upcoming"
                      ? "Book your next appointment with a doctor"
                      : f === "past"
                        ? "Your past appointments will appear here"
                        : "Cancelled appointments will appear here"}
                  </p>
                  {f === "upcoming" && (
                    <Button onClick={() => navigate("/healthcare/book")}>Book Now</Button>
                  )}
                </Card>
              ) : (
                <div className="space-y-4" data-testid="tickets-list">
                  {visible.map((ticket) => (
                    <Card
                      key={ticket.id}
                      className="p-6 hover:shadow-md transition-shadow"
                      data-testid="ticket-card"
                      data-ticket-status={ticket.status}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="font-mono text-sm text-primary font-bold">
                              {ticket.ticket_number}
                            </span>
                            <Badge
                              variant="outline"
                              className={STATUS_STYLES[ticket.status] || "bg-muted"}
                            >
                              <span className="capitalize">{ticket.status.replace("_", " ")}</span>
                            </Badge>
                            {ticket.consultation_type && (
                              <Badge variant="secondary" className="gap-1">
                                {ticket.consultation_type === "virtual" ? (
                                  <><Video className="h-3 w-3" /> Virtual</>
                                ) : (
                                  <><MapPin className="h-3 w-3" /> Physical</>
                                )}
                              </Badge>
                            )}
                            {renderReminderBadge(ticket)}
                          </div>

                          <p className="font-medium mb-2">{ticket.symptoms}</p>
                          {ticket.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
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
                                  {format(parseISO(ticket.appointment_date), "MMM d, yyyy")}
                                </span>
                              </div>
                            )}

                            {ticket.appointment_time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{ticket.appointment_time}</span>
                              </div>
                            )}

                            {ticket.consultation_fee ? (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatPrice(Number(ticket.consultation_fee))}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex md:flex-col items-end gap-2 shrink-0">
                          {f === "upcoming" && ticket.status !== "completed" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReschedule(ticket)}
                                data-testid="reschedule-btn"
                              >
                                <RotateCw className="h-3.5 w-3.5 mr-1" />
                                Reschedule
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    disabled={cancellingId === ticket.id}
                                    data-testid="cancel-btn"
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Cancel
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel appointment?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to cancel {ticket.ticket_number}?
                                      This action cannot be undone. You can rebook anytime.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep appointment</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleCancel(ticket)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Yes, cancel
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Created {format(parseISO(ticket.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default MyHealthTickets;
