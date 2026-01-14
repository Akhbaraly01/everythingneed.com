import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, XCircle, Trophy, Sparkles, Clock, 
  RotateCcw, ChevronRight, Zap, Award
} from "lucide-react";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizWidgetProps {
  title: string;
  questions: QuizQuestion[];
  category?: string;
  onComplete?: (score: number) => void;
}

const InteractiveQuizWidget = ({ title, questions, category, onComplete }: QuizWidgetProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));

  const handleAnswerSelect = (optionIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer");
      return;
    }

    const isCorrect = selectedAnswer === questions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
      toast.success("Correct! 🎉");
    } else {
      toast.error("Incorrect. Keep learning!");
    }

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setIsCompleted(true);
      onComplete?.(score);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setIsCompleted(false);
    setAnswers(Array(questions.length).fill(null));
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  if (isCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPassed = percentage >= 70;

    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="pt-6 text-center space-y-4">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${isPassed ? 'bg-success/20' : 'bg-destructive/20'}`}>
            {isPassed ? (
              <Trophy className="h-10 w-10 text-success" />
            ) : (
              <RotateCcw className="h-10 w-10 text-destructive" />
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-bold">
              {isPassed ? "Congratulations! 🎉" : "Keep Learning!"}
            </h3>
            <p className="text-muted-foreground">
              You scored {score} out of {questions.length} ({percentage}%)
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleRestart} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Retry Quiz
            </Button>
            {isPassed && (
              <Button className="gap-2">
                <Award className="h-4 w-4" />
                Claim Badge
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {category && <Badge variant="secondary">{category}</Badge>}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs text-muted-foreground">
            {currentQuestion + 1}/{questions.length}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4" />
          <span>Score: {score} points</span>
        </div>

        <h4 className="font-semibold text-lg">{question.question}</h4>

        <div className="space-y-2">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = showResult && index === question.correctAnswer;
            const isWrong = showResult && isSelected && index !== question.correctAnswer;

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 border-2 ${
                  isCorrect 
                    ? 'border-success bg-success/10 text-success' 
                    : isWrong 
                      ? 'border-destructive bg-destructive/10 text-destructive'
                      : isSelected 
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1">{option}</span>
                {isCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
                {isWrong && <XCircle className="h-5 w-5 text-destructive" />}
              </button>
            );
          })}
        </div>

        {showResult && question.explanation && (
          <div className="p-3 rounded-lg bg-muted text-sm">
            <strong>Explanation:</strong> {question.explanation}
          </div>
        )}

        <div className="flex justify-end gap-2">
          {!showResult ? (
            <Button onClick={handleSubmitAnswer} className="gap-2">
              Submit Answer
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} className="gap-2">
              {currentQuestion < questions.length - 1 ? "Next Question" : "See Results"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveQuizWidget;