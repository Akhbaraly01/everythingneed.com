import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, Clock, DollarSign, Users } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Card } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { db } from "@core/api/laravelGateway";

interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  virtual_fee: number | null;
  rating: number | null;
  avatar_url: string | null;
  is_available: boolean;
}

const DoctorSelection = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("all");
  const [specializations, setSpecializations] = useState<string[]>([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const data = await db
        .from("doctors")
        .select("*")
        .where("is_available", "=", true)
        .orderBy("rating", false);

      setDoctors(((data as unknown as Doctor[]) || []));
      const uniqueSpecs = [...new Set(((data as unknown as Doctor[]) || []).map((d) => d.specialization))];
      setSpecializations(uniqueSpecs);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
    setLoading(false);
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec =
      selectedSpecialization === "all" ||
      doctor.specialization === selectedSpecialization;
    return matchesSearch && matchesSpec;
  });

  const handleSelectDoctor = (doctorId: string) => {
    navigate(`/healthcare/book/${doctorId}`);
  };

  const handleRandomAssignment = () => {
    navigate("/healthcare/book/random");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-2">
            Find a Doctor
          </h1>
          <p className="text-primary-foreground/80 mb-6">
            Book an appointment with our experienced healthcare professionals
          </p>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search doctors by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <Select
              value={selectedSpecialization}
              onValueChange={setSelectedSpecialization}
            >
              <SelectTrigger className="w-full md:w-48 bg-background">
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {specializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Random Assignment Option */}
        <Card className="p-6 mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Not sure which doctor to choose?
              </h3>
              <p className="text-muted-foreground text-sm">
                Let us assign an available doctor based on your symptoms
              </p>
            </div>
            <Button onClick={handleRandomAssignment}>
              <Users className="h-4 w-4 mr-2" />
              Auto-Assign Doctor
            </Button>
          </div>
        </Card>

        {/* Doctors Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-muted rounded" />
              </Card>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No doctors found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="doctor-list">
            {filteredDoctors.map((doctor) => {
              const physical = Number(doctor.consultation_fee);
              const virtual =
                doctor.virtual_fee != null
                  ? Number(doctor.virtual_fee)
                  : Math.round(physical * 0.7);
              const savings = Math.max(0, physical - virtual);
              return (
                <Card
                  key={doctor.id}
                  className="p-6 hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                  data-testid="doctor-card"
                  data-doctor-id={doctor.id}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={doctor.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {doctor.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{doctor.full_name}</h3>
                        {doctor.is_available && (
                          <Badge className="bg-success/15 text-success border-success/30 shrink-0">
                            Available
                          </Badge>
                        )}
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        {doctor.specialization}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {doctor.qualification}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-3 w-3 fill-warning text-warning" />
                        <span className="font-medium text-sm">
                          {doctor.rating ? Number(doctor.rating).toFixed(1) : "New"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="font-medium text-sm">
                          {doctor.experience_years}y
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Exp.</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium text-sm">${physical}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Physical</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4 p-2 rounded-lg bg-success/5 border border-success/20">
                    <span className="text-xs text-muted-foreground">Virtual visit</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-success">${virtual}</span>
                      {savings > 0 && (
                        <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">
                          Save ${savings}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleSelectDoctor(doctor.id)}
                    data-testid="book-doctor-btn"
                  >
                    Book Appointment
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorSelection;
