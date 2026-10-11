import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { BookOpen, Clock, Star, Users } from 'lucide-react';
import Image from '@/components/shared/Image';
import { formatPrice } from '@/lib/currency';

/**
 * The one course card used across Learn (catalog, category, search, landing
 * rails, instructor profiles). Optional fields simply drop out of the render,
 * so the same component serves rich landing data and lean API rows.
 */
export interface CourseCardData {
    id: string;
    title: string;
    instructor_name?: string | null;
    instructor?: string | null;
    description?: string | null;
    category?: string | null;
    level?: string | null;
    /** `free` marks zero-price courses; numeric 0 also renders as Free. */
    type?: string | null;
    price?: number | string | null;
    thumbnail_url?: string | null;
    /** Older endpoints return `image_url` instead of `thumbnail_url`. */
    image_url?: string | null;
    rating?: number | string | null;
    students_count?: number | null;
    duration_hours?: number | null;
}

interface CourseCardProps {
    course: CourseCardData;
    /** Optional enrollment progress bar (0-100). */
    progress?: number | null;
    /** Extra line(s) inside the body (e.g. lesson counts). */
    extra?: ReactNode;
    /** Footer action rendered OUTSIDE the title link (buttons, links). */
    action?: ReactNode;
    /** Hide the price row (e.g. enrolled learners on My Learning). */
    hidePrice?: boolean;
}

export default function CourseCard({ course, progress, extra, action, hidePrice }: CourseCardProps) {
    const thumbnail = course.thumbnail_url ?? course.image_url ?? undefined;
    const instructor = course.instructor_name ?? course.instructor ?? undefined;
    const price = Number(course.price ?? 0);
    const free = course.type === 'free' || price <= 0;
    const showRating = course.rating !== null && course.rating !== undefined && course.rating !== '';

    return (
        <div className="overflow-hidden rounded-lg bg-white shadow transition hover:shadow-md dark:bg-gray-800">
            <Link href={`/learn/${course.id}`} className="block">
                <div className="aspect-video bg-indigo-50 dark:bg-indigo-900/20">
                    {thumbnail ? (
                        <Image src={thumbnail} alt={course.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-10 w-10 text-indigo-300 dark:text-indigo-700" />
                        </div>
                    )}
                </div>
                <div className="p-4">
                    {(course.category || course.level) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {course.category && (
                                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                                    {course.category}
                                </span>
                            )}
                            {course.level && (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                    {course.level}
                                </span>
                            )}
                        </div>
                    )}
                    <h3 className="mt-2 font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white line-clamp-2">
                        {course.title}
                    </h3>
                    {instructor && (
                        <p className="mt-1 text-sm text-gray-500">{instructor}</p>
                    )}
                    {course.description && (
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{course.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {course.duration_hours != null && (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.duration_hours}h</span>
                        )}
                        {course.students_count != null && (
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.students_count}</span>
                        )}
                        {showRating && (
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{course.rating}</span>
                        )}
                    </div>
                    {extra}
                    {progress != null && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Progress</span>
                                <span className="font-semibold text-indigo-600">{Math.round(progress)}%</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${Math.min(100, Math.max(0, Math.round(progress)))}%` }} />
                            </div>
                        </div>
                    )}
                    {!hidePrice && (
                        <div className="mt-3 flex items-center justify-between">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {free ? 'Free' : formatPrice(price)}
                            </span>
                        </div>
                    )}
                </div>
            </Link>
            {action && (
                <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">{action}</div>
            )}
        </div>
    );
}
