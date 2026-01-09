import { Link, useNavigate } from "react-router-dom";
import { User, Search, ScanLine, Headphones, Bell, Globe, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const StaticTopBar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, profile, user } = useAuth();
  const { currency, setCurrency, currencies, language, setLanguage, languages } = useCurrency();

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const handleScan = () => {
    toast.info("Camera scan feature - Upload or scan an item image to find similar products!");
    // Future: Implement camera/upload functionality
  };

  const handleSupport = () => {
    navigate("/support/tickets");
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-3 py-2">
        <div className="flex items-center gap-2">
          {/* User Avatar */}
          {isAuthenticated ? (
            <Link to="/account">
              <Avatar className="h-9 w-9 border-2 border-primary/50">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => navigate("/auth")} className="h-9 w-9">
              <User className="h-5 w-5" />
            </Button>
          )}

          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products, services..."
              className="pl-9 h-9 bg-muted/50 border-0 text-sm"
            />
          </div>

          {/* Scan Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleScan}
            className="h-9 w-9 shrink-0"
          >
            <ScanLine className="h-5 w-5" />
          </Button>

          {/* Customer Support */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSupport}
            className="h-9 w-9 shrink-0"
          >
            <Headphones className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9 shrink-0 relative"
            onClick={() => navigate("/account/notifications")}
          >
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 text-[10px] bg-destructive">
              3
            </Badge>
          </Button>
        </div>

        {/* Currency & Language Selector Row */}
        <div className="flex items-center gap-2 mt-2">
          {/* Currency Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                <span className="font-medium">{currency.code}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel className="text-xs">Select Currency</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {currencies.map((c) => (
                <DropdownMenuItem 
                  key={c.code} 
                  onClick={() => setCurrency(c)}
                  className={currency.code === c.code ? "bg-primary/10" : ""}
                >
                  <span className="font-medium mr-2">{c.symbol}</span>
                  <span>{c.code}</span>
                  <span className="text-muted-foreground ml-2 text-xs">- {c.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                <Globe className="h-3 w-3" />
                <span>{language.flag}</span>
                <span className="hidden sm:inline">{language.code.toUpperCase()}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel className="text-xs">Select Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code} 
                  onClick={() => setLanguage(lang)}
                  className={language.code === lang.code ? "bg-primary/10" : ""}
                >
                  <span className="mr-2">{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                  <span className="text-muted-foreground ml-2 text-xs">({lang.name})</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Brand */}
          <Link to="/" className="ml-auto">
            <span className="text-sm font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              everythingneed
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StaticTopBar;
