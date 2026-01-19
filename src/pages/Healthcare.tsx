import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { healthVideos, healthDocuments, preventiveCareGuides, healthcareCategories as healthCats } from "@/data/healthcareData";
import { healthcareExperts } from "@/data/expertsData";
import AIChatBot from "@/components/chat/AIChatBot";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Video, MapPin, Pill, Stethoscope, Calendar, Phone, Play, FileText, 
  Download, Eye, Shield, Heart, Activity, AlertTriangle, Loader2, 
  ChevronRight, Clock, Star, Users, CheckCircle, Sparkles
} from "lucide-react";

const ITEMS_PER_PAGE = 6;

const Healthcare = () => {
  const [activeTab, setActiveTab] = useState("services");
  const [displayedVideos, setDisplayedVideos] = useState(healthVideos.slice(0, ITEMS_PER_PAGE));
  const [displayedDocs, setDisplayedDocs] = useState(healthDocuments.slice(0, ITEMS_PER_PAGE));
  const [videoIndex, setVideoIndex] = useState(ITEMS_PER_PAGE);
  const [docIndex, setDocIndex] = useState(ITEMS_PER_PAGE);
  const [loading, setLoading] = useState(false);

  // Fetch doctors from database
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_available', true)
        .order('rating', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const healthServices = [
    {
      icon: Stethoscope,
      title: "Physical Consultation",
      description: "Book in-person appointments",
      price: "From $50",
      discount: null,
      link: "/healthcare/book",
      color: "bg-success/10 text-success"
    },
    {
      icon: Video,
      title: "Virtual Consultation",
      description: "Video call from anywhere",
      price: "From $35",
      discount: "30% Off",
      link: "/healthcare/book",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Pill,
      title: "Pharmacy",
      description: "Order medicines online",
      price: "Fast Delivery",
      discount: null,
      link: "/pharmacy",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: MapPin,
      title: "Lab Tests",
      description: "Book lab tests digitally",
      price: "From $20",
      discount: null,
      link: "/healthcare/labs",
      color: "bg-warning/10 text-warning"
    },
  ];

  const loadMore = useCallback((type: 'videos' | 'documents') => {
    setLoading(true);
    setTimeout(() => {
      if (type === 'videos') {
        const next = healthVideos.slice(videoIndex, videoIndex + ITEMS_PER_PAGE);
        setDisplayedVideos(prev => [...prev, ...next]);
        setVideoIndex(prev => prev + ITEMS_PER_PAGE);
      } else {
        const next = healthDocuments.slice(docIndex, docIndex + ITEMS_PER_PAGE);
        setDisplayedDocs(prev => [...prev, ...next]);
        setDocIndex(prev => prev + ITEMS_PER_PAGE);
      }
      setLoading(false);
    }, 500);
  }, [videoIndex, docIndex]);

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-success via-success/90 to-primary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <Badge className="bg-white/20 text-white mb-4">🏥 24/7 Healthcare</Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Your Health, Our Priority
              </h1>
              <p className="text-white/90 mb-6 max-w-lg">
                Access certified doctors, order medicines, book lab tests, and get professional healthcare guidance - all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/healthcare/book">
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Book Consultation
                  </Button>
                </Link>
                <Link to="/pharmacy">
                  <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                    <Pill className="h-4 w-4 mr-2" />
                    Visit Pharmacy
                  </Button>
                </Link>
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-white/20">
                <div>
                  <p className="text-2xl font-bold">{doctors.length || 20}+</p>
                  <p className="text-sm text-white/70">Doctors</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">10K+</p>
                  <p className="text-sm text-white/70">Patients</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">24/7</p>
                  <p className="text-sm text-white/70">Availability</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">4.9</p>
                  <p className="text-sm text-white/70">Rating</p>
                </div>
              </div>
            </div>
            
            {/* Featured Doctor */}
            {doctors[0] && (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader className="pb-2">
                  <Badge className="w-fit bg-warning text-warning-foreground">Top Rated</Badge>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-white/30">
                    <AvatarImage src={doctors[0].avatar_url || ''} />
                    <AvatarFallback className="bg-white/20">{doctors[0].full_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{doctors[0].full_name}</h3>
                    <p className="text-sm text-white/70">{doctors[0].specialization}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{doctors[0].rating} • {doctors[0].experience_years} yrs exp</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link to={`/healthcare/book/${doctors[0].id}`} className="flex-1">
                    <Button className="w-full" variant="secondary" size="sm">
                      <Video className="h-4 w-4 mr-1" /> Virtual ${doctors[0].virtual_fee}
                    </Button>
                  </Link>
                  <Link to={`/healthcare/book/${doctors[0].id}`} className="flex-1">
                    <Button className="w-full bg-white/10 hover:bg-white/20" variant="ghost" size="sm">
                      <MapPin className="h-4 w-4 mr-1" /> Physical ${doctors[0].consultation_fee}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Services */}
        <section className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {healthServices.map((service, idx) => (
              <Link key={idx} to={service.link}>
                <Card className="h-full hover:shadow-lg transition-all group cursor-pointer border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${service.color} group-hover:scale-110 transition-transform`}>
                      <service.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{service.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{service.description}</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs font-medium">{service.price}</span>
                      {service.discount && (
                        <Badge variant="destructive" className="text-[10px] px-1.5">{service.discount}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-success" />
              Specializations
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {healthCats.map((cat) => (
              <Link key={cat.id} to={`/healthcare/specialty/${cat.id}`}>
                <Button variant="outline" className="flex-shrink-0 gap-2 rounded-full">
                  <span>{cat.icon}</span>
                  {cat.name}
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* Available Doctors */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-success" />
              Available Doctors
            </h2>
            <Link to="/healthcare/book">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {doctors.map((doctor) => (
              <Link key={doctor.id} to={`/healthcare/book/${doctor.id}`}>
                <Card className="flex-shrink-0 w-[200px] hover:shadow-lg transition-all">
                  <CardContent className="p-4 text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarImage src={doctor.avatar_url || ''} />
                      <AvatarFallback>{doctor.full_name[0]}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium text-sm line-clamp-1">{doctor.full_name}</h3>
                    <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-xs">{doctor.rating}</span>
                    </div>
                    <div className="flex flex-col gap-1 mt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Virtual</span>
                        <span className="font-medium text-primary">${doctor.virtual_fee}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Physical</span>
                        <span className="font-medium">${doctor.consultation_fee}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50">
            <TabsTrigger value="services" className="text-xs sm:text-sm">Services</TabsTrigger>
            <TabsTrigger value="videos" className="text-xs sm:text-sm">Videos ({healthVideos.length})</TabsTrigger>
            <TabsTrigger value="prevention" className="text-xs sm:text-sm">Prevention</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2 border-success/20">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="h-6 w-6 text-success" />
                    <CardTitle className="text-base">Physical Consultation</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Meet healthcare professionals in person</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-xs">
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[20px]">1.</span>
                      <span>Fill out the form with your details and symptoms</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[20px]">2.</span>
                      <span>Choose your preferred healthcare professional</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[20px]">3.</span>
                      <span>See the price and book your appointment</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[20px]">4.</span>
                      <span>Visit the clinic at your scheduled time</span>
                    </li>
                  </ol>
                  <Link to="/healthcare/book">
                    <Button className="w-full mt-4" size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Physical
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Video className="h-6 w-6 text-primary" />
                    <CardTitle className="text-base">Virtual Consultation</CardTitle>
                    <Badge variant="destructive" className="text-[10px]">30% Off</Badge>
                  </div>
                  <CardDescription className="text-xs">Connect with doctors remotely via video call</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2 text-xs">
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[20px]">1.</span>
                      <span>Fill out the form with your health concerns</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[20px]">2.</span>
                      <span>Select a doctor or get auto-assigned</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[20px]">3.</span>
                      <span>Make payment to confirm your consultation</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[20px]">4.</span>
                      <span>Connect via video call at scheduled time</span>
                    </li>
                  </ol>
                  <Link to="/healthcare/book">
                    <Button className="w-full mt-4" size="sm" variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Start Virtual
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Pharmacy Banner */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-0">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold mb-1">Online Pharmacy</h3>
                  <p className="text-sm text-muted-foreground">
                    Order medicines online with fast doorstep delivery.
                  </p>
                </div>
                <Link to="/pharmacy">
                  <Button className="gap-2">
                    <Pill className="h-4 w-4" />
                    Browse Pharmacy
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedVideos.map((video) => (
                <Card key={video.id} className="hover:shadow-lg transition-all group">
                  <div className="aspect-video bg-gradient-to-br from-success/20 to-primary/20 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-success/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <Badge variant="secondary" className="w-fit mb-1 text-xs">{video.category}</Badge>
                    <CardTitle className="text-sm line-clamp-2">{video.title}</CardTitle>
                    <CardDescription className="text-xs">by {video.instructor}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {video.views.toLocaleString()} views
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" size="sm" variant="secondary">
                      <Play className="h-4 w-4 mr-2" /> Watch
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-success" />
              </div>
            )}
            {videoIndex < healthVideos.length && !loading && (
              <div className="text-center">
                <Button variant="outline" onClick={() => loadMore('videos')}>
                  Load More Videos
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Prevention Tab */}
          <TabsContent value="prevention" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preventiveCareGuides.map((guide) => (
                <Card key={guide.id} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-success" />
                      </div>
                      <Badge className="text-xs">{guide.category}</Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{guide.title}</CardTitle>
                    <CardDescription className="text-xs">{guide.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-xs mb-2 flex items-center gap-2">
                        <Heart className="h-3 w-3 text-success" />
                        Prevention Tips
                      </h4>
                      <ul className="grid grid-cols-1 gap-1 text-xs">
                        {guide.tips.slice(0, 3).map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-success mt-0.5 shrink-0" />
                            <span className="text-muted-foreground">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-warning" />
                        Risk Factors
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {guide.riskFactors.slice(0, 3).map((factor, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px]">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full" size="sm">
                      Learn More <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Chatbot */}
      <AIChatBot context="healthcare" title="Health Assistant" />
    </div>
  );
};

export default Healthcare;
