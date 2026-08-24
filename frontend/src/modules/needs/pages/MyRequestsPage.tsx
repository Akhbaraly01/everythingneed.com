import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@core/api";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/textarea";
import { Label } from "@shared/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@shared/ui/dialog";
import { Skeleton } from "@shared/ui/skeleton";
import { Inbox, Send, Handshake, CreditCard, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "/api";

interface NeedOffer {
  id: string;
  provider_id: string;
  price: string;
  message: string | null;
  status: string;
  created_at: string;
  provider?: { id: string; name: string };
}

interface NeedRequest {
  id: string;
  request_number: string;
  title: string;
  description: string;
  budget_min?: string;
  budget_max?: string;
  location?: string;
  deadline?: string;
  status: string;
  created_at: string;
  offers?: NeedOffer[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-blue-100 text-blue-800",
  offered: "bg-indigo-100 text-indigo-800",
  accepted: "bg-emerald-100 text-emerald-800",
  paid: "bg-green-100 text-green-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-teal-100 text-teal-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function MyRequestsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── Data ──
  const mineRes = useQuery({
    queryKey: ["need-requests", "mine"],
    queryFn: () => http.get<{ data: NeedRequest[] }>(`${API}/need-requests?scope=mine`).then((r) => r.data ?? []),
  });

  const openRes = useQuery({
    queryKey: ["need-requests", "open"],
    queryFn: () => http.get<{ data: NeedRequest[] }>(`${API}/need-requests?scope=open`).then((r) => r.data ?? []),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["need-requests"] });
  };

  const notifyError = (error: unknown) =>
    toast({
      title: "Action failed",
      description: error instanceof Error ? error.message : "Please try again.",
      variant: "destructive",
    });

  const payMutation = useMutation({
    mutationFn: (requestId: string) =>
      http.post(`${API}/need-requests/${requestId}/pay`, { method: "card" }),
    onSuccess: () => {
      toast({ title: "Payment successful", description: "The provider can start working." });
      invalidateAll();
    },
    onError: notifyError,
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) =>
      http.post(`${API}/need-requests/${requestId}/cancel`),
    onSuccess: () => {
      toast({ title: "Request cancelled" });
      invalidateAll();
    },
    onError: notifyError,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Inbox className="h-7 w-7" /> Requests Hub
        </h1>
      </div>

      <Tabs defaultValue="mine" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mine">My Requests</TabsTrigger>
          <TabsTrigger value="open">Open Marketplace</TabsTrigger>
        </TabsList>

        {/* ── MY REQUESTS ── */}
        <TabsContent value="mine" className="space-y-4">
          {mineRes.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          ) : (mineRes.data ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center space-y-3">
                <Inbox className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="font-medium">No requests yet</p>
                <p className="text-sm text-muted-foreground">Submit a need and providers will send you offers.</p>
              </CardContent>
            </Card>
          ) : (
            mineRes.data?.map((req) => (
              <MyRequestCard
                key={req.id}
                request={req}
                onPay={() => payMutation.mutate(req.id)}
                paying={payMutation.isPending}
                onCancel={() => cancelMutation.mutate(req.id)}
                cancelling={cancelMutation.isPending}
              />
            ))
          )}
        </TabsContent>

        {/* ── OPEN MARKETPLACE (providers bid here) ── */}
        <TabsContent value="open" className="space-y-4">
          {openRes.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          ) : (openRes.data ?? []).length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-sm text-muted-foreground">No open requests right now.</p>
              </CardContent>
            </Card>
          ) : (
            openRes.data?.map((req) => (
              <OpenRequestCard key={req.id} request={req} onOffered={invalidateAll} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Owner card with offers + payment flow ─────────────────────────

function MyRequestCard({
  request, onPay, paying, onCancel, cancelling,
}: {
  request: NeedRequest;
  onPay: () => void;
  paying: boolean;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const [offersOpen, setOffersOpen] = useState(false);

  const offersRes = useQuery({
    queryKey: ["need-offers", request.id],
    queryFn: () => http.get<{ data: NeedOffer[] }>(`${API}/need-requests/${request.id}/offers`).then((r) => r.data ?? []),
    enabled: offersOpen,
  });

  const acceptMutation = useMutation({
    mutationFn: (offerId: string) =>
      http.post(`${API}/need-requests/${request.id}/offers/${offerId}/accept`),
    onSuccess: () => {
      setOffersOpen(true);
      void offersRes.refetch();
    },
  });

  const pendingOffers = (offersRes.data ?? []).filter((o) => o.status === "pending");
  const acceptedOffer = (offersRes.data ?? []).find((o) => o.status === "accepted");

  const canCancel = ["pending", "reviewing", "offered"].includes(request.status);
  const canPay = request.status === "accepted";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{request.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {request.request_number} · {new Date(request.created_at).toLocaleDateString()}
              {request.location ? ` · ${request.location}` : ""}
            </p>
          </div>
          <Badge className={STATUS_COLORS[request.status]}>{request.status.replace("_", " ")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>

        {(request.budget_min || request.budget_max) && (
          <p className="text-sm font-medium">
            Budget: ${Number(request.budget_min ?? 0).toFixed(0)} – ${Number(request.budget_max ?? 0).toFixed(0)}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => setOffersOpen((v) => !v)}>
            <Handshake className="h-4 w-4 mr-1" />
            {offersOpen ? "Hide offers" : "View offers"}
          </Button>

          {canPay && (
            <Button size="sm" onClick={onPay} disabled={paying}>
              {paying ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CreditCard className="h-4 w-4 mr-1" />}
              Pay accepted offer
            </Button>
          )}

          {canCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={cancelling}>
              <XCircle className="h-4 w-4 mr-1" /> Cancel
            </Button>
          )}

          {request.status === "paid" && (
            <span className="inline-flex items-center gap-1 text-sm text-emerald-600 self-center">
              <CreditCard className="h-4 w-4" /> Paid — waiting for the provider to start
            </span>
          )}
          {request.status === "completed" && (
            <span className="inline-flex items-center gap-1 text-sm text-teal-600 self-center">
              <CheckCircle2 className="h-4 w-4" /> Completed
            </span>
          )}
        </div>

        {offersOpen && (
          <div className="rounded-lg border divide-y mt-2">
            {offersRes.isLoading && <div className="p-3"><Skeleton className="h-12 w-full" /></div>}
            {!offersRes.isLoading && (offersRes.data ?? []).length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">No offers received yet.</p>
            )}
            {(offersRes.data ?? []).map((offer) => (
              <div key={offer.id} className="flex items-center justify-between p-3 gap-3">
                <div>
                  <p className="font-semibold">${Number(offer.price).toFixed(2)}</p>
                  {offer.message && <p className="text-xs text-muted-foreground">{offer.message}</p>}
                  {offer.provider?.name && (
                    <p className="text-xs text-muted-foreground mt-0.5">by {offer.provider.name}</p>
                  )}
                </div>
                {offer.status === "pending" && request.status !== "accepted" && request.status !== "paid" && (
                  <Button
                    size="sm"
                    disabled={acceptMutation.isPending}
                    onClick={() => acceptMutation.mutate(offer.id)}
                  >
                    Accept
                  </Button>
                )}
                {offer.status === "accepted" && <Badge variant="default">Accepted</Badge>}
                {offer.status === "rejected" && <Badge variant="secondary">Declined</Badge>}
              </div>
            ))}
            {acceptedOffer && pendingOffers.length > 0 && (
              <p className="p-2 text-[11px] text-muted-foreground px-3">
                Other pending offers were declined automatically.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Provider card with bid dialog ─────────────────────────────────

function OpenRequestCard({ request, onOffered }: { request: NeedRequest; onOffered: () => void }) {
  const { toast } = useToast();
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const offerMutation = useMutation({
    mutationFn: () =>
      http.post(`${API}/need-requests/${request.id}/offers`, {
        price: Number(price),
        message: message || undefined,
      }),
    onSuccess: () => {
      toast({ title: "Offer sent!", description: "You'll be notified if it's accepted." });
      setOpen(false);
      setPrice("");
      setMessage("");
      onOffered();
    },
    onError: (error) =>
      toast({
        title: "Could not send offer",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      }),
  });

  return (
    <Card>
      <CardContent className="pt-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{request.title}</p>
            <p className="text-xs text-muted-foreground">
              {(request as NeedRequest & { location?: string }).location ?? "Remote"} ·{" "}
              {new Date(request.created_at).toLocaleDateString()}
            </p>
          </div>
          {(request.budget_max || request.budget_min) && (
            <Badge variant="outline">
              up to ${Number(request.budget_max ?? request.budget_min ?? 0).toFixed(0)}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="mt-1">
              <Send className="h-4 w-4 mr-1" /> Send offer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Offer for "{request.title}"</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={`price-${request.id}`}>Your price ($) *</Label>
                <Input
                  id={`price-${request.id}`}
                  type="number"
                  min={1}
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`msg-${request.id}`}>Message</Label>
                <Textarea
                  id={`msg-${request.id}`}
                  rows={3}
                  placeholder="Why you're the best fit, timeline…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={!price || Number(price) <= 0 || offerMutation.isPending}
                onClick={() => offerMutation.mutate()}
              >
                {offerMutation.isPending ? "Sending…" : "Submit offer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
