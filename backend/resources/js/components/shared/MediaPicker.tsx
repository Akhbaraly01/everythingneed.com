import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { libraryUrl, isImageItem, type LibraryItem, type LibraryPage } from '@/lib/media';
import Image from '@/components/shared/Image';
import { FileText, Images, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface MediaPickerProps {
    open: boolean;
    title?: string;
    onSelect: (url: string) => void;
    onClose: () => void;
}

const FOLDERS = ['library', 'banners', 'cms', 'products'];

/**
 * Media picker modal (W1): browse the shared library (search + paging) or
 * upload straight into it. Selecting - by click or right after upload -
 * returns the public URL to the caller.
 */
export default function MediaPicker({ open, title = 'Choose image', onSelect, onClose }: MediaPickerProps) {
    const [tab, setTab] = useState<'browse' | 'upload'>('browse');
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [search, setSearch] = useState('');
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [folder, setFolder] = useState('library');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!open) return;
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
    }, [open, page, query]);

    useEffect(() => {
        if (open) {
            setTab('browse');
            setSearch('');
            setQuery('');
            setPage(1);
            setFile(null);
        }
    }, [open ]);

    if (!open) return null;

    const submitSearch = () => {
        setPage(1);
        setQuery(search.trim());
    };

    const upload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('folder', folder);
            const res = await api.post<{ data: { url: string } }>('/api/admin/media', fd);
            toast.success('Uploaded to the library.');
            onSelect(res.data.url);
        } catch (e) {
            toast.error(errorMessage(e, 'Upload failed'));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800" role="dialog" aria-modal="true">
                <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                    <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
                    <button onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex gap-2 border-b border-gray-200 p-3 dark:border-gray-700">
                    <button onClick={() => setTab('browse')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${tab === 'browse' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        <Images className="h-4 w-4" /> Browse
                    </button>
                    <button onClick={() => setTab('upload')}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${tab === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        <Upload className="h-4 w-4" /> Upload
                    </button>
                </div>

                {tab === 'browse' ? (
                    <div className="flex min-h-0 flex-1 flex-col p-4">
                        <form onSubmit={(e) => { e.preventDefault(); submitSearch(); }} className="flex gap-2">
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or filename..."
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                            <button type="submit" className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-600">Search</button>
                        </form>

                        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                            {loading ? (
                                <p className="py-10 text-center text-sm text-gray-500">Loading…</p>
                            ) : items.length === 0 ? (
                                <p className="py-10 text-center text-sm text-gray-500">No media yet — switch to Upload to add the first file.</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                                    {items.map((item) => (
                                        <button key={item.id} onClick={() => onSelect(libraryUrl(item))} title={item.title}
                                            className="group overflow-hidden rounded-lg border border-gray-200 text-left hover:border-blue-500 dark:border-gray-700">
                                            {isImageItem(item) ? (
                                                <Image src={libraryUrl(item)} alt={item.title} className="aspect-square w-full object-cover" />
                                            ) : (
                                                <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 bg-gray-50 p-2 dark:bg-gray-700">
                                                    <FileText className="h-8 w-8 text-gray-400" />
                                                    <span className="w-full truncate text-center text-xs text-gray-500">{item.file_name}</span>
                                                </div>
                                            )}
                                            <div className="truncate px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300">{item.title}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                            <span>{total} file{total === 1 ? '' : 's'} · page {page} of {Math.max(lastPage, 1)}</span>
                            <div className="flex gap-2">
                                <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                    className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                                <button disabled={page >= lastPage} onClick={() => setPage(page + 1)}
                                    className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 p-4">
                        <label className="block text-sm">
                            <span className="mb-1 block text-gray-600 dark:text-gray-400">File (jpg, png, gif, webp, svg, pdf — max 10 MB)</span>
                            <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block text-gray-600 dark:text-gray-400">Library folder</span>
                            <select value={folder} onChange={(e) => setFolder(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                {FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </label>
                        <div className="flex justify-end gap-2">
                            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400">Cancel</button>
                            <button onClick={upload} disabled={!file || uploading}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                                {uploading ? 'Uploading…' : 'Upload & select'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
