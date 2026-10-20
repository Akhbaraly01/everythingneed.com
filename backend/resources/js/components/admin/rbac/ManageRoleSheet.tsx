import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/shared/Button';
import { Sheet } from '@/components/shared/Sheet';
import { diffRoleSelection, roleBadge, roleLabel, type RbacMatrixRow } from '@/lib/rbac';
import { RotateCcw, Save } from 'lucide-react';
import { PermissionPicker } from './PermissionPicker';

interface Props {
    open: boolean;
    onClose: () => void;
    row: RbacMatrixRow | null;
    denied: string[];
    catalog: string[];
    saving: boolean;
    resetting: boolean;
    /** Resolves true when the bulk save was applied server-side. */
    onSave: (role: string, grant: string[], revoke: string[]) => Promise<boolean>;
    onReset: (role: string) => void;
}

/**
 * Slide-over permission editor for one role. All edits stay local until
 * Save, which posts a single bulk grant/revoke diff.
 */
export function ManageRoleSheet({
    open,
    onClose,
    row,
    denied,
    catalog,
    saving,
    resetting,
    onSave,
    onReset,
}: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set());

    // Re-seed on open and whenever the underlying row changes (e.g. after
    // a reset reload), keeping the sheet in lockstep with the server.
    useEffect(() => {
        if (open && row) {
            setSelected(new Set(row.permissions));
        }
    }, [open, row]);

    const deniedSet = useMemo(() => new Set(denied), [denied]);
    const diff = useMemo(
        () => (row ? diffRoleSelection(selected, row.permissions) : { grant: [], revoke: [] }),
        [selected, row],
    );
    const dirty = diff.grant.length > 0 || diff.revoke.length > 0;

    const toggle = (permission: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(permission)) next.delete(permission);
            else next.add(permission);
            return next;
        });
    };

    if (!row) return null;

    const badge = roleBadge(row);
    const userCount = row.user_count ?? 0;

    const save = async () => {
        const ok = await onSave(row.role, diff.grant, diff.revoke);
        if (ok) onClose();
    };

    return (
        <Sheet
            open={open}
            onClose={onClose}
            variant="right"
            title={`Manage ${roleLabel(row)}`}
            description={`${userCount} user${userCount === 1 ? '' : 's'} · ${row.permissions.length} granted${
                denied.length > 0 ? ` · ${denied.length} revoked` : ''
            }`}
        >
            <div className="flex items-center gap-2">
                <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.className}`}
                >
                    {badge.label}
                </span>
                <span className="truncate text-xs text-muted-foreground">{row.role}</span>
            </div>

            <PermissionPicker
                className="mt-4"
                catalog={catalog}
                selected={selected}
                denied={deniedSet}
                onToggle={toggle}
                disabled={saving}
            />

            <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row sm:items-center">
                <p className="text-xs text-muted-foreground sm:mr-auto">
                    {dirty
                        ? `${diff.grant.length} to grant · ${diff.revoke.length} to revoke`
                        : 'No unsaved changes'}
                </p>
                {row.is_custom !== true ? (
                    <Button
                        variant="outline"
                        size="sm"
                        iconLeft={<RotateCcw className="h-3.5 w-3.5" />}
                        disabled={saving || resetting}
                        loading={resetting}
                        onClick={() => onReset(row.role)}
                    >
                        Reset defaults
                    </Button>
                ) : null}
                <Button
                    size="sm"
                    iconLeft={<Save className="h-3.5 w-3.5" />}
                    disabled={!dirty || saving}
                    loading={saving}
                    onClick={() => void save()}
                >
                    Save changes
                </Button>
            </div>
        </Sheet>
    );
}

export default ManageRoleSheet;
