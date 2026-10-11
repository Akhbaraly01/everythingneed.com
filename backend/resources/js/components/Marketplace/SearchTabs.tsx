import { useEffect, useState } from 'react';
import {
    Search,
    X,
    ArrowUpDown,
    ShoppingCart,
    Users,
    Stethoscope,
    GraduationCap,
    Briefcase,
} from 'lucide-react';

export type ContentTab = 'all' | 'products' | 'needs' | 'healthcare' | 'learning' | 'services';
export type SortOption = 'default' | 'price_low' | 'price_high' | 'rating' | 'name';

const tabs: { id: ContentTab; label: string; icon: 'cart' | 'users' | 'health' | 'learn' | 'service' | null }[] = [
    { id: 'all', label: 'All', icon: null },
    { id: 'products', label: 'Products', icon: 'cart' },
    { id: 'needs', label: 'Needs', icon: 'users' },
    { id: 'healthcare', label: 'Healthcare', icon: 'health' },
    { id: 'learning', label: 'Learning', icon: 'learn' },
    { id: 'services', label: 'Services', icon: 'service' },
];

function TabIcon({ icon }: { icon: NonNullable<(typeof tabs)[number]['icon']> }) {
    const cls = 'h-3 w-3';
    switch (icon) {
        case 'cart':
            return <ShoppingCart className={cls} />;
        case 'users':
            return <Users className={cls} />;
        case 'health':
            return <Stethoscope className={cls} />;
        case 'learn':
            return <GraduationCap className={cls} />;
        case 'service':
            return <Briefcase className={cls} />;
    }
}

interface SearchTabsProps {
    activeTab: ContentTab;
    onTabChange: (tab: ContentTab) => void;
    search: string;
    onSearchChange: (value: string) => void;
    sortBy: SortOption;
    onSortChange: (value: SortOption) => void;
}

export default function SearchTabs({
    activeTab,
    onTabChange,
    search,
    onSearchChange,
    sortBy,
    onSortChange,
}: SearchTabsProps) {
    const [sortOpen, setSortOpen] = useState(false);

    useEffect(() => {
        if (!sortOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSortOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [sortOpen]);
    const sortOptions: { value: SortOption; label: string }[] = [
        { value: 'default', label: 'Default' },
        { value: 'price_low', label: 'Price: Low' },
        { value: 'price_high', label: 'Price: High' },
        { value: 'rating', label: 'Rating' },
        { value: 'name', label: 'Name' },
    ];

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search products, needs, courses..."
                        className="h-10 w-full rounded-full bg-muted/50 border border-border pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearchChange('')}
                            aria-label="Clear search"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setSortOpen((v) => !v)}
                        className="flex h-10 w-[120px] items-center justify-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium"
                    >
                        <ArrowUpDown className="h-3.5 w-3.5 mr-1" />
                        {sortOptions.find((o) => o.value === sortBy)?.label ?? 'Sort'}
                    </button>
                    {sortOpen && (
                        <button
                            type="button"
                            aria-label="Close sort menu"
                            onClick={() => setSortOpen(false)}
                            className="fixed inset-0 z-10 cursor-default bg-transparent"
                        />
                    )}
                    {sortOpen && (
                        <div className="absolute right-0 z-20 mt-2 w-36 rounded-lg border border-border bg-card p-1 shadow-lg">
                            {sortOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onSortChange(opt.value);
                                        setSortOpen(false);
                                    }}
                                    className={`block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-muted ${
                                        sortBy === opt.value ? 'bg-muted font-semibold' : ''
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        className={`flex flex-shrink-0 items-center gap-1.5 rounded-full h-8 text-xs px-4 font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border bg-card text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {tab.icon && <TabIcon icon={tab.icon} />}
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
