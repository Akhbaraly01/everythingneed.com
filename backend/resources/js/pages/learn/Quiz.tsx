import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import { useState } from 'react';

interface Question {
    id: string;
    question: string;
    options: string[];
    correct_answer?: string;
}

interface QuizPageProps {
    course: { id: string; title: string };
    quiz: { id: string; title: string; description?: string; passing_score: number; time_limit_minutes?: number };
    questions: Question[];
}

export default function CourseQuiz({ course, quiz, questions }: QuizPageProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState<{ score: number; passed: boolean; correct_count: number; total: number; detail: any[] } | null>(null);

    const handleSelect = (questionId: string, answer: string) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            alert('Please answer all questions');
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post<{ score: number; passed: boolean; correct_count: number; total: number; detail: any[] }>(
                `/api/quizzes/${quiz.id}/submit`,
                { answers }
            );
            setResults(res.data ?? res as any);
        } catch (e: any) {
            alert(e.message ?? 'Failed to submit');
        }
        setSubmitting(false);
    };

    if (results) {
        return (
            <AppLayout>
                <Head title="Quiz Results" />
                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
                        {results.passed ? (
                            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                        ) : (
                            <XCircle className="mx-auto h-16 w-16 text-red-500" />
                        )}
                        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                            {results.passed ? 'Congratulations!' : 'Keep Practicing'}
                        </h2>
                        <p className="mt-2 text-gray-500">
                            You scored {results.correct_count}/{results.total} ({results.score}%)
                        </p>
                        <p className="text-sm text-gray-400">Passing score: {quiz.passing_score}%</p>
                        {results.passed && (
                            <a href={`/learn/courses/${course.id}/certificate`} target="_blank"
                                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-500">
                                <Award className="h-5 w-5" /> View Certificate
                            </a>
                        )}
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title={`${quiz.title} - ${course.title}`} />
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
                    {quiz.description && <p className="text-sm text-gray-500">{quiz.description}</p>}
                    {quiz.time_limit_minutes && (
                        <p className="flex items-center gap-1 text-sm text-gray-500"><Clock className="h-4 w-4" /> {quiz.time_limit_minutes} minutes</p>
                    )}
                </div>

                {questions.map((q, idx) => (
                    <div key={q.id} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <p className="font-medium text-gray-900 dark:text-white">
                            <span className="text-indigo-600">Q{idx + 1}.</span> {q.question}
                        </p>
                        <div className="mt-3 space-y-2">
                            {q.options.map((opt) => (
                                <label key={opt} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                                    answers[q.id] === opt ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'
                                }`}>
                                    <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => handleSelect(q.id, opt)} className="text-indigo-600" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}

                <button onClick={handleSubmit} disabled={submitting}
                    className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Submit Quiz'}
                </button>
            </div>
        </AppLayout>
    );
}
