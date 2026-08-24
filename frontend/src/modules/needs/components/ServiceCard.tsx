import { useState } from "react";
import { Card, CardContent } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Star, ShoppingCart, CalendarClock, Briefcase, MessageSquare } from "lucide-react";
import BookingModal, { BookingKind } from "./BookingModal";

export interface ServiceCardItem {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  rating?: number;
  provider?: string;
  category: string;
  accentColor?: string;
}

const inferKind = (category: string): BookingKind => {
  const c = category.toLowerCase();
  if (c.includes("health") || c.includes("doctor") || c.includes("medical")) return "appointment";
  if (c.includes("job") || c.includes("career")) return "apply";
  if (c.includes("transport") || c.includes("flight") || c.includes("hotel") || c.includes("ride"))
    return "book";
  return "inquire";
};

const labelByKind: Record<BookingKind, string> = {
  book: "Book Now",
  appointment: "Appointment",
  apply: "Quick Apply",
  inquire: "Inquire",
};

const iconByKind: Record<BookingKind, React.ComponentType<any>> = {
  book: ShoppingCart,
  appointment: CalendarClock,
  apply: Briefcase,
  inquire: MessageSquare,
};

const ServiceCard = ({ item }: { item: ServiceCardItem }) => {
  const [open, setOpen] = useState(false);
  const kind = inferKind(item.category);
  const Icon = iconByKind[kind];
  const accent = item.accentColor ?? "hsl(var(--primary))";

  return (
    <>
      <Card className="group h-full flex flex-col hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
        <div
          className="h-28 sm:h-32 flex items-center justify-center rounded-t-lg"
          style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}08)` }}
        >
          <Icon className="h-10 w-10" style={{ color: accent }} />
        </div>
        <CardContent className="pt-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          {item.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span>{(item.rating ?? 4.7).toFixed(1)}</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Available</Badge>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            {item.price ? (
              <span className="text-base font-bold" style={{ color: accent }}>
                ${item.price}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Quote on request</span>
            )}
            <Button size="sm" onClick={() => setOpen(true)} className="h-8">
              <Icon className="h-3.5 w-3.5 mr-1" />
              {labelByKind[kind]}
            </Button>
          </div>
        </CardContent>
      </Card>
      <BookingModal
        open={open}
        onOpenChange={setOpen}
        kind={kind}
        service={{
          id: item.id,
          name: item.name,
          price: item.price ?? undefined,
          category: item.category,
        }}
      />
    </>
  );
};

export default ServiceCard;
