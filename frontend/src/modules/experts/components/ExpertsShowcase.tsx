import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { Input } from "@shared/ui/input";
import { 
  Search, Star, Users, Calendar, MessageCircle, Filter, 
  GraduationCap, Stethoscope, ChevronLeft, ChevronRight,
  Clock, Globe, Award, CheckCircle, Video, Play
} from "lucide-react";
import { http } from "@core/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shared/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";

const API = import.meta.env.VITE_API_URL || "/api";

interface Expert {
  id: string;
  name: string;
  specialty: string;
  title: string;
  avatar: string;
  rating: number;
  experience: number;
  availability: string;
  hourlyRate?: number;
  bio?: string;
  category?: string;
}

interface ExpertsShowcaseProps {
  category: 'learn' | 'healthcare' | 'needs' | 'all';
  title?: string;
  showFilters?: boolean;
  limit?: number;
  compact?: boolean;
}

const ExpertsShowcase = ({ 
  category = 'all', 
  title, 
  showFilters = true,
  limit,
  compact = false
}: ExpertsShowcaseProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const EXPERTS_PER_PAGE = limit || 8;
  const [allExperts, setAllExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperts = async () => {
      setLoading(true);
      const experts: Expert[] = [];
      try {
        if (category === 'learn' || category === 'all') {
          const res = await http.get<any>(`${API}/courses?with_instructor=true&per_page=20`).catch(() => null);
          if (res) {
            const courses = res?.data || res || [];
            (Array.isArray(courses) ? courses : []).forEach((c: any) => {
              if (c.instructor) {
                experts.push({
                  id: `learn-${c.instructor.id || c.instructor.user_id}`,
                  name: c.instructor_name || "Instructor",
                  specialty: c.category?.name || "Teaching",
                  title: "Course Instructor",
                  avatar: c.instructor.user?.avatar || c.instructor.avatar || "",
                  rating: c.instructor.rating || c.rating || 4.5,
                  experience: c.instructor.experience_years || 5,
                  availability: "available",
                  category: "learn",
                });
              }
            });
          }
        }

        if (category === 'healthcare' || category === 'all') {
          const res = await http.get<any>(`${API}/doctors?per_page=20`).catch(() => null);
          if (res) {
            const doctors = res?.data || res || [];
            (Array.isArray(doctors) ? doctors : []).forEach((d: any) => {
              experts.push({
                id: `health-${d.id}`,
                name: `Dr. ${d.full_name?.split(' ')[0] || ""} ${d.full_name?.split(' ').slice(1).join(' ') || ""}`.trim(),
                specialty: d.specialization || "General Practice",
                title: d.qualifications || "Medical Doctor",
                avatar: d.avatar_url || "",
                rating: d.rating || 4.5,
                experience: d.experience_years || 5,
                availability: d.is_available ? "available" : "busy",
                hourlyRate: d.consultation_fee,
                category: "healthcare",
              });
            });
          }
        }
      } catch (e) {
        console.error("Failed to load experts:", e);
      }
      setAllExperts(experts);
      setLoading(false);
    };
    fetchExperts();
  }, [category]);

  // Get unique specialties
  const specialties = useMemo(() => {
    const specs = [...new Set(allExperts.map(e => e.specialty))];
    return specs.sort();
  }, [allExperts]);

  // Filter experts
  const filteredExperts = useMemo(() => {
    return allExperts.filter(expert => {
      const matchesSearch = 
        expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecialty = selectedSpecialty === "all" || expert.specialty === selectedSpecialty;
      const matchesAvailability = selectedAvailability === "all" || expert.availability === selectedAvailability;
      
      return matchesSearch && matchesSpecialty && matchesAvailability;
    });
  }, [allExperts, searchQuery, selectedSpecialty, selectedAvailability]);

  // Pagination
  const totalPages = Math.ceil(filteredExperts.length / EXPERTS_PER_PAGE);
  const displayedExperts = filteredExperts.slice(
    currentPage * EXPERTS_PER_PAGE, 
    (currentPage + 1) * EXPERTS_PER_PAGE
  );

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleBooking = (expert: Expert) => {
    if (!user) {
      toast.error("Please sign in to book an appointment");
      navigate("/auth");
      return;
    }
    setSelectedExpert(expert);
    setBookingDialogOpen(true);
  };

  const confirmBooking = () => {
    if (selectedExpert) {
      toast.success(`Booking request sent to ${selectedExpert.name}!`);
      setBookingDialogOpen(false);
      setSelectedExpert(null);
    }
  };

  const learnExperts = useMemo(() => allExperts.filter(e => e.category === 'learn'), [allExperts]);
  const healthcareExperts = useMemo(() => allExperts.filter(e => e.category === 'healthcare'), [allExperts]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold">
            {title || (category === 'learn' ? 'Learning Experts' : category === 'healthcare' ? 'Healthcare Professionals' : 'Our Experts')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {filteredExperts.length} professionals ready to help you
          </p>
        </div>
        <div className="flex items-center gap-2">
          {category === 'all' && (
            <div className="flex gap-1">
              <Badge variant="outline" className="gap-1 text-xs">
                <GraduationCap className="h-3 w-3" />
                {learnExperts.length}
              </Badge>
              <Badge variant="outline" className="gap-1 text-xs">
                <Stethoscope className="h-3 w-3" />
                {healthcareExperts.length}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search experts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Specialty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {specialties.map(spec => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedAvailability} onValueChange={setSelectedAvailability}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Experts Grid - Compact mode for home page - shows ALL experts in horizontal scroll */}
      {compact ? (
        <div className="relative">
          <div 
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {filteredExperts.map((expert) => (
              <Card 
                key={expert.id} 
                className="flex-shrink-0 w-[160px] overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 group cursor-pointer snap-start"
                onClick={() => handleBooking(expert)}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-2">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarImage src={expert.avatar} alt={expert.name} />
                        <AvatarFallback>{expert.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getAvailabilityColor(expert.availability)}`} />
                      {/* Video intro indicator */}
                      <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1">
                        <Play className="h-2 w-2 text-white" />
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-xs line-clamp-1">{expert.name}</h3>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{expert.specialty}</p>
                    
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      {expert.rating}
                      <span>•</span>
                      <span>{expert.experience}yr</span>
                    </div>

                    <Button 
                      size="sm" 
                      className="w-full h-6 text-[10px] mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBooking(expert);
                      }}
                    >
                      Book
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Scroll buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 backdrop-blur-sm -ml-2 z-10"
            onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 bg-background/80 backdrop-blur-sm -mr-2 z-10"
            onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayedExperts.map((expert) => (
            <Card 
              key={expert.id} 
              className="overflow-hidden hover:shadow-lg hover:scale-[1.03] transition-all duration-300 group cursor-pointer"
              onClick={() => handleBooking(expert)}
            >
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-2">
                    <Avatar className="h-16 w-16 border-2 border-primary/20">
                      <AvatarImage src={expert.avatar} alt={expert.name} />
                      <AvatarFallback>{expert.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background ${getAvailabilityColor(expert.availability)}`} />
                    {/* Video intro indicator */}
                    <div className="absolute -top-1 -right-1 bg-primary rounded-full p-1.5">
                      <Play className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-sm line-clamp-1">{expert.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{expert.title}</p>
                  
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    {expert.specialty}
                  </Badge>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {expert.rating}
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {(expert as any).studentsOrPatients?.toLocaleString() || "0"}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{expert.experience} yrs exp</span>
                  </div>

                  {expert.hourlyRate && (
                    <p className="text-sm font-bold text-primary mt-2">
                      {formatPrice(expert.hourlyRate)}/hr
                    </p>
                  )}

                  <div className="flex gap-1 mt-2 w-full">
                    <Button 
                      size="sm" 
                      className="flex-1 h-7 text-xs gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBooking(expert);
                      }}
                    >
                      <Calendar className="h-3 w-3" />
                      Book
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Starting video call...");
                      }}
                    >
                      <Video className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Schedule a session with {selectedExpert?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpert && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedExpert.avatar} />
                  <AvatarFallback>{selectedExpert.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedExpert.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedExpert.specialty}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {selectedExpert.rating}
                    </Badge>
                    {selectedExpert.hourlyRate && (
                      <Badge className="text-xs">
                        {formatPrice(selectedExpert.hourlyRate)}/hr
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Languages</h4>
                <div className="flex flex-wrap gap-1">
                  {((selectedExpert as any).languages || []).map(lang => (
                    <Badge key={lang} variant="secondary" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Certifications</h4>
                <div className="flex flex-wrap gap-1">
                  {((selectedExpert as any).certifications || []).slice(0, 3).map(cert => (
                    <Badge key={cert} variant="outline" className="text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {((selectedExpert as any).skills || []).map(skill => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmBooking} className="flex-1 gap-2">
              <Calendar className="h-4 w-4" />
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpertsShowcase;
