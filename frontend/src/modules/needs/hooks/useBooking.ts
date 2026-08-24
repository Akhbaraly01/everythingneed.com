import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { http } from "@core/api";

export type BookingServiceType =
  | "transportation"
  | "flight"
  | "hotel"
  | "healthcare"
  | "job"
  | "inquiry";

export interface BookingPayload {
  service_type: BookingServiceType | string;
  service_id?: string;
  details: Record<string, unknown>;
}

export function useBooking() {
  const [submitting, setSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const submit = async (payload: BookingPayload) => {
    setSubmitting(true);
    try {
      if (!isAuthenticated || !user) {
        toast.error("Please sign in to continue");
        return { ok: false as const };
      }

      await http.post("/api/bookings", {
        userId: user.id,
        serviceType: payload.service_type,
        serviceId: payload.service_id,
        details: payload.details,
      });

      toast.success("Submitted successfully");
      return { ok: true as const };
    } catch (e: any) {
      toast.error(e?.message ?? "Submission failed");
      return { ok: false as const };
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting };
}
