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
import { useLanguage } from '@/lib/use-language';

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
    /** Hide the search + sort row (Home: the fixed header owns search). */
    hideSearchBar?: boolean;
    search?: string;
    onSearchChange?: (value: string) => void;
    sortBy?: SortOption;
    onSortChange?: (value: SortOption) => void;
}

export default function SearchTabs({
    activeTab,
    onTabChange,
    hideSearchBar = false,
    search = '',
    onSearchChange,
    sortBy = 'default',
    onSortChange,
}: SearchTabsProps) {
    const [sortOpen, setSortOpen] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        if (!sortOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSortOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [sortOpen]);
    const sortOptions: { value: SortOption; label: string }[] = [
        { value: 'default', label: t('sort.default') },
        { value: 'price_low', label: t('sort.priceLow') },
        { value: 'price_high', label: t('sort.priceHigh') },
        { value: 'rating', label: t('sort.rating') },
        { value: 'name', label: t('sort.name') },
    ];

    return (
        <div className="space-y-3" data-testid="home-search-tabs">
            {!hideSearchBar && (
            <div className="flex gap-2">
                <div className="search-capsule flex-1">
                    <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder="Search products, needs, courses..."
                        aria-label="Search products, needs, courses"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => onSearchChange?.('')}
                            aria-label="Clear search"
                            className="tap-safe flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-foreground active:scale-90"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="relative shrink-0">
                    <button
                        type="button"
                        onClick={() => setSortOpen((v) => !v)}
                        className="glass-2 tap-safe flex h-10 w-[120px] items-center justify-center gap-1 rounded-full px-3 text-xs font-medium text-foreground transition-transform duration-fast active:scale-95"
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
                        <div className="glass-3 glass-edge absolute right-0 z-20 mt-2 w-36 rounded-xl p-1">
                            {sortOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onSortChange?.(opt.value);
                                        setSortOpen(false);
                                    }}
                                    className={`block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-muted ${
                                        sortBy === opt.value ? 'bg-muted font-semibold text-primary' : 'text-foreground'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            )}

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        className={`flex flex-shrink-0 items-center gap-1.5 rounded-full h-8 text-xs px-4 font-medium transition-all duration-fast active:scale-95 ${
                            activeTab === tab.id
                                ? 'btn-3d !min-h-8 !px-4 !text-xs'
                                : 'glass-1 text-muted-foreground hover:text-foreground'
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
