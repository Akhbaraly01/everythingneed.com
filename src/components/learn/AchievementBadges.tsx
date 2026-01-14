import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Star, Zap, BookOpen, Award, Target, Flame, 
  Medal, Crown, Shield, Sparkles, Lock, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
  points: number;
}

const AchievementBadges = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first-course",
      name: "First Steps",
      description: "Complete your first course",
      icon: <BookOpen className="h-6 w-6" />,
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      rarity: "common",
      points: 100
    },
    {
      id: "quiz-master",
      name: "Quiz Master",
      description: "Score 100% on 5 quizzes",
      icon: <Target className="h-6 w-6" />,
      progress: 3,
      maxProgress: 5,
      unlocked: false,
      rarity: "rare",
      points: 250
    },
    {
      id: "learning-streak",
      name: "On Fire!",
      description: "Maintain a 7-day learning streak",
      icon: <Flame className="h-6 w-6" />,
      progress: 5,
      maxProgress: 7,
      unlocked: false,
      rarity: "rare",
      points: 300
    },
    {
      id: "video-watcher",
      name: "Video Scholar",
      description: "Watch 20 educational videos",
      icon: <Star className="h-6 w-6" />,
      progress: 12,
      maxProgress: 20,
      unlocked: false,
      rarity: "common",
      points: 150
    },
    {
      id: "course-collection",
      name: "Course Collector",
      description: "Enroll in 10 different courses",
      icon: <Medal className="h-6 w-6" />,
      progress: 4,
      maxProgress: 10,
      unlocked: false,
      rarity: "epic",
      points: 500
    },
    {
      id: "knowledge-king",
      name: "Knowledge King",
      description: "Earn 5 certificates",
      icon: <Crown className="h-6 w-6" />,
      progress: 2,
      maxProgress: 5,
      unlocked: false,
      rarity: "legendary",
      points: 1000
    },
    {
      id: "social-learner",
      name: "Social Learner",
      description: "Comment on 10 posts",
      icon: <Sparkles className="h-6 w-6" />,
      progress: 7,
      maxProgress: 10,
      unlocked: false,
      rarity: "common",
      points: 100
    },
    {
      id: "early-bird",
      name: "Early Bird",
      description: "Study before 7 AM for 3 days",
      icon: <Zap className="h-6 w-6" />,
      progress: 1,
      maxProgress: 3,
      unlocked: false,
      rarity: "rare",
      points: 200
    }
  ]);

  const getRarityColor = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common": return "from-gray-400 to-gray-600";
      case "rare": return "from-blue-400 to-blue-600";
      case "epic": return "from-purple-400 to-purple-600";
      case "legendary": return "from-amber-400 to-orange-600";
    }
  };

  const getRarityBg = (rarity: Achievement["rarity"]) => {
    switch (rarity) {
      case "common": return "bg-gray-100 dark:bg-gray-800";
      case "rare": return "bg-blue-100 dark:bg-blue-900/30";
      case "epic": return "bg-purple-100 dark:bg-purple-900/30";
      case "legendary": return "bg-amber-100 dark:bg-amber-900/30";
    }
  };

  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((acc, a) => acc + a.points, 0);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Card className="border-2 border-accent/20">
      <CardHeader className="bg-gradient-to-r from-accent/10 to-primary/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">Achievements</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              {totalPoints.toLocaleString()} XP
            </Badge>
            <Badge variant="secondary">
              {unlockedCount}/{achievements.length}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement) => {
            const progressPercent = (achievement.progress / achievement.maxProgress) * 100;
            
            return (
              <div 
                key={achievement.id}
                className={`relative p-4 rounded-xl text-center transition-all cursor-pointer hover:scale-105 ${
                  achievement.unlocked 
                    ? getRarityBg(achievement.rarity)
                    : 'bg-muted/50 grayscale'
                }`}
                onClick={() => {
                  if (achievement.unlocked) {
                    toast.success(`${achievement.name}: ${achievement.description}`);
                  } else {
                    toast.info(`Progress: ${achievement.progress}/${achievement.maxProgress}`);
                  }
                }}
              >
                <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2 bg-gradient-to-br ${
                  achievement.unlocked 
                    ? getRarityColor(achievement.rarity) 
                    : 'from-gray-300 to-gray-500'
                } text-white shadow-lg`}>
                  {achievement.unlocked ? achievement.icon : <Lock className="h-6 w-6" />}
                </div>
                
                <h4 className="font-semibold text-sm mb-1 line-clamp-1">{achievement.name}</h4>
                
                {!achievement.unlocked && (
                  <div className="space-y-1">
                    <Progress value={progressPercent} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">
                      {achievement.progress}/{achievement.maxProgress}
                    </p>
                  </div>
                )}
                
                {achievement.unlocked && (
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    <span>{achievement.points} XP</span>
                  </div>
                )}
                
                <Badge 
                  variant="outline" 
                  className={`absolute -top-1 -right-1 text-[8px] px-1.5 capitalize ${
                    achievement.rarity === 'legendary' ? 'border-amber-500 text-amber-600' :
                    achievement.rarity === 'epic' ? 'border-purple-500 text-purple-600' :
                    achievement.rarity === 'rare' ? 'border-blue-500 text-blue-600' :
                    'border-gray-400 text-gray-600'
                  }`}
                >
                  {achievement.rarity}
                </Badge>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next level: Gold Learner</span>
            <span className="font-bold text-primary">{totalPoints}/500 XP</span>
          </div>
          <Progress value={(totalPoints / 500) * 100} className="h-2 mt-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default AchievementBadges;