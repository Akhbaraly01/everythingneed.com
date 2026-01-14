import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, CheckCircle2, Circle, PlayCircle, 
  Clock, Award, Target, Flame 
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  duration: number;
  completed: boolean;
}

interface CourseProgressTrackerProps {
  courseId: string;
  courseName: string;
  lessons: Lesson[];
  onLessonSelect?: (lessonId: string) => void;
}

const CourseProgressTracker = ({ 
  courseId, 
  courseName, 
  lessons, 
  onLessonSelect 
}: CourseProgressTrackerProps) => {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem(`course-progress-${courseId}`);
    if (saved) {
      setCompletedLessons(JSON.parse(saved));
    }

    const streakData = localStorage.getItem("learning-streak");
    if (streakData) {
      const { streak, lastDate } = JSON.parse(streakData);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (lastDate === today || lastDate === yesterday) {
        setCurrentStreak(streak);
      }
    }
  }, [courseId]);

  const toggleLessonComplete = (lessonId: string) => {
    let newCompleted: string[];
    
    if (completedLessons.includes(lessonId)) {
      newCompleted = completedLessons.filter((id) => id !== lessonId);
    } else {
      newCompleted = [...completedLessons, lessonId];
      
      // Update streak
      const today = new Date().toDateString();
      const streakData = localStorage.getItem("learning-streak");
      let newStreak = 1;
      
      if (streakData) {
        const { streak, lastDate } = JSON.parse(streakData);
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (lastDate === yesterday) {
          newStreak = streak + 1;
        } else if (lastDate === today) {
          newStreak = streak;
        }
      }
      
      localStorage.setItem("learning-streak", JSON.stringify({ 
        streak: newStreak, 
        lastDate: today 
      }));
      setCurrentStreak(newStreak);
    }
    
    setCompletedLessons(newCompleted);
    localStorage.setItem(`course-progress-${courseId}`, JSON.stringify(newCompleted));
  };

  const progressPercent = lessons.length > 0 
    ? (completedLessons.length / lessons.length) * 100 
    : 0;

  const totalDuration = lessons.reduce((acc, l) => acc + l.duration, 0);
  const completedDuration = lessons
    .filter((l) => completedLessons.includes(l.id))
    .reduce((acc, l) => acc + l.duration, 0);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-0">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">{courseName}</h3>
              <p className="text-sm text-muted-foreground">
                {completedLessons.length} of {lessons.length} lessons completed
              </p>
            </div>
            {progressPercent === 100 && (
              <Badge className="bg-success text-success-foreground gap-1">
                <Trophy className="h-3 w-3" />
                Completed!
              </Badge>
            )}
          </div>
          
          <Progress value={progressPercent} className="h-3 mb-4" />
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-background/50 rounded-lg">
              <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{Math.round(progressPercent)}%</p>
              <p className="text-xs text-muted-foreground">Progress</p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg">
              <Clock className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{formatDuration(completedDuration)}</p>
              <p className="text-xs text-muted-foreground">Time Spent</p>
            </div>
            <div className="p-3 bg-background/50 rounded-lg">
              <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Course Content</span>
            <span className="text-sm font-normal text-muted-foreground">
              {formatDuration(totalDuration)} total
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {lessons.map((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id);
            
            return (
              <div
                key={lesson.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer hover:bg-muted ${
                  isCompleted ? "bg-success/10" : "bg-background"
                }`}
                onClick={() => onLessonSelect?.(lesson.id)}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLessonComplete(lesson.id);
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm truncate ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                    {index + 1}. {lesson.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <PlayCircle className="h-3 w-3" />
                    {formatDuration(lesson.duration)}
                  </div>
                </div>
                
                {!isCompleted && (
                  <Button size="sm" variant="ghost" className="shrink-0">
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Certificate Button */}
      {progressPercent === 100 && (
        <Button className="w-full gap-2" size="lg">
          <Award className="h-5 w-5" />
          Get Your Certificate
        </Button>
      )}
    </div>
  );
};

export default CourseProgressTracker;