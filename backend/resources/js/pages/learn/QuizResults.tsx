import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { Award, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

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

    useEffect(() => {
        api.get<{ data: QuizResult[] }>('/api/learn/quiz-results')
            .then((res) => setResults(res.data))
            .catch(() => setResults([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Quiz Results">
            <Head title="Quiz Results" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz Results</h1>
                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : results.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No quiz results yet</p>
                        <Link href="/learn" className="mt-4 inline-block text-blue-600 hover:underline">Browse Courses</Link>
                    </div>
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
