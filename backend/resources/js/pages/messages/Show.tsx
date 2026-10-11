import { useEffect, useRef, useState } from 'react';
import {Head, Link, usePage} from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import { ArrowLeft, SendHorizonal, Image as ImageIcon, Paperclip, Loader2 } from 'lucide-react';

interface ChatMessageView {
    id: string;
    sender_id: string;
    message: string;
    message_type?: string;
    created_at?: string;
}

interface Props {
    conversation: {
        id: string;
        customer?: { id: string; name: string; email: string } | null;
        worker?: { id: string; name: string; email: string } | null;
    };
    initialMessages: Array<ChatMessageView & { mine: boolean }>;
}

export default function MessageThread({ conversation, initialMessages }: Props) {
    const auth = usePage().props.auth as { user?: { id: string }; id?: string } | null;
    const myId = auth?.user?.id ?? auth?.id ?? '';
    const [messages, setMessages] = useState<Array<ChatMessageView & { mine: boolean }>>(initialMessages);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastIdRef = useRef<string | null>(initialMessages.at(-1)?.id ?? null);

    const otherName = conversation.worker?.name ?? conversation.customer?.name ?? 'Conversation';

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    // Lightweight poll for new messages (upgrade path: Laravel Echo over Reverb)
    useEffect(() => {
        const interval = setInterval(async () => {
            if (document.hidden || sending) return;
            try {
                const res = await api.get<{ data: ChatMessageView[] }>(`/api/chat/${conversation.id}/messages`);
                const latest = res.data.at(-1)?.id ?? null;
                if (latest && latest !== lastIdRef.current) {
                    lastIdRef.current = latest;
                    setMessages(res.data.map((m) => ({ ...m, mine: m.sender_id === myId })));
                }
            } catch {
                /* transient network errors are ignored between polls */
            }
        }, 5000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversation.id]);

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = draft.trim();
        if (!text) return;

        setSending(true);
        try {
            const res = await api.post<{ data: { id: string; message: string; message_type?: string; created_at?: string } }>(
                `/api/chat/${conversation.id}/messages`,
                { message: text },
            );
            lastIdRef.current = res.data.id;
            setMessages((prev) => [...prev, {
                id: res.data.id,
                sender_id: myId,
                message: res.data.message,
                message_type: res.data.message_type ?? 'text',
                created_at: res.data.created_at ?? new Date().toISOString(),
                mine: true,
            }]);
            setDraft('');
        } catch (err) {
            toast.error(errorMessage(err, 'Message failed to send'));
        } finally {
            setSending(false);
        }
    };

    return (
        <AppLayout title={otherName}>
            <Head title={`Chat — ${otherName}`} />
            <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col px-4 py-6">
                {/* Header */}
                <div className="mb-3 flex items-center gap-3">
                    <Link href="/messages" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:text-white">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="font-bold text-gray-900 dark:text-white">{otherName}</h1>
                        <p className="text-xs text-gray-400">Direct conversation</p>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    {messages.length === 0 ? (
                        <p className="py-16 text-center text-sm text-gray-400">No messages yet — say hello 👋</p>
                    ) : (
                        messages.map((m) => (
                            <div key={m.id} className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                                        m.mine
                                            ? 'rounded-br-sm bg-emerald-600 text-white'
                                            : 'rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                                    }`}
                                >
                                    {m.message_type === 'image' ? (
                                        <span className="flex items-center gap-1.5"><ImageIcon className="inline h-4 w-4" /> {m.message}</span>
                                    ) : m.message_type === 'file' ? (
                                        <span className="flex items-center gap-1.5"><Paperclip className="inline h-4 w-4" /> {m.message}</span>
                                    ) : (
                                        m.message
                                    )}
                                    <span className={`mt-1 block text-right text-[10px] ${m.mine ? 'text-emerald-200' : 'text-gray-400'}`}>
                                        {formatDateTime(m.created_at ?? new Date().toISOString())}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Composer */}
                <form onSubmit={send} className="mt-3 flex gap-2">
                    <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Type a message…"
                        maxLength={5000}
                        className="flex-1 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={!draft.trim() || sending}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                    </button>
                </form>
            </div>
        </AppLayout>
    );
}
