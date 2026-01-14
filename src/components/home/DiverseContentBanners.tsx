import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingBag, GraduationCap, Stethoscope, Briefcase, Building2, 
  Car, Heart, Play, FileText, ChevronRight, Star, Users, Award,
  Phone, Video, Zap, Shield, Clock, MapPin
} from "lucide-react";

interface ContentBanner {
  id: string;
  type: "needs" | "learn" | "healthcare" | "jobs";
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  icon: React.ReactNode;
  bgGradient: string;
  features: string[];
  stats?: { label: string; value: string }[];
}

const contentBanners: ContentBanner[] = [
  {
    id: "needs-1",
    type: "needs",
    title: "Find Your Need",
    subtitle: "Everything You Need, One Platform",
    description: "Browse 15+ categories with thousands of products and services tailored for you.",
    ctaText: "Browse Categories",
    ctaLink: "/deals",
    icon: <ShoppingBag className="h-8 w-8" />,
    bgGradient: "from-purple-600 to-indigo-600",
    features: ["Products", "Services", "Rentals", "Auctions"],
    stats: [{ label: "Categories", value: "15+" }, { label: "Vendors", value: "1000+" }]
  },
  {
    id: "learn-1",
    type: "learn",
    title: "Learn Something New",
    subtitle: "Videos, Courses & Certifications",
    description: "Watch tutorials, read guides, and earn certificates from industry experts.",
    ctaText: "Start Learning",
    ctaLink: "/learn",
    icon: <GraduationCap className="h-8 w-8" />,
    bgGradient: "from-amber-500 to-orange-600",
    features: ["Video Tutorials", "Free Courses", "Certificates", "Live Classes"],
    stats: [{ label: "Courses", value: "100+" }, { label: "Students", value: "50K+" }]
  },
  {
    id: "healthcare-1",
    type: "healthcare",
    title: "Your Health Matters",
    subtitle: "Doctors Available 24/7",
    description: "Book physical or virtual consultations with qualified healthcare professionals.",
    ctaText: "Book Appointment",
    ctaLink: "/healthcare",
    icon: <Stethoscope className="h-8 w-8" />,
    bgGradient: "from-emerald-500 to-teal-600",
    features: ["Physical Consultation", "Virtual Consultation", "Lab Tests", "Pharmacy"],
    stats: [{ label: "Doctors", value: "200+" }, { label: "Specialties", value: "30+" }]
  },
  {
    id: "jobs-1",
    type: "jobs",
    title: "Get Your Dream Job",
    subtitle: "Thousands of Opportunities Await",
    description: "Find full-time, part-time, remote, or freelance work matching your skills.",
    ctaText: "Find Jobs",
    ctaLink: "/deals/jobs",
    icon: <Briefcase className="h-8 w-8" />,
    bgGradient: "from-blue-500 to-cyan-600",
    features: ["Full-time", "Remote Work", "Freelance", "Internships"],
    stats: [{ label: "Jobs", value: "5000+" }, { label: "Companies", value: "500+" }]
  },
  {
    id: "learn-2",
    type: "learn",
    title: "How-To Videos",
    subtitle: "Learn By Watching",
    description: "Step-by-step video tutorials on cooking, crafts, technology, and more.",
    ctaText: "Watch Now",
    ctaLink: "/learn",
    icon: <Play className="h-8 w-8" />,
    bgGradient: "from-red-500 to-rose-600",
    features: ["DIY Projects", "Cooking", "Tech Tutorials", "Life Hacks"]
  },
  {
    id: "healthcare-2",
    type: "healthcare",
    title: "Preventive Care",
    subtitle: "Stay Healthy, Stay Happy",
    description: "Learn preventive measures and access health education resources.",
    ctaText: "Learn More",
    ctaLink: "/healthcare",
    icon: <Shield className="h-8 w-8" />,
    bgGradient: "from-pink-500 to-fuchsia-600",
    features: ["Health Tips", "Vaccinations", "Screening Tests", "Wellness Guides"]
  },
  {
    id: "needs-2",
    type: "needs",
    title: "Sell Your Products",
    subtitle: "Become a Vendor Today",
    description: "Register as a vendor and reach thousands of customers worldwide.",
    ctaText: "Start Selling",
    ctaLink: "/vendor/register",
    icon: <Users className="h-8 w-8" />,
    bgGradient: "from-violet-500 to-purple-600",
    features: ["Easy Setup", "Low Fees", "Analytics", "24/7 Support"]
  },
  {
    id: "needs-3",
    type: "needs",
    title: "Trusted Engineers",
    subtitle: "Building & Repair Services",
    description: "Connect with verified electricians, plumbers, carpenters, and more.",
    ctaText: "Find Workers",
    ctaLink: "/building-services",
    icon: <Building2 className="h-8 w-8" />,
    bgGradient: "from-orange-500 to-amber-600",
    features: ["Verified Workers", "Fair Pricing", "Quality Work", "Warranty"]
  }
];

const DiverseContentBanners = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % contentBanners.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const currentBanner = contentBanners[currentIndex];
  const nextBanners = contentBanners.slice(currentIndex + 1, currentIndex + 3);
  if (nextBanners.length < 2) {
    nextBanners.push(...contentBanners.slice(0, 2 - nextBanners.length));
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold">Discover More Services</h2>
          <p className="text-xs text-muted-foreground">Find everything you need in one place</p>
        </div>
        <div className="flex gap-1">
          {contentBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx);
                setIsAutoPlaying(false);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-primary w-6' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Large Banner */}
        <Link to={currentBanner.ctaLink} className="lg:col-span-2">
          <Card className={`overflow-hidden h-full min-h-[250px] bg-gradient-to-br ${currentBanner.bgGradient} text-white border-0 hover:shadow-xl transition-shadow`}>
            <div className="p-6 h-full flex flex-col justify-between relative">
              <div className="absolute top-4 right-4 opacity-20">
                <div className="transform scale-[3]">{currentBanner.icon}</div>
              </div>
              
              <div className="space-y-3 relative z-10">
                <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm">
                  {currentBanner.type.charAt(0).toUpperCase() + currentBanner.type.slice(1)}
                </Badge>
                <h3 className="text-2xl md:text-3xl font-bold">{currentBanner.title}</h3>
                <p className="text-lg opacity-90">{currentBanner.subtitle}</p>
                <p className="text-sm opacity-80 max-w-md">{currentBanner.description}</p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  {currentBanner.features.map((feature, idx) => (
                    <Badge key={idx} variant="outline" className="border-white/40 text-white text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 relative z-10">
                {currentBanner.stats && (
                  <div className="flex gap-6">
                    {currentBanner.stats.map((stat, idx) => (
                      <div key={idx}>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs opacity-80">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="secondary" className="gap-2 ml-auto">
                  {currentBanner.ctaText}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </Link>

        {/* Side Smaller Banners */}
        <div className="flex flex-col gap-4">
          {nextBanners.map((banner) => (
            <Link key={banner.id} to={banner.ctaLink}>
              <Card className={`overflow-hidden bg-gradient-to-br ${banner.bgGradient} text-white border-0 hover:shadow-xl transition-shadow`}>
                <div className="p-4 flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm shrink-0">
                    {banner.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg">{banner.title}</h4>
                    <p className="text-sm opacity-90 line-clamp-1">{banner.subtitle}</p>
                    <div className="flex gap-2 mt-2">
                      {banner.features.slice(0, 2).map((f, i) => (
                        <Badge key={i} variant="outline" className="border-white/40 text-white text-[10px]">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DiverseContentBanners;