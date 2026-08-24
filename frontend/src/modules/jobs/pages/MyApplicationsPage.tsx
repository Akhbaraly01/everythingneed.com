import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function MyApplicationsPage() {
  const navigate = useNavigate();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["myApplications"],
    queryFn: () =>
      http.get<any>("/api/jobs/applications").then((res) => res.data),
  });

  const statusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/jobs")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
      </Button>

      <h1 className="text-2xl font-bold">My Applications</h1>

      {isLoading ? (
        <div className="text-center py-8">Loading applications...</div>
      ) : !applications || applications.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          You haven't applied to any jobs yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app: any) => (
            <Card
              key={app.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/jobs/${app.job_id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {app.job?.title || app.job_title || "Job Title"}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {app.job?.company || app.company || "Company"}
                    </p>
                  </div>
                  <Badge variant={statusVariant(app.status)}>
                    {app.status || "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Applied:{" "}
                  {new Date(app.created_at || app.applied_date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
