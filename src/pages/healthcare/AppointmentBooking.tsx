import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isSameDay } from "date-fns";

interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  qualification: string;
  consultation_fee: number;
  avatar_url: string | null;
}

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

const AppointmentBooking = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    addDays(new Date(), 1)
  );
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [symptoms, setSymptoms] = useState("");
  const [description, setDescription] = useState("");
  const [consultationType, setConsultationType] = useState<"physical" | "virtual">(
    "physical"
  );
  const isRandomAssignment = doctorId === "random";

  useEffect(() => {
    if (!isRandomAssignment && doctorId) {
      fetchDoctor();
    } else {
      setLoading(false);
    }
  }, [doctorId]);

  const fetchDoctor = async () => {
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("id", doctorId)
      .single();

    if (error || !data) {
      toast({
        title: "Doctor not found",
        description: "Please select another doctor",
        variant: "destructive",
      });
      navigate("/healthcare/book");
      return;
    }

    setDoctor(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to book an appointment",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Select date and time",
        description: "Please choose an appointment date and time slot",
        variant: "destructive",
      });
      return;
    }

    if (!symptoms.trim()) {
      toast({
        title: "Symptoms required",
        description: "Please describe your symptoms",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase
      .from("health_tickets")
      .insert({
        patient_id: user.id,
        doctor_id: isRandomAssignment ? null : doctorId,
        symptoms: symptoms,
        description: description || null,
        appointment_date: format(selectedDate, "yyyy-MM-dd"),
        appointment_time: selectedTime,
        is_random_assignment: isRandomAssignment,
      } as any)
      .select()
      .single();

    if (error) {
      toast({
        title: "Booking failed",
        description: "Could not create appointment. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    toast({
      title: "Appointment booked!",
      description: `Your ticket number is ${data.ticket_number}`,
    });

    navigate("/healthcare/tickets");
  };

  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date > addDays(today, 30);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/healthcare/book")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Doctors
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          Book Appointment
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Doctor Info */}
          {doctor && !isRandomAssignment && (
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={doctor.avatar_url || undefined} />
                  <AvatarFallback>
                    {doctor.full_name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold text-lg">{doctor.full_name}</h2>
                  <p className="text-muted-foreground">{doctor.specialization}</p>
                  <p className="text-sm text-muted-foreground">
                    {doctor.qualification}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm text-muted-foreground">Consultation Fee</p>
                  <p className="text-xl font-bold text-primary">
                    ${Number(doctor.consultation_fee)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {isRandomAssignment && (
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">Auto-Assignment Mode</h3>
                  <p className="text-sm text-muted-foreground">
                    An available doctor will be assigned based on your symptoms and
                    availability. You'll be notified once assigned.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Select Date
              </h3>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={disabledDays}
                className="rounded-md border"
              />
            </Card>

            {/* Time & Type Selection */}
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Select Time Slot
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-semibold mb-3 block">
                  Consultation Type
                </Label>
                <RadioGroup
                  value={consultationType}
                  onValueChange={(v) =>
                    setConsultationType(v as "physical" | "virtual")
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="physical" id="physical" />
                    <Label htmlFor="physical" className="cursor-pointer">
                      Physical Visit
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="virtual" id="virtual" />
                    <Label htmlFor="virtual" className="cursor-pointer">
                      Virtual Call
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </Card>
          </div>

          {/* Symptoms */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Describe Your Symptoms</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="symptoms">Main Symptoms *</Label>
                <Textarea
                  id="symptoms"
                  placeholder="What symptoms are you experiencing?"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Additional Details (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Any additional information the doctor should know..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Booking..." : "Confirm Appointment"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AppointmentBooking;
