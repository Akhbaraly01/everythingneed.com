import AppLayout from '@/layouts/AppLayout';
import {Head, Link} from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { toast } from 'sonner';
import {CheckCircle, PlayCircle, ArrowRight, Download, NotebookPen} from 'lucide-react';
import {useEffect, useState} from 'react';

interface Lesson {
    id: string;
    title: string;
    description?: string;
    content?: string;
    video_url?: string;
    duration_minutes?: number;
    order: number;
    is_free: boolean;
    resources?: { title: string; url: string }[] | null;
}

interface CourseLessonProps {
    course: { id: string; title: string; instructor?: string; total_lessons?: number };
    lesson: Lesson;
    nextLessonId?: string;
    prevLessonId?: string;
    progress: number;
    is_enrolled: boolean;
}

/** Strip scripts/iframes/event handlers from stored lesson HTML before render. */
function sanitizeHtml(html: string): string {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
        .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
        .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
        .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
        .replace(/javascript\s*:/gi, '');
}

export default function CourseLesson({ course, lesson, nextLessonId, prevLessonId, progress, is_enrolled }: CourseLessonProps) {
    const [completing, setCompleting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [note, setNote] = useState('');
    const [noteSaved, setNoteSaved] = useState(false);
    const [noteError, setNoteError] = useState<string | null>(null);
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        if (!is_enrolled) return;
        api.get<{ data: { body: string } | null }>(`/api/learn/lessons/${lesson.id}/notes`)
            .then((res) => {
                if (res.data?.body) {
                    setNote(res.data.body);
                    setNoteSaved(true);
                }
            })
            .catch(() => undefined);
    }, [lesson.id, is_enrolled]);

    const markComplete = async () => {
        setCompleting(true);
        try {
            await api.post(`/api/learn/courses/${course.id}/lessons/${lesson.id}/complete`);
            setCompleted(true);
            toast.success('Lesson marked complete.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not mark lesson complete'));
        }
        setCompleting(false);
    };

    const saveNote = async () => {
        if (!note.trim()) return;
        setSavingNote(true);
        setNoteError(null);
        try {
            await api.post(`/api/learn/lessons/${lesson.id}/notes`, { body: note.trim() });
            setNoteSaved(true);
        } catch (e) {
            setNoteError(errorMessage(e, 'Could not save note'));
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <AppLayout>
            <Head title={`${lesson.title} - ${course.title}`} />

            <div className="space-y-6">
                <Link href={`/learn/${course.id}`} className="text-sm text-gray-500 hover:text-gray-700">
                    &larr; Back to course
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
                        <p className="text-sm text-gray-500">by {course.instructor ?? 'Instructor'}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                        Lesson {lesson.order} of {course.total_lessons ?? '?'}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="rounded-full bg-gray-200 h-2 dark:bg-gray-700">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-500">{Math.round(progress)}% complete</p>

                {/* Video / Content */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    {lesson.video_url ? (
                        <div className="aspect-video">
                            <iframe src={lesson.video_url} className="h-full w-full rounded-lg" allowFullScreen />
                        </div>
                    ) : lesson.content ? (
                        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.content) }} />
                    ) : (
                        <div className="flex h-48 items-center justify-center text-gray-400">
                            <PlayCircle className="h-12 w-12" />
                        </div>
                    )}
                </div>

                {/* Description */}
                {lesson.description && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white">About this lesson</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{lesson.description}</p>
                    </div>
                )}

                {/* Downloadable resources */}
                {lesson.resources && lesson.resources.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Resources</h3>
                        <ul className="mt-3 space-y-2">
                            {lesson.resources.map((resource, i) => (
                                <li key={i}>
                                    <a href={resource.url} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                        <Download className="h-4 w-4" /> {resource.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Learner notes */}
                {is_enrolled && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                            <NotebookPen className="h-4 w-4" /> My notes
                        </h3>
                        <textarea value={note} onChange={(e) => { setNote(e.target.value); setNoteSaved(false); }} rows={4}
                            placeholder="Write down key takeaways from this lesson..."
                            className="mt-3 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                        {noteError && <p className="mt-2 text-sm text-red-600">{noteError}</p>}
                        <div className="mt-3 flex items-center gap-3">
                            <button onClick={saveNote} disabled={savingNote || !note.trim()}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                                {savingNote ? 'Saving...' : 'Save note'}
                            </button>
                            {noteSaved && <span className="text-xs text-green-600">Saved ✓</span>}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                    {prevLessonId ? (
                        <Link href={`/learn/courses/${course.id}/lessons/${prevLessonId}`}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Previous Lesson
                        </Link>
                    ) : <div />}

                    {is_enrolled && (
                        completed ? (
                            <span className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" /> Completed
                            </span>
                        ) : (
                            <button onClick={markComplete} disabled={completing}
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50">
                                <CheckCircle className="h-4 w-4" /> {completing ? 'Saving...' : 'Mark Complete'}
                            </button>
                        )
                    )}

                    {nextLessonId ? (
                        <Link href={`/learn/courses/${course.id}/lessons/${nextLessonId}`}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
                            Next Lesson <ArrowRight className="h-4 w-4" />
                        </Link>
                    ) : is_enrolled ? (
                        <Link href={`/learn/courses/${course.id}/quiz`}
                            className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-500">
                            Take Quiz <ArrowRight className="h-4 w-4" />
                        </Link>
                    ) : <div />}
                </div>
            </div>
        </AppLayout>
    );
}
