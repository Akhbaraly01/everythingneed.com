import { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, Star, Clock, Users, Play, MessageCircle, Calendar as CalendarIcon,
  Video, Award, Languages, Filter, ChevronDown, Globe, MapPin, Briefcase,
  GraduationCap, Stethoscope, Wrench, Heart, CheckCircle, X
} from "lucide-react";
import { learnExperts, healthcareExperts, type Expert } from "@/data/expertsData";
import { needsExperts } from "@/data/needsExpertsData";
import { useCurrency } from "@/contexts/CurrencyContext";
import AIChatBot from "@/components/chat/AIChatBot";

const allExperts = [...learnExperts, ...healthcareExperts, ...needsExperts];

const categories = [
  { id: "all", label: "All Experts", icon: Users, count: allExperts.length },
  { id: "learn", label: "Learning", icon: GraduationCap, count: learnExperts.length },
  { id: "healthcare", label: "Healthcare", icon: Stethoscope, count: healthcareExperts.length },
  { id: "needs", label: "Services", icon: Wrench, count: needsExperts.length },
];

const ExpertsDirectory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const { formatPrice } = useCurrency();

  const filteredExperts = useMemo(() => {
    return allExperts.filter(expert => {
      const matchesCategory = selectedCategory === "all" || expert.category === selectedCategory;
      const matchesSearch = 
        expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  ];

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "busy": return "bg-amber-500";
      default: return "bg-gray-400";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "learn": return "bg-blue-500";
      case "healthcare": return "bg-rose-500";
      case "needs": return "bg-purple-500";
      default: return "bg-primary";
    }
  };

  const handleBooking = () => {
    if (selectedDate && selectedTime && selectedExpert) {
      console.log("Booking:", { expert: selectedExpert.name, date: selectedDate, time: selectedTime });
      setShowBookingModal(false);
      setSelectedDate(undefined);
      setSelectedTime("");
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Expert Directory</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Connect with top professionals for learning, healthcare, and service needs. 
          Book consultations, watch video introductions, and start your journey today.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search experts by name, specialty, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0 gap-2"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
              <Badge variant="secondary" className="ml-1 text-xs">
                {cat.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {filteredExperts.length} expert{filteredExperts.length !== 1 ? "s" : ""}
      </p>

      {/* Experts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredExperts.map(expert => (
          <Card 
            key={expert.id} 
            className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
            onClick={() => setSelectedExpert(expert)}
          >
            <div className="relative">
              {/* Video Intro Indicator */}
              {expert.videoIntro && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-black/70 hover:bg-black/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedExpert(expert);
                    setShowVideoModal(true);
                  }}
                >
                  <Play className="h-4 w-4 text-white" />
                </Button>
              )}
              
              {/* Availability Badge */}
              <div className={`absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs text-white ${getAvailabilityColor(expert.availability)}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {expert.availability}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="h-14 w-14 border-2 border-background shadow-md">
                    <AvatarImage src={expert.avatar} alt={expert.name} />
                    <AvatarFallback>{expert.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{expert.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{expert.title}</p>
                    <Badge variant="outline" className={`text-xs mt-1 ${getCategoryColor(expert.category)} text-white border-0`}>
                      {expert.specialty}
                    </Badge>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center gap-0.5 text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="font-semibold text-sm">{expert.rating}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Rating</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="font-semibold text-sm">{expert.experience}y</p>
                    <p className="text-[10px] text-muted-foreground">Exp</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="font-semibold text-sm">{(expert.studentsOrPatients / 1000).toFixed(0)}k</p>
                    <p className="text-[10px] text-muted-foreground">Clients</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {expert.skills.slice(0, 3).map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {skill}
                    </Badge>
                  ))}
                  {expert.skills.length > 3 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      +{expert.skills.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Price and Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  {expert.hourlyRate && (
                    <div>
                      <span className="font-bold text-primary">{formatPrice(expert.hourlyRate)}</span>
                      <span className="text-xs text-muted-foreground">/hr</span>
                    </div>
                  )}
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExpert(expert);
                      }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedExpert(expert);
                        setShowBookingModal(true);
                      }}
                    >
                      Book
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* Expert Detail Modal */}
      <Dialog open={!!selectedExpert && !showBookingModal && !showVideoModal} onOpenChange={() => setSelectedExpert(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedExpert && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                    <AvatarImage src={selectedExpert.avatar} alt={selectedExpert.name} />
                    <AvatarFallback>{selectedExpert.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{selectedExpert.name}</DialogTitle>
                    <p className="text-muted-foreground">{selectedExpert.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getCategoryColor(selectedExpert.category)}>{selectedExpert.specialty}</Badge>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${getAvailabilityColor(selectedExpert.availability)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        {selectedExpert.availability}
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-bold text-lg">{selectedExpert.rating}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="font-bold text-lg">{selectedExpert.experience}</p>
                    <p className="text-xs text-muted-foreground">Years Exp</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="font-bold text-lg">{selectedExpert.studentsOrPatients.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Clients</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="font-bold text-lg">{selectedExpert.hourlyRate ? formatPrice(selectedExpert.hourlyRate) : "N/A"}</p>
                    <p className="text-xs text-muted-foreground">Per Hour</p>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h4 className="font-semibold mb-2">About</h4>
                  <p className="text-sm text-muted-foreground">{selectedExpert.bio}</p>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="font-semibold mb-2">Skills & Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExpert.skills.map((skill, idx) => (
                      <Badge key={idx} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    Languages
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExpert.languages.map((lang, idx) => (
                      <Badge key={idx} variant="outline">{lang}</Badge>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certifications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedExpert.certifications.map((cert, idx) => (
                      <Badge key={idx} variant="outline" className="gap-1">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Mock Reviews */}
                <div>
                  <h4 className="font-semibold mb-3">Recent Reviews</h4>
                  <div className="space-y-3">
                    {[
                      { name: "John D.", rating: 5, comment: "Excellent expertise and very patient. Highly recommend!", date: "2 days ago" },
                      { name: "Sarah M.", rating: 5, comment: "Very professional and knowledgeable. Great experience overall.", date: "1 week ago" },
                      { name: "Mike R.", rating: 4, comment: "Good session, learned a lot. Would book again.", date: "2 weeks ago" },
                    ].map((review, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{review.name}</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: review.rating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                        <p className="text-xs text-muted-foreground mt-1">{review.date}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedExpert.videoIntro && (
                    <Button variant="outline" className="gap-2" onClick={() => setShowVideoModal(true)}>
                      <Play className="h-4 w-4" />
                      Watch Intro
                    </Button>
                  )}
                  <Button variant="outline" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Send Message
                  </Button>
                  <Button className="gap-2 flex-1" onClick={() => setShowBookingModal(true)}>
                    <CalendarIcon className="h-4 w-4" />
                    Book Appointment
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          {selectedExpert && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar>
                  <AvatarImage src={selectedExpert.avatar} />
                  <AvatarFallback>{selectedExpert.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedExpert.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedExpert.specialty}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Select Date</h4>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-md border"
                />
              </div>

              {selectedDate && (
                <div>
                  <h4 className="font-medium mb-2">Select Time</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {timeSlots.map(time => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="text-xs"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && selectedTime && (
                <div className="p-3 rounded-lg bg-primary/10 text-sm">
                  <p className="font-medium">Booking Summary</p>
                  <p>Date: {selectedDate.toLocaleDateString()}</p>
                  <p>Time: {selectedTime}</p>
                  <p>Cost: {selectedExpert.hourlyRate ? formatPrice(selectedExpert.hourlyRate) : "Free"}</p>
                </div>
              )}

              <Button 
                className="w-full" 
                disabled={!selectedDate || !selectedTime}
                onClick={handleBooking}
              >
                Confirm Booking
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Video Introduction</DialogTitle>
          </DialogHeader>
          {selectedExpert && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                controls
                autoPlay
                className="w-full h-full"
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Chat */}
      <AIChatBot context="general" title="Expert Finder" />
    </div>
  );
};

export default ExpertsDirectory;
