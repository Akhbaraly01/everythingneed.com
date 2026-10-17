import { useEffect, useRef, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Button } from '@/components/shared/Button';
import { toast } from 'sonner';
import { MessageSquare, Plus, Search, X, UserSearch } from 'lucide-react';

interface ConversationSummary {
    id: string;
    customer?: { id: string; name: string; email: string } | null;
    worker?: { id: string; name: string; email: string } | null;
    last_message?: { message: string; sender_id: string; created_at: string } | null;
    unread_count: number;
    updated_at: string;
}

interface UserOption {
    id: string;
    name: string;
    email: string;
}

interface Props {
    conversations: ConversationSummary[];
}

export default function MessagesInbox({ conversations }: Props) {
    const [q, setQ] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [userQuery, setUserQuery] = useState('');
    const [results, setResults] = useState<UserOption[]>([]);
    const [searching, setSearching] = useState(false);
    const [starting, setStarting] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!showNew) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await api.get<{ data: UserOption[] }>(`/api/chat/users?q=${encodeURIComponent(userQuery)}`);
                setResults(res.data);
            } catch {
                setResults([]);
                if (userQuery.trim()) toast.error('Could not search for users');
            } finally {
                setSearching(false);
            }
        }, 250);
    }, [userQuery, showNew]);

    const startConversation = async (recipientId: string) => {
        setStarting(recipientId);
        try {
            const res = await api.post<{ data: { id: string } }>('/api/chat/conversations', { recipient_id: recipientId });
            router.visit(`/messages/${res.data.id}`);
        } catch (err) {
            toast.error(errorMessage(err, 'Could not start conversation'));
            setStarting(null);
        }
    };

    const filtered = conversations.filter((c) => {
        if (!q.trim()) return true;
        const other = c.customer && c.worker
            ? [c.customer.name, c.worker.name]
            : [];
        return other.some((n) => n.toLowerCase().includes(q.toLowerCase()))
            || (c.last_message?.message ?? '').toLowerCase().includes(q.toLowerCase());
    });

    const otherParty = (c: ConversationSummary): string => {
        // The "other" participant relative to viewer isn't flagged server-side for
        // this listing; display both when ambiguous, prefer worker label.
        return c.worker?.name ?? c.customer?.name ?? 'Conversation';
    };

    return (
        <AppLayout title="Messages">
            <Head title="Messages" />
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100"><MessageSquare className="h-6 w-6 text-emerald-600" /></span>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
                            <p className="text-sm text-gray-500">{conversations.length} conversation{conversations.length === 1 ? '' : 's'}</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { setShowNew(true); setUserQuery(''); setResults([]); }}
                        className="flex items-center gap-1.5"
                    >
                        <Plus className="h-4 w-4" /> New conversation
                    </Button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search conversations…"
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                </div>

                {/* List */}
                {filtered.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600">
                        <MessageSquare className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">{conversations.length === 0 ? 'No conversations yet' : 'No matches'}</p>
                        <p className="text-sm text-gray-500">Start one with “New conversation”.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((c) => (
                            <Link
                                key={c.id}
                                href={`/messages/${c.id}`}
                                className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:border-emerald-300 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900 dark:text-white">{otherParty(c)}</p>
                                        {(c.unread_count > 0) && (
                                            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-white">{c.unread_count}</span>
                                        )}
                                    </div>
                                    <p className="truncate text-sm text-gray-500">{c.last_message?.message ?? 'No messages yet'}</p>
                                    {c.last_message && (
                                        <p className="text-[11px] text-gray-400">{formatDateTime(c.last_message.created_at)}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* New conversation modal */}
                {showNew && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setShowNew(false)} />
                        <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white"><UserSearch className="h-5 w-5" /> Start a conversation</h2>
                                <Button onClick={() => setShowNew(false)} variant="icon" iconOnly size="sm" aria-label="Close"><X className="h-5 w-5 text-gray-400" /></Button>
                            </div>
                            <input
                                autoFocus
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                placeholder="Search people by name or email…"
                                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
                                {searching ? (
                                    <p className="py-4 text-center text-sm text-gray-400">Searching…</p>
                                ) : results.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-gray-400">No users found — try another search.</p>
                                ) : results.map((u) => (
                                    <Button
                                        key={u.id}
                                        disabled={starting === u.id}
                                        onClick={() => startConversation(u.id)}
                                        variant="ghost"
                                        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                                    >
                                        <span>
                                            <span className="block text-sm font-medium text-gray-900 dark:text-white">{u.name}</span>
                                            <span className="block text-xs text-gray-400">{u.email}</span>
                                        </span>
                                        <Plus className="h-4 w-4 text-emerald-600" />
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
