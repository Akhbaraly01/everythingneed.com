import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBooking, BookingServiceType } from "../hooks/useBooking";
import { PricingEngine } from "@core/engines";

export type BookingKind = "book" | "appointment" | "apply" | "inquire";

interface Service {
  id: string;
  name: string;
  price?: number;
  category: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: BookingKind;
  service: Service;
}

const titleByKind: Record<BookingKind, string> = {
  book: "Book Now",
  appointment: "Schedule Appointment",
  apply: "Quick Apply",
  inquire: "Send Inquiry",
};

const serviceTypeByKind = (kind: BookingKind, category: string): BookingServiceType => {
  if (kind === "appointment") return "healthcare";
  if (kind === "apply") return "job";
  if (kind === "book") {
    if (category.toLowerCase().includes("hotel")) return "hotel";
    if (category.toLowerCase().includes("flight") || category.toLowerCase().includes("transport"))
      return "transportation";
    return "transportation";
  }
  return "inquiry";
};

const BookingModal = ({ open, onOpenChange, kind, service }: Props) => {
  const { submit, submitting } = useBooking();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setForm({});
  }, [open, service.id]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const guests = Number(form.guests || 1);
  const basePrice = service.price ?? 0;
  const total =
    kind === "book" && basePrice
      ? PricingEngine.lineTotal({ unitPrice: basePrice, quantity: guests })
      : null;

  const onSubmit = async () => {
    const res = await submit({
      service_type: serviceTypeByKind(kind, service.category),
      service_id: service.id,
      details: { kind, service_name: service.name, ...form, total },
    });
    if (res.ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titleByKind[kind]}</DialogTitle>
          <DialogDescription className="line-clamp-2">{service.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {kind === "book" && (
            <>
              <Field label="Date">
                <Input type="date" value={form.date || ""} onChange={(e) => set("date", e.target.value)} />
              </Field>
              <Field label="Guests / Rooms">
                <Input
                  type="number"
                  min={1}
                  value={form.guests || "1"}
                  onChange={(e) => set("guests", e.target.value)}
                />
              </Field>
              {total !== null && (
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Estimated total</span>
                  <span className="font-semibold">${total.toFixed(2)}</span>
                </div>
              )}
            </>
          )}

          {kind === "appointment" && (
            <>
              <Field label="Preferred date">
                <Input type="date" value={form.date || ""} onChange={(e) => set("date", e.target.value)} />
              </Field>
              <Field label="Time">
                <Input type="time" value={form.time || ""} onChange={(e) => set("time", e.target.value)} />
              </Field>
              <Field label="Doctor / Specialist">
                <Input
                  placeholder="e.g. Dr. Sarah Chen"
                  value={form.doctor || ""}
                  onChange={(e) => set("doctor", e.target.value)}
                />
              </Field>
              <Field label="Notes for the provider">
                <Textarea
                  rows={3}
                  value={form.notes || ""}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </Field>
            </>
          )}

          {kind === "apply" && (
            <>
              <Field label="Full name">
                <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Resume link">
                <Input
                  placeholder="https://..."
                  value={form.resume || ""}
                  onChange={(e) => set("resume", e.target.value)}
                />
              </Field>
            </>
          )}

          {kind === "inquire" && (
            <>
              <Field label="Your name">
                <Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Contact (email or phone)">
                <Input
                  value={form.contact || ""}
                  onChange={(e) => set("contact", e.target.value)}
                />
              </Field>
              <Field label="Message">
                <Textarea
                  rows={4}
                  value={form.message || ""}
                  onChange={(e) => set("message", e.target.value)}
                />
              </Field>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm">{label}</Label>
    {children}
  </div>
);

export default BookingModal;
