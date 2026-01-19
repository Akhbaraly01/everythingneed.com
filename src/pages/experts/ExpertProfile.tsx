import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { learnExperts, healthcareExperts } from "@/data/expertsData";
import { needsExperts } from "@/data/needsExpertsData";
import { useExpertReviews } from "@/hooks/useExpertReviews";
import { useExpertWishlist } from "@/hooks/useExpertWishlist";
import { useExpertAvailability } from "@/hooks/useExpertAvailability";
import ExpertReviewForm from "@/components/experts/ExpertReviewForm";
import ExpertReviewsList from "@/components/experts/ExpertReviewsList";
import { 
  ArrowLeft, Star, Clock, Users, Award, Play, Heart, Share2, 
  MessageSquare, Calendar as CalendarIcon, Video, MapPin, CheckCircle,
  Globe, Shield, Briefcase
} from "lucide-react";
import { format, addDays } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ExpertProfile = () => {
  const { expertId } = useParams();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  
  // Find expert from all categories
  const allExperts = [...learnExperts, ...healthcareExperts, ...needsExperts];
  const expert = allExperts.find(e => e.id === expertId);
  
  const { reviews, averageRating, reviewCount, isLoading: reviewsLoading } = useExpertReviews(expertId);
  const { isInWishlist, toggleWishlist } = useExpertWishlist();
  const { availability, loading: availabilityLoading } = useExpertAvailability(expertId || '', expert?.category || 'learn');

  if (!expert) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Expert Not Found</h2>
          <Link to="/experts">
            <Button>Browse Experts</Button>
          </Link>
        </div>
      </div>
    );
  }

  const timeSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
  ];

  const handleBooking = () => {
    if (!user) {
      toast.error("Please sign in to book a session");
      return;
    }
    if (!selectedDate || !selectedTime) {
      toast.error("Please select a date and time");
      return;
    }
    toast.success(`Booking request sent for ${format(selectedDate, 'MMM dd, yyyy')} at ${selectedTime}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success text-success-foreground';
      case 'busy': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Back Navigation */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/experts">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Experts
            </Button>
          </Link>
          <div className="flex-1" />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => toggleWishlist(expert.id)}
            className={isInWishlist(expert.id) ? "text-destructive" : ""}
          >
            <Heart className={`h-4 w-4 ${isInWishlist(expert.id) ? "fill-current" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Expert Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Intro / Hero */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20">
                {expert.videoIntro && showVideo ? (
                  <video 
                    src={expert.videoIntro} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-background shadow-xl">
                        <AvatarImage src={expert.avatar} />
                        <AvatarFallback className="text-4xl">{expert.name[0]}</AvatarFallback>
                      </Avatar>
                      {expert.videoIntro && (
                        <Button onClick={() => setShowVideo(true)} className="gap-2">
                          <Play className="h-4 w-4" />
                          Watch Video Introduction
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {/* Availability Badge */}
                <Badge className={`absolute top-4 right-4 ${getStatusColor(availability?.current_status || expert.availability)}`}>
                  {availability?.current_status || expert.availability}
                </Badge>
              </div>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{expert.name}</h1>
                    <p className="text-muted-foreground">{expert.title}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-medium">{averageRating > 0 ? averageRating.toFixed(1) : expert.rating}</span>
                        <span className="text-muted-foreground">({reviewCount > 0 ? reviewCount : Math.floor(expert.studentsOrPatients / 100)} reviews)</span>
                      </div>
                      <Badge variant="outline">{expert.specialty}</Badge>
                    </div>
                  </div>
                  {expert.hourlyRate && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${expert.hourlyRate}</p>
                      <p className="text-sm text-muted-foreground">per hour</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>About {expert.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{expert.bio}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Briefcase className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="font-semibold">{expert.experience}+</p>
                        <p className="text-xs text-muted-foreground">Years Experience</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="font-semibold">{expert.studentsOrPatients.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{expert.category === 'healthcare' ? 'Patients' : 'Students'}</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                        <p className="font-semibold">{expert.rating}</p>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Award className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="font-semibold">{expert.certifications.length}</p>
                        <p className="text-xs text-muted-foreground">Certifications</p>
                      </div>
                    </div>

                    {/* Languages */}
                    <div className="pt-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Languages
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {expert.languages.map((lang, idx) => (
                          <Badge key={idx} variant="secondary">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Certifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Skills */}
                    <div>
                      <h4 className="font-semibold mb-3">Expertise</h4>
                      <div className="flex flex-wrap gap-2">
                        {expert.skills.map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="py-1.5 px-3">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {/* Certifications */}
                    <div>
                      <h4 className="font-semibold mb-3">Certifications</h4>
                      <div className="space-y-2">
                        {expert.certifications.map((cert, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <Shield className="h-4 w-4 text-success" />
                            <span className="text-sm">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-4 space-y-4">
                <ExpertReviewForm expertId={expert.id} expertName={expert.name} />
                <ExpertReviewsList expertId={expert.id} />
              </TabsContent>

              <TabsContent value="schedule" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Availability Calendar</CardTitle>
                    <CardDescription>Select a date and time for your session</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                        className="rounded-md border"
                      />
                      
                      {selectedDate && (
                        <div>
                          <h4 className="font-semibold mb-3">
                            Available Times - {format(selectedDate, 'MMM dd, yyyy')}
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {timeSlots.map((time) => (
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
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Booking Card */}
          <div className="space-y-4">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Book a Session</CardTitle>
                <CardDescription>Choose your preferred consultation type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Consultation Options */}
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                    <Video className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">Virtual Session</p>
                      <p className="text-xs text-muted-foreground">
                        ${expert.hourlyRate ? Math.round(expert.hourlyRate * 0.7) : 'N/A'}/hour (30% off)
                      </p>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                    <MapPin className="h-5 w-5 text-success" />
                    <div className="text-left">
                      <p className="font-medium">In-Person Session</p>
                      <p className="text-xs text-muted-foreground">
                        ${expert.hourlyRate || 'Contact for price'}/hour
                      </p>
                    </div>
                  </Button>
                </div>

                {/* Selected Date/Time */}
                {selectedDate && selectedTime && (
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{format(selectedDate, 'EEEE, MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Clock className="h-4 w-4" />
                      <span>{selectedTime}</span>
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTime}
                >
                  Book Now
                </Button>

                <Button variant="outline" className="w-full gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Verified Expert</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Usually responds within 1 hour</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>Money-back guarantee</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertProfile;
