import { ReactNode } from 'react';

interface Props {
    children: ReactNode;
    onClear?: () => void;
    hasActive?: boolean;
}

export default function Filters({ children, onClear, hasActive }: Props) {
    return (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="flex flex-1 flex-wrap gap-3">{children}</div>
            {hasActive && onClear && (
                <button onClick={onClear} className="text-sm text-blue-600 hover:underline dark:text-blue-400">Clear filters</button>
            )}
        </div>
    );
}

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700">
                <option value="">All</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </label>
    );
}
