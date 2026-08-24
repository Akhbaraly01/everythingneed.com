import { useState } from "react";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CalendarPlus, Star, GraduationCap, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AvailabilitySlot {
  id: string;
  status_message: string | null;
}

interface DoctorProfile {
  id: string;
  full_name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: string | number;
  virtual_fee: string | number | null;
  rating?: number;
  is_available?: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [consultationType, setConsultationType] = useState("in_person");
  const [symptoms, setSymptoms] = useState("");
  const [description, setDescription] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const { data: doctor, isLoading } = useQuery({
    queryKey: ["doctor", id],
    queryFn: () => http.get<{ data: DoctorProfile }>(`/api/doctors/${id}`).then((res) => res.data),
    retry: false,
  });

  const { data: availability = [] } = useQuery({
    queryKey: ["doctor-availability", id],
    queryFn: () =>
      http
        .get<{ data: AvailabilitySlot[] }>(`/api/doctors/${id}/availability`)
        .then((res) => res.data ?? []),
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      http.post("/api/appointments", {
        doctor_id: id,
        symptoms,
        description: description || undefined,
        consultation_type: consultationType,
        appointment_date: appointmentDate || undefined,
        appointment_time: appointmentTime || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Appointment requested", description: "You can track it in My Appointments." });
      navigate("/healthcare/appointments");
    },
    onError: (error) => {
      toast({
        title: "Booking failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading doctor profile...</div>;
  }

  if (!doctor) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-muted-foreground">Doctor not found.</p>
        <Button variant="outline" onClick={() => navigate("/healthcare")}>Back to directory</Button>
      </div>
    );
  }

  const fee =
    consultationType === "virtual"
      ? Number(doctor.virtual_fee ?? doctor.consultation_fee)
      : Number(doctor.consultation_fee);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/healthcare")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to directory
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{doctor.full_name}</CardTitle>
              <p className="text-muted-foreground mt-1">{doctor.specialization}</p>
            </div>
            {typeof doctor.rating === "number" && doctor.rating > 0 && (
              <Badge variant="secondary">
                <Star className="h-3 w-3 mr-1 text-yellow-500" /> {Number(doctor.rating).toFixed(1)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap className="h-4 w-4 text-primary" />
            {doctor.qualification || "—"}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-primary" />
            {doctor.experience_years ?? "—"} years experience
          </div>
          <div className="text-sm">
            <span className="font-medium">In-person fee:</span> ${Number(doctor.consultation_fee).toFixed(2)}
          </div>
          <div className="text-sm">
            <span className="font-medium">Virtual fee:</span>{" "}
            {doctor.virtual_fee != null ? `$${Number(doctor.virtual_fee).toFixed(2)}` : "Same as in-person"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarPlus className="h-4 w-4 text-primary" /> Book an appointment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Consultation type</Label>
              <Select value={consultationType} onValueChange={setConsultationType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In person</SelectItem>
                  <SelectItem value="virtual">Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Preferred time</Label>
              <input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fee</Label>
              <div className="h-9 flex items-center font-semibold">${fee.toFixed(2)}</div>
            </div>
          </div>

          {availability.length > 0 && (
            <div className="rounded-lg border p-3 bg-muted/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Weekly availability
              </p>
              <ul className="space-y-1 text-sm">
                {availability.map((slot) => (
                  <li key={slot.id}>{slot.status_message ?? "Available"}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="symptoms">Symptoms *</Label>
            <Textarea
              id="symptoms"
              rows={2}
              required
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. Chest pain, fever…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Additional details (optional)</Label>
            <Textarea
              id="desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Medical history, current medication…"
            />
          </div>

          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={!symptoms.trim() || bookMutation.isPending}
            onClick={() => bookMutation.mutate()}
          >
            {bookMutation.isPending ? "Requesting…" : `Request appointment — $${fee.toFixed(2)}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
