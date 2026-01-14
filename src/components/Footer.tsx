import { Link, useNavigate } from "react-router-dom";
import { 
  Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, Heart,
  Send, Globe, Shield, CreditCard, Truck, Headphones, Award, Users, Building2,
  GraduationCap, Stethoscope, ShoppingBag, Briefcase, Home as HomeIcon, Car,
  ChevronRight, ArrowUp, FileText, HelpCircle, MessageCircle, Scale, BookOpen,
  Wallet, Settings, Bell, Clock, Star, CheckCircle, Zap, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";

const Footer = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateTo = (path: string) => {
    navigate(path);
    scrollToTop();
  };

  const siteMapLinks = [
    { name: "Home", path: "/" },
    { name: "About Us", path: "/" },
    { name: "News & Updates", path: "/learn" },
    { name: "Events", path: "/deals" },
    { name: "Payment Methods", path: "/account/dashboard" },
    { name: "People Directory", path: "/deals/jobs" },
    { name: "Research", path: "/learn" },
    { name: "Publications", path: "/learn" },
    { name: "Academic Staff", path: "/learn" },
    { name: "Vendor Profiles", path: "/vendor/register" },
    { name: "Postgraduate Services", path: "/learn" },
    { name: "Undergraduate Programs", path: "/learn" },
  ];

  const categoryLinks = [
    { name: "Electronics", path: "/needs/electronics" },
    { name: "Fashion & Apparel", path: "/needs/fashion" },
    { name: "Home & Garden", path: "/needs/home" },
    { name: "Healthcare Services", path: "/healthcare" },
    { name: "Learning & Courses", path: "/learn" },
    { name: "Jobs & Careers", path: "/deals/jobs" },
    { name: "Building Services", path: "/building-services" },
    { name: "Transportation", path: "/deals/transportation" },
    { name: "Hotels & Booking", path: "/deals/hotels" },
    { name: "Food & Catering", path: "/deals/food" },
    { name: "Real Estate", path: "/deals/real-estate" },
    { name: "Agriculture", path: "/deals/agriculture" },
  ];

  const supportLinks = [
    { name: "FAQs", path: "/support/tickets", icon: HelpCircle },
    { name: "Contact Us", path: "/support/tickets/new", icon: MessageCircle },
    { name: "Mail Support", path: "/support/tickets/new", icon: Mail },
    { name: "Live Chat", path: "/support/tickets", icon: MessageCircle },
    { name: "Submit Ticket", path: "/support/tickets/new", icon: FileText },
    { name: "Help Center", path: "/support/tickets", icon: HelpCircle },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook", color: "hover:text-blue-600 hover:bg-blue-100" },
    { icon: Twitter, href: "#", label: "Twitter", color: "hover:text-sky-500 hover:bg-sky-100" },
    { icon: Instagram, href: "#", label: "Instagram", color: "hover:text-pink-500 hover:bg-pink-100" },
    { icon: Linkedin, href: "#", label: "LinkedIn", color: "hover:text-blue-700 hover:bg-blue-100" },
    { icon: Youtube, href: "#", label: "YouTube", color: "hover:text-red-600 hover:bg-red-100" },
  ];

  const features = [
    { icon: Truck, text: t('freeShipping') },
    { icon: Shield, text: t('securePayments') },
    { icon: CreditCard, text: t('easyReturns') },
    { icon: Globe, text: t('worldwideDelivery') },
    { icon: Headphones, text: t('support247') },
    { icon: Award, text: t('qualityGuaranteed') },
  ];

  const trustedCompanies = [
    "Microsoft", "Google", "Amazon", "Apple", "Meta", "IBM", 
    "Oracle", "Salesforce", "Adobe", "Intel", "NVIDIA", "Tesla",
    "WHO", "UNICEF", "Red Cross", "UNESCO"
  ];

  const quickServices = [
    { name: t('findYourNeed'), path: "/deals", icon: ShoppingBag, desc: t('browseCategories') },
    { name: t('getJob'), path: "/deals/jobs", icon: Briefcase, desc: t('findOpportunities') },
    { name: t('learnSkills'), path: "/learn", icon: GraduationCap, desc: t('coursesAndCertificates') },
    { name: t('healthcare'), path: "/healthcare", icon: Stethoscope, desc: t('bookAppointments') },
    { name: t('buildingServices'), path: "/building-services", icon: Building2, desc: t('findWorkers') },
    { name: t('becomeVendor'), path: "/vendor/register", icon: Users, desc: t('sellProducts') },
  ];

  const accountLinks = [
    { name: "Dashboard", path: "/account/dashboard", icon: Target },
    { name: "My Orders", path: "/pharmacy/orders", icon: ShoppingBag },
    { name: "Wishlist", path: "/account/wishlist", icon: Heart },
    { name: "Certificates", path: "/account/certificates", icon: Award },
    { name: "Notifications", path: "/account/notifications", icon: Bell },
    { name: "Wallet", path: "/account/dashboard", icon: Wallet },
  ];

  return (
    <footer className="bg-amber-900 text-amber-50 relative">
      {/* Scroll to Top Button */}
      <Button
        onClick={scrollToTop}
        className="fixed bottom-20 md:bottom-24 right-4 h-12 w-12 rounded-full shadow-xl z-40 bg-amber-500 hover:bg-amber-400 text-amber-900"
        size="icon"
      >
        <ArrowUp className="h-6 w-6" />
      </Button>

      {/* Features Bar */}
      <div className="bg-amber-800 py-6 border-b border-amber-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-sm">
                <feature.icon className="h-5 w-5 text-amber-400 shrink-0" />
                <span className="font-medium text-amber-100">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Services Grid */}
      <div className="bg-amber-800/50 py-6 border-b border-amber-700">
        <div className="container mx-auto px-4">
          <h3 className="text-lg font-bold text-center mb-4 text-amber-100">{t('whatWouldYouLikeToDo')}</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {quickServices.map((service, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto py-3 flex-col gap-1 bg-amber-800/50 border-amber-600 text-amber-100 hover:bg-amber-700 hover:text-white transition-all"
                onClick={() => navigateTo(service.path)}
              >
                <service.icon className="h-5 w-5 text-amber-400" />
                <span className="font-semibold text-xs">{service.name}</span>
                <span className="text-[10px] text-amber-300 hidden md:block">{service.desc}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Trusted Companies */}
      <div className="py-4 border-b border-amber-700 bg-amber-800/30">
        <div className="container mx-auto px-4">
          <h4 className="text-center text-xs text-amber-400 mb-3 font-semibold tracking-wide">
            {t('trustedBy')}
          </h4>
          <div className="flex flex-wrap justify-center items-center gap-2">
            {trustedCompanies.map((company, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="px-2 py-1 text-xs font-medium border-amber-600 text-amber-200 hover:bg-amber-700 transition-colors cursor-default"
              >
                {company}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content - Site Map Style */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Site Map */}
          <div>
            <h4 className="font-bold text-amber-400 mb-2 text-sm">{t('siteMap')}</h4>
            <ul className="space-y-1">
              {siteMapLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigateTo(link.path)}
                    className="text-xs text-amber-200 hover:text-amber-400 transition-colors flex items-center gap-1"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-amber-400 mb-4 text-lg">CATEGORIES</h4>
            <ul className="space-y-2">
              {categoryLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigateTo(link.path)}
                    className="text-sm text-amber-200 hover:text-amber-400 transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* My Account */}
          <div>
            <h4 className="font-bold text-amber-400 mb-4 text-lg">MY ACCOUNT</h4>
            <ul className="space-y-2">
              {accountLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigateTo(link.path)}
                    className="text-sm text-amber-200 hover:text-amber-400 transition-colors flex items-center gap-2"
                  >
                    <link.icon className="h-3 w-3" />
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-amber-400 mb-4 text-lg">SUPPORT</h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => navigateTo(link.path)}
                    className="text-sm text-amber-200 hover:text-amber-400 transition-colors flex items-center gap-2"
                  >
                    <link.icon className="h-3 w-3" />
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Get In Touch */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h4 className="font-bold text-amber-400 mb-4 text-lg">GET IN TOUCH</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <HomeIcon className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-sm text-amber-200">
                  EverythingNeed Global HQ, Innovation District, Tech City, Worldwide
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-amber-400 shrink-0" />
                <span className="text-sm text-amber-200">+1 (555) 123-4567, +1 (555) 987-6543</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-amber-400 shrink-0" />
                <span className="text-sm text-amber-200">support@everythingneed.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-amber-400 shrink-0" />
                <button className="text-sm text-amber-200 hover:text-amber-400 underline">
                  View on Map (Geolocation)
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                <span className="text-sm text-amber-200">24/7 Customer Support</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-amber-700" />

        {/* Newsletter Section */}
        <div className="bg-amber-800 rounded-lg p-4 mb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-center md:text-left">
              <h3 className="text-sm font-bold text-amber-100 mb-1">
                {t('subscribeNewsletter')}
              </h3>
              <p className="text-amber-300 text-xs">
                {t('getExclusiveDeals')}
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Input
                type="email"
                placeholder={t('enterEmail')}
                className="max-w-xs bg-amber-700 border-amber-600 text-amber-100 placeholder:text-amber-400 h-8 text-sm"
              />
              <Button size="sm" className="shrink-0 bg-amber-500 hover:bg-amber-400 text-amber-900 h-8">
                <Send className="h-3 w-3 mr-1" />
                {t('subscribe')}
              </Button>
            </div>
          </div>
        </div>

        {/* App Download & Payment Methods */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
          <div className="text-center lg:text-left">
            <h4 className="font-semibold mb-3 text-amber-100">Download Our Mobile App</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 border-amber-600 text-amber-200 hover:bg-amber-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                App Store
              </Button>
              <Button variant="outline" size="sm" className="gap-2 border-amber-600 text-amber-200 hover:bg-amber-700">
                <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="m3 20.5 9-9-9-9 1.5-1 11 10-11 10z"/></svg>
                Google Play
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="font-semibold mb-3 text-amber-100">We Accept</h4>
            <div className="flex gap-2 flex-wrap justify-center">
              {["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay", "Stripe", "Crypto"].map((method) => (
                <div key={method} className="px-3 py-1.5 bg-amber-800 rounded text-xs font-medium text-amber-200">
                  {method}
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center lg:text-right">
            <h4 className="font-semibold mb-3 text-amber-100">Security & Trust</h4>
            <div className="flex gap-2 flex-wrap justify-center lg:justify-end">
              <Badge variant="outline" className="gap-1 border-amber-600 text-amber-200">
                <Shield className="h-3 w-3" />
                SSL Secured
              </Badge>
              <Badge variant="outline" className="gap-1 border-amber-600 text-amber-200">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
              <Badge variant="outline" className="gap-1 border-amber-600 text-amber-200">
                <Award className="h-3 w-3" />
                ISO Certified
              </Badge>
            </div>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-amber-700">
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className={`p-2 rounded-full bg-amber-800 transition-all duration-300 ${social.color}`}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          
          <p className="text-sm text-amber-300 flex items-center gap-1 flex-wrap justify-center">
            © {currentYear} everythingneed.com. Made with 
            <Heart className="h-4 w-4 text-red-400 fill-red-400" /> 
            for humanity. All rights reserved.
          </p>
          
          <div className="flex gap-4 text-sm text-amber-300">
            <button onClick={() => navigateTo("/")} className="hover:text-amber-400 transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => navigateTo("/")} className="hover:text-amber-400 transition-colors">
              Terms of Service
            </button>
            <button onClick={() => navigateTo("/")} className="hover:text-amber-400 transition-colors">
              Cookie Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;