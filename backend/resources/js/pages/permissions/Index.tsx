import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { Key, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Real shape from AdminRbacController::permissions():
 * { data: { module: [action, ...], ... } } — grouped, not a flat list.
 * Rendered as module → `module.action` chips.
 */
type PermissionMap = Record<string, string[]>;

export default function PermissionsIndex() {
    const [grouped, setGrouped] = useState<PermissionMap | null>(null);
    const [denied, setDenied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: PermissionMap }>('/api/admin/permissions')
            .then((res) => setGrouped(res.data ?? {}))
            .catch((e) => {
                if (e instanceof ApiError && e.status === 403) {
                    setDenied(true);
                } else {
                    setError(errorMessage(e, 'Failed to load permissions'));
                }
            });
    }, []);

    return (
        <AppLayout title="Permissions">
            <Head title="Permissions" />
            <div className="space-y-6">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                    <Key className="h-6 w-6" /> Permissions
                </h1>

                {grouped === null && !denied && !error ? (
                    <p className="text-gray-500" aria-busy="true">Loading...</p>
                ) : denied ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Shield className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                        <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Admin access required</h2>
                        <p className="mt-1 text-sm text-gray-500">Only administrators can view the permission catalog.</p>
                    </div>
                ) : error ? (
                    <p className="text-sm text-red-500" role="alert">{error}</p>
                ) : grouped && Object.keys(grouped).length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Shield className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                        <p className="mt-4 text-sm text-gray-500">No permissions defined.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(grouped ?? {}).map(([module, actions]) => (
                            <div key={module} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h2 className="font-semibold text-gray-900 dark:text-white">{module}</h2>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {actions.map((action) => (
                                        <span
                                            key={`${module}.${action}`}
                                            className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                                        >
                                            {module}.{action}
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
