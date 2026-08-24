import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Progress } from "@shared/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

interface Course { id: string; title: string; description: string; instructor: string; category: string; level: string; duration: string; students: number; rating: number; price: number; lessons: number; thumbnail?: string; }
interface Video { id: string; title: string; description: string; instructor: string; category: string; duration: string; views: number; url?: string; }
interface Document { id: string; title: string; description: string; category: string; type: string; pages: number; downloads: number; author?: string; }
interface LearnCategory { id: string; name: string; icon: string; count: number; }
// eslint-disable-next-line no-restricted-imports -- FacebookStyleFeed belongs to learn module
import { FacebookStyleFeed } from "@modules/learn";
import { Link } from "react-router-dom";
import { 
  Play, Users, Clock, FileText, Download, Eye, BookOpen, 
  Video as VideoIcon, Loader2, MessageSquare, Home, TrendingUp,
  Award, Star, GraduationCap, ChevronRight, Sparkles
} from "lucide-react";

const ITEMS_PER_PAGE = 6;

const Learn = () => {
  const [activeTab, setActiveTab] = useState("feed");
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [allDocs, setAllDocs] = useState<Document[]>([]);
  const [categories, setCategories] = useState<LearnCategory[]>([]);
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [displayedVideos, setDisplayedVideos] = useState<Video[]>([]);
  const [displayedDocs, setDisplayedDocs] = useState<Document[]>([]);
  const [courseIndex, setCourseIndex] = useState(ITEMS_PER_PAGE);
  const [videoIndex, setVideoIndex] = useState(ITEMS_PER_PAGE);
  const [docIndex, setDocIndex] = useState(ITEMS_PER_PAGE);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchLearnData = async () => {
      setInitialLoading(true);
      try {
        const [coursesRes, categoriesRes] = await Promise.allSettled([
          http.get<any>(`${API}/courses?per_page=50`),
          http.get<any>(`${API}/courses`),
        ]);

        let courses: Course[] = [];
        if (coursesRes.status === "fulfilled") {
          const raw = coursesRes.value?.data || coursesRes.value || [];
          courses = (Array.isArray(raw) ? raw : []).map((c: any) => ({
            id: c.id || c.slug,
            title: c.title,
            description: c.description || "",
            instructor: c.instructor?.name || `${c.user?.first_name || ""} ${c.user?.last_name || ""}`.trim() || "Instructor",
            category: c.category?.name || "General",
            level: c.level || "Beginner",
            duration: c.duration || `${c.lessons_count || 10} lessons`,
            students: c.students_count || c.enrollments_count || 0,
            rating: c.rating || 4.5,
            price: c.price || 0,
            lessons: c.lessons_count || 10,
            thumbnail: c.thumbnail,
          }));
        }
        setAllCourses(courses);
        setDisplayedCourses(courses.slice(0, ITEMS_PER_PAGE));

        if (categoriesRes.status === "fulfilled") {
          const raw = categoriesRes.value?.data || categoriesRes.value || [];
          setCategories((Array.isArray(raw) ? raw : []).map((cat: any) => ({
            id: cat.id || cat.slug,
            name: cat.name,
            icon: cat.icon || "📚",
            count: cat.courses_count || 0,
          })));
        }
      } catch (e) {
        console.error("Failed to load learn data:", e);
      }
      setInitialLoading(false);
    };
    fetchLearnData();
  }, []);

  const loadMore = useCallback((type: 'courses' | 'videos' | 'documents') => {
    setLoading(true);
    setTimeout(() => {
      if (type === 'courses') {
        const next = allCourses.slice(courseIndex, courseIndex + ITEMS_PER_PAGE);
        setDisplayedCourses(prev => [...prev, ...next]);
        setCourseIndex(prev => prev + ITEMS_PER_PAGE);
      } else if (type === 'videos') {
        const next = allVideos.slice(videoIndex, videoIndex + ITEMS_PER_PAGE);
        setDisplayedVideos(prev => [...prev, ...next]);
        setVideoIndex(prev => prev + ITEMS_PER_PAGE);
      } else {
        const next = allDocs.slice(docIndex, docIndex + ITEMS_PER_PAGE);
        setDisplayedDocs(prev => [...prev, ...next]);
        setDocIndex(prev => prev + ITEMS_PER_PAGE);
      }
      setLoading(false);
    }, 500);
  }, [courseIndex, videoIndex, docIndex, allCourses, allVideos, allDocs]);

  // Featured course
  const featuredCourse = allCourses[0];

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-secondary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <Badge className="bg-white/20 text-white mb-4">🎓 Over 500+ Courses</Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Learn New Skills & Advance Your Career
              </h1>
              <p className="text-white/90 mb-6 max-w-lg">
                Access world-class courses, video tutorials, and documents from expert instructors. Get certified and boost your career.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/learn/course/featured">
                  <Button size="lg" variant="secondary" className="gap-2">
                    <Play className="h-4 w-4" />
                    Start Learning
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                  View Certificates
                </Button>
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-white/20">
                <div>
                  <p className="text-2xl font-bold">{allCourses.length}+</p>
                  <p className="text-sm text-white/70">Courses</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{allCourses.length > 0 ? new Set(allCourses.map(c => c.instructor)).size : 0}+</p>
                  <p className="text-sm text-white/70">Instructors</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">50K+</p>
                  <p className="text-sm text-white/70">Students</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">4.8</p>
                  <p className="text-sm text-white/70">Avg Rating</p>
                </div>
              </div>
            </div>
            
            {/* Featured Course Card */}
            {featuredCourse ? (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader className="pb-2">
                <Badge className="w-fit bg-warning text-warning-foreground">Featured</Badge>
                <CardTitle className="text-lg">{featuredCourse.title}</CardTitle>
                <CardDescription className="text-white/70">by {featuredCourse.instructor}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-white/80 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {featuredCourse.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" /> {featuredCourse.students.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {featuredCourse.rating}
                  </span>
                </div>
                <Link to={`/learn/course/${featuredCourse.id}`}>
                  <Button className="w-full">Enroll Now - ${featuredCourse.price}</Button>
                </Link>
              </CardContent>
            </Card>
            ) : (
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader className="pb-2">
                <Badge className="w-fit bg-warning text-warning-foreground">Featured</Badge>
                <CardTitle className="text-lg">Loading...</CardTitle>
              </CardHeader>
            </Card>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6">
        {/* Categories - Horizontal Scroll */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Browse Categories
            </h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant="outline"
                className="flex-shrink-0 gap-2 rounded-full"
              >
                <span>{cat.icon}</span>
                {cat.name}
              </Button>
            ))}
          </div>
        </section>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md bg-muted/50">
            <TabsTrigger value="feed" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <VideoIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Videos</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Docs</span>
            </TabsTrigger>
          </TabsList>

          {/* Facebook-Style Feed Tab */}
          <TabsContent value="feed" className="space-y-6">
            <FacebookStyleFeed />
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedCourses.map((course) => (
                <Link key={course.id} to={`/learn/course/${course.id}`}>
                  <Card className="hover:shadow-lg transition-all duration-300 group h-full">
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-14 w-14 rounded-full bg-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <Badge className="absolute top-2 right-2">{course.level}</Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <Badge variant="outline" className="w-fit mb-1 text-xs">{course.category}</Badge>
                      <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
                      <CardDescription className="text-xs">by {course.instructor}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {course.students.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" /> {course.rating}
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-2 border-t">
                      <p className="text-lg font-bold text-primary">${course.price}</p>
                      <Button size="sm">Enroll</Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {courseIndex < allCourses.length && !loading && (
              <div className="text-center">
                <Button variant="outline" onClick={() => loadMore('courses')}>
                  Load More Courses
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedVideos.map((video) => (
                <Card key={video.id} className="hover:shadow-lg transition-all duration-300 group">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <Badge variant="secondary" className="w-fit mb-1 text-xs">{video.category}</Badge>
                    <CardTitle className="text-sm line-clamp-2">{video.title}</CardTitle>
                    <CardDescription className="text-xs">by {video.instructor}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {video.views.toLocaleString()} views
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" size="sm" variant="secondary">
                      <Play className="h-4 w-4 mr-2" />
                      Watch Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {videoIndex < allVideos.length && !loading && (
              <div className="text-center">
                <Button variant="outline" onClick={() => loadMore('videos')}>
                  Load More Videos
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedDocs.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                    </div>
                    <CardTitle className="text-sm mt-2 line-clamp-2">{doc.title}</CardTitle>
                    <CardDescription className="text-xs">by {doc.author || "Unknown"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{doc.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{doc.pages} pages</span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" /> {(doc as any).downloadCount?.toLocaleString() || "0"}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {docIndex < allDocs.length && !loading && (
              <div className="text-center">
                <Button variant="outline" onClick={() => loadMore('documents')}>
                  Load More Documents
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Top Instructors */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-warning" />
              Top Instructors
            </h2>
            <Link to="/experts">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {allCourses.slice(0, 8).map((course) => (
              <Link key={course.id} to={`/learn/course/${course.id}`}>
                <Card className="flex-shrink-0 w-[160px] hover:shadow-lg transition-all text-center">
                  <CardContent className="pt-4">
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarImage src={course.thumbnail || ""} />
                      <AvatarFallback>{course.instructor[0]}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium text-sm line-clamp-1">{course.instructor}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{course.category}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-xs">{course.rating}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* What You'll Learn */}
        <section className="mt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            What You'll Learn
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">Theoretical Knowledge</CardTitle>
                <CardDescription className="text-xs">
                  Comprehensive theory courses covering fundamentals to advanced concepts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> In-depth video lectures</li>
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> Reading materials & PDFs</li>
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> Quizzes & assessments</li>
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> Certificate of completion</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
              <CardHeader>
                <CardTitle className="text-base">Practical Skills</CardTitle>
                <CardDescription className="text-xs">
                  Hands-on projects and real-world applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> Step-by-step tutorials</li>
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> Live demonstrations</li>
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> Practice exercises</li>
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> Portfolio projects</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <CardHeader>
                <CardTitle className="text-base">Online Classes</CardTitle>
                <CardDescription className="text-xs">
                  Live sessions with expert instructors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-xs">
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> Scheduled live classes</li>
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> Q&A sessions</li>
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> Student community</li>
                  <li className="flex items-center gap-2"><span className="text-success">✓</span> Professional qualifications</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* AI Chatbot placeholder */}
      <div className="fixed bottom-4 right-4 z-50">
        <button className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow">
          Chat
        </button>
      </div>
    </div>
  );
};

export default Learn;
