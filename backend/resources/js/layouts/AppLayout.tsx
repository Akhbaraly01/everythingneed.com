import { type ReactNode } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useApp } from '@/hooks/use-app';
import { getInitials } from '@/lib/utils';
import {
    LayoutDashboard,
    ShoppingBag,
    Heart,
    Calendar,
    MessageSquare,
    Bell,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    User,
    Package,
    CreditCard,
    HelpCircle,
    Briefcase,
    Plane,
    ListChecks,
} from 'lucide-react';
import { useState } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
}

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: ShoppingBag },
    { name: 'Orders', href: '/orders', icon: Package },
    { name: 'Job Seekers', href: '/job-seekers', icon: Briefcase },
    { name: 'Flights', href: '/flights', icon: Plane },
    { name: 'Task Center', href: '/tasks', icon: ListChecks },
    { name: 'My Bookings', href: '/bookings', icon: Calendar },
    { name: 'Wishlist', href: '/wishlist', icon: Heart },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Help', href: '/help', icon: HelpCircle },
];

export default function AppLayout({ children, title }: AppLayoutProps) {
    const { user } = useApp();
    const page = usePage();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
                    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800">
                        <div className="flex h-full flex-col">
                            <div className="flex items-center justify-between p-4">
                                <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
                                    EverythingNeed
                                </Link>
                                <button onClick={() => setSidebarOpen(false)}>
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <nav className="flex-1 space-y-1 px-3">
                                {navigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                                            page.url === item.href
                                                ? 'bg-gray-100 text-gray-900'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
                <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white dark:bg-gray-800">
                    <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
                        <div className="flex flex-shrink-0 items-center px-4">
                            <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
                                EverythingNeed
                            </Link>
                        </div>
                        <nav className="mt-8 flex-1 space-y-1 px-3">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                                        page.url === item.href
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
                        <div className="group block w-full flex-shrink-0">
                            <div className="flex items-center">
                                <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-500">
                                    <span className="text-sm font-medium text-white">
                                        {getInitials(user?.name ?? 'U')}
                                    </span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{user?.name}</p>
                                    <p className="text-xs font-medium text-gray-500">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Top bar */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm dark:bg-gray-800 sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1" />
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            {/* Profile dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="-m-1.5 flex items-center p-1.5"
                                    onClick={() => setProfileOpen(!profileOpen)}
                                >
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-500">
                                        <span className="text-sm font-medium text-white">
                                            {getInitials(user?.name ?? 'U')}
                                        </span>
                                    </span>
                                    <span className="hidden lg:flex lg:items-center">
                                        <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                            {user?.name}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                                    </span>
                                </button>
                                {profileOpen && (
                                    <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                                        <Link
                                            href="/profile"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <User className="h-4 w-4" />
                                            Profile
                                        </Link>
                                        <Link
                                            href="/settings"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <Settings className="h-4 w-4" />
                                            Settings
                                        </Link>
                                        <Link
                                            href="/wallet"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            Wallet
                                        </Link>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setProfileOpen(false)}
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign out
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="py-6">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        {title && (
                            <div className="mb-6">
                                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
                            </div>
                        )}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
