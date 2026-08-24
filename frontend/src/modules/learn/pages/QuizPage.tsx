import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

interface QuizQuestion {
  id: string | number;
  question: string;
  options: string[];
}

interface QuizResult {
  score: number;
  total: number;
  correct_answers?: Record<string, string>;
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<QuizResult | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", id],
    queryFn: () => http.get<{ data: any }>(`/api/quizzes/${id}`).then((res) => res.data),
  });

  const submitMutation = useMutation({
    mutationFn: (answers: Record<string, string>) =>
      http.post<{ data: QuizResult }>(`/api/quizzes/${id}/submit`, { answers }),
    onSuccess: (res) => {
      setResults(res.data);
    },
  });

  const handleSelect = (questionId: string | number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: answer }));
  };

  const handleSubmit = () => {
    submitMutation.mutate(answers);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading quiz...</div>;
  }

  if (!quiz) {
    return <div className="p-8 text-center">Quiz not found.</div>;
  }

  const questions: QuizQuestion[] = quiz.questions || [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{quiz.title || "Quiz"}</CardTitle>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
          <Badge variant="secondary">{questions.length} Questions</Badge>
        </CardHeader>
      </Card>

      {results ? (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-4xl font-bold">
                {results.score}/{results.total}
              </p>
              <p className="text-muted-foreground mt-2">
                {Math.round((results.score / results.total) * 100)}% Correct
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate(-1)}>
              Back to Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-medium">
                    {index + 1}. {question.question}
                  </h3>
                  <div className="grid gap-2">
                    {question.options?.map((option, optIdx) => (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                          answers[String(question.id)] === option
                            ? "border-primary bg-primary/5"
                            : "border-input hover:bg-accent/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={answers[String(question.id)] === option}
                          onChange={() => handleSelect(question.id, option)}
                          className="accent-primary"
                        />
                        <span className="text-sm">{option}</span>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={
              submitMutation.isPending ||
              Object.keys(answers).length < questions.length
            }
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
          </Button>
        </>
      )}
    </div>
  );
}
