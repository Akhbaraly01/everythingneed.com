import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Bell, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISS_KEY = 'push-prompt-dismissed';

export default function PushNotificationPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    const auth = usePage().props.auth as { id?: string } | null;
    const { isSupported, permission, requestPermission } = usePushNotifications();

    useEffect(() => {
        // Only signed-in users get order/ticket alerts; show after 3 seconds.
        if (!auth?.id) {
            return;
        }

        const timer = setTimeout(() => {
            if (isSupported && permission === 'default' && !localStorage.getItem(DISMISS_KEY)) {
                setShowPrompt(true);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [auth?.id, isSupported, permission]);

    const handleEnable = async () => {
        await requestPermission();
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem(DISMISS_KEY, 'true');
        toast.info('You can enable notifications later from browser settings');
    };

    if (!showPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-48 left-4 right-4 z-40 animate-in slide-in-from-bottom-4 md:left-auto md:w-96">
            <div className="rounded-lg border border-primary/20 bg-card p-4 shadow-lg">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <h4 className="mb-1 text-sm font-semibold text-card-foreground">Enable Notifications</h4>
                        <p className="mb-3 text-sm text-muted-foreground">
                            Get instant alerts when your orders or tickets are updated
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleEnable}
                                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                            >
                                Enable
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                            >
                                Not Now
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        aria-label="Dismiss notification prompt"
                        className="rounded-md p-1 text-muted-foreground hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
