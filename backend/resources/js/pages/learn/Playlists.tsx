import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ListMusic, Plus, Trash2, X, ChevronLeft } from 'lucide-react';
import { api, errorMessage } from '@/lib/api';

interface Playlist {
    id: string;
    name: string;
    items_count?: number;
}

interface Post {
    id: string;
    title: string;
    user?: { name?: string } | null;
}

export default function LearnPlaylists() {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    const [openId, setOpenId] = useState<string | null>(null);
    const [openName, setOpenName] = useState('');
    const [items, setItems] = useState<Post[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [catalog, setCatalog] = useState<Post[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);

    const loadList = useCallback(() => {
        api.get<{ data: Playlist[] }>('/api/learn/playlists')
            .then((res) => setPlaylists(Array.isArray(res.data) ? res.data : []))
            .catch((e) => toast.error(errorMessage(e, 'Failed to load playlists')))
            .finally(() => setLoading(false));
    }, []);

    useEffect(loadList, [loadList]);

    const openPlaylist = (p: Playlist) => {
        setOpenId(p.id);
        setOpenName(p.name);
        setDetailLoading(true);
        api.get<{ data: Playlist; posts: Post[] }>(`/api/learn/playlists/${p.id}`)
            .then((res) => setItems(Array.isArray(res.posts) ? res.posts : []))
            .catch((e) => {
                setItems([]);
                toast.error(errorMessage(e, 'Failed to load playlist'));
            })
            .finally(() => setDetailLoading(false));
    };

    const closePlaylist = () => {
        setOpenId(null);
        setItems([]);
        setCatalog([]);
        loadList();
    };

    const createPlaylist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await api.post('/api/learn/playlists', { name: newName.trim() });
            toast.success('Playlist created');
            setNewName('');
            loadList();
        } catch (err) {
            toast.error(errorMessage(err, 'Could not create playlist'));
        } finally {
            setCreating(false);
        }
    };

    const removeItem = async (postId: string) => {
        if (!openId) return;
        setBusyId(postId);
        try {
            await api.del(`/api/learn/playlists/${openId}/items/${postId}`);
            setItems((it) => it.filter((p) => p.id !== postId));
            toast.success('Removed from playlist');
        } catch (err) {
            toast.error(errorMessage(err, 'Could not remove'));
        } finally {
            setBusyId(null);
        }
    };

    const deletePlaylist = async (id: string) => {
        setBusyId(id);
        try {
            await api.del(`/api/learn/playlists/${id}`);
            toast.success('Playlist deleted');
            if (openId === id) closePlaylist();
            else loadList();
        } catch (err) {
            toast.error(errorMessage(err, 'Could not delete playlist'));
        } finally {
            setBusyId(null);
        }
    };

    const loadCatalog = () => {
        api.get<{ data: Post[] }>('/api/learn/posts?per_page=20')
            .then((res) => setCatalog(Array.isArray(res.data) ? res.data : []))
            .catch(() => setCatalog([]));
    };

    const addItem = async (postId: string) => {
        if (!openId) return;
        setBusyId(postId);
        try {
            const res = await api.post<{ data: { post: Post } }>(`/api/learn/playlists/${openId}/items`, { post_id: postId });
            const added = res?.data?.post;
            setItems((it) => (added && !it.some((p) => p.id === added.id) ? [...it, added] : it));
            setCatalog((c) => c.filter((p) => p.id !== postId));
            toast.success('Added to playlist');
        } catch (err) {
            toast.error(errorMessage(err, 'Could not add'));
        } finally {
            setBusyId(null);
        }
    };

    if (openId) {
        const itemIds = new Set(items.map((i) => i.id));
        const addable = catalog.filter((c) => !itemIds.has(c.id));
        return (
            <AppLayout title="Playlist">
                <Head title={openName} />
                <div className="mx-auto max-w-3xl space-y-6">
                    <button onClick={closePlaylist} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <ChevronLeft className="h-4 w-4" /> All playlists
                    </button>
                    <div className="flex items-center justify-between">
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                            <ListMusic className="h-6 w-6 text-indigo-500" /> {openName}
                        </h1>
                        <button
                            onClick={() => deletePlaylist(openId)}
                            disabled={busyId === openId}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900"
                        >
                            <Trash2 className="h-4 w-4" /> Delete
                        </button>
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">Saved posts</h2>
                        {detailLoading ? (
                            <p className="text-sm text-gray-500">Loading...</p>
                        ) : items.length === 0 ? (
                            <p className="text-sm text-gray-500">This playlist is empty — add posts below.</p>
                        ) : (
                            <ul className="divide-y dark:divide-gray-700">
                                {items.map((p) => (
                                    <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{p.title}</p>
                                            {p.user?.name && <p className="text-xs text-gray-500">{p.user.name}</p>}
                                        </div>
                                        <button
                                            onClick={() => removeItem(p.id)}
                                            disabled={busyId === p.id}
                                            aria-label="Remove from playlist"
                                            className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Add posts</h2>
                            <button onClick={loadCatalog} className="text-sm font-medium text-indigo-600 hover:underline">Browse feed</button>
                        </div>
                        {catalog.length === 0 ? (
                            <p className="text-sm text-gray-500">Load the feed to pick posts to add.</p>
                        ) : (
                            <ul className="divide-y dark:divide-gray-700">
                                {addable.map((p) => (
                                    <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                                        <p className="min-w-0 truncate text-sm text-gray-900 dark:text-white">{p.title}</p>
                                        <button
                                            onClick={() => addItem(p.id)}
                                            disabled={busyId === p.id}
                                            className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                        >Add</button>
                                    </li>
                                ))}
                                {addable.length === 0 && <p className="text-sm text-gray-500">All loaded posts are already in this playlist.</p>}
                            </ul>
                        )}
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Playlists">
            <Head title="My Playlists" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                    <ListMusic className="h-6 w-6 text-indigo-500" /> My Playlists
                </h1>

                <form onSubmit={createPlaylist} className="flex gap-3">
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="New playlist name"
                        maxLength={120}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={creating || !newName.trim()}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        <Plus className="h-4 w-4" /> Create
                    </button>
                </form>

                {loading ? (
                    <div className="rounded-lg bg-white p-10 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading playlists...</p></div>
                ) : playlists.length === 0 ? (
                    <div className="rounded-lg bg-white p-10 text-center shadow dark:bg-gray-800">
                        <ListMusic className="mx-auto h-10 w-10 text-gray-400" />
                        <p className="mt-3 text-gray-500">No playlists yet — create one to save posts for later.</p>
                    </div>
                ) : (
                    <div className="divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                        {playlists.map((p) => (
                            <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <button onClick={() => openPlaylist(p)} className="min-w-0 flex-1 text-left">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                                    <p className="text-xs text-gray-500">{p.items_count ?? 0} post{(p.items_count ?? 0) === 1 ? '' : 's'}</p>
                                </button>
                                <button
                                    onClick={() => deletePlaylist(p.id)}
                                    disabled={busyId === p.id}
                                    aria-label="Delete playlist"
                                    className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:hover:bg-gray-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
