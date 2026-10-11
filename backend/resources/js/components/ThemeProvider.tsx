import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';
type ResolvedTheme = 'dark' | 'light';

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

interface ThemeProviderState {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const DEFAULT_STORAGE_KEY = 'everythingneed-theme';

const ThemeProviderContext = createContext<ThemeProviderState>({
    theme: 'system',
    resolvedTheme: 'light',
    setTheme: () => null,
    toggleTheme: () => null,
});

function isTheme(value: unknown): value is Theme {
    return value === 'dark' || value === 'light' || value === 'system';
}

function readStoredTheme(storageKey: string, fallback: Theme): Theme {
    if (typeof window === 'undefined') return fallback;
    try {
        const stored = window.localStorage.getItem(storageKey);
        return isTheme(stored) ? stored : fallback;
    } catch {
        return fallback;
    }
}

function systemPrefersDark(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
        return false;
    }
}

function resolveTheme(theme: Theme): ResolvedTheme {
    if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light';
    return theme;
}

/** Applies the resolved theme to <html>, color-scheme and theme-color meta. */
function applyTheme(resolved: ResolvedTheme): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.classList.toggle('light', resolved === 'light');
    if ('style' in root) {
        root.style.colorScheme = resolved;
    }

    // A media-scoped theme-color already covers the system preference; the
    // unscoped tag wins so an explicit user choice tints the browser chrome.
    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]:not([media])');
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', resolved === 'dark' ? '#01050f' : '#f8fafc');
}

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = DEFAULT_STORAGE_KEY,
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => readStoredTheme(storageKey, defaultTheme));
    const [systemDark, setSystemDark] = useState<boolean>(() => systemPrefersDark());

    const resolvedTheme: ResolvedTheme =
        theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

    // Keep the DOM in sync with the resolved theme. This is idempotent with
    // the pre-paint blade script, so it never causes a flash of its own.
    useEffect(() => {
        applyTheme(resolvedTheme);
    }, [resolvedTheme]);

    // Follow OS-level theme changes while the preference is "system".
    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
        query.addEventListener?.('change', onChange);
        setSystemDark(query.matches);
        return () => query.removeEventListener?.('change', onChange);
    }, []);

    const setTheme = useCallback(
        (next: Theme) => {
            if (!isTheme(next)) return;
            try {
                window.localStorage.setItem(storageKey, next);
            } catch {
                // Private-mode storage failures only cost persistence.
            }
            setThemeState(next);
        },
        [storageKey],
    );

    const toggleTheme = useCallback(() => {
        setTheme(resolveTheme(theme) === 'dark' ? 'light' : 'dark');
    }, [setTheme, theme]);

    const value = useMemo(
        () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
        [theme, resolvedTheme, setTheme, toggleTheme],
    );

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeProviderContext);

export type { Theme, ResolvedTheme };
