import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CategoryGrid from "@/components/CategoryGrid";
import { learnCategories, courses } from "@/data/mockData";
import { Play, Users, Clock } from "lucide-react";

const Learn = () => {
  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="bg-gradient-secondary py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Learn & Grow
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Master new skills with 100+ courses across technology, business, agriculture, and more
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse Learning Categories</h2>
          <CategoryGrid categories={learnCategories} />
          
          <div className="mt-6 text-center">
            <Button variant="outline">
              View All 100+ Categories
            </Button>
          </div>
        </section>

        {/* Featured Courses */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Popular Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-all duration-300 group">
                <div className="aspect-video bg-gradient-primary relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
                <CardHeader>
                  <Badge className="w-fit mb-2">{course.category}</Badge>
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <CardDescription>by {course.instructor}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.students.toLocaleString()}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-primary">${course.price}</p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Enroll Now</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Course Types */}
        <section>
          <h2 className="text-2xl font-bold mb-6">What You'll Learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardHeader>
                <CardTitle>Theoretical Knowledge</CardTitle>
                <CardDescription>
                  Comprehensive theory courses covering fundamentals to advanced concepts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ In-depth video lectures</li>
                  <li>✓ Reading materials & PDFs</li>
                  <li>✓ Quizzes & assessments</li>
                  <li>✓ Certificate of completion</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-accent/10">
              <CardHeader>
                <CardTitle>Practical Skills</CardTitle>
                <CardDescription>
                  Hands-on projects and real-world applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Step-by-step tutorials</li>
                  <li>✓ Live demonstrations</li>
                  <li>✓ Practice exercises</li>
                  <li>✓ Portfolio projects</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/10 to-primary/10">
              <CardHeader>
                <CardTitle>Online Classes</CardTitle>
                <CardDescription>
                  Live sessions with expert instructors and peer interaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✓ Scheduled live classes</li>
                  <li>✓ Q&A sessions</li>
                  <li>✓ Student community</li>
                  <li>✓ Professional qualifications</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Learn;
