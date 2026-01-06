import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryGrid from "@/components/CategoryGrid";
import { healthcareCategories } from "@/data/mockData";
import { healthVideos, healthDocuments, preventiveCareGuides, healthcareCategories as healthCats, HealthVideo, HealthDocument, PreventiveCare } from "@/data/healthcareData";
import AIChatBot from "@/components/chat/AIChatBot";
import { Link } from "react-router-dom";
import { Video, MapPin, Pill, Stethoscope, Calendar, Phone, Play, FileText, Download, Eye, Shield, Heart, Brain, Activity, AlertTriangle, Loader2, ChevronRight, Clock } from "lucide-react";

const ITEMS_PER_PAGE = 6;

const iconMap: Record<string, any> = {
  Heart, Brain, Activity, Shield, Eye
};

const Healthcare = () => {
  const [activeTab, setActiveTab] = useState("services");
  const [displayedVideos, setDisplayedVideos] = useState<HealthVideo[]>([]);
  const [displayedDocs, setDisplayedDocs] = useState<HealthDocument[]>([]);
  const [videoIndex, setVideoIndex] = useState(ITEMS_PER_PAGE);
  const [docIndex, setDocIndex] = useState(ITEMS_PER_PAGE);
  const [loading, setLoading] = useState(false);

  const healthServices = [
    {
      icon: Stethoscope,
      title: "Physical Consultation",
      description: "Book in-person appointments with healthcare professionals",
      price: "$50 - $200",
      link: "/healthcare/book"
    },
    {
      icon: Video,
      title: "Virtual Consultation",
      description: "Connect with doctors via video call from anywhere",
      price: "$30 - $100",
      link: "/healthcare/book"
    },
    {
      icon: Pill,
      title: "Pharmacy Delivery",
      description: "Order medicines online with doorstep delivery",
      price: "Varies",
      link: "/pharmacy"
    },
    {
      icon: MapPin,
      title: "Laboratory Tests",
      description: "Book lab tests and get results digitally",
      price: "$20 - $300",
      link: "/healthcare/book"
    },
  ];

  useEffect(() => {
    setDisplayedVideos(healthVideos.slice(0, ITEMS_PER_PAGE));
    setDisplayedDocs(healthDocuments.slice(0, ITEMS_PER_PAGE));
  }, []);

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
    <div className="min-h-screen pb-20">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-success to-success/70 py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Healthcare Services
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Access doctors, health resources, pharmacies, and healthcare professionals - both physical and virtual
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Access Categories */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Healthcare Categories</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {healthCats.map((cat) => (
              <div key={cat.id} className="text-center p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors">
                <span className="text-2xl">{cat.icon}</span>
                <p className="text-xs mt-1 font-medium truncate">{cat.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="videos">Videos ({healthVideos.length})</TabsTrigger>
            <TabsTrigger value="documents">Guides ({healthDocuments.length})</TabsTrigger>
            <TabsTrigger value="prevention">Prevention</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-8">
            {/* Service Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {healthServices.map((service, index) => (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
                      <service.icon className="h-6 w-6 text-success" />
                    </div>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">Starting from {service.price}</p>
                    <Link to={service.link}>
                      <Button className="w-full" variant="outline">Book Now</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Consultation Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-success/20">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="h-6 w-6 text-success" />
                    <CardTitle>Physical Consultation</CardTitle>
                  </div>
                  <CardDescription>Meet healthcare professionals in person</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[24px]">1.</span>
                      <span>Fill out the contact form with your details and symptoms</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[24px]">2.</span>
                      <span>Choose your preferred healthcare professional</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[24px]">3.</span>
                      <span>See the required amount and book your appointment</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[24px]">4.</span>
                      <span>Visit the clinic at your scheduled time</span>
                    </li>
                  </ol>
                  <Link to="/healthcare/book">
                    <Button className="w-full mt-6">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Physical Appointment
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Video className="h-6 w-6 text-primary" />
                    <CardTitle>Virtual Consultation</CardTitle>
                  </div>
                  <CardDescription>Connect with doctors remotely via video call</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[24px]">1.</span>
                      <span>Fill out the form with your health concerns</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[24px]">2.</span>
                      <span>Our team reviews and assigns appropriate specialist</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[24px]">3.</span>
                      <span>Make payment to confirm your consultation</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-semibold min-w-[24px]">4.</span>
                      <span>Connect via video call at scheduled time</span>
                    </li>
                  </ol>
                  <Link to="/healthcare/book">
                    <Button className="w-full mt-6" variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Start Virtual Consultation
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Pharmacy Section */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Online Pharmacy</h2>
                  <p className="text-muted-foreground mb-4">
                    Browse thousands of medicines, supplements, and healthcare products.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Wide range of medicines with detailed descriptions</li>
                    <li>✓ Upload prescription images for verification</li>
                    <li>✓ Fast delivery to your doorstep</li>
                  </ul>
                </div>
                <Link to="/pharmacy">
                  <Button size="lg">
                    <Pill className="h-5 w-5 mr-2" />
                    Browse Pharmacy
                  </Button>
                </Link>
              </div>
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedVideos.map((video) => (
                <Card key={video.id} className="hover:shadow-lg transition-all duration-300 group">
                  <div className="aspect-video bg-gradient-to-br from-success/20 to-primary/20 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-14 w-14 rounded-full bg-success/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <Badge variant="secondary" className="w-fit mb-2">{video.category}</Badge>
                    <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                    <CardDescription className="text-xs">by {video.instructor}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{video.description}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {video.views.toLocaleString()} views
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="secondary">
                      <Play className="h-4 w-4 mr-2" />
                      Watch Now
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

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedDocs.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-success" />
                      </div>
                      <Badge variant="outline">{doc.type}</Badge>
                    </div>
                    <CardTitle className="text-base mt-3 line-clamp-2">{doc.title}</CardTitle>
                    <CardDescription className="text-xs">by {doc.author}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{doc.description}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{doc.pages} pages</span>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {doc.downloadCount.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download {doc.type}
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
            {docIndex < healthDocuments.length && !loading && (
              <div className="text-center">
                <Button variant="outline" onClick={() => loadMore('documents')}>
                  Load More Documents
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Prevention Tab */}
          <TabsContent value="prevention" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {preventiveCareGuides.map((guide) => (
                <Card key={guide.id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                        <Shield className="h-6 w-6 text-success" />
                      </div>
                      <Badge>{guide.category}</Badge>
                    </div>
                    <CardTitle className="mt-3">{guide.title}</CardTitle>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Heart className="h-4 w-4 text-success" />
                        Prevention Tips
                      </h4>
                      <ul className="grid grid-cols-1 gap-1 text-sm">
                        {guide.tips.slice(0, 4).map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-success">✓</span>
                            <span className="text-muted-foreground">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Risk Factors
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {guide.riskFactors.slice(0, 4).map((factor, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
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
