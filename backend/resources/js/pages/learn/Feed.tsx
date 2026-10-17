import AppLayout from '@/layouts/AppLayout';
import VideoPlayer from '@/components/learn/VideoPlayer';
import { Button } from '@/components/shared/Button';
import { PromptDialog } from '@/components/shared/Ui';
import { statusLabel, statusTone } from '@/lib/lifecycle';
import { api, errorMessage, rows } from '@/lib/api';
import { resolveVideoUrl } from '@/lib/video';
import { Head, Link, usePage } from '@inertiajs/react';
import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
    Bookmark,
    CheckCircle2,
    Flag,
    Heart,
    MessageCircle,
    PenLine,
    Search,
    Send,
    Share2,
    Upload,
} from 'lucide-react';
import { toast } from 'sonner';

interface FeedPost {
    id: string;
    title: string;
    content: string;
    category?: string | null;
    media_type?: string | null;
    media_url?: string | null;
    video_url?: string | null;
    video_provider?: string | null;
    provider_video_id?: string | null;
    duration_seconds?: number | null;
    views_count: number;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    is_pinned?: boolean;
    status: string;
    created_at: string;
    author_name?: string | null;
    user?: { id: string; name: string };
    viewer?: { liked: boolean; saved: boolean; following: boolean };
}

interface FeedMeta {
    per_page: number;
    has_more: boolean;
    next_cursor: string | null;
    sort: string;
    page: number;
}

interface FeedComment {
    id: string;
    content: string;
    likes_count?: number;
    liked?: boolean;
    created_at: string;
    user?: { id: string; name: string };
    replies?: FeedComment[];
}

interface MinePost extends FeedPost {
    rejection_reason?: string | null;
    appeal_reason?: string | null;
    submitted_at?: string | null;
}

interface CommentBundle {
    roots: FeedComment[];
    comments_count: number;
}

const SORTS = ['latest', 'top', 'trending'] as const;
type Sort = (typeof SORTS)[number];
const TYPES = ['all', 'text', 'image', 'video'] as const;
type TypeFilter = (typeof TYPES)[number];
type Tab = 'feed' | 'mine';

const REPORT_REASONS = ['spam', 'misinformation', 'harassment', 'off_topic', 'copyright', 'unsafe', 'other'];

/**
 * Learn 2.0 knowledge feed: cursor-driven infinite scroll, sort/filter tabs,
 * inline muted-autoplay video players, composer (drafts + submit), saves,
 * threaded comments, reports and a personal "my posts" review status tab.
 */
