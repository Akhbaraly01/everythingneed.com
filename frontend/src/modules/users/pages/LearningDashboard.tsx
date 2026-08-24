import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Progress } from "@shared/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/ui/avatar";
import { 
  BookOpen, Award, Flame, Clock, Play, Calendar, 
  TrendingUp, Target, Trophy, Star, Download, ChevronRight,
  GraduationCap, Video, FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@core/api/laravelGateway";
import { http } from "@core/api";
import { useQuery } from "@tanstack/react-query";

const API = import.meta.env.VITE_API_URL || "/api";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@shared/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from "recharts";

interface EnrolledCourse {
  id: string;
  course_id: string;
  progress: number;
  created_at: string;
  completed_at: string | null;
}

interface Certificate {
  id: string;
  course_title: string;
  certificate_number: string;
  issued_at: string;
  instructor_name: string;
}

interface VideoProgress {
  lesson_id: string;
  progress_percent: number;
  completed: boolean;
}

// Mock weekly progress data
const weeklyProgress = [
  { day: "Mon", hours: 2.5, lessons: 4 },
  { day: "Tue", hours: 1.8, lessons: 3 },
  { day: "Wed", hours: 3.2, lessons: 5 },
  { day: "Thu", hours: 2.0, lessons: 3 },
  { day: "Fri", hours: 1.5, lessons: 2 },
  { day: "Sat", hours: 4.0, lessons: 6 },
  { day: "Sun", hours: 2.8, lessons: 4 },
];

const monthlyStats = [
  { month: "Jan", courses: 1, hours: 24 },
  { month: "Feb", courses: 2, hours: 36 },
  { month: "Mar", courses: 1, hours: 18 },
  { month: "Apr", courses: 3, hours: 52 },
  { month: "May", courses: 2, hours: 40 },
  { month: "Jun", courses: 2, hours: 45 },
];

const chartConfig = {
  hours: {
    label: "Hours",
    color: "hsl(var(--primary))",
  },
  lessons: {
    label: "Lessons",
    color: "hsl(var(--chart-2))",
  },
  courses: {
    label: "Courses",
    color: "hsl(var(--chart-3))",
  },
};

const LearningDashboard = () => {
  const { user } = useAuth();
  const [learningStreak, setLearningStreak] = useState(7);
  const [totalHours, setTotalHours] = useState(156);

  // Fetch enrollments
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const data = await db
        .from('enrollments')
        .select('*')
        .where('user_id', '=', user.id)
        .orderBy('created_at', false);

      if (!Array.isArray(data)) throw new Error('Unexpected enrollments response');
      return data as unknown as EnrolledCourse[];
    },
    enabled: !!user?.id,
  });

  // Fetch certificates
  const { data: certificates = [], isLoading: certificatesLoading } = useQuery({
    queryKey: ['certificates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const data = await db
        .from('user_certificates')
        .select('*')
        .where('user_id', '=', user.id)
        .orderBy('issued_at', false);

      if (!Array.isArray(data)) throw new Error('Unexpected certificates response');
      return data as unknown as Certificate[];
    },
    enabled: !!user?.id,
  });

  // Fetch video progress
  const { data: videoProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['video_progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const data = await db
        .from('video_progress')
        .select('*')
        .where('user_id', '=', user.id);

      if (!Array.isArray(data)) throw new Error('Unexpected video progress response');
      return data as unknown as VideoProgress[];
    },
    enabled: !!user?.id,
  });

  // Realtime subscriptions not supported in mock — skipped

  // Get course details from enrollments - use fallback since courses are fetched per-enrollment
  const enrolledCoursesWithDetails = enrollments.map(enrollment => {
    return {
      ...enrollment,
      course: {
        id: enrollment.course_id,
        title: "Course",
        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400",
        instructor: "Instructor",
        category: "General",
      },
    };
  });

  const completedCount = enrollments.filter(e => e.completed_at).length;
  const inProgressCount = enrollments.filter(e => !e.completed_at && e.progress > 0).length;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Learning Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and achievements</p>
        </div>
        <Link to="/learn">
          <Button className="gap-2">
            <BookOpen className="h-4 w-4" />
            Browse Courses
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Learning Streak</p>
                <p className="text-3xl font-bold">{learningStreak}</p>
                <p className="text-xs opacity-70">days in a row</p>
              </div>
              <Flame className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Total Hours</p>
                <p className="text-3xl font-bold">{totalHours}</p>
                <p className="text-xs opacity-70">hours learned</p>
              </div>
              <Clock className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Courses Completed</p>
                <p className="text-3xl font-bold">{completedCount}</p>
                <p className="text-xs opacity-70">of {enrollments.length} enrolled</p>
              </div>
              <Trophy className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Certificates Earned</p>
                <p className="text-3xl font-bold">{certificates.length}</p>
                <p className="text-xs opacity-70">achievements</p>
              </div>
              <Award className="h-10 w-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <AreaChart data={weeklyProgress}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Monthly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart data={monthlyStats}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="hours" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Courses and Certificates */}
      <Tabs defaultValue="in-progress" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="in-progress" className="gap-2">
            <Play className="h-4 w-4" />
            In Progress ({inProgressCount})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <Trophy className="h-4 w-4" />
            Completed ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="certificates" className="gap-2">
            <Award className="h-4 w-4" />
            Certificates ({certificates.length})
          </TabsTrigger>
        </TabsList>

        {/* In Progress Courses */}
        <TabsContent value="in-progress">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCoursesWithDetails
              .filter(e => !e.completed_at)
              .map(enrollment => (
                <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-32 bg-muted">
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 left-2">
                      {enrollment.course.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">{enrollment.course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{enrollment.course.instructor}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{enrollment.progress}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>
                    
                    <Link to={`/learn/course/${enrollment.course_id}`}>
                      <Button className="w-full mt-3 gap-2" size="sm">
                        <Play className="h-4 w-4" />
                        Continue Learning
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            
            {enrolledCoursesWithDetails.filter(e => !e.completed_at).length === 0 && (
              <Card className="col-span-full p-8 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No courses in progress</p>
                <Link to="/learn">
                  <Button variant="outline" className="mt-3">Browse Courses</Button>
                </Link>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Completed Courses */}
        <TabsContent value="completed">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCoursesWithDetails
              .filter(e => e.completed_at)
              .map(enrollment => (
                <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-32 bg-muted">
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-2 left-2 bg-green-500">
                      Completed
                    </Badge>
                    <div className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5">
                      <Trophy className="h-4 w-4 text-amber-500" />
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1">{enrollment.course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{enrollment.course.instructor}</p>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        100%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Completed {new Date(enrollment.completed_at!).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            
            {enrolledCoursesWithDetails.filter(e => e.completed_at).length === 0 && (
              <Card className="col-span-full p-8 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No completed courses yet</p>
                <p className="text-sm text-muted-foreground mt-1">Keep learning to earn your first completion!</p>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Certificates */}
        <TabsContent value="certificates">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map(cert => (
              <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Award className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{cert.course_title}</h3>
                      <p className="text-xs text-muted-foreground">{cert.instructor_name}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Certificate #</span>
                      <span className="font-mono text-xs">{cert.certificate_number}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Issued</span>
                      <span>{new Date(cert.issued_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <Button className="w-full mt-4 gap-2" variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                    Download Certificate
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {certificates.length === 0 && (
              <Card className="col-span-full p-8 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No certificates earned yet</p>
                <p className="text-sm text-muted-foreground mt-1">Complete courses to earn certificates!</p>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "Completed lesson", item: "React Hooks Deep Dive", time: "2 hours ago", icon: Video },
              { action: "Started course", item: "Advanced TypeScript", time: "Yesterday", icon: BookOpen },
              { action: "Earned certificate", item: "JavaScript Fundamentals", time: "3 days ago", icon: Award },
              { action: "Completed quiz", item: "Node.js Basics", time: "5 days ago", icon: FileText },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <activity.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.item}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearningDashboard;
