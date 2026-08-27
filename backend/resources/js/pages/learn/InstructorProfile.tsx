import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { User, Star, BookOpen, Award } from 'lucide-react';

interface Instructor {
    id: string;
    full_name: string;
    bio: string;
    avatar_url: string;
    specialization: string;
    courses_count: number;
    students_count: number;
    rating: number;
}

export default function InstructorProfile({ instructor_id }: { instructor_id?: string }) {
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (instructor_id) {
            api.get<{ data: Instructor }>(`/api/learn/instructors/${instructor_id}`)
                .then((res) => setInstructor(res.data))
                .catch(() => {})
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [instructor_id]);

    if (loading) return <AppLayout title="Instructor"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    if (!instructor) return <AppLayout title="Instructor"><p className="p-12 text-center text-red-500">Instructor not found</p></AppLayout>;

    return (
        <AppLayout title={instructor.full_name}>
            <Head title={instructor.full_name} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{instructor.full_name}</h1>
                            <p className="text-gray-500">{instructor.specialization}</p>
                            <div className="mt-2 flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-yellow-500"><Star className="h-4 w-4" /> {instructor.rating || 'New'}</span>
                                <span className="flex items-center gap-1 text-gray-500"><BookOpen className="h-4 w-4" /> {instructor.courses_count} courses</span>
                                <span className="flex items-center gap-1 text-gray-500"><Award className="h-4 w-4" /> {instructor.students_count} students</span>
                            </div>
                        </div>
                    </div>
                    {instructor.bio && (
                        <p className="mt-6 text-gray-600 dark:text-gray-400">{instructor.bio}</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
