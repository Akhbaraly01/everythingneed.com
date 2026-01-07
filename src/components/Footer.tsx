import { Link } from "react-router-dom";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin, 
  Heart,
  Send,
  Globe,
  Shield,
  CreditCard,
  Truck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Quick Links",
      links: [
        { name: "Home", path: "/" },
        { name: "Needs", path: "/deals" },
        { name: "Learn", path: "/learn" },
        { name: "Healthcare", path: "/healthcare" },
        { name: "Pharmacy", path: "/pharmacy" },
        { name: "Dashboard", path: "/account/dashboard" },
      ],
    },
    {
      title: "Services",
      links: [
        { name: "Transportation", path: "/deals/transportation" },
        { name: "Hotels & Booking", path: "/deals/hotels" },
        { name: "Jobs & Careers", path: "/deals/jobs" },
        { name: "Real Estate", path: "/deals/real-estate" },
        { name: "Agriculture", path: "/deals/agriculture" },
        { name: "Food & Catering", path: "/deals/food" },
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
        { name: "Help Center", path: "/support" },
        { name: "Contact Us", path: "/contact" },
        { name: "FAQs", path: "/faqs" },
        { name: "Submit Ticket", path: "/support/tickets/new" },
        { name: "Live Chat", path: "/chat" },
        { name: "Community", path: "/community" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", path: "/about" },
        { name: "Careers", path: "/careers" },
        { name: "Press", path: "/press" },
        { name: "Blog", path: "/blog" },
        { name: "Partners", path: "/partners" },
        { name: "Affiliates", path: "/affiliates" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", path: "/privacy" },
        { name: "Terms of Service", path: "/terms" },
        { name: "Cookie Policy", path: "/cookies" },
        { name: "Refund Policy", path: "/refunds" },
        { name: "Shipping Info", path: "/shipping" },
        { name: "Accessibility", path: "/accessibility" },
      ],
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  const features = [
    { icon: Truck, text: "Free Shipping on $50+" },
    { icon: Shield, text: "Secure Payments" },
    { icon: CreditCard, text: "Easy Returns" },
    { icon: Globe, text: "Worldwide Delivery" },
  ];

  return (
    <footer className="bg-gradient-to-b from-background to-muted border-t border-border">
      {/* Features Bar */}
      <div className="bg-primary/5 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-center gap-2 text-sm">
                <feature.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-gradient-primary py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-primary-foreground mb-2">
                Stay Updated
              </h3>
              <p className="text-primary-foreground/80">
                Subscribe to our newsletter for the latest updates, deals, and exclusive offers
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
            <Link to="/" className="inline-block mb-4">
              <h2 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                everythingneed
              </h2>
            </Link>
            <p className="text-muted-foreground mb-4 text-sm">
              Your all-in-one platform for every human need. From transportation to healthcare, 
              we connect you with the services you need.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>support@everythingneed.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+1 (555) 123-4567</span>
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
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* App Download & Payment Methods */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-2">Download Our App</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                App Store
              </Button>
              <Button variant="outline" size="sm">
                Google Play
              </Button>
            </div>
          </div>
          <div className="text-center md:text-right">
            <h4 className="font-semibold mb-2">We Accept</h4>
            <div className="flex gap-2 text-muted-foreground">
              <div className="px-3 py-1 bg-muted rounded text-xs font-medium">Visa</div>
              <div className="px-3 py-1 bg-muted rounded text-xs font-medium">Mastercard</div>
              <div className="px-3 py-1 bg-muted rounded text-xs font-medium">PayPal</div>
              <div className="px-3 py-1 bg-muted rounded text-xs font-medium">Apple Pay</div>
            </div>
          </div>
        </div>

        {/* Social Links & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="p-2 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            © {currentYear} everythingneed.com. Made with <Heart className="h-4 w-4 text-destructive fill-destructive" /> All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
