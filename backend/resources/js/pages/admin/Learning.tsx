import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import ConfirmDialog from '@/components/shared/Ui';
import { BookOpen, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

type CourseStatus = 'draft' | 'published' | 'archived';

/** Real courses row (CourseController::index / learn_courses table). */
interface Course {
    id: string;
    title: string;
    slug?: string;
    description?: string;
    category: string;
    course_type: 'theory' | 'practical' | 'both';
    instructor_name: string;
    price: number;
    duration_hours?: number | null;
    students_count: number;
    rating?: number | null;
    is_featured?: boolean;
    level?: string | null;
    language?: string | null;
    objectives?: string[] | null;
    requirements?: string | null;
    status?: CourseStatus;
    published_at?: string | null;
}

interface Meta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface CourseForm {
    title: string;
    description: string;
    category: string;
    course_type: 'theory' | 'practical' | 'both';
    instructor_name: string;
    price: string;
    duration_hours: string;
    level: string;
    language: string;
    objectives: string;
    requirements: string;
    is_featured: boolean;
}

const EMPTY_FORM: CourseForm = {
    title: '', description: '', category: '', course_type: 'theory',
    instructor_name: '', price: '', duration_hours: '', level: '', language: '',
    objectives: '', requirements: '', is_featured: false,
};

const STATUS_STYLES: Record<CourseStatus, string> = {
    published: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    archived: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

export default function AdminLearning() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [category, setCategory] = useState('all');
    const [status, setStatus] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteFor, setDeleteFor] = useState<Course | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [form, setForm] = useState<CourseForm>(EMPTY_FORM);

    const load = (pageToUse = page, query = q, cat = category, courseStatus = status) => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(pageToUse) });
        if (query) params.set('q', query);
        if (cat && cat !== 'all') params.set('category', cat);
        if (courseStatus && courseStatus !== 'all') params.set('status', courseStatus);
        // Admin list (all statuses) - the public /api/courses hides drafts.
        api.get<{ data: Course[]; meta: Meta }>(`/api/admin/courses?${params}`)
            .then((res) => {
                setCourses(rows<Course>(res));
                setMeta(res.meta);
            })
            .catch((e) => {
                setCourses([]);
                toast.error(errorMessage(e, 'Failed to load courses'));
            })
            .finally(() => setLoading(false));
    };

    // Initial + page change load (search/category/status trigger explicit reloads).
    useEffect(() => { load(page, q, category, status); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

    const searchNow = (e: FormEvent) => {
        e.preventDefault();
        setPage(1);
        load(1, q, category, status);
    };

    const formPayload = () => ({
        title: form.title,
        description: form.description,
        category: form.category,
        course_type: form.course_type,
        instructor_name: form.instructor_name,
        price: Number(form.price),
        duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
        level: form.level || null,
        language: form.language || null,
        requirements: form.requirements || null,
        objectives: form.objectives.split('\n').map((s) => s.trim()).filter(Boolean),
        is_featured: form.is_featured,
    });

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = formPayload();
            if (editing) {
                await api.put(`/api/admin/courses/${editing.id}`, payload);
                toast.success('Course updated.');
            } else {
                await api.post('/api/admin/courses', payload);
                toast.success('Course created — it is live in search, listings and navigation.');
            }
            closeForm();
            setPage(1);
            load(1, q, category, status);
        } catch (err) {
            toast.error(errorMessage(err, editing ? 'Failed to update course' : 'Failed to create course'));
        } finally {
            setSaving(false);
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        setForm(EMPTY_FORM);
    };

    const startEdit = (course: Course) => {
        setEditing(course);
        setShowForm(true);
        setForm({
            title: course.title,
            description: course.description ?? '',
            category: course.category,
            course_type: course.course_type,
            instructor_name: course.instructor_name,
            price: String(course.price),
            duration_hours: course.duration_hours != null ? String(course.duration_hours) : '',
            level: course.level ?? '',
            language: course.language ?? '',
            requirements: course.requirements ?? '',
            objectives: (course.objectives ?? []).join('\n'),
            is_featured: Boolean(course.is_featured),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const changeStatus = async (course: Course, next: CourseStatus) => {
        try {
            await api.put(`/api/admin/courses/${course.id}/status`, { status: next });
            toast.success(next === 'published'
                ? 'Course published — it is live in search, listings and navigation.'
                : next === 'archived' ? 'Course archived.' : 'Course unpublished — it left every public surface.');
            load(page, q, category, status);
        } catch (e) {
            toast.error(errorMessage(e, 'Failed to change status'));
        }
    };

    const remove = async (course: Course) => {
        setDeleting(true);
        try {
            await api.del(`/api/admin/courses/${course.id}`);
            toast.success('Course deleted.');
            setDeleteFor(null);
            load(page, q, category, status);
        } catch (e) {
            toast.error(errorMessage(e, 'Could not delete course'));
        } finally {
            setDeleting(false);
        }
    };

    const categories = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)));

    return (
        <AdminLayout title="Learning Admin">
            <Head title="Learning Admin" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Management</h1>
                    <div className="flex items-center gap-3">
                        {meta && <span className="text-sm text-gray-500">{meta.total} courses</span>}
                        <button onClick={() => (showForm ? closeForm() : setShowForm(true))}
                            className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                            <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add course'}
                        </button>
                    </div>
                </div>

                {showForm && (
                    <form onSubmit={submit} className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">{editing ? 'Edit course' : 'New course'}</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <label className="text-sm text-gray-600 dark:text-gray-300">Title
                                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Category
                                <input required value={form.category} placeholder="e.g. programming" onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Type
                                <select value={form.course_type} onChange={(e) => setForm({ ...form, course_type: e.target.value as CourseForm['course_type'] })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700">
                                    <option value="theory">Theory</option>
                                    <option value="practical">Practical</option>
                                    <option value="both">Both</option>
                                </select>
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Instructor
                                <input required value={form.instructor_name} onChange={(e) => setForm({ ...form, instructor_name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Price
                                <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Duration (hours)
                                <input type="number" min="0" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Level
                                <input value={form.level} placeholder="e.g. beginner" onChange={(e) => setForm({ ...form, level: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Language
                                <input value={form.language} placeholder="e.g. en" maxLength={10} onChange={(e) => setForm({ ...form, language: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="sm:col-span-2 text-sm text-gray-600 dark:text-gray-300">Description
                                <textarea required rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Learning objectives (one per line)
                                <textarea rows={3} value={form.objectives} placeholder={'Explain the water cycle\nRun a basic experiment'}
                                    onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="text-sm text-gray-600 dark:text-gray-300">Requirements
                                <textarea rows={3} value={form.requirements} placeholder="What learners need before starting"
                                    onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700" />
                            </label>
                            <label className="flex items-center gap-2 self-end py-2 text-sm text-gray-600 dark:text-gray-300">
                                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                                Featured
                            </label>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button type="submit" disabled={saving}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                                {saving ? 'Saving...' : editing ? 'Save changes' : 'Create course'}
                            </button>
                            <button type="button" onClick={closeForm}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="flex flex-wrap gap-2">
                    <form onSubmit={searchNow} className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses..."
                                className="w-64 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <button type="submit" className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 dark:bg-gray-600">Search</button>
                    </form>
                    <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); load(1, q, e.target.value, status); }}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700">
                        <option value="all">All categories</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); load(1, q, category, e.target.value); }}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700">
                        <option value="all">All statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : courses.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No courses found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Course</th>
                                    <th className="px-4 py-3">Instructor</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3">Students</th>
                                    <th className="px-4 py-3">Rating</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {courses.map((c) => {
                                    const courseStatus: CourseStatus = c.status ?? 'published';
                                    return (
                                        <tr key={c.id}>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-900 dark:text-white">{c.title}</p>
                                                <p className="text-xs text-gray-500">{c.category}{c.duration_hours != null ? ` · ${c.duration_hours}h` : ''}</p>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{c.instructor_name}</td>
                                            <td className="px-4 py-3 capitalize">{c.course_type}</td>
                                            <td className="px-4 py-3 font-semibold">{formatCurrency(Number(c.price))}</td>
                                            <td className="px-4 py-3">{c.students_count}</td>
                                            <td className="px-4 py-3">
                                                {c.rating != null ? (
                                                    <span className="flex items-center gap-1 text-amber-600"><Star className="h-3.5 w-3.5 fill-current" />{Number(c.rating).toFixed(1)}</span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[courseStatus]}`}>
                                                    {courseStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => startEdit(c)} title="Edit"
                                                        className="rounded p-1 text-blue-600 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button>
                                                    {courseStatus !== 'published' && (
                                                        <button onClick={() => void changeStatus(c, 'published')} title="Publish"
                                                            className="rounded px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-50">Publish</button>
                                                    )}
                                                    {courseStatus === 'published' && (
                                                        <button onClick={() => void changeStatus(c, 'draft')} title="Unpublish"
                                                            className="rounded px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">Unpublish</button>
                                                    )}
                                                    <button onClick={() => setDeleteFor(c)} title="Delete"
                                                        className="rounded p-1 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <ConfirmDialog
                    open={deleteFor !== null}
                    title="Delete course?"
                    description={deleteFor ? `Delete "${deleteFor.title}"? Courses with enrolled learners cannot be deleted - unpublish instead.` : undefined}
                    confirmLabel="Delete"
                    danger
                    busy={deleting}
                    onConfirm={() => deleteFor && void remove(deleteFor)}
                    onCancel={() => setDeleteFor(null)}
                />

                {meta && meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.current_page} of {meta.last_page} · {meta.total} courses</span>
                        <div className="flex gap-2">
                            <button disabled={meta.current_page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={meta.current_page >= meta.last_page} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}

                <CommunityQueue />
            </div>
        </AdminLayout>
    );
}

/** Phase 16 moderation queue: pending community posts -> approve / reject. */
function CommunityQueue() {
    const [queue, setQueue] = useState<CommunityQueueItem[]>([]);
    const [loadingQueue, setLoadingQueue] = useState(true);

    const loadQueue = () => {
        setLoadingQueue(true);
        api.get<{ data: CommunityQueueItem[] }>('/api/learn/posts-queue')
            .then((res) => setQueue(rows<CommunityQueueItem>(res)))
            .catch((e) => toast.error(errorMessage(e, 'Failed to load moderation queue')))
            .finally(() => setLoadingQueue(false));
    };

    useEffect(loadQueue, []);

    const decide = async (id: string, action: 'approve' | 'reject') => {
        try {
            await api.post(`/api/learn/posts/${id}/${action}`);
            toast.success(action === 'approve' ? 'Post approved and published.' : 'Post rejected.');
            loadQueue();
        } catch (e) {
            toast.error(errorMessage(e, `Could not ${action} post`));
        }
    };

    return (
        <div className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
                Community posts awaiting review{queue.length > 0 ? ` (${queue.length})` : ''}
            </h2>
            {loadingQueue && <p className="mt-2 text-sm text-gray-500">Loading queue...</p>}
            {!loadingQueue && queue.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">Queue is empty. New submissions appear here.</p>
            )}
            <div className="mt-3 space-y-3">
                {queue.map((post) => (
                    <div key={post.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                        <p className="font-medium text-gray-900 dark:text-white">{post.title}</p>
                        <p className="text-xs text-gray-500">
                            {post.user?.name ?? 'Learner'} · {new Date(post.created_at).toLocaleString()}
                            {post.category ? ` · ${post.category}` : ''}
                        </p>
                        <p className="mt-1 line-clamp-3 text-sm text-gray-600 dark:text-gray-300">{post.content}</p>
                        <div className="mt-2 flex gap-2">
                            <button onClick={() => void decide(post.id, 'approve')}
                                className="rounded-lg bg-green-600 px-3 py-1 text-sm font-medium text-white hover:bg-green-500">
                                Approve
                            </button>
                            <button onClick={() => void decide(post.id, 'reject')}
                                className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-500">
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

type CommunityQueueItem = {
    id: string;
    title: string;
    content: string;
    category?: string | null;
    created_at: string;
    user?: { name?: string };
};
