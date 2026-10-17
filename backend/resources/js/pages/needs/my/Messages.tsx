import AppLayout from '@/layouts/AppLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { ArrowLeft, Send } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { NeedRequestDetail } from '@/types';

interface ChatMessage {
    id: string;
    sender_id: string;
    message: string;
    created_at: string;
}

/**
 * Spec S14 /needs/my-needs/{id}/messages: per-need conversation between the
 * requester and the accepted (or first-offering) provider, backed by the
 * existing messaging module. No counterpart yet -> honest empty state.
 */
export default function MyNeedMessages({ need_id }: { need_id: string }) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [need, setNeed] = useState<NeedRequestDetail | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [counterpartName, setCounterpartName] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadMessages = useCallback(async (convId: string) => {
        const res = await api.get<{ data: ChatMessage[] }>(`/api/chat/${convId}/messages`);
        setMessages(res.data ?? []);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<{ data: NeedRequestDetail }>(`/api/need-requests/${need_id}`);
                const n = res.data;
                setNeed(n);

                const me = auth?.user?.id;
                const offers = n.offers ?? [];
                const accepted = offers.find((o) => o.status === 'accepted');
                const counterparty =
                    me === n.user_id
                        ? (accepted?.provider ?? offers[0]?.provider)
                        : offers.find((o) => o.provider_id === me)?.provider ??
                          { id: n.user_id, name: n.user?.name ?? 'Requester' };

                if (!counterparty?.id) {
                    setLoading(false);
                    return;
                }
                setCounterpartName(counterparty.name ?? 'Counterpart');

                const conv = await api.post<{ data: { id: string } }>('/api/chat/conversations', {
                    recipient_id: counterparty.id,
                    booking_id: need_id,
                });
                setConversationId(conv.data.id);
                await loadMessages(conv.data.id);
            } catch (e) {
                setError(errorMessage(e, 'Could not open messages'));
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [need_id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const send = async () => {
        if (!draft.trim() || !conversationId) return;
        setSending(true);
        setError(null);
        try {
            const res = await api.post<{ data: ChatMessage }>(`/api/chat/${conversationId}/messages`, {
                message: draft.trim(),
            });
            setMessages((m) => [...m, res.data]);
            setDraft('');
        } catch (e) {
            setError(errorMessage(e, 'Message failed to send'));
        }
        setSending(false);
    };

    const myId = auth?.user?.id;

    return (
        <AppLayout title="Messages">
            <Head title="Messages" />
            <div className="mx-auto flex max-w-3xl flex-col px-3 py-4" style={{ height: 'calc(100vh - 140px)' }}>
                <div className="mb-4 flex items-center gap-3">
                    <Link href={`/needs/my-needs/${need_id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                            Messages{counterpartName ? ` · ${counterpartName}` : ''}
                        </h1>
                        {need && <p className="truncate text-xs text-gray-500">{need.title}</p>}
                    </div>
                </div>

                {error && (
                    <p role="alert" className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</p>
                )}

                <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    {loading && <p className="text-sm text-gray-500">Loading conversation...</p>}
                    {!loading && !conversationId && (
                        <div className="py-10 text-center">
                            <p className="font-medium text-gray-800 dark:text-gray-200">No conversation yet</p>
                            <p className="mt-1 text-sm text-gray-500">
                                Once a provider offers on this need, your conversation opens here.
                            </p>
                        </div>
                    )}
                    {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.sender_id === myId ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                                    m.sender_id === myId
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                                }`}
                            >
                                <p className="whitespace-pre-line break-words">{m.message}</p>
                                <time className={`mt-1 block text-[10px] ${m.sender_id === myId ? 'text-indigo-200' : 'text-gray-400'}`} dateTime={m.created_at}>
                                    {new Date(m.created_at).toLocaleString()}
                                </time>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                <div className="mt-3 flex gap-2">
                    <label htmlFor="need-message" className="sr-only">Message</label>
                    <input
                        id="need-message"
                        type="text"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') send();
                        }}
                        placeholder={conversationId ? `Message ${counterpartName || 'provider'}...` : 'No conversation yet'}
                        disabled={!conversationId || sending}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <Button
                        type="button"
                        onClick={send}
                        loading={sending}
                        disabled={!conversationId || !draft.trim()}
                        iconLeft={<Send className="h-4 w-4" />}
                    >
                        Send
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
