import AppLayout from '@/layouts/AppLayout';
import {Head} from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
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
    quiz: { id: string; title: string; description?: string; passing_score: number; time_limit_minutes?: number } | null;
    questions: Question[];
}

interface CourseProgressState {
    progress: number;
    course_completed: boolean;
}

interface SubmitResult {
    score: number;
    passed: boolean;
    total: number;
    percent?: number;
    course_progress?: CourseProgressState | null;
}

interface QuizResultView {
    score: number;
    passed: boolean;
    correct_count: number;
    total: number;
    percent: number;
    course_progress: CourseProgressState | null;
}

export default function CourseQuiz({ course, quiz, questions }: QuizPageProps) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState<QuizResultView | null>(null);

    if (!quiz) {
        return (
            <AppLayout>
                <Head title={`Quiz - ${course.title}`} />
                <div className="mx-auto max-w-2xl space-y-6">
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">No quiz yet</h1>
                        <p className="mt-2 text-gray-500">This course does not have a quiz. Check back later.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Answers are option positions ("0", "1", ...) - the server grades them
    // against its own answer key, so free text would never match.
    const handleSelect = (questionId: string, optionIndex: number) => {
        setAnswers({ ...answers, [questionId]: String(optionIndex) });
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            toast.warning('Please answer all questions');
            return;
        }
        setSubmitting(true);
        try {
            const res = await api.post<{ data: SubmitResult }>(
                `/api/quizzes/${quiz.id}/submit`,
                { answers }
            );
            const graded = res.data;
            const total = graded?.total ?? questions.length;
            const score = graded?.score ?? 0;
            setResults({
                score,
                passed: graded?.passed ?? false,
                correct_count: score,
                total,
                percent: graded?.percent ?? (total > 0 ? Math.round((score / total) * 100) : 0),
                course_progress: graded?.course_progress ?? null,
            });
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to submit'));
        }
        setSubmitting(false);
    };

    if (results) {
        const courseCompleted = results.course_progress?.course_completed === true;
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
                            You scored {results.correct_count}/{results.total} ({results.percent}%)
                        </p>
                        <p className="text-sm text-gray-400">Passing score: {quiz.passing_score}%</p>
                        {results.course_progress && (
                            <p className="mt-4 text-sm font-medium text-indigo-600">
                                Course progress: {results.course_progress.progress}%
                                {!courseCompleted && results.passed && ' — finish the rest of the course to unlock your certificate'}
                            </p>
                        )}
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            {courseCompleted && results.passed ? (
                                <a href="/learn/certificates"
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-500">
                                    <Award className="h-5 w-5" /> View Certificates
                                </a>
                            ) : (
                                <a href={`/learn/${course.id}`}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-500">
                                    Back to course
                                </a>
                            )}
                        </div>
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
                            {q.options.map((opt, optionIndex) => (
                                <label key={optionIndex} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                                    answers[q.id] === String(optionIndex) ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700'
                                }`}>
                                    <input type="radio" name={q.id} value={optionIndex}
                                        checked={answers[q.id] === String(optionIndex)}
                                        onChange={() => handleSelect(q.id, optionIndex)}
                                        className="text-indigo-600" />
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
