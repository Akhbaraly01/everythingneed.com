import { Link, useNavigate } from "react-router-dom";
import { User, Search, ScanLine, Headphones, Bell, Globe, ChevronDown, Moon, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useTheme } from "next-themes";
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
  const { language, setLanguage, languages } = useCurrency();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

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
    toast.info(t('scanFeature'));
  };

  const handleSupport = () => {
    navigate("/support/tickets");
  };

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-3 py-2">
        <div className="flex items-center gap-2">
          {/* 1. User Avatar / Profile */}
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

          {/* 2. Search + Filter Input (Global Search) */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('searchPlaceholder')}
              className="pl-9 h-9 bg-muted/50 border-0 text-sm"
            />
          </div>

          {/* 3. Scan Products Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleScan}
            className="h-9 w-9 shrink-0"
          >
            <ScanLine className="h-5 w-5" />
          </Button>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 shrink-0"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* 4. Customer Service */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSupport}
            className="h-9 w-9 shrink-0"
          >
            <Headphones className="h-5 w-5" />
          </Button>

          {/* 5. Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <span className="text-lg">{language.flag}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
              <DropdownMenuLabel className="text-xs">{t('selectLanguage')}</DropdownMenuLabel>
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

          {/* 6. Notifications */}
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
      </div>
    </div>
  );
};

export default StaticTopBar;
