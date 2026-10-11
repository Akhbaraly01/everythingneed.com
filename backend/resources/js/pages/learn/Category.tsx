import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Course } from '@/types';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import CourseCard from '@/components/learn/CourseCard';
import EmptyState from '@/components/shared/EmptyState';
import LoadingState from '@/components/shared/LoadingState';
import SeoMeta, { type LearnSeo } from '@/components/learn/SeoMeta';

interface CategoryProps {
    category_slug: string;
    seo?: LearnSeo | null;
}

export default function LearnCategory({ category_slug, seo }: CategoryProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [name, setName] = useState(category_slug);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: { name: string; slug: string }[] }>('/api/course-categories')
            .then((res) => {
                const match = (Array.isArray(res.data) ? res.data : []).find((c) => c.slug === category_slug);
                const categoryName = match ? match.name : category_slug;
                setName(categoryName);
                return api.get<{ data: Course[] }>(`/api/courses?category=${encodeURIComponent(categoryName)}&per_page=24`);
            })
            .then((res) => setCourses(Array.isArray(res.data) ? res.data : []))
            .catch(() => setCourses([]))
            .finally(() => setLoading(false));
    }, [category_slug]);

    return (
        <AppLayout>
            <Head title={seo?.title ?? name} />
            <SeoMeta seo={seo} />
            <div className="mx-auto max-w-5xl space-y-6">
                <Link href="/learn/categories" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← All categories
                </Link>
                <h1 className="text-2xl font-bold capitalize text-gray-900 dark:text-white">{name}</h1>

                {loading ? (
                    <LoadingState message="Loading courses..." />
                ) : courses.length === 0 ? (
                    <EmptyState title="No courses in this category yet." />
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
