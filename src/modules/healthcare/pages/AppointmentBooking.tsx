import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@core/api/supabaseGateway";
import { useToast } from "@/hooks/use-toast";
import AppointmentCalendar from "../components/AppointmentCalendar";

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

const AppointmentBooking = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
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

  const handleSuccess = (ticketNumber: string) => {
    toast({
      title: "Appointment booked!",
      description: `Your ticket number is ${ticketNumber}`,
    });
    navigate("/healthcare/tickets");
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

        <AppointmentCalendar
          doctor={doctor}
          isRandomAssignment={isRandomAssignment}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
};

export default AppointmentBooking;
