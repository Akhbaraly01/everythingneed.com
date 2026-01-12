import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extendedCourses, educationalVideos, educationalDocuments, learnCategories as learnCats, Course, Video, Document } from "@/data/learnData";
import AIChatBot from "@/components/chat/AIChatBot";
import FacebookStyleFeed from "@/components/learn/FacebookStyleFeed";
import { Play, Users, Clock, FileText, Download, Eye, BookOpen, Video as VideoIcon, Loader2, MessageSquare, Home } from "lucide-react";

const ITEMS_PER_PAGE = 6;

const Learn = () => {
  const [activeTab, setActiveTab] = useState("feed");
  const [displayedCourses, setDisplayedCourses] = useState<Course[]>([]);
  const [displayedVideos, setDisplayedVideos] = useState<Video[]>([]);
  const [displayedDocs, setDisplayedDocs] = useState<Document[]>([]);
  const [courseIndex, setCourseIndex] = useState(ITEMS_PER_PAGE);
  const [videoIndex, setVideoIndex] = useState(ITEMS_PER_PAGE);
  const [docIndex, setDocIndex] = useState(ITEMS_PER_PAGE);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDisplayedCourses(extendedCourses.slice(0, ITEMS_PER_PAGE));
    setDisplayedVideos(educationalVideos.slice(0, ITEMS_PER_PAGE));
    setDisplayedDocs(educationalDocuments.slice(0, ITEMS_PER_PAGE));
  }, []);

  const loadMore = useCallback((type: 'courses' | 'videos' | 'documents') => {
    setLoading(true);
    setTimeout(() => {
      if (type === 'courses') {
        const next = extendedCourses.slice(courseIndex, courseIndex + ITEMS_PER_PAGE);
        setDisplayedCourses(prev => [...prev, ...next]);
        setCourseIndex(prev => prev + ITEMS_PER_PAGE);
      } else if (type === 'videos') {
        const next = educationalVideos.slice(videoIndex, videoIndex + ITEMS_PER_PAGE);
        setDisplayedVideos(prev => [...prev, ...next]);
        setVideoIndex(prev => prev + ITEMS_PER_PAGE);
      } else {
        const next = educationalDocuments.slice(docIndex, docIndex + ITEMS_PER_PAGE);
        setDisplayedDocs(prev => [...prev, ...next]);
        setDocIndex(prev => prev + ITEMS_PER_PAGE);
      }
      setLoading(false);
    }, 500);
  }, [courseIndex, videoIndex, docIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loading) {
      if (activeTab === 'courses' && courseIndex < extendedCourses.length) {
        loadMore('courses');
      } else if (activeTab === 'videos' && videoIndex < educationalVideos.length) {
        loadMore('videos');
      } else if (activeTab === 'documents' && docIndex < educationalDocuments.length) {
        loadMore('documents');
      }
    }
  }, [activeTab, courseIndex, videoIndex, docIndex, loading, loadMore]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header Section */}
      <section className="bg-gradient-secondary py-12 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Learn & Grow
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Master new skills with 100+ courses, videos, and documents across technology, business, agriculture, and more
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Categories */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Browse Learning Categories</h2>
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-3">
            {learnCats.map((cat) => (
              <div key={cat.id} className="text-center p-3 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors">
                <span className="text-2xl">{cat.icon}</span>
                <p className="text-xs mt-1 font-medium truncate">{cat.name}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Docs
            </TabsTrigger>
          </TabsList>

          {/* Facebook-Style Feed Tab */}
          <TabsContent value="feed" className="space-y-6">
            <FacebookStyleFeed />
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[800px] overflow-y-auto"
              onScroll={handleScroll}
            >
              {displayedCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-all duration-300 group">
                  <div className="aspect-video bg-gradient-primary relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <Badge className="absolute top-2 right-2">{course.level}</Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit mb-2">{course.category}</Badge>
                    <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                    <CardDescription>by {course.instructor}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {course.students.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.lessons} lessons
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <p className="text-2xl font-bold text-primary">${course.price}</p>
                    <Button>Enroll Now</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            {loading && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {courseIndex < extendedCourses.length && !loading && (
              <div className="text-center">
                <Button variant="outline" onClick={() => loadMore('courses')}>
                  Load More Courses
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[800px] overflow-y-auto"
              onScroll={handleScroll}
            >
              {displayedVideos.map((video) => (
                <Card key={video.id} className="hover:shadow-lg transition-all duration-300 group">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-14 w-14 rounded-full bg-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <Badge variant="secondary" className="w-fit mb-2">{video.category}</Badge>
                    <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                    <CardDescription className="text-xs">by {video.instructor}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{video.description}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {video.views.toLocaleString()} views
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="secondary">
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
            {videoIndex < educationalVideos.length && !loading && (
              <div className="text-center">
                <Button variant="outline" onClick={() => loadMore('videos')}>
                  Load More Videos
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[800px] overflow-y-auto"
              onScroll={handleScroll}
            >
              {displayedDocs.map((doc) => (
                <Card key={doc.id} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="outline">{doc.type}</Badge>
                    </div>
                    <CardTitle className="text-base mt-3 line-clamp-2">{doc.title}</CardTitle>
                    <CardDescription className="text-xs">by {doc.author}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{doc.description}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{doc.pages} pages</span>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {doc.downloadCount.toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download {doc.type}
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
            {docIndex < educationalDocuments.length && !loading && (
              <div className="text-center">
                <Button variant="outline" onClick={() => loadMore('documents')}>
                  Load More Documents
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Course Types */}
        <section className="mt-12">
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

      {/* AI Chatbot */}
      <AIChatBot context="learn" title="Learning Assistant" />
    </div>
  );
};

export default Learn;
