import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function MyCoursesPage() {
  const navigate = useNavigate();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["myEnrollments"],
    queryFn: () => http.get<{ data: any[] }>("/api/my-courses").then((res) => res.data),
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/learn")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learn
      </Button>

      <h1 className="text-2xl font-bold">My Courses</h1>

      {isLoading ? (
        <div className="text-center py-8">Loading courses...</div>
      ) : !enrollments || enrollments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          You haven't enrolled in any courses yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {enrollments.map((enrollment: any) => {
            const progress = enrollment.progress || 0;
            const course = enrollment.course || {};
            return (
              <Card
                key={enrollment.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/learn/courses/${course.id || enrollment.course_id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {course.title || "Course Title"}
                      </CardTitle>
                      {course.last_accessed && (
                        <p className="text-sm text-muted-foreground">
                          Last accessed:{" "}
                          {new Date(course.last_accessed).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{progress}%</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
