import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

/** Display-only granted permission pill. */
export function PermissionChip({
    permission,
    className,
}: {
    permission: string;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-medium text-violet-800 dark:bg-violet-950/40 dark:text-violet-200',
                className,
            )}
        >
            <span className="truncate">{permission}</span>
        </span>
    );
}

/** A revoked (denied) permission with one-click restore (W2 reversible). */
export function DeniedPermissionChip({
    permission,
    onRestore,
    disabled = false,
}: {
    permission: string;
    onRestore: () => void;
    disabled?: boolean;
}) {
    return (
        <span
            title="Revoked — click to restore"
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted py-0.5 pl-2.5 pr-1 text-[11px] font-medium text-muted-foreground line-through"
        >
            <span className="truncate">{permission}</span>
            <button
                type="button"
                disabled={disabled}
                onClick={onRestore}
                title={`Restore ${permission}`}
                aria-label={`Restore ${permission}`}
                className="rounded-full p-0.5 hover:bg-border disabled:opacity-40"
            >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
            </button>
        </span>
    );
}

export default PermissionChip;
