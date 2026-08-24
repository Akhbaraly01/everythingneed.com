import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  status: string;
  created_at: string;
}

export function PlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: plan, isLoading } = useQuery<Plan>({
    queryKey: ["plan", id],
    queryFn: async () => {
      const { data } = await http.get<any>(`/api/plans/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Plan not found</p>
        <Button variant="link" onClick={() => navigate("/subscriptions")}>Back to plans</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/subscriptions")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{plan.name}</h1>
        <Badge variant={plan.status === "active" ? "default" : "secondary"}>
          {plan.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            ${plan.price?.toFixed(2)}
            <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{plan.description}</p>
        </CardContent>
      </Card>

      {plan.features?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button className="w-full" size="lg">Subscribe Now</Button>
    </div>
  );
}

export default PlanDetail;
