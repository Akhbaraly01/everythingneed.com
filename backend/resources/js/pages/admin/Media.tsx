import AdminLayout from '@/layouts/AdminLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import ConfirmDialog from '@/components/shared/Ui';
import Image from '@/components/shared/Image';
import MediaPicker from '@/components/shared/MediaPicker';
import { libraryUrl, isImageItem, type LibraryItem, type LibraryPage } from '@/lib/media';
import { prepareForUpload } from '@/lib/media-compress';
import { FileText, Images, Link2, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const FOLDERS = ['library', 'banners', 'cms', 'products'];

export default function AdminMedia() {
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [showUpload, setShowUpload] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [folder, setFolder] = useState('library');
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);

    const [showPicker, setShowPicker] = useState(false);
    const [deleteFor, setDeleteFor] = useState<LibraryItem | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page) });
        if (query) params.set('search', query);
        api.get<{ data: LibraryPage }>(`/api/admin/media?${params}`)
            .then((res) => {
                setItems(res.data.data);
                setLastPage(res.data.last_page);
                setTotal(res.data.total);
            })
            .catch((e) => {
                setItems([]);
                toast.error(errorMessage(e, 'Failed to load media'));
            })
            .finally(() => setLoading(false));
    }, [page, query]);

    const load = () => {
        setPage(1);
        setQuery(search.trim());
    };

    const upload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const prepared = await prepareForUpload(file);
            const fd = new FormData();
            fd.append('file', prepared.file);
            fd.append('folder', folder);
            if (title.trim()) fd.append('title', title.trim());
            await api.post('/api/admin/media', fd);
            toast.success('Uploaded to the library.');
            setFile(null);
            setTitle('');
            setShowUpload(false);
            setQuery(search.trim());
            setPage(1);
        } catch (e) {
            toast.error(errorMessage(e, 'Upload failed'));
        } finally {
            setUploading(false);
        }
    };

    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('URL copied.');
        } catch {
            toast.info(text);
        }
    };

    const copyUrl = async (item: LibraryItem) => {
        await copyText(libraryUrl(item));
    };

    const remove = async (item: LibraryItem) => {
        setDeleting(true);
        try {
            await api.del(`/api/admin/media/${item.id}`);
            setItems(items.filter((x) => x.id !== item.id));
            toast.success('Media deleted.');
        } catch (e) {
            toast.error(errorMessage(e, 'Delete failed'));
        } finally {
            setDeleting(false);
            setDeleteFor(null);
        }
    };

    return (
        <AdminLayout title="Media Library">
            <Head title="Media Library" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                        <Images className="h-6 w-6" /> Media Library
                    </h1>
                    <div className="flex gap-2">
                        <button onClick={() => setShowPicker(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">
                            <Link2 className="h-4 w-4" /> Pick URL
                        </button>
                        <button onClick={() => setShowUpload(!showUpload)}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                            {showUpload ? <Upload className="h-4 w-4" /> : <Plus className="h-4 w-4" />} Upload
                        </button>
                    </div>
                </div>

                {showUpload && (
                    <div className="space-y-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Upload to the shared library</h2>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <label className="text-sm">
                                <span className="mb-1 block text-gray-600 dark:text-gray-400">File * (max 10 MB)</span>
                                <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </label>
                            <label className="text-sm">
                                <span className="mb-1 block text-gray-600 dark:text-gray-400">Folder</span>
                                <select value={folder} onChange={(e) => setFolder(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    {FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </label>
                            <label className="text-sm">
                                <span className="mb-1 block text-gray-600 dark:text-gray-400">Title (optional)</span>
                                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={250} placeholder="Defaults to the filename"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            </label>
                        </div>
                        <button onClick={upload} disabled={!file || uploading}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                            {uploading ? 'Uploading…' : 'Upload'}
                        </button>
                    </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or filename..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <button type="submit" className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-600">Search</button>
                </form>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading…</p></div>
                ) : items.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Images className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No media found</h3>
                        <p className="mt-1 text-sm text-gray-500">Upload the first file to the shared library.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {items.map((item) => (
                            <div key={item.id} className="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
                                {isImageItem(item) ? (
                                    <Image src={libraryUrl(item)} alt={item.title} className="aspect-video w-full object-cover" />
                                ) : (
                                    <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 bg-gray-50 dark:bg-gray-700">
                                        <FileText className="h-8 w-8 text-gray-400" />
                                        <span className="w-full truncate px-2 text-center text-xs text-gray-500">{item.file_name}</span>
                                    </div>
                                )}
                                <div className="space-y-1 p-3">
                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white" title={item.title}>{item.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {item.width && item.height ? `${item.width}×${item.height} · ` : ''}{(item.size / 1024).toFixed(1)} KB
                                    </p>
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                            {item.path.split('/')[1] ?? 'files'}
                                        </span>
                                        <div className="flex gap-1">
                                            <button onClick={() => copyUrl(item)} title="Copy URL"
                                                className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700"><Link2 className="h-4 w-4" /></button>
                                            <button onClick={() => setDeleteFor(item)} title="Delete"
                                                className="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {lastPage > 1 && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {page} of {lastPage} · {total} files</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={page >= lastPage} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>

            <MediaPicker open={showPicker} title="Pick a library URL" onSelect={(url) => { setShowPicker(false); void copyText(url); }} onClose={() => setShowPicker(false)} />

            <ConfirmDialog
                open={deleteFor !== null}
                title="Delete media?"
                description={deleteFor ? `Delete "${deleteFor.title}" from the library and disk?` : undefined}
                confirmLabel="Delete"
                danger
                busy={deleting}
                onConfirm={() => deleteFor && remove(deleteFor)}
                onCancel={() => setDeleteFor(null)}
            />
        </AdminLayout>
    );
}
