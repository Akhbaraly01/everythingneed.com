import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@core/api/supabaseGateway";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  MapPin, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Star,
  Loader2
} from "lucide-react";

interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  virtual_fee?: number;
  rating: number | null;
  avatar_url: string | null;
  is_available: boolean;
}

interface AppointmentCalendarProps {
  doctor: Doctor | null;
  isRandomAssignment?: boolean;
  onSuccess?: (ticketNumber: string) => void;
}

const timeSlots = [
  { time: "09:00", period: "Morning" },
  { time: "09:30", period: "Morning" },
  { time: "10:00", period: "Morning" },
  { time: "10:30", period: "Morning" },
  { time: "11:00", period: "Morning" },
  { time: "11:30", period: "Morning" },
  { time: "14:00", period: "Afternoon" },
  { time: "14:30", period: "Afternoon" },
  { time: "15:00", period: "Afternoon" },
  { time: "15:30", period: "Afternoon" },
  { time: "16:00", period: "Afternoon" },
  { time: "16:30", period: "Afternoon" },
  { time: "17:00", period: "Evening" },
  { time: "17:30", period: "Evening" },
  { time: "18:00", period: "Evening" },
];

const AppointmentCalendar = ({ doctor, isRandomAssignment = false, onSuccess }: AppointmentCalendarProps) => {
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [consultationType, setConsultationType] = useState<"physical" | "virtual">("physical");
  const [symptoms, setSymptoms] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Calculate fees
  const physicalFee = doctor?.consultation_fee || 100;
  const virtualFee = doctor?.virtual_fee || Math.round(physicalFee * 0.7);
  const currentFee = consultationType === "virtual" ? virtualFee : physicalFee;
  const savings = physicalFee - virtualFee;

  // Fetch already booked slots for selected date
  useEffect(() => {
    if (selectedDate && doctor && !isRandomAssignment) {
      const fetchBookedSlots = async () => {
        const { data, error } = await supabase
          .from("health_tickets")
          .select("appointment_time")
          .eq("doctor_id", doctor.id)
          .eq("appointment_date", format(selectedDate, "yyyy-MM-dd"))
          .neq("status", "cancelled");

        if (!error && data) {
          setBookedSlots(data.map(d => d.appointment_time || "").filter(Boolean));
        }
      };
      fetchBookedSlots();
    }
  }, [selectedDate, doctor, isRandomAssignment]);

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to book an appointment");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error("Please select date and time");
      return;
    }

    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms");
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("health_tickets")
        .insert({
          patient_id: user.id,
          doctor_id: isRandomAssignment ? null : doctor?.id,
          symptoms: symptoms,
          description: description || null,
          appointment_date: format(selectedDate, "yyyy-MM-dd"),
          appointment_time: selectedTime,
          is_random_assignment: isRandomAssignment,
          consultation_type: consultationType,
          consultation_fee: currentFee
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Call booking confirmation edge function
      try {
        await supabase.functions.invoke('booking-confirmation', {
          body: {
            ticketNumber: data.ticket_number,
            patientName: user.user_metadata?.full_name || user.email,
            doctorName: doctor?.full_name || null,
            appointmentDate: format(selectedDate, "MMM dd, yyyy"),
            appointmentTime: selectedTime,
            consultationType,
            consultationFee: currentFee,
            patientEmail: user.email,
          }
        });
      } catch (emailError) {
        console.log("Confirmation notification pending:", emailError);
      }

      toast.success(`Appointment booked! Ticket: ${data.ticket_number}`);
      onSuccess?.(data.ticket_number);
    } catch (error: any) {
      toast.error(error.message || "Failed to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const disabledDays = (date: Date) => {
    const today = startOfDay(new Date());
    return isBefore(date, today) || date > addDays(today, 30);
  };

  const groupedSlots = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.period]) acc[slot.period] = [];
    acc[slot.period].push(slot);
    return acc;
  }, {} as Record<string, typeof timeSlots>);

  return (
    <div className="space-y-6">
      {/* Doctor Info Card */}
      {doctor && !isRandomAssignment && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={doctor.avatar_url || undefined} />
                <AvatarFallback className="text-xl">
                  {doctor.full_name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{doctor.full_name}</h2>
                <Badge variant="secondary" className="mt-1">{doctor.specialization}</Badge>
                <p className="text-sm text-muted-foreground mt-1">{doctor.qualification}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    {doctor.rating ? Number(doctor.rating).toFixed(1) : "New"}
                  </span>
                  <span>{doctor.experience_years} years exp.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isRandomAssignment && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg">Auto-Assignment Mode</h3>
                <p className="text-muted-foreground">
                  An available doctor will be assigned based on your symptoms and the selected time slot.
                  You'll receive a notification once assigned.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consultation Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Choose Consultation Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={consultationType}
            onValueChange={(v) => setConsultationType(v as "physical" | "virtual")}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
              consultationType === "physical" 
                ? "border-primary bg-primary/5" 
                : "border-muted hover:border-primary/50"
            }`}>
              <RadioGroupItem value="physical" id="physical" className="absolute right-4 top-4" />
              <Label htmlFor="physical" className="cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Physical Visit</p>
                    <p className="text-sm text-muted-foreground">In-person consultation</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">${physicalFee}</p>
                  <p className="text-xs text-muted-foreground">Standard consultation fee</p>
                </div>
              </Label>
            </div>

            <div className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
              consultationType === "virtual" 
                ? "border-primary bg-primary/5" 
                : "border-muted hover:border-primary/50"
            }`}>
              <RadioGroupItem value="virtual" id="virtual" className="absolute right-4 top-4" />
              <Label htmlFor="virtual" className="cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Video className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold">Virtual Consultation</p>
                    <p className="text-sm text-muted-foreground">Video call from home</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-success/10 rounded-lg">
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-success">${virtualFee}</p>
                    <Badge variant="secondary" className="text-xs bg-success/20 text-success">
                      Save ${savings}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">30% discount for virtual visits</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Date & Time Selection */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={disabledDays}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Select Time Slot
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedSlots).map(([period, slots]) => (
              <div key={period}>
                <p className="text-sm font-medium text-muted-foreground mb-2">{period}</p>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map(({ time }) => {
                    const isBooked = bookedSlots.includes(time);
                    return (
                      <Button
                        key={time}
                        type="button"
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        disabled={isBooked}
                        onClick={() => setSelectedTime(time)}
                        className={isBooked ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        {time}
                        {isBooked && <span className="ml-1 text-xs">(Booked)</span>}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Symptoms Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Describe Your Symptoms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="symptoms">Main Symptoms *</Label>
            <Textarea
              id="symptoms"
              placeholder="What symptoms are you experiencing? (e.g., headache, fever, cough)"
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
        </CardContent>
      </Card>

      {/* Summary & Submit */}
      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Appointment Summary</p>
              <div className="flex flex-wrap gap-2">
                {selectedDate && (
                  <Badge variant="outline">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {format(selectedDate, "MMM dd, yyyy")}
                  </Badge>
                )}
                {selectedTime && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {selectedTime}
                  </Badge>
                )}
                <Badge variant={consultationType === "virtual" ? "default" : "secondary"}>
                  {consultationType === "virtual" ? (
                    <><Video className="h-3 w-3 mr-1" /> Virtual</>
                  ) : (
                    <><MapPin className="h-3 w-3 mr-1" /> Physical</>
                  )}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Fee</p>
                <p className="text-2xl font-bold text-primary">${currentFee}</p>
              </div>
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={submitting || !selectedDate || !selectedTime || !symptoms.trim()}
                className="min-w-[150px]"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Booking...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-2" /> Confirm Booking</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentCalendar;
