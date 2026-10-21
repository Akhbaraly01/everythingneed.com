import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { roleBadge, roleLabel, type RbacMatrixRow } from '@/lib/rbac';
import { Lock, Trash2, Users, Wand2 } from 'lucide-react';
import { DeniedPermissionChip, PermissionChip } from './PermissionChip';

interface Props {
    row: RbacMatrixRow;
    denied: string[];
    busy: boolean;
    onManage: () => void;
    onDelete: () => void;
    onRestore: (permission: string) => void;
}

const VISIBLE_GRANTED = 6;
const VISIBLE_DENIED = 3;

/** One role tile: identity, counts, permission preview and row actions. */
export function RoleCard({ row, denied, busy, onManage, onDelete, onRestore }: Props) {
    const badge = roleBadge(row);
    const label = roleLabel(row);
    const visibleGranted = row.permissions.slice(0, VISIBLE_GRANTED);
    const hiddenGranted = row.permissions.length - visibleGranted.length;
    const visibleDenied = denied.slice(0, VISIBLE_DENIED);
    const hiddenDenied = denied.length - visibleDenied.length;
    const deletable = row.is_custom === true;
    const userCount = row.user_count ?? 0;

    return (
        <Card className="flex h-full flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                    <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-sm font-bold uppercase text-secondary"
                    >
                        {label.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-foreground">{label}</h3>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3 shrink-0" aria-hidden="true" />
                            {userCount} user{userCount === 1 ? '' : 's'}
                            <span aria-hidden="true">·</span>
                            {row.permissions.length} permission
                            {row.permissions.length === 1 ? '' : 's'}
                        </p>
                    </div>
                </div>
                <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
                >
                    {badge.label}
                </span>
            </div>

            <div className="flex flex-1 flex-wrap content-start gap-1.5">
                {row.permissions.length === 0 && denied.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No explicit grants.</p>
                ) : (
                    <>
                        {visibleGranted.map((permission) => (
                            <PermissionChip key={permission} permission={permission} />
                        ))}
                        {hiddenGranted > 0 ? (
                            <button
                                type="button"
                                onClick={onManage}
                                className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                            >
                                +{hiddenGranted} more
                            </button>
                        ) : null}
                        {visibleDenied.map((permission) => (
                            <DeniedPermissionChip
                                key={`denied:${permission}`}
                                permission={permission}
                                disabled={busy}
                                onRestore={() => onRestore(permission)}
                            />
                        ))}
                        {hiddenDenied > 0 ? (
                            <button
                                type="button"
                                onClick={onManage}
                                className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground line-through transition-colors hover:bg-border hover:text-foreground"
                            >
                                +{hiddenDenied} revoked
                            </button>
                        ) : null}
                    </>
                )}
            </div>

            <div className="flex items-center gap-2 border-t border-border/60 pt-3">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    iconLeft={<Wand2 className="h-3.5 w-3.5" />}
                    onClick={onManage}
                >
                    Manage
                </Button>
                {deletable ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        iconLeft={<Trash2 className="h-3.5 w-3.5" />}
                        className="text-muted-foreground hover:text-destructive"
                        disabled={busy}
                        title={`Delete ${label}`}
                        onClick={onDelete}
                    >
                        Delete
                    </Button>
                ) : (
                    <span
                        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground"
                        title="Built-in roles cannot be deleted"
                    >
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        Protected
                    </span>
                )}
            </div>
        </Card>
    );
}

export default RoleCard;
