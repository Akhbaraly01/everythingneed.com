import { type ReactNode } from 'react';

interface Props {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/** Accessible confirmation dialog — replaces native window.confirm(). */
export default function ConfirmDialog({
    open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
    danger = false, busy = false, onConfirm, onCancel,
}: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
            <div className="relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800" role="dialog" aria-modal="true">
                <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
                {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onCancel} disabled={busy} className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400">
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={busy}
                        className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {busy ? 'Working…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function EmptyState({ icon, title, description, action }: {
    icon?: ReactNode; title: string; description?: string; action?: ReactNode;
}) {
    return (
        <div className="rounded-xl border border-dashed border-gray-300 p-14 text-center dark:border-gray-600">
            {icon && <div className="mx-auto mb-3 w-fit text-gray-300">{icon}</div>}
            <p className="font-medium text-gray-900 dark:text-white">{title}</p>
            {description && <p className="text-sm text-gray-500">{description}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

const badgeTones: Record<string, string> = {
    green: 'bg-green-100 text-green-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    gray: 'bg-gray-100 text-gray-600',
};

export function StatusBadge({ status, tone = 'gray' }: { status: string; tone?: keyof typeof badgeTones }) {
    return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeTones[tone]}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
}
