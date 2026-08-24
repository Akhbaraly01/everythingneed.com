import { Card, CardContent, CardFooter, CardHeader } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Progress } from "@shared/ui/progress";
import { Calendar, Users, DollarSign } from "lucide-react";

interface Task {
  id: string;
  title: string;
  category: string;
  description?: string;
  reward: number;
  deadline?: string;
  participants: number;
  maxParticipants: number;
  difficulty?: string;
}

interface TaskCardProps {
  task: Task;
  onParticipate: (task: Task) => void;
}

const TaskCard = ({ task, onParticipate }: TaskCardProps) => {
  const progressPercent = (task.participants / task.maxParticipants) * 100;
  const spotsLeft = task.maxParticipants - task.participants;

  const difficultyColor = {
    Easy: "bg-green-500/10 text-green-600 border-green-500/20",
    Medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    Hard: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{task.title}</h3>
            <Badge variant="outline" className="mt-1">{task.category}</Badge>
          </div>
          <Badge className={difficultyColor[task.difficulty]}>
            {task.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
        
        <div className="flex items-center gap-4 text-sm mb-4">
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-bold text-green-600">${task.reward}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(task.deadline).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{spotsLeft} spots left</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Participation</span>
            <span>{task.participants}/{task.maxParticipants}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          className="w-full" 
          onClick={() => onParticipate(task)}
          disabled={spotsLeft === 0}
        >
          {spotsLeft > 0 ? "Participate" : "Full"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TaskCard;
