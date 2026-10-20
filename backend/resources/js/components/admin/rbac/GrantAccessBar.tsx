import { useState } from 'react';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { roleLabel, type RbacMatrixRow } from '@/lib/rbac';
import { Plus } from 'lucide-react';

interface Props {
    rows: RbacMatrixRow[];
    catalog: string[];
    busy: boolean;
    /** Resolves true when the grant was applied server-side. */
    onGrant: (role: string, permission: string) => Promise<boolean>;
}

const SELECT_CLASS =
    'min-w-0 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

/** Quick single-pair grant box kept from the original console flow. */
export function GrantAccessBar({ rows, catalog, busy, onGrant }: Props) {
    const [role, setRole] = useState('');
    const [permission, setPermission] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const submit = async () => {
        if (!role || !permission || submitting) return;
        setSubmitting(true);
        const ok = await onGrant(role, permission);
        if (ok) setPermission('');
        setSubmitting(false);
    };

    return (
        <Card className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Grant access
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    aria-label="Role"
                    className={`${SELECT_CLASS} sm:w-56`}
                >
                    <option value="">Select role...</option>
                    {rows.map((row) => (
                        <option key={row.role} value={row.role}>
                            {roleLabel(row)}
                        </option>
                    ))}
                </select>
                <select
                    value={permission}
                    onChange={(event) => setPermission(event.target.value)}
                    aria-label="Permission"
                    className={`${SELECT_CLASS} sm:flex-1`}
                >
                    <option value="">Select permission...</option>
                    {catalog.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
                <Button
                    iconLeft={<Plus className="h-4 w-4" />}
                    disabled={!role || !permission || busy}
                    loading={submitting}
                    onClick={() => void submit()}
                >
                    Grant
                </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
                Grants apply immediately. Revoking flips the row to denied (never deleted), so it can be
                restored any time.
            </p>
        </Card>
    );
}

export default GrantAccessBar;
