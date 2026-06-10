import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ArrowLeft, Star, Clock, MapPin, Award, Phone, Video,
  Search, Filter, CheckCircle2, Baby, Stethoscope
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { supabase } from "@core/api/supabaseGateway";

interface SpecialtyDoctor {
  id: string;
  name: string;
  specialty: string;
  subSpecialty?: string;
  experience: number;
  rating: number;
  consultationFee: number;
  image: string;
  available: boolean;
  languages: string[];
  education: string;
}

const specialtyData: Record<string, { title: string; description: string; icon: React.ReactNode; doctors: SpecialtyDoctor[] }> = {
  pediatrics: {
    title: "Pediatrics",
    description: "Child healthcare specialists for infants, children, and adolescents",
    icon: <Baby className="h-6 w-6" />,
    doctors: [
      { id: "ped1", name: "Dr. Sarah Johnson", specialty: "Pediatrics", subSpecialty: "Neonatology", experience: 12, rating: 4.9, consultationFee: 60, image: "https://i.pravatar.cc/150?u=ped1", available: true, languages: ["English", "Spanish"], education: "MD, Johns Hopkins" },
      { id: "ped2", name: "Dr. Michael Chen", specialty: "Pediatrics", subSpecialty: "Pediatric Cardiology", experience: 15, rating: 4.8, consultationFee: 75, image: "https://i.pravatar.cc/150?u=ped2", available: true, languages: ["English", "Mandarin"], education: "MD, Harvard Medical" },
      { id: "ped3", name: "Dr. Emily Brown", specialty: "Pediatrics", subSpecialty: "Developmental Pediatrics", experience: 8, rating: 4.7, consultationFee: 55, image: "https://i.pravatar.cc/150?u=ped3", available: true, languages: ["English"], education: "MD, Stanford" },
      { id: "ped4", name: "Dr. James Wilson", specialty: "Pediatrics", subSpecialty: "Pediatric Neurology", experience: 20, rating: 4.9, consultationFee: 90, image: "https://i.pravatar.cc/150?u=ped4", available: false, languages: ["English", "French"], education: "MD, Yale" },
    ]
  },
  dentistry: {
    title: "Dentistry",
    description: "Dental care including general, cosmetic, and oral surgery",
    icon: <Stethoscope className="h-6 w-6" />,
    doctors: [
      { id: "den1", name: "Dr. Amanda White", specialty: "Dentistry", subSpecialty: "General Dentistry", experience: 10, rating: 4.8, consultationFee: 50, image: "https://i.pravatar.cc/150?u=den1", available: true, languages: ["English"], education: "DDS, UCLA" },
      { id: "den2", name: "Dr. Robert Kim", specialty: "Dentistry", subSpecialty: "Orthodontics", experience: 14, rating: 4.9, consultationFee: 80, image: "https://i.pravatar.cc/150?u=den2", available: true, languages: ["English", "Korean"], education: "DDS, NYU" },
      { id: "den3", name: "Dr. Lisa Martinez", specialty: "Dentistry", subSpecialty: "Oral Surgery", experience: 18, rating: 4.7, consultationFee: 120, image: "https://i.pravatar.cc/150?u=den3", available: true, languages: ["English", "Spanish"], education: "DMD, UPenn" },
      { id: "den4", name: "Dr. David Lee", specialty: "Dentistry", subSpecialty: "Cosmetic Dentistry", experience: 12, rating: 4.8, consultationFee: 100, image: "https://i.pravatar.cc/150?u=den4", available: false, languages: ["English"], education: "DDS, Columbia" },
    ]
  },
  cardiology: {
    title: "Cardiology",
    description: "Heart and cardiovascular system specialists",
    icon: <Stethoscope className="h-6 w-6" />,
    doctors: [
      { id: "car1", name: "Dr. Richard Adams", specialty: "Cardiology", subSpecialty: "Interventional Cardiology", experience: 22, rating: 4.9, consultationFee: 100, image: "https://i.pravatar.cc/150?u=car1", available: true, languages: ["English"], education: "MD, Mayo Clinic" },
      { id: "car2", name: "Dr. Jennifer Park", specialty: "Cardiology", subSpecialty: "Electrophysiology", experience: 16, rating: 4.8, consultationFee: 95, image: "https://i.pravatar.cc/150?u=car2", available: true, languages: ["English", "Korean"], education: "MD, Cleveland Clinic" },
    ]
  },
  dermatology: {
    title: "Dermatology",
    description: "Skin, hair, and nail specialists",
    icon: <Stethoscope className="h-6 w-6" />,
    doctors: [
      { id: "der1", name: "Dr. Sophia Taylor", specialty: "Dermatology", subSpecialty: "Cosmetic Dermatology", experience: 11, rating: 4.8, consultationFee: 70, image: "https://i.pravatar.cc/150?u=der1", available: true, languages: ["English"], education: "MD, Duke" },
      { id: "der2", name: "Dr. William Green", specialty: "Dermatology", subSpecialty: "Pediatric Dermatology", experience: 13, rating: 4.7, consultationFee: 65, image: "https://i.pravatar.cc/150?u=der2", available: true, languages: ["English", "Spanish"], education: "MD, USC" },
    ]
  },
};

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
];

