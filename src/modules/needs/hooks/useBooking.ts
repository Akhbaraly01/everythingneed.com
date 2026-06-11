import { useState } from "react";
import { toast } from "sonner";
import { supabaseGateway } from "@core/api/supabaseGateway";

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

  const submit = async (payload: BookingPayload) => {
    setSubmitting(true);
    try {
      const { data: auth } = await supabaseGateway.auth.getUser();
      if (!auth?.user) {
        toast.error("Please sign in to continue");
        return { ok: false as const };
      }
      const { error } = await supabaseGateway
        .from("bookings")
        .insert({
          user_id: auth.user.id,
          service_type: payload.service_type,
          service_id: payload.service_id ?? null,
          details: payload.details,
          status: "pending",
        });
      if (error) throw error;
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
