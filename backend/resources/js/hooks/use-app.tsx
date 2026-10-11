import {usePage} from '@inertiajs/react';
import { type ReactNode, createContext, useContext } from 'react';

export interface SharedData {
    [key: string]: unknown;
    auth: {
        id: string;
        name: string;
        email: string;
        roles: string[];
        permissions: string[];
    } | null;
    flash: {
        success: string | null;
        error: string | null;
    };
    ziggy: {
        url: string;
        port: string | null;
        defaults: Record<string, unknown>;
        routes: Record<string, unknown>;
    };
}

interface PageProps {
    [key: string]: unknown;
}

interface AppContextType {
    user: SharedData['auth'];
    flash: SharedData['flash'];
    hasRole: (role: string) => boolean;
    hasPermission: (permission: string) => boolean;
    can: (ability: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const page = usePage<SharedData & PageProps>();
    const auth = page.props?.auth ?? null;
    const flash = page.props?.flash ?? { success: null, error: null };

    const hasRole = (role: string): boolean => {
        return auth?.roles?.includes(role) ?? false;
    };

    const hasPermission = (permission: string): boolean => {
        return auth?.permissions?.includes(permission) ?? false;
    };

    const can = (ability: string): boolean => {
        return hasRole('super_admin') || hasPermission(ability);
    };

    return (
        <AppContext.Provider value={{ user: auth, flash, hasRole, hasPermission, can }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp(): AppContextType {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

export { type PageProps };
