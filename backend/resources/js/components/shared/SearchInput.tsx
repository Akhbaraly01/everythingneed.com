import { Search, X } from 'lucide-react';

interface Props {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    onSearch?: () => void;
}

export default function SearchInput({ value, onChange, placeholder = 'Search...', onSearch }: Props) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
                placeholder={placeholder}
                className="w-full rounded-lg border py-2 pl-9 pr-9 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            {value && (
                <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
