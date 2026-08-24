import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", courseId, lessonId],
    queryFn: () =>
      http
        .get<{ data: any }>(`/api/courses/${courseId}/lessons/${lessonId}`)
        .then((res) => res.data),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading lesson...</div>;
  }

  if (!lesson) {
    return <div className="p-8 text-center">Lesson not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate(`/learn/courses/${courseId}`)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{lesson.title || "Lesson"}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Lesson {lesson.order || lesson.position || ""}
              </p>
            </div>
            {lesson.duration && (
              <Badge variant="secondary">{lesson.duration}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-lg">Video Player</p>
              <p className="text-sm">Video content will be displayed here</p>
            </div>
          </div>

          {lesson.content && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Lesson Content</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                {lesson.content}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            {lesson.prev_lesson_id ? (
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`/learn/courses/${courseId}/lessons/${lesson.prev_lesson_id}`)
                }
              >
                Previous Lesson
              </Button>
            ) : (
              <div />
            )}
            {lesson.next_lesson_id ? (
              <Button
                onClick={() =>
                  navigate(`/learn/courses/${courseId}/lessons/${lesson.next_lesson_id}`)
                }
              >
                Next Lesson
              </Button>
            ) : (
              <Button onClick={() => navigate(`/learn/courses/${courseId}`)}>
                Back to Course
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
