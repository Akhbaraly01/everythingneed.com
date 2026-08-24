import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Progress } from "@shared/ui/progress";
import { BarChart3, Users, Check, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollWidgetProps {
  question: string;
  options: PollOption[];
  totalVotes?: number;
  category?: string;
  onVote?: (optionId: string) => void;
}

const PollWidget = ({ question, options: initialOptions, totalVotes: initialTotal = 0, category, onVote }: PollWidgetProps) => {
  const [options, setOptions] = useState(initialOptions);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [totalVotes, setTotalVotes] = useState(initialTotal || initialOptions.reduce((acc, opt) => acc + opt.votes, 0));

  const handleVote = () => {
    if (!selectedOption) {
      toast.error("Please select an option");
      return;
    }

    setOptions(prev => prev.map(opt => 
      opt.id === selectedOption ? { ...opt, votes: opt.votes + 1 } : opt
    ));
    setTotalVotes(prev => prev + 1);
    setHasVoted(true);
    onVote?.(selectedOption);
    toast.success("Vote recorded! 🗳️");
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <Card className="border-2 border-secondary/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-secondary/10 to-accent/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-secondary" />
            <CardTitle className="text-base">Community Poll</CardTitle>
          </div>
          {category && <Badge variant="outline">{category}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{totalVotes.toLocaleString()} votes</span>
        </div>

        <h4 className="font-semibold text-lg">{question}</h4>

        <div className="space-y-3">
          {options.map((option) => {
            const percentage = getPercentage(option.votes);
            const isSelected = selectedOption === option.id;

            return (
              <div key={option.id} className="space-y-1">
                <button
                  onClick={() => !hasVoted && setSelectedOption(option.id)}
                  disabled={hasVoted}
                  className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 border-2 relative overflow-hidden ${
                    hasVoted
                      ? 'border-border bg-muted cursor-default'
                      : isSelected 
                        ? 'border-secondary bg-secondary/10'
                        : 'border-border hover:border-secondary/50 hover:bg-muted'
                  }`}
                >
                  {hasVoted && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-secondary/20 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  
                  <span className={`relative w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                    isSelected ? 'border-secondary bg-secondary text-white' : 'border-muted-foreground'
                  }`}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </span>
                  
                  <span className="relative flex-1 font-medium">{option.text}</span>
                  
                  {hasVoted && (
                    <span className="relative text-sm font-bold text-muted-foreground">
                      {percentage}%
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {!hasVoted && (
          <Button onClick={handleVote} className="w-full gap-2" variant="secondary">
            <MessageSquare className="h-4 w-4" />
            Submit Vote
          </Button>
        )}

        {hasVoted && (
          <p className="text-center text-sm text-muted-foreground">
            Thanks for voting! Results are updated in real-time.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PollWidget;