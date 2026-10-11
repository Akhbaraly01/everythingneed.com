import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Briefcase } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';

interface EmployerPost {
    id: string;
    title: string;
    is_active: boolean;
    applications_count?: number;
}

interface Profile {
    posts: EmployerPost[];
    total_posts: number;
    active_posts: number;
    applications_received: number;
}

export default function JobsProfile() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Profile }>('/api/jobs/profile')
            .then((res) => setProfile(res.data))
            .catch((e) => setError(errorMessage(e, 'Failed to load employer profile')))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Employer Profile">
            <Head title="Employer Profile" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                    <Briefcase className="h-6 w-6" /> Employer Profile
                </h1>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading profile...</p>
                    </div>
                ) : error || !profile ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">{error ?? 'Profile unavailable.'}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Total posts', value: profile.total_posts },
                                { label: 'Active', value: profile.active_posts },
                                { label: 'Applications', value: profile.applications_received },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-lg bg-white p-4 text-center shadow dark:bg-gray-800">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                    <p className="text-xs text-gray-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                            {profile.posts.length === 0 ? (
                                <p className="p-6 text-center text-sm text-gray-500">
                                    No posts yet. <Link href="/jobs/create" className="font-medium text-indigo-600 underline">Post your first job</Link>
                                </p>
                            ) : profile.posts.map((post) => (
                                <Link key={post.id} href={`/jobs/${post.id}`}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{post.title}</p>
                                    <span className="text-xs text-gray-500">{post.applications_count ?? 0} applications</span>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
