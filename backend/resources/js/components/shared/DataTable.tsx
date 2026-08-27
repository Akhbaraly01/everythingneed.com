import { ReactNode } from 'react';

export interface Column<T> {
    key: string;
    header: string;
    render?: (row: T) => ReactNode;
    accessor?: keyof T;
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
}

export default function DataTable<T extends Record<string, any>>({ columns, data, loading, emptyTitle = 'No data', emptyDescription, emptyAction, onRowClick }: Props<T>) {
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

    return (
        <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
            <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">{col.header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                    {data.map((row, idx) => (
                        <tr key={(row.id as string) || idx} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}>
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
    );
}
