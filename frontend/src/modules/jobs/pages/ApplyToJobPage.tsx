import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function ApplyToJobPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [coverLetter, setCoverLetter] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [availability, setAvailability] = useState("immediately");

  const { data: job } = useQuery({
    queryKey: ["job", id],
    queryFn: () => http.get<any>(`/api/jobs/${id}`).then((res) => res.data),
  });

  const mutation = useMutation({
    mutationFn: (data: {
      cover_letter: string;
      expected_salary: string;
      availability: string;
    }) => http.post(`/api/jobs/${id}/apply`, data),
    onSuccess: () => {
      navigate("/jobs/applications");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      cover_letter: coverLetter,
      expected_salary: expectedSalary,
      availability,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate(`/jobs/${id}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Apply to {job?.title || "Job"}</CardTitle>
          {job?.company && (
            <p className="text-muted-foreground">{job.company}</p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="cover_letter" className="text-sm font-medium">
                Cover Letter
              </label>
              <textarea
                id="cover_letter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell us why you're a great fit for this role..."
                className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="expected_salary" className="text-sm font-medium">
                Expected Salary
              </label>
              <input
                id="expected_salary"
                type="text"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="e.g. $50,000 - $60,000"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="availability" className="text-sm font-medium">
                Availability
              </label>
              <select
                id="availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="immediately">Immediately</option>
                <option value="2weeks">2 Weeks</option>
                <option value="1month">1 Month</option>
              </select>
            </div>

            {mutation.isError && (
              <p className="text-sm text-red-500">
                Something went wrong. Please try again.
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
