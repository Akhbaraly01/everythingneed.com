import { Card } from '@/components/shared/Card';
import { KeyRound, Layers, ShieldCheck, Users } from 'lucide-react';
import { matrixStats, type RbacMatrixRow } from '@/lib/rbac';

interface Props {
    rows: RbacMatrixRow[];
    catalogSize: number;
}

/** Headline counters above the role grid (adopts the console token palette). */
export function RbacStats({ rows, catalogSize }: Props) {
    const stats = matrixStats(rows, catalogSize);

    const items = [
        { label: 'Total roles', value: stats.totalRoles, icon: Layers },
        { label: 'Permissions', value: stats.totalPermissions, icon: KeyRound },
        { label: 'Core roles', value: stats.coreRoles, icon: ShieldCheck },
        { label: 'Role assignments', value: stats.assignments, icon: Users },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {items.map(({ label, value, icon: Icon }) => (
                <Card key={label} className="flex items-center gap-3 p-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                        <span className="block text-xs text-muted-foreground">{label}</span>
                        <span className="block text-xl font-bold text-foreground">{value}</span>
                    </span>
                </Card>
            ))}
        </div>
    );
}

export default RbacStats;
