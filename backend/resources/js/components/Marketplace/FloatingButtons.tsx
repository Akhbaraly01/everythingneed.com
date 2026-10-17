import { useEffect, useState } from 'react';
import { MessageCircle, X, Send, ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { useCartDrawer } from '@/components/cart/CartDrawerContext';

export function FloatingChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen]);

    const sendMessage = async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;
        setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
        setInput('');
        setLoading(true);
        try {
            const res = await api.post<{ data?: { content?: string } }>('/api/ai/chat', { message: trimmed });
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: res.data?.content ?? 'Sorry, I could not process your request.' },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Chat service is unavailable right now.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                aria-label="Open chat"
                className="btn-3d tap-safe fixed bottom-[calc(var(--dock-clearance)+8px)] right-4 z-cluster !h-12 !w-12 !min-h-12 !p-0"
            >
                {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
            </button>
            {isOpen && (
                <div
                    role="dialog"
                    aria-label="AI Assistant chat"
                    className="glass-3 glass-edge fixed bottom-[calc(var(--dock-clearance)+64px)] right-4 z-cluster w-[350px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl shadow-2xl md:w-[400px]"
                >
                    <div className="px-4 pb-3 pt-3 rounded-t-2xl" style={{ backgroundImage: 'var(--gradient-primary)' }}>
                        <h3 className="font-semibold text-sm text-white">AI Assistant</h3>
                        <p className="text-xs text-white/80">Ask about products, orders, bookings</p>
                    </div>
                    <div className="h-64 overflow-y-auto p-3 space-y-2">
                        {messages.length === 0 && (
                            <p className="text-xs text-muted-foreground">Hi! How can I help you today?</p>
                        )}
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`rounded-2xl px-3 py-2 text-xs max-w-[85%] ${
                                    m.role === 'user'
                                        ? 'ml-auto bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                }`}
                            >
                                {m.content}
                            </div>
                        ))}
                        {loading && (
                            <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                                Typing...
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2 border-t border-border/60 p-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') void sendMessage();
                            }}
                            placeholder="Type a message..."
                            aria-label="Type a message"
                            className="h-9 flex-1 rounded-full border border-input bg-background/80 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                            type="button"
                            onClick={() => void sendMessage()}
                            aria-label="Send message"
                            className="btn-3d tap-safe !h-9 !w-9 !min-h-9 !p-0"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export function FloatingCart({ count = 0 }: { count?: number }) {
    const { openCart } = useCartDrawer();
    return (
        <button
            type="button"
            onClick={openCart}
            aria-label="Open cart"
            className="icon-glass-3d tap-safe fixed bottom-[calc(var(--dock-clearance)+8px)] left-4 z-cluster !h-12 !w-12"
        >
            <span className="relative">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                    <span className="badge-pop absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive p-0 text-[10px] font-medium text-destructive-foreground">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </span>
        </button>
    );
}

export default function FloatingButtons({ cartCount = 0 }: { cartCount?: number }) {
    return (
        <>
            <FloatingChat />
            <FloatingCart count={cartCount} />
        </>
    );
}
