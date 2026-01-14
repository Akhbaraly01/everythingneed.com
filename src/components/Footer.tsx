import { Link, useNavigate } from "react-router-dom";
import { 
  Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, Heart,
  Send, Globe, Shield, CreditCard, Truck, Headphones, Award, Users, Building2,
  GraduationCap, Stethoscope, ShoppingBag, Briefcase, Home as HomeIcon, Car,
  ChevronRight, ArrowUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const Footer = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateTo = (path: string) => {
    navigate(path);
    scrollToTop();
  };

  const footerSections = [
    {
      title: "Quick Links",
      links: [
        { name: "Home", path: "/", icon: HomeIcon },
        { name: "Find Your Need", path: "/deals", icon: ShoppingBag },
        { name: "Learn & Grow", path: "/learn", icon: GraduationCap },
        { name: "Healthcare", path: "/healthcare", icon: Stethoscope },
        { name: "Pharmacy", path: "/pharmacy", icon: CreditCard },
        { name: "Dashboard", path: "/account/dashboard", icon: Users },
      ],
    },
    {
      title: "Services",
      links: [
        { name: "Transportation", path: "/deals/transportation", icon: Car },
        { name: "Hotels & Booking", path: "/deals/hotels", icon: Building2 },
        { name: "Jobs & Careers", path: "/deals/jobs", icon: Briefcase },
        { name: "Real Estate", path: "/deals/real-estate", icon: HomeIcon },
        { name: "Building Services", path: "/building-services", icon: Building2 },
        { name: "Food & Catering", path: "/deals/food", icon: ShoppingBag },
      ],
    },
    {
      title: "Categories",
      links: [
        { name: "Electronics", path: "/needs/electronics" },
        { name: "Fashion", path: "/needs/fashion" },
        { name: "Home & Garden", path: "/needs/home" },
        { name: "Sports & Fitness", path: "/needs/sports" },
        { name: "Books & Education", path: "/needs/books" },
        { name: "Beauty & Care", path: "/needs/beauty" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", path: "/support/tickets" },
        { name: "Contact Us", path: "/support/tickets/new" },
        { name: "FAQs", path: "/support/tickets" },
        { name: "Submit Ticket", path: "/support/tickets/new" },
        { name: "Live Chat", path: "/support/tickets" },
        { name: "My Certificates", path: "/account/certificates" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", path: "/" },
        { name: "Careers", path: "/deals/jobs" },
        { name: "Partners", path: "/vendor/register" },
        { name: "Become a Vendor", path: "/vendor/register" },
        { name: "Affiliates", path: "/vendor/register" },
        { name: "Blog", path: "/learn" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", path: "/" },
        { name: "Terms of Service", path: "/" },
        { name: "Cookie Policy", path: "/" },
        { name: "Refund Policy", path: "/" },
        { name: "Shipping Info", path: "/" },
        { name: "Accessibility", path: "/" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-blue-600" },
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:text-sky-500" },
    { icon: Instagram, href: "#", label: "Instagram", color: "hover:text-pink-500" },
    { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:text-blue-700" },
    { icon: Youtube, href: "#", label: "YouTube", color: "hover:text-red-600" },
  ];

  const features = [
    { icon: Truck, text: "Free Shipping on $50+" },
    { icon: Shield, text: "100% Secure Payments" },
    { icon: CreditCard, text: "Easy Returns" },
    { icon: Globe, text: "Worldwide Delivery" },
    { icon: Headphones, text: "24/7 Support" },
    { icon: Award, text: "Quality Guaranteed" },
  ];

  const trustedCompanies = [
    "Microsoft", "Google", "Amazon", "Apple", "Meta", "IBM", 
    "Oracle", "Salesforce", "Adobe", "Intel", "NVIDIA", "Tesla"
  ];

  const quickServices = [
    { name: "Find Your Need", path: "/deals", icon: ShoppingBag, desc: "Browse all categories" },
    { name: "Get a Job", path: "/deals/jobs", icon: Briefcase, desc: "Find career opportunities" },
    { name: "Learn Skills", path: "/learn", icon: GraduationCap, desc: "Courses & certificates" },
    { name: "Healthcare", path: "/healthcare", icon: Stethoscope, desc: "Book appointments" },
    { name: "Building Services", path: "/building-services", icon: Building2, desc: "Find skilled workers" },
    { name: "Become Vendor", path: "/vendor/register", icon: Users, desc: "Sell your products" },
  ];

  return (
    <footer className="bg-gradient-to-b from-background to-muted border-t border-border relative">
      {/* Scroll to Top Button */}
      <Button
        onClick={scrollToTop}
        className="fixed bottom-20 md:bottom-24 right-4 h-10 w-10 rounded-full shadow-lg z-40"
        size="icon"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>

      {/* Features Bar */}
      <div className="bg-primary/5 py-6 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-sm">
                <feature.icon className="h-5 w-5 text-primary shrink-0" />
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Services Grid */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 py-8">
        <div className="container mx-auto px-4">
          <h3 className="text-xl font-bold text-center mb-6">What Would You Like to Do?</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickServices.map((service, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto py-4 flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                onClick={() => navigateTo(service.path)}
              >
                <service.icon className="h-6 w-6" />
                <span className="font-semibold">{service.name}</span>
                <span className="text-xs text-muted-foreground">{service.desc}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Trusted Companies */}
      <div className="py-8 border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <h4 className="text-center text-sm text-muted-foreground mb-4">
            TRUSTED BY LEADING ORGANIZATIONS WORLDWIDE
          </h4>
          <div className="flex flex-wrap justify-center items-center gap-6">
            {trustedCompanies.map((company, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="px-4 py-2 text-sm font-medium hover:bg-primary/10 transition-colors cursor-default"
              >
                {company}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-primary to-secondary py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-primary-foreground mb-2">
                Stay Updated with EverythingNeed
              </h3>
              <p className="text-primary-foreground/80">
                Subscribe for exclusive deals, learning resources, and updates
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="max-w-xs bg-background/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
              <Button variant="secondary" className="shrink-0">
                <Send className="h-4 w-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-8">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className="inline-block mb-4" onClick={scrollToTop}>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                everythingneed
              </h2>
            </Link>
            <p className="text-muted-foreground mb-4 text-sm">
              Your all-in-one platform for every human need. From transportation to healthcare, 
              learning to shopping - we connect you with everything you need.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                <Mail className="h-4 w-4 text-primary" />
                <span>support@everythingneed.com</span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                <Phone className="h-4 w-4 text-primary" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                <Headphones className="h-4 w-4 text-primary" />
                <span>24/7 Customer Support</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>123 Main Street, City, Country</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={() => navigateTo(link.path)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* App Download & Payment Methods */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
          <div className="text-center lg:text-left">
            <h4 className="font-semibold mb-3">Download Our Mobile App</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                App Store
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="m3 20.5 9-9-9-9 1.5-1 11 10-11 10z"/></svg>
                Google Play
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="font-semibold mb-3">We Accept</h4>
            <div className="flex gap-2 flex-wrap justify-center">
              {["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay", "Stripe"].map((method) => (
                <div key={method} className="px-3 py-1.5 bg-muted rounded text-xs font-medium hover:bg-primary/10 transition-colors cursor-default">
                  {method}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center lg:text-right">
            <h4 className="font-semibold mb-3">Security & Trust</h4>
            <div className="flex gap-2 flex-wrap justify-center lg:justify-end">
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                SSL Secured
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Award className="h-3 w-3" />
                Verified
              </Badge>
            </div>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t">
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className={`p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300 ${social.color}`}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap justify-center">
            © {currentYear} everythingneed.com. Made with 
            <Heart className="h-4 w-4 text-destructive fill-destructive" /> 
            for humanity. All rights reserved.
          </p>
          
          <div className="flex gap-4 text-sm text-muted-foreground">
            <button onClick={() => navigateTo("/")} className="hover:text-primary transition-colors">
              Privacy
            </button>
            <button onClick={() => navigateTo("/")} className="hover:text-primary transition-colors">
              Terms
            </button>
            <button onClick={() => navigateTo("/")} className="hover:text-primary transition-colors">
              Cookies
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;