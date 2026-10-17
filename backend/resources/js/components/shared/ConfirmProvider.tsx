import { useCallback, useState, type ReactNode } from 'react';
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from '@/lib/confirm';

/**
 * Promise-based confirmation dialog (FrontendPolicy: no native confirm()/
 * prompt()). Callers `await` the result exactly like the old sync API:
 *
 *   const ask = useConfirm();
 *   if (!(await ask({ title: 'Delete offer?', danger: true }))) return;
 */

type Pending = { options: ConfirmOptions; resolve: (value: boolean) => void };

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [pending, setPending] = useState<Pending | null>(null);

    const confirmAction = useCallback<ConfirmFn>(
        (options) => new Promise<boolean>((resolve) => setPending({ options, resolve })),
        [],
    );

    const close = (value: boolean) => {
        pending?.resolve(value);
        setPending(null);
    };

    return (
        <ConfirmContext.Provider value={confirmAction}>
            {children}
            {pending && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => close(false)} />
                    <div
                        className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-700 dark:bg-gray-800"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-dialog-title"
                    >
                        <h2 id="confirm-dialog-title" className="font-bold text-gray-900 dark:text-white">
                            {pending.options.title}
                        </h2>
                        {pending.options.description && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {pending.options.description}
                            </p>
                        )}
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => close(false)}
                                className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400"
                            >
                                {pending.options.cancelLabel ?? 'Cancel'}
                            </button>
                            <button
                                autoFocus
                                onClick={() => close(true)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                                    pending.options.danger
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                }`}
                            >
                                {pending.options.confirmLabel ?? 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}
