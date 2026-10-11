import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import LoadingState, { ErrorState } from '@/components/shared/LoadingState';

interface QuizResult {
    id: string;
    course_title: string;
    score: number;
    total_questions: number;
    passed: boolean;
    completed_at: string;
}

export default function QuizResults() {
    const [results, setResults] = useState<QuizResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError(null);
        api.get<{ data: QuizResult[] }>('/api/learn/quiz-results')
            .then((res) => setResults(res.data))
            .catch((e) => {
                setResults([]);
                setError(errorMessage(e, 'Failed to load your quiz results'));
            })
            .finally(() => setLoading(false));
    }, [attempt]);

    return (
        <AppLayout>
            <Head title="Quiz Results" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz Results</h1>
                {loading ? (
                    <LoadingState message="Loading..." />
                ) : error ? (
                    <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
                ) : results.length === 0 ? (
                    <EmptyState
                        icon={<BarChart3 className="h-10 w-10" />}
                        title="No quiz results yet"
                        hint="Take a quiz from any enrolled course to see your scores here."
                    >
                        <Link href="/learn" className="mt-2 inline-block text-blue-600 hover:underline">Browse Courses</Link>
                    </EmptyState>
                ) : (
                    <div className="space-y-4">
                        {results.map((r) => (
                            <div key={r.id} className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{r.course_title}</p>
                                        <p className="text-sm text-gray-500">{new Date(r.completed_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {r.passed ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                <CheckCircle className="h-3 w-3" /> Passed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                                <XCircle className="h-3 w-3" /> Failed
                                            </span>
                                        )}
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">{r.score}/{r.total_questions}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
