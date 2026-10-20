import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { filterCatalog, groupCatalog } from '@/lib/rbac';

interface Props {
    catalog: string[];
    selected: ReadonlySet<string>;
    /** Permissions currently in the denied (revoked) state. */
    denied?: ReadonlySet<string>;
    onToggle: (permission: string) => void;
    disabled?: boolean;
    className?: string;
}

/**
 * Grouped, searchable permission checklist shared by the Manage sheet and
 * the Create-role sheet. Denied permissions render struck-through until
 * re-checked (which restores them on save).
 */
export function PermissionPicker({
    catalog,
    selected,
    denied,
    onToggle,
    disabled = false,
    className = '',
}: Props) {
    const [query, setQuery] = useState('');
    const groups = useMemo(() => groupCatalog(filterCatalog(catalog, query)), [catalog, query]);

    return (
        <div className={className}>
            <div className="relative">
                <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                />
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search permissions..."
                    className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
            </div>

            <div className="mt-3 max-h-80 space-y-3 overflow-y-auto overscroll-contain pr-1 sm:max-h-96">
                {groups.map((group) => {
                    const selectedInGroup = group.permissions.filter((permission) =>
                        selected.has(permission),
                    ).length;

                    return (
                        <section key={group.module} className="rounded-xl border border-border/60">
                            <header className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {group.module}
                                </span>
                                <span className="text-[11px] tabular-nums text-muted-foreground">
                                    {selectedInGroup}/{group.permissions.length}
                                </span>
                            </header>
                            <div className="grid gap-0.5 p-1.5 sm:grid-cols-2">
                                {group.permissions.map((permission) => {
                                    const isSelected = selected.has(permission);
                                    const isDenied = denied?.has(permission) ?? false;

                                    return (
                                        <label
                                            key={permission}
                                            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-muted"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={disabled}
                                                onChange={() => onToggle(permission)}
                                                className="h-4 w-4 shrink-0 rounded border-border accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                            />
                                            <span
                                                className={`min-w-0 truncate ${
                                                    isDenied && !isSelected
                                                        ? 'text-muted-foreground line-through'
                                                        : 'text-foreground'
                                                }`}
                                            >
                                                {permission}
                                            </span>
                                            {isDenied && !isSelected ? (
                                                <span className="ml-auto shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                    revoked
                                                </span>
                                            ) : null}
                                        </label>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

                {groups.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        No permissions match “{query}”.
                    </p>
                ) : null}
            </div>
        </div>
    );
}

export default PermissionPicker;
