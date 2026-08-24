import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: () => http.get<any>(`/api/jobs/${id}`).then((res) => res.data),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading job details...</div>;
  }

  if (!job) {
    return <div className="p-8 text-center">Job not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/jobs")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{job.title}</CardTitle>
              <p className="text-lg text-muted-foreground mt-1">{job.company}</p>
            </div>
            <Button onClick={() => navigate(`/jobs/${id}/apply`)}>
              Apply Now
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            {job.location && <Badge variant="secondary">{job.location}</Badge>}
            {job.type && <Badge variant="secondary">{job.type}</Badge>}
            {job.salary && <Badge variant="outline">{job.salary}</Badge>}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Requirements</h3>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {job.requirements.map((req: string, idx: number) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {job.salary && <span>Salary: {job.salary}</span>}
            {job.location && <span>Location: {job.location}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
