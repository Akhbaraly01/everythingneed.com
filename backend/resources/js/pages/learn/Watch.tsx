import AppLayout from '@/layouts/AppLayout';
import VideoPlayer from '@/components/learn/VideoPlayer';
import { PromptDialog } from '@/components/shared/Ui';
import { ApiError, api, errorMessage, rows } from '@/lib/api';
import { Head, Link, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import {
    ArrowLeft,
    Bookmark,
    CheckCircle2,
    Eye,
    Flag,
    Heart,
    MessageCircle,
    Send,
    Share2,
    Timer,
} from 'lucide-react';
import { toast } from 'sonner';

interface WatchPost {
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
    user?: { id: string; name: string };
    viewer?: { liked: boolean; saved: boolean; following: boolean };
}

interface WatchComment {
    id: string;
    content: string;
    likes_count?: number;
    liked?: boolean;
    created_at: string;
    user?: { id: string; name: string };
    replies?: WatchComment[];
}

const REPORT_REASONS = ['spam', 'misinformation', 'harassment', 'off_topic', 'copyright', 'unsafe', 'other'];

/**
 * Single-post watch page: the video/text detail view with real watch time,
 * threaded discussion, saves, shares and reporting. Reachable from every
 * feed card (`/learn/watch/{id}`).
 */
export default function LearnWatch({ post_id }: { post_id: string }) {
    const { props } = usePage();
    const authed = Boolean((props as Record<string, unknown>).auth);

    const [post, setPost] = useState<WatchPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState(false);
    const [comments, setComments] = useState<WatchComment[]>([]);
    const [commentsTotal, setCommentsTotal] = useState(0);
    const [commentDraft, setCommentDraft] = useState('');
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const [reportOpen, setReportOpen] = useState(false);
    const [watched, setWatched] = useState(0);

    const loadPost = useCallback(() => {
        setLoading(true);
        api.get<{ data: WatchPost }>(`/api/learn/posts/${post_id}`)
            .then((res) => setPost(res.data))
            .catch((e) => {
                setPost(null);
                if (e instanceof ApiError && e.status === 404) setMissing(true);
                else toast.error(errorMessage(e, 'Could not load this post'));
            })
            .finally(() => setLoading(false));
    }, [post_id]);

    const loadComments = useCallback(() => {
        api.get<{ data: WatchComment[]; meta: { total: number } }>(`/api/learn/posts/${post_id}/comments`)
            .then((res) => {
                setComments(rows<WatchComment>(res));
                setCommentsTotal(res.meta.total);
            })
            .catch(() => {
                setComments([]);
                setCommentsTotal(0);
            });
    }, [post_id]);

    useEffect(() => {
        loadPost();
        loadComments();
    }, [loadPost, loadComments]);

    const toggleLike = async () => {
        if (!post) return;
        if (!authed) return toast.error('Sign in to like posts.');
        try {
            const res = await api.post<{ data: { liked: boolean; likes_count: number } }>(
                `/api/learn/posts/${post.id}/like`,
            );
            setPost({
                ...post,
                likes_count: res.data.likes_count,
                viewer: {
                    liked: res.data.liked,
                    saved: post.viewer?.saved ?? false,
                    following: post.viewer?.following ?? false,
                },
            });
        } catch (e) {
            toast.error(errorMessage(e, 'Could not like this post'));
        }
    };

    const toggleSave = async () => {
        if (!post) return;
        if (!authed) return toast.error('Sign in to save posts.');
        try {
            const res = await api.post<{ data: { saved: boolean } }>(`/api/learn/posts/${post.id}/save`);
            setPost({
                ...post,
                viewer: {
                    liked: post.viewer?.liked ?? false,
                    saved: res.data.saved,
                    following: post.viewer?.following ?? false,
                },
            });
            toast.success(res.data.saved ? 'Saved to your collection.' : 'Removed from saved.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not save this post'));
        }
    };

    const sharePost = async () => {
        if (!post) return;
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
            setPost({ ...post, shares_count: res.data.shares_count });
        } catch (e) {
            toast.error(errorMessage(e, 'Could not share this post'));
        }
    };

    const toggleFollow = async () => {
        if (!authed || !post?.user) return toast.error('Sign in to follow creators.');
        try {
            const res = await api.post<{ data: { following: boolean } }>(
                `/api/learn/creators/${post.user.id}/follow`,
            );
            setPost({
                ...post,
                viewer: {
                    liked: post.viewer?.liked ?? false,
                    saved: post.viewer?.saved ?? false,
                    following: res.data.following,
                },
            });
        } catch (e) {
            toast.error(errorMessage(e, 'Could not update follow'));
        }
    };

    const sendComment = async (parentId: string | null = null) => {
        if (!post) return;
        const text = (parentId ? (commentDrafts[parentId] ?? '') : commentDraft).trim();
        if (!text) return;
        if (!authed) return toast.error('Sign in to comment.');
        try {
            const res = await api.post<{ data: WatchComment }>(`/api/learn/posts/${post.id}/comments`, {
                content: text,
                parent_id: parentId ?? undefined,
            });
            if (!parentId) {
                setComments((prev) => [...prev, res.data]);
            } else {
                setComments((prev) =>
                    prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), res.data] } : c)),
                );
                setCommentDrafts((prev) => ({ ...prev, [parentId]: '' }));
            }
            setCommentDraft('');
            setReplyTo(null);
            setCommentsTotal((n) => n + 1);
            setPost({ ...post, comments_count: post.comments_count + 1 });
        } catch (e) {
            toast.error(errorMessage(e, 'Could not post comment'));
        }
    };

    const likeComment = async (commentId: string) => {
        if (!authed) return toast.error('Sign in to like comments.');
        try {
            const res = await api.post<{ data: { liked: boolean; likes_count: number } }>(
                `/api/learn/comments/${commentId}/like`,
            );
            const liked = res.data.liked;
            const likes = res.data.likes_count;
            setComments((prev) =>
                prev.map((c) =>
                    c.id === commentId
                        ? { ...c, liked, likes_count: likes }
                        : {
                              ...c,
                              replies: (c.replies ?? []).map((r) =>
                                  r.id === commentId ? { ...r, liked, likes_count: likes } : r,
                              ),
                          },
                ),
            );
        } catch (e) {
            toast.error(errorMessage(e, 'Could not like comment'));
        }
    };

    const submitReport = async (reasonText: string) => {
        setReportOpen(false);
        if (!post) return;
        const reason = reasonText.trim().toLowerCase();
        if (!REPORT_REASONS.includes(reason)) {
            toast.error(`Pick one of: ${REPORT_REASONS.join(', ')}`);
            return;
        }
        try {
            await api.post(`/api/learn/posts/${post.id}/report`, { reason });
            toast.success('Report received. A reviewer will look at this post.');
        } catch (e) {
            toast.error(errorMessage(e, 'Could not send report'));
        }
    };

    return (
        <AppLayout title={post ? post.title : 'Post'}>
            <Head title={post ? post.title : 'Knowledge post'} />
            <div className="mx-auto max-w-3xl px-3 py-6">
                <Link
                    href="/learn/feed"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to feed
                </Link>

                {loading && <p className="mt-6 text-sm text-gray-500">Loading post...</p>}

                {!loading && (missing || !post) && (
                    <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
                        <p className="font-medium text-gray-900 dark:text-white">This post is not available</p>
                        <p className="mt-1 text-sm text-gray-500">
                            It was removed, hidden, or it was never approved for the public feed.
                        </p>
                        <Link
                            href="/learn/feed"
                            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            Browse the feed
                        </Link>
                    </div>
                )}

                {!loading && post && (
                    <article className="mt-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{post.title}</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    <Link href={`/learn/feed?author=${post.user?.id ?? ''}`} className="hover:text-indigo-600">
                                        {post.user?.name ?? 'Learner'}
                                    </Link>
                                    {' · '}
                                    {new Date(post.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                    {post.category ? ` · ${post.category}` : ''}
                                    {post.is_pinned ? ' · pinned' : ''}
                                </p>
                            </div>
                            {post.user && authed && (
                                <button
                                    type="button"
                                    onClick={() => void toggleFollow()}
                                    className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium ${
                                        post.viewer?.following
                                            ? 'border-indigo-600 text-indigo-600'
                                            : 'border-gray-300 text-gray-600 hover:border-indigo-400 dark:border-gray-600 dark:text-gray-300'
                                    }`}
                                >
                                    {post.viewer?.following && <CheckCircle2 className="h-4 w-4" />}
                                    {post.viewer?.following ? 'Following' : 'Follow'}
                                </button>
                            )}
                        </div>

                        {post.media_type === 'video' && (post.video_provider || post.video_url) && (
                            <VideoPlayer
                                post={post}
                                autoplay
                                className="mt-4"
                                onProgress={(p) => setWatched(p.watch_seconds)}
                            />
                        )}
                        {post.media_type === 'image' && post.media_url && (
                            <img
                                src={post.media_url}
                                alt={post.title}
                                className="mt-4 max-h-[32rem] w-full rounded-lg object-contain"
                            />
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" /> {post.views_count} views
                            </span>
                            {post.duration_seconds ? (
                                <span className="flex items-center gap-1">
                                    <Timer className="h-4 w-4" /> {Math.round(post.duration_seconds / 60)} min
                                </span>
                            ) : null}
                            {post.media_type === 'video' && (
                                <span className="flex items-center gap-1">
                                    <Heart className="h-4 w-4" /> {watched}s watched
                                </span>
                            )}
                        </div>

                        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-gray-800 dark:text-gray-200">
                            {post.content}
                        </p>

                        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
                            <button
                                type="button"
                                onClick={() => void toggleLike()}
                                className={`flex items-center gap-1 ${post.viewer?.liked ? 'text-indigo-600' : 'hover:text-indigo-600'}`}
                                aria-label={`Like ${post.title}`}
                            >
                                <Heart className={`h-4 w-4 ${post.viewer?.liked ? 'fill-current' : ''}`} /> {post.likes_count}
                            </button>
                            <span className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" /> {commentsTotal}
                            </span>
                            <button
                                type="button"
                                onClick={() => void sharePost()}
                                className="flex items-center gap-1 hover:text-indigo-600"
                                aria-label={`Share ${post.title}`}
                            >
                                <Share2 className="h-4 w-4" /> {post.shares_count}
                            </button>
                            <button
                                type="button"
                                onClick={() => void toggleSave()}
                                className={`flex items-center gap-1 ${post.viewer?.saved ? 'text-amber-500' : 'hover:text-amber-500'}`}
                                aria-label={`Save ${post.title}`}
                            >
                                <Bookmark className={`h-4 w-4 ${post.viewer?.saved ? 'fill-current' : ''}`} />
                                {post.viewer?.saved ? 'Saved' : 'Save'}
                            </button>
                            {authed && (
                                <button
                                    type="button"
                                    onClick={() => setReportOpen(true)}
                                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
                                    aria-label={`Report ${post.title}`}
                                >
                                    <Flag className="h-3.5 w-3.5" /> Report
                                </button>
                            )}
                        </div>

                        <section className="mt-6" aria-label="Comments">
                            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                                Discussion {commentsTotal > 0 ? `(${commentsTotal})` : ''}
                            </h2>

                            <div className="mt-3 space-y-4">
                                {comments.length === 0 && (
                                    <p className="text-sm text-gray-500">
                                        No comments yet. Share the first useful thought.
                                    </p>
                                )}
                                {comments.map((c) => (
                                    <div key={c.id} className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {c.user?.name ?? 'Learner'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => void likeComment(c.id)}
                                                className={`flex items-center gap-1 text-xs ${c.liked ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
                                            >
                                                <Heart className="h-3 w-3" /> {c.likes_count ?? 0}
                                            </button>
                                            {authed && (
                                                <button
                                                    type="button"
                                                    onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                                                    className="text-xs text-gray-400 hover:text-indigo-600"
                                                >
                                                    Reply
                                                </button>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-gray-700 dark:text-gray-300">{c.content}</p>

                                        {(c.replies ?? []).map((r) => (
                                            <div key={r.id} className="ml-6 mt-2">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {r.user?.name ?? 'Learner'}
                                                </span>{' '}
                                                <span className="text-gray-600 dark:text-gray-300">{r.content}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => void likeComment(r.id)}
                                                    className={`ml-2 text-xs ${r.liked ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
                                                >
                                                    <Heart className="inline h-3 w-3" /> {r.likes_count ?? 0}
                                                </button>
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
                                                <button
                                                    type="button"
                                                    onClick={() => void sendComment(c.id)}
                                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500"
                                                    aria-label="Send reply"
                                                >
                                                    <Send className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {authed ? (
                                <div className="mt-4 flex gap-2">
                                    <input
                                        value={commentDraft}
                                        onChange={(e) => setCommentDraft(e.target.value)}
                                        placeholder="Write a comment..."
                                        aria-label="Comment text"
                                        maxLength={2000}
                                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void sendComment()}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                                    >
                                        Post
                                    </button>
                                </div>
                            ) : (
                                <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                    <Link href="/login" className="font-medium text-indigo-600">
                                        Sign in
                                    </Link>{' '}
                                    to join the discussion.
                                </p>
                            )}
                        </section>
                    </article>
                )}
            </div>

            <PromptDialog
                open={reportOpen}
                title="Report this post"
                description={`Reason: ${REPORT_REASONS.join(', ')}. A reviewer will check it against the community rules.`}
                placeholder="spam"
                confirmLabel="Send report"
                danger
                onSubmit={submitReport}
                onCancel={() => setReportOpen(false)}
            />
        </AppLayout>
    );
}