export default function LearnFeed() {
    const { props, url } = usePage();
    const authed = Boolean((props as Record<string, unknown>).auth);

    const [tab, setTab] = useState<Tab>('feed');
    const [sort, setSort] = useState<Sort>('latest');
    const [type, setType] = useState<TypeFilter>('all');
    const [query, setQuery] = useState('');
    const [activeQuery, setActiveQuery] = useState('');
    const [authorFilter, setAuthorFilter] = useState<string | null>(null);

    const [posts, setPosts] = useState<FeedPost[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [mine, setMine] = useState<MinePost[]>([]);
    const [mineLoaded, setMineLoaded] = useState(false);

    const [showComposer, setShowComposer] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text');
    const [mediaUrl, setMediaUrl] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [duration, setDuration] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [openComments, setOpenComments] = useState<Record<string, CommentBundle>>({});
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [reportFor, setReportFor] = useState<FeedPost | null>(null);
    const [progress, setProgress] = useState<Record<string, number>>({});

    const sentinelRef = useRef<HTMLDivElement>(null);

    const videoPreview = videoUrl.trim() ? resolveVideoUrl(videoUrl) : null;

    const load = useCallback(
        (reset: boolean) => {
            if (reset) setLoading(true);
            else setLoadingMore(true);
            const params = new URLSearchParams();
            params.set('sort', sort);
            if (type !== 'all') params.set('type', type);
            if (activeQuery) params.set('q', activeQuery);
            if (authorFilter) params.set('author', authorFilter);
            if (!reset && cursor) params.set('cursor', cursor);
            params.set('per_page', '10');

            api.get<{ data: FeedPost[]; meta: FeedMeta }>(`/api/learn/posts?${params}`)
                .then((res) => {
                    const incoming = rows<FeedPost>(res);
                    setPosts((prev) => (reset ? incoming : [...prev, ...incoming]));
                    setCursor(res.meta.next_cursor);
                    setHasMore(res.meta.has_more);
                })
                .catch((e) => {
                    if (reset) setPosts([]);
                    toast.error(errorMessage(e, 'Failed to load posts'));
                })
                .finally(() => {
                    if (reset) setLoading(false);
                    else setLoadingMore(false);
                });
        },
        [sort, type, activeQuery, authorFilter, cursor],
    );

    /* Author chip comes from the URL (?author=uuid) when arriving from a byline. */
    useEffect(() => {
        const value = new URL(url, window.location.origin).searchParams.get('author');
        setAuthorFilter(value);
    }, [url]);

    useEffect(() => {
        setCursor(null);
        load(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sort, type, activeQuery, authorFilter]);

    const loadMine = useCallback(() => {
        api.get<{ data: MinePost[] }>('/api/learn/posts-mine')
            .then((res) => {
                setMine(rows<MinePost>(res));
                setMineLoaded(true);
            })
            .catch((e) => toast.error(errorMessage(e, 'Failed to load your posts')));
    }, []);

    useEffect(() => {
        if (tab === 'mine' && !mineLoaded) loadMine();
    }, [tab, mineLoaded, loadMine]);

    /* Infinite scroll. */
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || tab !== 'feed') return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
                    load(false);
                }
            },
            { rootMargin: '400px' },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, load, tab]);

    const searchSubmit = (e: FormEvent) => {
        e.preventDefault();
        setActiveQuery(query.trim());
    };

    const resetComposer = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setCategory('');
        setMediaType('text');
        setMediaUrl('');
        setVideoUrl('');
        setDuration('');
    };

    const submitPost = async (asDraft: boolean) => {
        if (!title.trim() || !content.trim()) {
            toast.error('Add a title and some content first.');
            return;
        }
        if (mediaType === 'video' && !videoPreview) {
            toast.error('Add a valid YouTube, Vimeo, Facebook, TikTok or direct video file link.');
            return;
        }
        setSubmitting(true);
        try {
            if (editingId) {
                await api.patch(`/api/learn/posts/${editingId}`, {
                    title: title.trim(),
                    content: content.trim(),
                    category: category.trim() || undefined,
                    resubmit: true,
                });
                toast.success('Changes saved and resubmitted for review.');
            } else {
                await api.post('/api/learn/posts', {
                    title: title.trim(),
                    content: content.trim(),
                    category: category.trim() || undefined,
                    media_type: mediaType,
                    media_url: mediaType === 'image' && mediaUrl.trim() ? mediaUrl.trim() : undefined,
                    video_url: mediaType === 'video' && videoPreview ? videoPreview.url : undefined,
                    duration_seconds: duration ? Number(duration) : undefined,
                    save_as_draft: asDraft,
                });
                toast.success(
                    asDraft
                        ? 'Draft saved. Only you can see it.'
                        : 'Submitted for review. It appears here once approved.',
                );
            }
            resetComposer();
            setShowComposer(false);
            if (tab === 'mine') loadMine();
        } catch (e) {
            toast.error(errorMessage(e, 'Submission failed'));
        } finally {
            setSubmitting(false);
        }
    };

    const startEdit = (post: MinePost) => {
        setEditingId(post.id);
        setTitle(post.title);
        setContent(post.content);
        setCategory(post.category ?? '');
        setMediaType((post.media_type as 'text' | 'image' | 'video') ?? 'text');
        setVideoUrl(post.video_url ?? '');
        setMediaUrl(post.media_type === 'image' ? (post.media_url ?? '') : '');
        setDuration(post.duration_seconds ? String(post.duration_seconds) : '');
        setShowComposer(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleLike = async (post: FeedPost) => {
        if (!authed) return toast.error('Sign in to like posts.');
        try {
            const res = await api.post<{ data: { liked: boolean; likes_count: number } }>(
                `/api/learn/posts/${post.id}/like`,
            );
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === post.id
                        ? {
                              ...p,
                              likes_count: res.data.likes_count,
                              viewer: { liked: res.data.liked, saved: p.viewer?.saved ?? false, following: p.viewer?.following ?? false },
                          }
                        : p,
                ),
            );
        } catch (e) {
            toast.error(errorMessage(e, 'Could not like this post'));
        }
    };

    const toggleSave = async (post: FeedPost) => {
        if (!authed) return toast.error('Sign in to save posts.');
        try {
            const res = await api.post<{ data: { saved: boolean } }>(`/api/learn/posts/${post.id}/save`);
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === post.id
                        ? { ...p, viewer: { liked: p.viewer?.liked ?? false, saved: res.data.saved, following: p.viewer?.following ?? false } }
                        : p,
                ),
            );
            toast.success(res.data.saved ? 'Saved to your collection.' : 'Removed from saved.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not save this post'));
        }
    };

    const sharePost = async (post: FeedPost) => {
        try {
            const res = await api.post<{ data: { url: string; shares_count: number } }>(
                `/api/learn/posts/${post.id}/share`,
            );
            const link = res.data.url;
            if (navigator.share) {
                await navigator.share({ title: post.title, url: link }).catch(() => undefined);
            } else {
                await navigator.clipboard.writeText(link);
                toast.success('Link copied.');
            }
            setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, shares_count: res.data.shares_count } : p)));
        } catch (e) {
            toast.error(errorMessage(e, 'Could not share this post'));
        }
    };

    const toggleFollow = async (post: FeedPost) => {
        if (!authed || !post.user) return toast.error('Sign in to follow creators.');
        try {
            const res = await api.post<{ data: { following: boolean } }>(
                `/api/learn/creators/${post.user.id}/follow`,
            );
            setPosts((prev) =>
                prev.map((p) =>
                    p.id === post.id
                        ? { ...p, viewer: { liked: p.viewer?.liked ?? false, saved: p.viewer?.saved ?? false, following: res.data.following } }
                        : p,
                ),
            );
        } catch (e) {
            toast.error(errorMessage(e, 'Could not update follow'));
        }
    };

    const loadComments = async (id: string) => {
        if (openComments[id]) {
            setOpenComments((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            return;
        }
        try {
            const res = await api.get<{ data: FeedComment[]; meta: { total: number } }>(
                `/api/learn/posts/${id}/comments`,
            );
            setOpenComments((prev) => ({ ...prev, [id]: { roots: rows<FeedComment>(res), comments_count: res.meta.total } }));
        } catch (e) {
            toast.error(errorMessage(e, 'Could not load comments'));
        }
    };

    const sendComment = async (postId: string, parentId: string | null = null) => {
        const key = parentId ?? postId;
        const text = (commentDrafts[key] ?? '').trim();
        if (!text) return;
        if (!authed) return toast.error('Sign in to comment.');
        try {
            const res = await api.post<{ data: FeedComment }>(`/api/learn/posts/${postId}/comments`, {
                content: text,
                parent_id: parentId ?? undefined,
            });
            setOpenComments((prev) => {
                const bundle = prev[postId] ?? { roots: [], comments_count: 0 };
                if (!parentId) {
                    return { ...prev, [postId]: { roots: [...bundle.roots, res.data], comments_count: bundle.comments_count + 1 } };
                }
                return {
                    ...prev,
                    [postId]: {
                        comments_count: bundle.comments_count + 1,
                        roots: bundle.roots.map((r) =>
                            r.id === parentId ? { ...r, replies: [...(r.replies ?? []), res.data] } : r,
                        ),
                    },
                };
            });
            setCommentDrafts((prev) => ({ ...prev, [key]: '' }));
            setReplyTo(null);
            setPosts((prev) =>
                prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p)),
            );
        } catch (e) {
            toast.error(errorMessage(e, 'Could not post comment'));
        }
    };

    const likeComment = async (postId: string, commentId: string, parentId?: string) => {
        if (!authed) return toast.error('Sign in to like comments.');
        try {
            const res = await api.post<{ data: { liked: boolean; likes_count: number } }>(
                `/api/learn/comments/${commentId}/like`,
            );
            setOpenComments((prev) => {
                const bundle = prev[postId];
                if (!bundle) return prev;
                const apply = (c: FeedComment): FeedComment =>
                    c.id === commentId ? { ...c, liked: res.data.liked, likes_count: res.data.likes_count } : c;
                return {
                    ...prev,
                    [postId]: {
                        ...bundle,
                        roots: bundle.roots.map((r) =>
                            parentId || !parentId
                                ? r.id === commentId
                                    ? apply(r)
                                    : { ...r, replies: (r.replies ?? []).map(apply) }
                                : r,
                        ),
                    },
                };
            });
        } catch (e) {
            toast.error(errorMessage(e, 'Could not like comment'));
        }
    };

    const submitReport = async (reasonText: string) => {
        const target = reportFor;
        setReportFor(null);
        if (!target) return;
        const reason = reasonText.trim().toLowerCase();
        if (!REPORT_REASONS.includes(reason)) {
            toast.error(`Pick one of: ${REPORT_REASONS.join(', ')}`);
            return;
        }
        try {
            await api.post(`/api/learn/posts/${target.id}/report`, { reason });
            toast.success('Report received. A reviewer will look at this post.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not send report'));
        }
    };

    const appeal = async (post: MinePost, reason: string) => {
        if (!reason.trim()) return;
        try {
            await api.post(`/api/learn/posts/${post.id}/appeal`, { reason: reason.trim() });
            toast.success('Appeal submitted.');
            loadMine();
        } catch (e) {
            toast.error(errorMessage(e, 'Could not submit appeal'));
        }
    };

    const startEditMine = (post: MinePost) => {
        if (post.status === 'approved' || post.status === 'under_review') {
            toast.error('This post is live or in review - wait for the reviewer decision.');
            return;
        }
        startEdit(post);
    };

    return (
        <AppLayout>
            <Head title="Learning Community" />
            <div className="mx-auto max-w-2xl px-3 py-6">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Knowledge Feed</h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Guides, ideas and videos shared by learners. Every post is reviewed before publishing.
                        </p>
                    </div>
                    {authed && (
                        <Button
                            type="button"
                            onClick={() => {
                                if (!showComposer) resetComposer();
                                setShowComposer(!showComposer);
                            }}
                            size="sm"
                            className="flex items-center gap-1.5"
                        >
                            {showComposer ? <Upload className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
                            {showComposer ? 'Hide' : 'Share'}
                        </Button>
                    )}
                </div>

                <div className="mt-4 flex gap-2 border-b border-gray-200 dark:border-gray-700">
                    {(['feed', 'mine'] as Tab[]).map((t) => (
                        <Button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            variant={tab === t ? 'primary' : 'ghost'}
                            size="sm"
                            className="-mb-px border-b-2 px-3 py-2"
                        >
                            {t === 'feed' ? 'Community' : 'My posts'}
                        </Button>
                    ))}
                </div>

                {tab === 'feed' && (
                    <>
                        {showComposer && authed && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void submitPost(false);
                                }}
                                className="mt-4 space-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                            >
                                <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                                    <PenLine className="h-4 w-4" />
                                    {editingId ? 'Edit and resubmit' : 'Share something useful'}
                                </h2>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Title"
                                    aria-label="Post title"
                                    maxLength={255}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write your guide, idea or explanation..."
                                    aria-label="Post content"
                                    rows={4}
                                    maxLength={10000}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                                <div className="flex flex-wrap gap-2">
                                    <input
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Category (e.g. agriculture)"
                                        aria-label="Post category"
                                        maxLength={100}
                                        className="min-w-40 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                    <select
                                        value={mediaType}
                                        onChange={(e) => setMediaType(e.target.value as 'text' | 'image' | 'video')}
                                        aria-label="Post type"
                                        className="rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="text">Text</option>
                                        <option value="image">Image</option>
                                        <option value="video">Video</option>
                                    </select>
                                </div>
                                {mediaType === 'image' && (
                                    <input
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        placeholder="Image URL (https://...)"
                                        aria-label="Image URL"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                )}
                                {mediaType === 'video' && (
                                    <div className="space-y-1">
                                        <input
                                            value={videoUrl}
                                            onChange={(e) => setVideoUrl(e.target.value)}
                                            placeholder="YouTube, Vimeo, Facebook, TikTok or direct file link"
                                            aria-label="Video URL"
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                        <div className="flex items-center gap-3 text-xs">
                                            {videoUrl.trim() && videoPreview && (
                                                <span className="text-green-600">
                                                    Ready: {videoPreview.provider} video
                                                </span>
                                            )}
                                            {videoUrl.trim() && !videoPreview && (
                                                <span className="text-red-500">
                                                    Unsupported host - use YouTube, Vimeo, Facebook, TikTok or a direct video file.
                                                </span>
                                            )}
                                            <label className="text-gray-500">
                                                Duration (s)
                                                <input
                                                    value={duration}
                                                    onChange={(e) => setDuration(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="60"
                                                    inputMode="numeric"
                                                    className="ml-2 w-20 rounded border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-gray-700"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="submit"
                                        loading={submitting}
                                    >
                                        {editingId ? 'Resubmit' : 'Submit for review'}
                                    </Button>
                                    {!editingId && (
                                        <Button
                                            type="button"
                                            disabled={submitting}
                                            onClick={() => void submitPost(true)}
                                            variant="outline"
                                        >
                                            Save draft
                                        </Button>
                                    )}
                                </div>
                            </form>
                        )}

                        {!authed && (
                            <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                <Link href="/login" className="font-medium text-indigo-600">
                                    Sign in
                                </Link>{' '}
                                to share knowledge, like posts and join the discussion.
                            </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            {SORTS.map((s) => (
                                <Button
                                    key={s}
                                    type="button"
                                    onClick={() => setSort(s)}
                                    variant={sort === s ? 'primary' : 'outline'}
                                    size="sm"
                                    className="rounded-full px-3 py-1 capitalize"
                                >
                                    {s}
                                </Button>
                            ))}
                            <span className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600" />
                            {TYPES.map((t) => (
                                <Button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    variant={type === t ? 'secondary' : 'outline'}
                                    size="sm"
                                    className="rounded-full px-3 py-1 capitalize"
                                >
                                    {t}
                                </Button>
                            ))}
                        </div>

                        <form onSubmit={searchSubmit} className="mt-3 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search posts..."
                                    aria-label="Search posts"
                                    className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700"
                                />
                            </div>
                            <Button
                                type="submit"
                            >
                                Search
                            </Button>
                        </form>

                        {authorFilter && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <span>Filtered to one creator</span>
                                <Button
                                    type="button"
                                    onClick={() => setAuthorFilter(null)}
                                    variant="ghost"
                                    size="sm"
                                    className="px-0 underline"
                                >
                                    Clear
                                </Button>
                            </div>
                        )}

                        <div className="mt-6 space-y-4">
                            {loading && <p className="text-sm text-gray-500">Loading posts...</p>}
                            {!loading && posts.length === 0 && (
                                <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    {activeQuery || authorFilter
                                        ? 'Nothing matches this filter yet.'
                                        : 'No published posts yet. Be the first to share something useful.'}
                                </p>
                            )}

                            {posts.map((post) => (
                                <article key={post.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h2 className="font-semibold text-gray-900 dark:text-white">
                                                <Link href={`/learn/watch/${post.id}`} className="hover:text-indigo-600">
                                                    {post.title}
                                                </Link>
                                            </h2>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                <Link
                                                    href={`/learn/feed?author=${post.user?.id ?? ''}`}
                                                    className="hover:text-indigo-600"
                                                >
                                                    {post.user?.name ?? post.author_name ?? 'Learner'}
                                                </Link>
                                                {' · '}
                                                {new Date(post.created_at).toLocaleDateString()}
                                                {post.category ? ` · ${post.category}` : ''}
                                                {post.is_pinned ? ' · pinned' : ''}
                                            </p>
                                        </div>
                                        {post.user && authed && (
                                            <Button
                                                type="button"
                                                onClick={() => void toggleFollow(post)}
                                                variant={post.viewer?.following ? 'secondary' : 'outline'}
                                                size="sm"
                                                className="flex items-center gap-1 rounded-full px-2.5 py-1"
                                            >
                                                {post.viewer?.following && <CheckCircle2 className="h-3 w-3" />}
                                                {post.viewer?.following ? 'Following' : 'Follow'}
                                            </Button>
                                        )}
                                    </div>

                                    {post.media_type === 'video' && (post.video_provider || post.video_url) && (
                                        <VideoPlayer
                                            post={post}
                                            autoplay
                                            className="mt-3"
                                            onProgress={(p) => setProgress((prev) => ({ ...prev, [post.id]: p.watch_seconds }))}
                                        />
                                    )}
                                    {post.media_type === 'image' && post.media_url && (
                                        <img
                                            src={post.media_url}
                                            alt={post.title}
                                            loading="lazy"
                                            className="mt-3 max-h-96 w-full rounded-lg object-cover"
                                        />
                                    )}

                                    <p className="mt-2 whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">
                                        {post.content}
                                    </p>

                                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        <Button
                                            type="button"
                                            onClick={() => void toggleLike(post)}
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center gap-1 px-0"
                                            aria-label={`Like ${post.title}`}
                                            aria-pressed={post.viewer?.liked}
                                        >
                                            <Heart className={`h-4 w-4 ${post.viewer?.liked ? 'fill-current' : ''}`} />{' '}
                                            {post.likes_count}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => void loadComments(post.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center gap-1 px-0"
                                            aria-label={`Comments on ${post.title}`}
                                        >
                                            <MessageCircle className="h-4 w-4" /> {post.comments_count}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => void sharePost(post)}
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center gap-1 px-0"
                                            aria-label={`Share ${post.title}`}
                                        >
                                            <Share2 className="h-4 w-4" /> {post.shares_count}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => void toggleSave(post)}
                                            variant="icon"
                                            iconOnly
                                            size="sm"
                                            aria-label={`Save ${post.title}`}
                                            aria-pressed={post.viewer?.saved}
                                        >
                                            <Bookmark className={`h-4 w-4 ${post.viewer?.saved ? 'fill-current' : ''}`} />
                                        </Button>
                                        {authed && (
                                            <Button
                                                type="button"
                                                onClick={() => setReportFor(post)}
                                                variant="ghost"
                                                size="sm"
                                                className="flex items-center gap-1 px-0 text-xs"
                                                aria-label={`Report ${post.title}`}
                                            >
                                                <Flag className="h-3.5 w-3.5" /> Report
                                            </Button>
                                        )}
                                        {post.media_type === 'video' && progress[post.id] !== undefined && (
                                            <span className="text-xs text-gray-400">{progress[post.id]}s watched</span>
                                        )}
                                    </div>

                                    {openComments[post.id] && (
                                        <div className="mt-3 space-y-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                                            {openComments[post.id].roots.map((c) => (
                                                <div key={c.id} className="text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {c.user?.name ?? 'Learner'}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(c.created_at).toLocaleDateString()}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            onClick={() => void likeComment(post.id, c.id)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="flex items-center gap-1 px-0 text-xs"
                                                            aria-pressed={c.liked}
                                                        >
                                                            <Heart className="h-3 w-3" /> {c.likes_count ?? 0}
                                                        </Button>
                                                        {authed && (
                                                            <Button
                                                                type="button"
                                                                onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="px-0 text-xs"
                                                            >
                                                                Reply
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300">{c.content}</p>
                                                    {(c.replies ?? []).map((r) => (
                                                        <div key={r.id} className="ml-5 mt-1">
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {r.user?.name ?? 'Learner'}
                                                            </span>{' '}
                                                            <span className="text-gray-600 dark:text-gray-300">{r.content}</span>
                                                            <Button
                                                                type="button"
                                                                onClick={() => void likeComment(post.id, r.id, c.id)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="ml-2 px-0 text-xs"
                                                                aria-pressed={r.liked}
                                                            >
                                                                <Heart className="inline h-3 w-3" /> {r.likes_count ?? 0}
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {authed && replyTo === c.id && (
                                                        <div className="mt-2 flex gap-2">
                                                            <input
                                                                value={commentDrafts[c.id] ?? ''}
                                                                onChange={(e) =>
                                                                    setCommentDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                                                                }
                                                                placeholder={`Reply to ${c.user?.name ?? 'learner'}...`}
                                                                aria-label="Reply text"
                                                                maxLength={2000}
                                                                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                            />
                                                            <Button
                                                                type="button"
                                                                onClick={() => void sendComment(post.id, c.id)}
                                                                variant="icon"
                                                                iconOnly
                                                                size="sm"
                                                                aria-label="Send reply"
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            {authed && (
                                                <div className="flex gap-2">
                                                    <input
                                                        value={commentDrafts[post.id] ?? ''}
                                                        onChange={(e) =>
                                                            setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                                                        }
                                                        placeholder="Write a comment..."
                                                        aria-label="Comment text"
                                                        maxLength={2000}
                                                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={() => void sendComment(post.id)}
                                                        variant="icon"
                                                        iconOnly
                                                        size="sm"
                                                        aria-label="Send comment"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </article>
                            ))}

                            {tab === 'feed' && hasMore && (
                                <div ref={sentinelRef} className="py-2 text-center text-sm text-gray-400">
                                    {loadingMore ? 'Loading more...' : 'Scroll for more'}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {tab === 'mine' && (
                    <div className="mt-4 space-y-3">
                        {!mineLoaded && <p className="text-sm text-gray-500">Loading your posts...</p>}
                        {mineLoaded && mine.length === 0 && (
                            <p className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                You have not posted anything yet. Use Share to submit your first post.
                            </p>
                        )}
                        {mine.map((post) => (
                            <article key={post.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{post.title}</h3>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            {new Date(post.created_at).toLocaleDateString()}
                                            {post.category ? ` · ${post.category}` : ''}
                                        </p>
                                    </div>
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(post.status)}`}>
                                        {statusLabel(post.status)}
                                    </span>
                                </div>
                                <p className="mt-2 line-clamp-3 text-sm text-gray-700 dark:text-gray-300">{post.content}</p>
                                {post.status === 'rejected' && post.rejection_reason && (
                                    <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                                        Rejected: {post.rejection_reason}
                                    </p>
                                )}
                                {post.status === 'needs_information' && (
                                    <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                        A reviewer asked for changes - edit and resubmit below.
                                    </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {post.status === 'rejected' && (
                                        <PromptDialog
                                            open={reportFor?.id === post.id}
                                            title="Appeal rejection"
                                            description="Explain what you changed or why the decision should be revisited."
                                            placeholder="Why should this be re-reviewed?"
                                            confirmLabel="Send appeal"
                                            onSubmit={(reason) => {
                                                setReportFor(null);
                                                void appeal(post, reason);
                                            }}
                                            onCancel={() => setReportFor(null)}
                                        />
                                    )}
                                    {post.status === 'rejected' && (
                                        <Button
                                            type="button"
                                            onClick={() => setReportFor(post)}
                                            size="sm"
                                            className="text-xs"
                                        >
                                            Appeal
                                        </Button>
                                    )}
                                    {(post.status === 'draft' || post.status === 'needs_information' || post.status === 'rejected') && (
                                        <Button
                                            type="button"
                                            onClick={() => startEditMine(post)}
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>

            <PromptDialog
                open={reportFor !== null && tab === 'feed'}
                title="Report this post"
                description={`Reason: ${REPORT_REASONS.join(', ')}. A reviewer will check it against the community rules.`}
                placeholder="spam"
                confirmLabel="Send report"
                danger
                onSubmit={submitReport}
                onCancel={() => setReportFor(null)}
            />
        </AppLayout>
    );
}
