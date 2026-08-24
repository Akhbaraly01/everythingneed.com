import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export default function SubscriptionsPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      http.get<any>(`${API}/my-subscription`),
      http.get<any>(`${API}/plans`),
    ]).then(([subRes, plansRes]) => {
      if (subRes.status === "fulfilled") setSubscription(subRes.value.data?.data || null);
      if (plansRes.status === "fulfilled") setPlans(plansRes.value.data?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const subscribe = async (planId: string) => {
    try {
      await http.post(`${API}/subscribe`, { plan_id: planId });
      const res = await http.get<any>(`${API}/my-subscription`);
      setSubscription(res.data?.data || null);
    } catch {}
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 mb-6"><RefreshCw className="h-8 w-8" /> Subscriptions</h1>

      {subscription && (
        <Card className="mb-6 border-l-4 border-l-primary">
          <CardHeader><CardTitle>Current Plan</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{subscription.plan?.name || "Free"}</p>
                <p className="text-sm text-muted-foreground">Status: {subscription.status}</p>
              </div>
              <Badge variant={subscription.status === "active" ? "default" : "secondary"}>{subscription.status}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>${plan.price}/{plan.interval}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <Button onClick={() => subscribe(plan.id)} className="w-full">Subscribe</Button>
            </CardContent>
          </Card>
        ))}
        {plans.length === 0 && !loading && <p className="text-center text-muted-foreground col-span-3 py-8">No plans available</p>}
      </div>
    </div>
  );
}