const SpecialtyBooking = () => {
  const { specialty } = useParams<{ specialty: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  
  const [selectedDoctor, setSelectedDoctor] = useState<SpecialtyDoctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [consultationType, setConsultationType] = useState("physical");
  const [symptoms, setSymptoms] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const specialtyInfo = specialtyData[specialty || ""] || specialtyData.pediatrics;

  const filteredDoctors = specialtyInfo.doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.subSpecialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookAppointment = async () => {
    if (!user) {
      toast.error("Please sign in to book an appointment");
      navigate("/auth");
      return;
    }

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const ticketNumber = `${specialty?.toUpperCase().slice(0, 3)}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      const { error } = await supabase.from("health_tickets").insert({
        patient_id: user.id,
        ticket_number: ticketNumber,
        symptoms: symptoms || `${specialtyInfo.title} consultation`,
        description: `${consultationType === "virtual" ? "Virtual" : "Physical"} consultation with ${selectedDoctor.name}`,
        appointment_date: selectedDate.toISOString().split("T")[0],
        appointment_time: selectedTime,
        status: "pending",
        is_random_assignment: false,
      });

      if (error) throw error;

      toast.success("Appointment booked successfully!");
      navigate("/healthcare/tickets");
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/healthcare">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                {specialtyInfo.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{specialtyInfo.title}</h1>
                <p className="text-white/80">{specialtyInfo.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!selectedDoctor ? (
          // Doctor Selection View
          <div className="space-y-6">
            {/* Search */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors by name or specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Doctor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map(doctor => (
                <Card 
                  key={doctor.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${!doctor.available ? "opacity-60" : ""}`}
                  onClick={() => doctor.available && setSelectedDoctor(doctor)}
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={doctor.image} />
                        <AvatarFallback>{doctor.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{doctor.name}</h3>
                            <p className="text-sm text-muted-foreground">{doctor.subSpecialty}</p>
                          </div>
                          <Badge className={doctor.available ? "bg-success" : "bg-muted"}>
                            {doctor.available ? "Available" : "Unavailable"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            {doctor.rating}
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            {doctor.experience} yrs
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            Available
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mt-2">{doctor.education}</p>

                        <div className="flex items-center justify-between mt-4">
                          <p className="text-lg font-bold text-primary">{formatPrice(doctor.consultationFee)}</p>
                          {doctor.available && (
                            <Button size="sm">Book Now</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Booking Form View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Doctor Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={selectedDoctor.image} />
                      <AvatarFallback>{selectedDoctor.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{selectedDoctor.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedDoctor.subSpecialty}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline">{selectedDoctor.experience} yrs exp</Badge>
                        <Badge variant="outline" className="gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {selectedDoctor.rating}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedDoctor(null)}>
                      Change Doctor
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Consultation Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Consultation Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={consultationType} onValueChange={setConsultationType} className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${consultationType === "physical" ? "border-primary bg-primary/5" : "border-muted"}`}>
                      <RadioGroupItem value="physical" id="physical" className="sr-only" />
                      <Label htmlFor="physical" className="cursor-pointer flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Physical Visit</p>
                          <p className="text-sm text-muted-foreground">In-person consultation</p>
                        </div>
                      </Label>
                    </div>
                    <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${consultationType === "virtual" ? "border-primary bg-primary/5" : "border-muted"}`}>
                      <RadioGroupItem value="virtual" id="virtual" className="sr-only" />
                      <Label htmlFor="virtual" className="cursor-pointer flex items-center gap-3">
                        <Video className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Virtual Consultation</p>
                          <p className="text-sm text-muted-foreground">Video call</p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Date & Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Date & Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date > new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                      className="rounded-md border"
                    />
                    <div>
                      <Label className="mb-3 block">Available Time Slots</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map(slot => (
                          <Button
                            key={slot}
                            variant={selectedTime === slot ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(slot)}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Symptoms */}
              <Card>
                <CardHeader>
                  <CardTitle>Describe Your Symptoms</CardTitle>
                  <CardDescription>Help the doctor understand your condition better</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Describe your symptoms, concerns, or reason for visit..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Doctor</span>
                      <span className="font-medium">{selectedDoctor.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Specialty</span>
                      <span>{selectedDoctor.subSpecialty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant="outline">
                        {consultationType === "virtual" ? "Virtual" : "Physical"}
                      </Badge>
                    </div>
                    {selectedDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span>{selectedDate.toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedTime && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <span>{selectedTime}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Consultation Fee</span>
                      <span className="text-primary">{formatPrice(selectedDoctor.consultationFee)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleBookAppointment}
                    disabled={!selectedDate || !selectedTime || isSubmitting}
                  >
                    {isSubmitting ? "Booking..." : "Confirm Appointment"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By booking, you agree to our terms and cancellation policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialtyBooking;
