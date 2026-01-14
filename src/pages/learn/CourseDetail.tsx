import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Play, ArrowLeft, Clock, Users, BookOpen, Award, Star, 
  CheckCircle2, Circle, Download, Share2, Heart, MessageSquare,
  GraduationCap, Trophy, Flame, Target, PlayCircle
} from "lucide-react";
import LearnVideoPlayer from "@/components/learn/LearnVideoPlayer";
import CourseProgressTracker from "@/components/learn/CourseProgressTracker";
import CourseNotesBookmarks from "@/components/learn/CourseNotesBookmarks";
import { extendedCourses } from "@/data/learnData";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";

// Generate lesson data for a course
const generateLessons = (courseId: string, lessonCount: number) => {
  return Array.from({ length: lessonCount }, (_, i) => ({
    id: `${courseId}-lesson-${i + 1}`,
    title: `Lesson ${i + 1}: ${["Introduction", "Core Concepts", "Practical Application", "Advanced Techniques", "Real-World Examples", "Best Practices", "Case Studies", "Project Work", "Review & Summary", "Final Assessment"][i % 10]}`,
    duration: 10 + Math.floor(Math.random() * 30),
    completed: false,
  }));
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Find course
  const course = extendedCourses.find(c => c.id === courseId) || extendedCourses[0];
  const lessons = generateLessons(course.id, course.lessons || 10);

  useEffect(() => {
    // Check if enrolled
    const enrolled = localStorage.getItem(`enrolled-${course.id}`);
    if (enrolled) setIsEnrolled(true);
    
    // Set first lesson
    if (lessons.length > 0) {
      setCurrentLessonId(lessons[0].id);
    }
  }, [course.id, lessons]);

  const handleEnroll = () => {
    if (!user) {
      toast.error("Please sign in to enroll");
      return;
    }
    localStorage.setItem(`enrolled-${course.id}`, "true");
    setIsEnrolled(true);
    toast.success("Successfully enrolled in the course!");
  };

  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress);
  };

  const handleVideoComplete = () => {
    toast.success("Lesson completed!");
  };

  const handleLessonSelect = (lessonId: string) => {
    setCurrentLessonId(lessonId);
  };

  const handleSeekToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleGenerateCertificate = () => {
    setShowCertificate(true);
    toast.success("Certificate generated! You can download it now.");
  };

  const currentLesson = lessons.find(l => l.id === currentLessonId);

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Back Navigation */}
      <div className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/learn">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
          <div className="flex-1" />
          <Button variant="ghost" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="space-y-4">
              <LearnVideoPlayer
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                poster={`https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200`}
                title={currentLesson?.title || course.title}
                onProgress={handleVideoProgress}
                onComplete={handleVideoComplete}
              />
              
              {/* Current Lesson Info */}
              {currentLesson && (
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{currentLesson.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      Duration: {currentLesson.duration} minutes
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <PlayCircle className="h-3 w-3" />
                    {Math.round(videoProgress)}% watched
                  </Badge>
                </div>
              )}
            </div>

            {/* Course Info Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge>{course.category}</Badge>
                      <Badge variant="outline">{course.level}</Badge>
                      <Badge variant="secondary">{course.level}</Badge>
                    </div>
                    <CardTitle className="text-2xl">{course.title}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="font-semibold">{course.duration}</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="font-semibold">{course.students.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="font-semibold">{course.lessons}</p>
                        <p className="text-xs text-muted-foreground">Lessons</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                        <p className="font-semibold">{course.rating}</p>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <h4 className="font-semibold">What You'll Learn</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          "Master core fundamentals and advanced concepts",
                          "Build real-world projects from scratch",
                          "Learn industry best practices",
                          "Get lifetime access to course materials",
                          "Earn a certificate upon completion",
                          "Join our student community"
                        ].map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="curriculum" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Content</CardTitle>
                    <CardDescription>
                      {lessons.length} lessons • {lessons.reduce((a, l) => a + l.duration, 0)} minutes total
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        onClick={() => isEnrolled && handleLessonSelect(lesson.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          isEnrolled ? "cursor-pointer hover:bg-muted" : "opacity-60"
                        } ${currentLessonId === lesson.id ? "bg-primary/10 border border-primary/20" : ""}`}
                      >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          {isEnrolled ? (
                            <PlayCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground">{lesson.duration} min</p>
                        </div>
                        {!isEnrolled && index > 0 && (
                          <Badge variant="outline" className="text-xs">Premium</Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="instructor" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${course.instructor}`} />
                        <AvatarFallback>{course.instructor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{course.instructor}</h3>
                        <p className="text-muted-foreground">Senior Instructor & Expert</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            4.9 Rating
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            25,000+ Students
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            15 Courses
                          </span>
                        </div>
                        <p className="mt-4 text-sm">
                          A passionate educator with over 10 years of industry experience. 
                          Dedicated to making complex topics accessible and engaging for learners worldwide.
                        </p>
                        <Button variant="outline" className="mt-4 gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Contact Instructor
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Reviews</CardTitle>
                    <CardDescription>What our students say about this course</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="flex gap-4 pb-4 border-b last:border-0">
                        <Avatar>
                          <AvatarImage src={`https://i.pravatar.cc/40?u=student${i}`} />
                          <AvatarFallback>S{i + 1}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Student {i + 1}</h4>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-3 w-3 ${star <= 5 - i * 0.5 ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {[
                              "Excellent course! The instructor explains everything clearly and the projects are very practical.",
                              "Great content and well-structured. I learned a lot and feel confident applying these skills.",
                              "Very comprehensive course. Highly recommended for anyone looking to master this topic."
                            ][i]}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            {!isEnrolled && (
              <Card className="sticky top-20">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold text-primary">{formatPrice(course.price)}</p>
                    <p className="text-sm text-muted-foreground line-through">
                      {formatPrice(course.price * 1.5)}
                    </p>
                    <Badge className="mt-2 bg-destructive">33% OFF</Badge>
                  </div>
                  <Button className="w-full mb-3" size="lg" onClick={handleEnroll}>
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Enroll Now
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    30-day money-back guarantee
                  </p>
                  <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Full lifetime access</span>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Certificate of completion</span>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Access on mobile & TV</span>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress Tracker (for enrolled students) */}
            {isEnrolled && (
              <CourseProgressTracker
                courseId={course.id}
                courseName={course.title}
                lessons={lessons}
                onLessonSelect={handleLessonSelect}
              />
            )}

            {/* Notes & Bookmarks (for enrolled students) */}
            {isEnrolled && (
              <CourseNotesBookmarks
                courseId={course.id}
                currentTime={0}
                onSeekToTime={handleSeekToTime}
              />
            )}

            {/* Certificate Section */}
            {showCertificate && (
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="pt-6 text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-3 text-yellow-500" />
                  <h3 className="font-bold text-lg mb-2">Congratulations! 🎉</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You've completed the course!
                  </p>
                  <Button className="w-full gap-2">
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
