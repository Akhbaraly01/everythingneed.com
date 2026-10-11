import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
    key: string;
    header: string;
    render?: (row: T) => ReactNode;
    accessor?: keyof T;
    /** Client-side sort of the loaded rows by this column. */
    sortable?: boolean;
}

interface Props<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    emptyAction?: ReactNode;
    onRowClick?: (row: T) => void;
    /** Extra row classes (e.g. unread highlight). Applied to table + card rows. */
    rowClassName?: (row: T) => string;
    /**
     * Below this breakpoint the table renders as stacked cards (label:
     * value per column) instead of horizontal scroll. Default 'md'.
     * Pass null to keep the classic table at every width.
     */
    cardBelow?: 'sm' | 'md' | 'lg' | null;
}

function cellText<T>(row: T, col: Column<T>): string {
    if (col.accessor) {
        const v = row[col.accessor];
        return v === null || v === undefined ? '' : String(v);
    }
    return '';
}

/**
 * Shared admin resource table (W3): sortable headers, empty/loading
 * states and a responsive card layout below the breakpoint so admin
 * tables stay usable on tablets and phones without horizontal scroll.
 */
export default function DataTable<T>({ columns, data, loading, emptyTitle = 'No data', emptyDescription, emptyAction, onRowClick, rowClassName, cardBelow = 'md' }: Props<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const sorted = useMemo(() => {
        if (!sortKey) return data;
        const col = columns.find((c) => c.key === sortKey);
        if (!col) return data;
        const copy = [...data];
        copy.sort((a, b) => {
            const av = cellText(a, col).toLowerCase();
            const bv = cellText(b, col).toLowerCase();
            const numA = Number(av);
            const numB = Number(bv);
            let cmp: number;
            if (av !== '' && bv !== '' && !Number.isNaN(numA) && !Number.isNaN(numB)) {
                cmp = numA - numB;
            } else {
                cmp = av.localeCompare(bv);
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return copy;
    }, [data, sortKey, sortDir, columns]);

    const toggleSort = (key: string) => {
        if (sortKey !== key) {
            setSortKey(key);
            setSortDir('asc');
        } else {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        }
    };

    if (loading) {
        return (
            <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                <p className="mt-3 text-sm text-gray-500">Loading...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                <p className="font-medium text-gray-900 dark:text-white">{emptyTitle}</p>
                {emptyDescription && <p className="text-sm text-gray-500">{emptyDescription}</p>}
                {emptyAction && <div className="mt-4">{emptyAction}</div>}
            </div>
        );
    }

    const cardHidden = cardBelow === null ? '' : cardBelow === 'sm' ? 'hidden sm:block' : cardBelow === 'lg' ? 'hidden lg:block' : 'hidden md:block';
    const tableHidden = cardBelow === null ? '' : cardBelow === 'sm' ? 'sm:hidden' : cardBelow === 'lg' ? 'lg:hidden' : 'md:hidden';

    const headerCell = (col: Column<T>) => {
        if (!col.sortable) {
            return <span>{col.header}</span>;
        }
        const active = sortKey === col.key;
        return (
            <button
                onClick={() => toggleSort(col.key)}
                title={`Sort by ${col.header}`}
                className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white"
            >
                {col.header}
                {active ? (sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />}
            </button>
        );
    };

    return (
        <>
            <div className={`${cardHidden} overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800`}>
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                        <tr>
                            {columns.map((col) => (
                                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">{headerCell(col)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {sorted.map((row, idx) => (
                            <tr key={typeof (row as { id?: unknown }).id === 'string' ? ((row as { id?: unknown }).id as string) : idx} onClick={() => onRowClick?.(row)} className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''} ${rowClassName?.(row) ?? ''}`}>
                                {columns.map((col) => (
                                    <td key={col.key} className="px-4 py-3">
                                        {col.render ? col.render(row) : col.accessor ? String(row[col.accessor] ?? '') : ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {cardBelow !== null && (
                <div className={`${tableHidden} space-y-3`}>
                    {sorted.map((row, idx) => (
                        <div
                            key={typeof (row as { id?: unknown }).id === 'string' ? ((row as { id?: unknown }).id as string) : `card-${idx}`}
                            onClick={() => onRowClick?.(row)}
                            className={`rounded-lg bg-white p-4 shadow dark:bg-gray-800 ${rowClassName?.(row) ?? ''}`}
                        >
                            <dl className="space-y-2">
                                {columns.map((col) => (
                                    <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
                                        <dt className="shrink-0 font-medium text-gray-500 dark:text-gray-400">{col.header}</dt>
                                        <dd className="text-right text-gray-900 dark:text-white">
                                            {col.render ? col.render(row) : col.accessor ? String(row[col.accessor] ?? '') : ''}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
