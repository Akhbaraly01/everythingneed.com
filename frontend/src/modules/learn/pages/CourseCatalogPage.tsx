import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

export default function CourseCatalogPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState("");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses", category],
    queryFn: () => {
      const params = category ? `?category=${category}` : "";
      return http.get<{ data: any[] }>(`/api/courses${params}`).then((res) => res.data);
    },
  });

  const categories = [
    "Web Development",
    "Data Science",
    "Mobile Development",
    "Business",
    "Design",
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-2xl font-bold">Course Catalog</h1>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={category === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setCategory("")}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading courses...</div>
      ) : !courses || courses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No courses found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course: any) => (
            <Card
              key={course.id}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => navigate(`/learn/courses/${course.id}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {course.instructor?.name || course.instructor_name || "Instructor"}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{course.category || "General"}</Badge>
                    {course.rating && (
                      <span className="text-sm text-muted-foreground">
                        Rating: {course.rating}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold">
                    ${course.price?.toFixed(2) || "Free"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
