import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { Key, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Permission {
    id: string;
    name: string;
    slug: string;
    description?: string;
    category?: string;
}

export default function PermissionsIndex() {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Permission[] }>('/api/admin/permissions')
            .then((res) => setPermissions(res.data))
            .catch(() => setPermissions([]))
            .finally(() => setLoading(false));
    }, []);

    const grouped = permissions.reduce((acc, p) => {
        const cat = p.category ?? 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(p);
        return acc;
    }, {} as Record<string, Permission[]>);

    return (
        <AppLayout title="Permissions">
            <Head title="Permissions" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Key className="h-6 w-6" /> Permissions</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : permissions.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Shield className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No permissions found</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(grouped).map(([cat, perms]) => (
                            <div key={cat} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h2 className="font-semibold text-gray-900 dark:text-white capitalize">{cat}</h2>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {perms.map((p) => (
                                        <span key={p.id} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                                            {p.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
