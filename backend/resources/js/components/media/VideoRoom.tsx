import { useEffect, useRef, useState } from 'react';

/**
 * In-app video room for consultations and live sessions.
 *
 * Jitsi (the default provider) is embedded through the official
 * `external_api.js` External API; every other provider renders its
 * join URL in a microphone/camera-capable iframe. The visitor never
 * leaves the app and no link is shared out-of-band — both parties
 * join the same room from their own appointment page.
 */

interface JitsiApi {
    dispose(): void;
}

declare global {
    interface Window {
        JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiApi;
    }
}

function loadJitsi(domain: string): Promise<NonNullable<Window['JitsiMeetExternalAPI']>> {
    if (window.JitsiMeetExternalAPI) return Promise.resolve(window.JitsiMeetExternalAPI);
    return new Promise((resolve, reject) => {
        const src = `https://${domain}/external_api.js`;
        if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onerror = () => reject(new Error('Video room SDK failed to load'));
            document.head.appendChild(script);
        }
        let tries = 0;
        const timer = window.setInterval(() => {
            if (window.JitsiMeetExternalAPI) {
                window.clearInterval(timer);
                resolve(window.JitsiMeetExternalAPI);
            } else if (++tries > 60) {
                window.clearInterval(timer);
                reject(new Error('Video room SDK timed out'));
            }
        }, 250);
    });
}

interface Props {
    provider: string;
    room: string;
    joinUrl: string;
    /** Jitsi display name; empty lets the room ask for one. */
    displayName?: string;
    className?: string;
}

export default function VideoRoom({ provider, room, joinUrl, displayName = '', className = '' }: Props) {
    const mountRef = useRef<HTMLDivElement>(null);
    const [sdkFailed, setSdkFailed] = useState(false);

    useEffect(() => {
        if (provider !== 'jitsi' || sdkFailed) return;

        // Self-hosted Jitsi serves external_api.js from its own domain;
        // derive it from the room URL so VIDEO_BASE_URL swaps need no code.
        const domain = (() => {
            try {
                return new URL(joinUrl).hostname || 'meet.jit.si';
            } catch {
                return 'meet.jit.si';
            }
        })();

        let cancelled = false;
        let api: JitsiApi | null = null;

        loadJitsi(domain)
            .then((JitsiMeetExternalAPI) => {
                if (cancelled || !mountRef.current) return;
                api = new JitsiMeetExternalAPI(domain, {
                    roomName: room,
                    parentNode: mountRef.current,
                    userInfo: displayName ? { displayName } : undefined,
                });
            })
            .catch(() => {
                if (!cancelled) setSdkFailed(true);
            });

        return () => {
            cancelled = true;
            api?.dispose();
        };
    }, [provider, room, joinUrl, displayName, sdkFailed]);

    if (provider !== 'jitsi' || sdkFailed) {
        return (
            <iframe
                src={joinUrl}
                data-testid="video-room"
                className={`aspect-video w-full rounded-xl border-0 bg-black ${className}`}
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                allowFullScreen
                title="Video consultation room"
            />
        );
    }

    return <div ref={mountRef} data-testid="video-room" className={`aspect-video w-full overflow-hidden rounded-xl bg-black ${className}`} />;
}
