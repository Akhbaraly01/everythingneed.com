import type { ReactNode } from 'react';

/**
 * The shared "there's nothing here (and why)" panel. Honest empty states are a
 * house rule: no fake counts, no spinner-forever boxes.
 */
export default function EmptyState({
    icon,
    title,
    hint,
    children,
}: {
    icon?: ReactNode;
    title: string;
    hint?: string;
    children?: ReactNode;
}) {
    return (
        <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
            {icon && (
                <div className="mx-auto flex h-12 w-12 items-center justify-center text-gray-400">
                    {icon}
                </div>
            )}
            <p className="mt-3 text-gray-500">{title}</p>
            {hint && <p className="mt-1 text-sm text-gray-400">{hint}</p>}
            {children && <div className="mt-4">{children}</div>}
        </div>
    );
}
