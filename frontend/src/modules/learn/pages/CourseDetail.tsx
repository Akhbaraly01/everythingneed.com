import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Progress } from "@shared/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { 
  Play, ArrowLeft, Clock, Users, BookOpen, Award, Star, 
  CheckCircle2, Circle, Download, Share2, Heart, MessageSquare,
  GraduationCap, Trophy, Flame, Target, PlayCircle
} from "lucide-react";
// eslint-disable-next-line no-restricted-imports -- Learn components belong to learn module
import { LearnVideoPlayer, CourseProgressTracker, CourseNotesBookmarks } from "@modules/learn";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { db } from "@core/api/laravelGateway";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  const queryClient = useQueryClient();
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch course from API
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await http.get<any>(`${API}/courses/${courseId}`);
      const raw = res?.data || res;
      return {
        id: raw.id || raw.slug || courseId,
        title: raw.title || "Course",
        description: raw.description || "",
        instructor: raw.instructor_name || "Instructor",
        category: raw.category?.name || "General",
        level: raw.level || "Beginner",
        duration: raw.duration || `${raw.lessons_count || 10} lessons`,
        students: raw.students_count || raw.enrollments_count || 0,
        rating: raw.rating || 4.5,
        price: raw.price || 0,
        lessons: raw.lessons_count || 10,
        thumbnail: raw.thumbnail,
        whatYouWillLearn: raw.what_you_will_learn || [],
        requirements: raw.requirements || [],
      };
    },
    enabled: !!courseId,
  });

  const safeCourse = course || { id: courseId || "", title: "Loading...", description: "", instructor: "", category: "General", level: "Beginner", duration: "0 lessons", students: 0, rating: 0, price: 0, lessons: 10, thumbnail: null, whatYouWillLearn: [], requirements: [] };
  const lessons = generateLessons(safeCourse.id, safeCourse.lessons || 10);

  // Check enrollment status from API
  const { data: enrollment, isLoading: checkingEnrollment } = useQuery({
    queryKey: ['enrollment', safeCourse.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        const res = await http.get<any>(`${API}/my-courses`);
        const courses = res?.data || res || [];
        const enrollment = Array.isArray(courses) 
          ? courses.find((c: any) => c.course_id === safeCourse.id || c.id === safeCourse.id)
          : null;
        return enrollment || null;
      } catch {
        return null;
      }
    },
    enabled: !!user,
  });

  const isEnrolled = !!enrollment;

  // Fetch video progress for current lesson
  const { data: lessonProgress } = useQuery({
    queryKey: ['video-progress', safeCourse.id, currentLessonId, user?.id],
    queryFn: async () => {
      if (!user || !currentLessonId) return null;
      const data = await db
        .from('video_progress')
        .select('*')
        .where('user_id', '=', user.id)
        .where('course_id', '=', safeCourse.id)
        .where('lesson_id', '=', currentLessonId)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!currentLessonId && isEnrolled,
  });

  // Enroll mutation
  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get actual course from API if exists
      const dbCourse = await db
        .from('courses')
        .select('*')
        .where('slug', '=', safeCourse.id)
        .maybeSingle();

      const data = await db
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: dbCourse?.id || safeCourse.id,
          progress: 0,
        })
        .select()
        .single();
      if (!data) throw new Error("Failed to enroll");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
      toast.success("Successfully enrolled in the course!");
    },
    onError: (error) => {
      toast.error("Failed to enroll: " + error.message);
    },
  });

  // Save video progress mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (progress: { lessonId: string; percent: number; seconds: number }) => {
      if (!user) throw new Error("Not authenticated");

      const data = await db
        .from('video_progress')
        .upsert({
          user_id: user.id,
          course_id: safeCourse.id,
          lesson_id: progress.lessonId,
          progress_percent: progress.percent,
          last_position_seconds: progress.seconds,
          completed: progress.percent >= 95,
        })
        .select()
        .single();
      if (!data) throw new Error("Failed to save progress");
      return data;
    },
  });

  // Generate certificate mutation
  const generateCertificateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const data = await db
        .from('user_certificates')
        .insert({
          user_id: user.id,
          course_title: safeCourse.title,
          instructor_name: safeCourse.instructor,
          certificate_number: certNumber,
        })
        .select()
        .single();
      if (!data) throw new Error("Failed to generate certificate");
      return data;
    },
    onSuccess: () => {
      setShowCertificate(true);
      toast.success("Certificate generated! You can download it now.");
    },
    onError: (error) => {
      toast.error("Failed to generate certificate: " + error.message);
    },
  });

  // Set first lesson on mount
  useEffect(() => {
    if (lessons.length > 0 && !currentLessonId) {
      setCurrentLessonId(lessons[0].id);
    }
  }, [lessons, currentLessonId]);

  // Restore video progress when lesson changes
  useEffect(() => {
    if (lessonProgress) {
      setVideoProgress(Number(lessonProgress.progress_percent) || 0);
    } else {
      setVideoProgress(0);
    }
  }, [lessonProgress]);

  const handleEnroll = () => {
    if (!user) {
      toast.error("Please sign in to enroll");
      return;
    }
    enrollMutation.mutate();
  };

  const handleVideoProgress = (progress: number) => {
    setVideoProgress(progress);
    // Save progress every 10% or on completion
    if (currentLessonId && user && (progress % 10 < 1 || progress >= 95)) {
      saveProgressMutation.mutate({
        lessonId: currentLessonId,
        percent: progress,
        seconds: Math.floor(progress * 10), // Approximate
      });
    }
  };

  const handleVideoComplete = () => {
    toast.success("Lesson completed!");
    if (currentLessonId && user) {
      saveProgressMutation.mutate({
        lessonId: currentLessonId,
        percent: 100,
        seconds: 0,
      });
    }
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
    generateCertificateMutation.mutate();
  };

  const handleDownloadCertificate = () => {
    // Generate PDF certificate
    const certificateContent = `
CERTIFICATE OF COMPLETION

This is to certify that

${user?.email || 'Student'}

has successfully completed the course

"${safeCourse.title}"

Instructor: ${safeCourse.instructor}
Date: ${new Date().toLocaleDateString()}

Certificate ID: CERT-${Date.now()}
    `;
    
    const blob = new Blob([certificateContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${safeCourse.title.replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Certificate downloaded!");
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
                title={currentLesson?.title || safeCourse.title}
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
                      <Badge>{safeCourse.category}</Badge>
                      <Badge variant="outline">{safeCourse.level}</Badge>
                      <Badge variant="secondary">{safeCourse.level}</Badge>
                    </div>
                    <CardTitle className="text-2xl">{safeCourse.title}</CardTitle>
                    <CardDescription>{safeCourse.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="font-semibold">{safeCourse.duration}</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="font-semibold">{safeCourse.students.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="font-semibold">{safeCourse.lessons}</p>
                        <p className="text-xs text-muted-foreground">Lessons</p>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                        <p className="font-semibold">{safeCourse.rating}</p>
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
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${safeCourse.instructor}`} />
                        <AvatarFallback>{safeCourse.instructor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{safeCourse.instructor}</h3>
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
                    <p className="text-3xl font-bold text-primary">{formatPrice(safeCourse.price)}</p>
                    <p className="text-sm text-muted-foreground line-through">
                      {formatPrice(safeCourse.price * 1.5)}
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
                courseId={safeCourse.id}
                courseName={safeCourse.title}
                lessons={lessons}
                onLessonSelect={handleLessonSelect}
              />
            )}

            {/* Notes & Bookmarks (for enrolled students) */}
            {isEnrolled && (
              <CourseNotesBookmarks
                courseId={safeCourse.id}
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
                  <Button className="w-full gap-2" onClick={handleDownloadCertificate}>
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
