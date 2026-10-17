import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import type { Course, CourseLesson, CourseQuiz, Review } from '@/types';
import { BookOpen, Clock, Users, Star, Play, BadgeCheck, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import Image from '@/components/shared/Image';
import { Button } from '@/components/shared/Button';
import SeoMeta, { type LearnSeo } from '@/components/learn/SeoMeta';
import VideoPlayer from '@/components/learn/VideoPlayer';
import { resolvePlaybackSource } from '@/lib/video';

interface CourseShowProps {
    course: Course & { lessons?: CourseLesson[] };
    quizzes?: CourseQuiz[];
    enrollment?: { progress: number; completed_at?: string | null } | null;
    certificate_eligible?: boolean;
    seo?: LearnSeo | null;
}

export default function CourseShow({ course, quizzes = [], enrollment = null, certificate_eligible = false, seo }: CourseShowProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [reviews, setReviews] = useState<Review[]>([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [claiming, setClaiming] = useState(false);
    const [hydratedReview, setHydratedReview] = useState<string | null>(null);

    useEffect(() => {
        if (!auth?.user) return;
        api.get<{ data: Review[] }>(`/api/reviews?reviewable_type=course&reviewable_id=${course.id}`)
            .then((res) => setReviews(Array.isArray(res.data) ? res.data : []))
            .catch(() => setReviews([]));
    }, [course.id, auth?.user]);

    // The learner's own review hydrates the composer for editing.
    const myReview = auth?.user
        ? reviews.find((review) => review.user_id === auth.user?.id) ?? null
        : null;

    useEffect(() => {
        if (!myReview || hydratedReview === myReview.id) return;
        setRating(myReview.rating);
        setComment(myReview.comment ?? '');
        setHydratedReview(myReview.id);
    }, [myReview, hydratedReview]);

    // Quizzes gate the certificate alongside lessons (spec 19 completion).
    const pendingQuizzes = enrollment ? quizzes.filter((quiz) => !quiz.passed).length : 0;

    // Course intro video (when the course has one) plays in-app in the
    // header media pane; otherwise the thumbnail stands in.
    const introPlayback = resolvePlaybackSource(course.video_url);

    const handleEnroll = () => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        router.post(`/api/courses/${course.id}/enroll`, {}, {
            preserveScroll: true,
            onSuccess: () => router.visit('/learn/my-learning'),
            onError: (errors) => {
                const msg = Object.values(errors)[0];
                if (typeof msg === 'string') toast.error(msg);
            },
        });
    };

    const claimCertificate = () => {
        setClaiming(true);
        router.post(`/api/learn/courses/${course.id}/certificate`, {}, {
            preserveScroll: true,
            onSuccess: () => router.visit('/learn/certificates'),
            onFinish: () => setClaiming(false),
        });
    };

    const submitReview = async () => {
        setReviewError(null);
        try {
            const text = comment.trim();
            if (myReview) {
                // One review per learner: an edit, not a second row.
                await api.put(`/api/reviews/${myReview.id}`, { rating, comment: text || null });
            } else {
                await api.post('/api/reviews', {
                    reviewable_type: 'course',
                    reviewable_id: course.id,
                    rating,
                    comment: text || undefined,
                });
            }
            const res = await api.get<{ data: Review[] }>(`/api/reviews?reviewable_type=course&reviewable_id=${course.id}`);
            setReviews(Array.isArray(res.data) ? res.data : []);
            toast.success(myReview ? 'Review updated.' : 'Review submitted.');
        } catch (e) {
            setReviewError(errorMessage(e, 'Review failed'));
        }
    };

    return (
        <AppLayout>
            <Head title={seo?.title ?? course.title} />
            <SeoMeta seo={seo} />

            <div className="space-y-8">
                {/* Header */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex flex-col gap-6 lg:flex-row">
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 lg:w-1/2">
                                    {introPlayback && introPlayback.provider !== 'jitsi' && (introPlayback.playable || introPlayback.provider === 'udemy') ? (
                                <VideoPlayer
                                    post={{
                                        id: course.id,
                                        video_url: introPlayback.url,
                                        video_provider: introPlayback.provider,
                                        provider_video_id: introPlayback.videoId,
                                    }}
                                    autoplay={false}
                                    heartbeat={false}
                                />
                            ) : course.thumbnail_url ? (
                                <Image src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">
                                    <BookOpen className="h-12 w-12" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">{course.category}</span>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">{course.level || course.course_type}</span>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">{course.type}</span>
                            </div>
                            <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
                            {course.instructor_name && (
                                <Link href={`/learn/instructors/${encodeURIComponent(course.instructor_name)}`}
                                    className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                    By {course.instructor_name}
                                </Link>
                            )}
                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                                {course.duration_hours && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.duration_hours}h total</span>}
                                {course.students_count != null && <span className="flex items-center gap-1"><Users className="h-4 w-4" />{course.students_count} students</span>}
                                {course.rating != null && (
                                    <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{course.rating}</span>
                                )}
                            </div>
                            {course.description && (
                                <p className="mt-4 text-gray-600 dark:text-gray-400">{course.description}</p>
                            )}
                            <div className="mt-6 flex items-center gap-4">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {course.type === 'free' ? 'Free' : `$${course.price}`}
                                </span>
                                <Button
                                    onClick={handleEnroll}
                                    size="lg"
                                >
                                    Enroll Now
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* What you will learn */}
                {course.objectives && course.objectives.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">What you will learn</h2>
                        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-400">
                            {course.objectives.map((objective, i) => (
                                <li key={i}>{objective}</li>
                            ))}
                        </ul>
                        {course.requirements && (
                            <p className="mt-3 text-sm text-gray-500"><span className="font-medium">Requirements:</span> {course.requirements}</p>
                        )}
                    </div>
                )}

                {/* Enrollment + certificate eligibility */}
                {enrollment && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your progress</h2>
                            <span className="text-sm font-semibold text-indigo-600">{enrollment.progress}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${enrollment.progress}%` }} />
                        </div>
                        {certificate_eligible ? (
                            <div className="mt-4 flex items-center gap-3 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                <BadgeCheck className="h-5 w-5 shrink-0" />
                                <span className="flex-1">You finished this course — claim your certificate.</span>
                                <Button onClick={claimCertificate} loading={claiming} variant="success" size="sm">
                                    Claim certificate
                                </Button>
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-gray-500">
                                {pendingQuizzes > 0
                                    ? `Finish every lesson and pass ${pendingQuizzes} more quiz${pendingQuizzes === 1 ? '' : 'zes'} to unlock your certificate (${enrollment.progress}% complete).`
                                    : `Finish all lessons to unlock your certificate (${enrollment.progress}% complete).`}
                            </p>
                        )}
                    </div>
                )}

                {/* Quizzes */}
                {quizzes.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quizzes</h2>
                        {enrollment && (
                            <p className="mt-1 text-sm text-gray-500">
                                {quizzes.filter((quiz) => quiz.passed).length} of {quizzes.length} passed
                            </p>
                        )}
                        <div className="mt-3 divide-y dark:divide-gray-700">
                            {quizzes.map((quiz) => (
                                <Link key={quiz.id} href={`/learn/courses/${course.id}/quiz/${quiz.id}`}
                                    className="flex items-center justify-between py-3 hover:text-indigo-600">
                                    <span className="font-medium">{quiz.title}</span>
                                    <span className="flex items-center gap-3 text-xs text-gray-500">
                                        {enrollment && (
                                            quiz.passed
                                                ? <span className="font-semibold text-green-600">Passed</span>
                                                : <span>Not passed</span>
                                        )}
                                        <span>Pass mark {quiz.pass_score_percent ?? 0}%</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Curriculum */}
                {course.lessons && course.lessons.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Curriculum</h2>
                        <p className="mt-1 text-sm text-gray-500">{course.lessons.length} lessons</p>
                        <div className="mt-6 divide-y dark:divide-gray-700">
                            {course.lessons
                                .sort((a, b) => a.lesson_order - b.lesson_order)
                                .map((lesson, index) => (
                                    <div key={lesson.id} className="flex items-center gap-4 py-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-800">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white">{lesson.title}</h3>
                                            <p className="text-xs text-gray-500">
                                                {lesson.duration_minutes ? `${lesson.duration_minutes} min` : ''}
                                                {lesson.resources && lesson.resources.length > 0
                                                    ? `${lesson.duration_minutes ? ' · ' : ''}${lesson.resources.length} resource${lesson.resources.length === 1 ? '' : 's'}`
                                                    : ''}
                                            </p>
                                            {lesson.resources && lesson.resources.length > 0 && (
                                                <ul className="mt-1.5 space-y-0.5">
                                                    {lesson.resources.map((resource, i) => (
                                                        <li key={i}>
                                                            <a href={resource.url} target="_blank" rel="noreferrer"
                                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-500">
                                                                <Download className="h-3 w-3" /> {resource.title}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        {lesson.video_url && (
                                            <Play className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
                {/* Reviews */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reviews</h2>
                        <span className="text-sm text-gray-500">
                            {course.reviews_count ?? 0} review{(course.reviews_count ?? 0) === 1 ? '' : 's'}
                            {course.rating != null ? ` · ${course.rating} avg` : ''}
                        </span>
                    </div>
                    {!auth?.user ? (
                        <p className="mt-2 text-sm text-gray-500">
                            <Link href="/login" className="font-medium text-indigo-600 underline">Log in</Link> to read and leave reviews.
                        </p>
                    ) : (
                        <>
                            {reviews.length === 0 ? (
                                <p className="mt-2 text-sm text-gray-500">No reviews yet — be the first.</p>
                            ) : (
                                <div className="mt-3 space-y-3">
                                    {reviews.map((review) => (
                                        <div key={review.id} className="border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                                            <p className="flex items-center gap-2 text-sm font-semibold text-amber-500">
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                                {review.is_verified_purchase && (
                                                    <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                                        Verified learner
                                                    </span>
                                                )}
                                            </p>
                                            {review.comment && <p className="mt-1 text-sm">{review.comment}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {myReview ? (
                                <>
                                    <p className="mt-4 text-sm text-gray-500">
                                        You reviewed this course — update your rating or comment below.
                                    </p>
                                    <div className="mt-4 flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Button key={star} type="button" onClick={() => setRating(star)} variant="icon" iconOnly size="sm" className={star <= rating ? 'text-amber-500' : 'text-gray-300'}>
                                                ★
                                            </Button>
                                        ))}
                                    </div>
                                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                                        placeholder="Share your experience (optional)"
                                        className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                                    {reviewError && <p className="mt-2 text-sm text-red-600">{reviewError}</p>}
                                    <Button onClick={submitReview}
                                        className="mt-3">
                                        Update review
                                    </Button>
                                </>
                            ) : !enrollment ? (
                                <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
                                    Enroll in this course to leave a review — only enrolled learners can.
                                </p>
                            ) : (
                                <>
                                    <div className="mt-4 flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Button key={star} type="button" onClick={() => setRating(star)} variant="icon" iconOnly size="sm" className={star <= rating ? 'text-amber-500' : 'text-gray-300'}>
                                                ★
                                            </Button>
                                        ))}
                                    </div>
                                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
                                        placeholder="Share your experience (optional)"
                                        className="mt-2 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                                    {reviewError && <p className="mt-2 text-sm text-red-600">{reviewError}</p>}
                                    <Button onClick={submitReview}
                                        className="mt-3">
                                        Submit review
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
