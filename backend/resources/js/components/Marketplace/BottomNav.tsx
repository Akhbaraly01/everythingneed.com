import { Link, usePage } from '@inertiajs/react';
import {
    Home,
    FileText,
    GraduationCap,
    Heart,
    User,
    type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '@/lib/use-language';

interface DockTab {
    id: string;
    labelKey: 'nav.home' | 'nav.needs' | 'nav.learn' | 'nav.healthcare' | 'nav.account';
    fallbackLabel: string;
    url: string;
    Icon: LucideIcon;
    /** Signature 3D orb gradient (active state). */
    orb: string;
    /** Matching glow shadow (active state). */
    glow: string;
    /** Icon tint on the frost orb (inactive state). */
    tint: string;
}

// Fixed bottom bar (mobile): 5 tabs only — Home, Needs, Learn, Health,
// Account. Always visible while scrolling; hidden on md+ (desktop uses the
// fixed header nav). Each tab owns a signature candy orb color; the active
// orb pops with gloss + glow. Extra destinations live on Account.
const TABS: DockTab[] = [
    { id: 'home', labelKey: 'nav.home', fallbackLabel: 'Home', url: '/', Icon: Home,
      orb: 'from-sky-400 via-blue-500 to-indigo-600', glow: 'shadow-blue-500/50', tint: 'text-sky-300' },
    { id: 'needs', labelKey: 'nav.needs', fallbackLabel: 'Needs', url: '/needs', Icon: FileText,
      orb: 'from-violet-400 via-purple-500 to-fuchsia-600', glow: 'shadow-purple-500/50', tint: 'text-violet-300' },
    { id: 'learn', labelKey: 'nav.learn', fallbackLabel: 'Learn', url: '/learn', Icon: GraduationCap,
      orb: 'from-amber-400 via-orange-500 to-red-500', glow: 'shadow-orange-500/50', tint: 'text-amber-300' },
    { id: 'healthcare', labelKey: 'nav.healthcare', fallbackLabel: 'Health', url: '/healthcare', Icon: Heart,
      orb: 'from-rose-400 via-pink-500 to-rose-600', glow: 'shadow-rose-500/50', tint: 'text-rose-300' },
    { id: 'account', labelKey: 'nav.account', fallbackLabel: 'Account', url: '/account', Icon: User,
      orb: 'from-cyan-400 via-teal-500 to-emerald-600', glow: 'shadow-teal-500/50', tint: 'text-teal-300' },
];

export default function BottomNav() {
    const { url } = usePage();
    const { t } = useLanguage();
    const currentPath = url.split('?')[0];

    const isActive = (path: string): boolean => {
        if (path === '/') {
            return currentPath === '/' || currentPath === '/dashboard' || currentPath === '/home';
        }
        if (path === '/account') {
            return currentPath === '/account' || currentPath.startsWith('/account/') || currentPath === '/login';
        }
        return currentPath === path || currentPath.startsWith(`${path}/`);
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            data-testid="site-nav-mobile"
            aria-label="Mobile navigation"
        >
            <div className="flex h-[78px] items-stretch justify-around rounded-t-2xl border-t border-white/10 bg-[#0f172a]/90 px-1 backdrop-blur-xl dark:bg-gray-900/90">
                {TABS.map((tab) => {
                    const active = isActive(tab.url);
                    return (
                        <Link
                            key={tab.id}
                            href={tab.url}
                            aria-current={active ? 'page' : undefined}
                            className={`tap-safe group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-all duration-300 active:scale-95 ${
                                active ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border backdrop-blur-md transition-all duration-300 max-[399px]:h-9 max-[399px]:w-9 ${
                                    active
                                        ? `scale-110 border-white/40 bg-gradient-to-br ${tab.orb} shadow-lg ${tab.glow}`
                                        : 'border-white/10 bg-white/10 shadow-inner'
                                }`}
                            >
                                {/* Gloss reflection across the upper half. */}
                                <span
                                    aria-hidden="true"
                                    className={`pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-t-full bg-gradient-to-b to-transparent ${
                                        active ? 'from-white/50' : 'from-white/15'
                                    }`}
                                />
                                <tab.Icon
                                    className={`relative z-10 h-[18px] w-[18px] shrink-0 max-[399px]:h-4 max-[399px]:w-4 ${
                                        active ? 'text-white' : tab.tint
                                    }`}
                                    strokeWidth={active ? 2.25 : 1.75}
                                />
                            </span>
                            <span
                                className={`max-w-full truncate text-center text-[10px] font-medium leading-none max-[399px]:text-[9px] ${
                                    active ? 'font-bold text-white' : ''
                                }`}
                            >
                                {t(tab.labelKey) || tab.fallbackLabel}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
