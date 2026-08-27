import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Users, Shield, Ban, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    is_suspended: boolean;
    email_verified_at?: string;
    created_at: string;
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchUsers = () => {
        const params = search ? `?search=${encodeURIComponent(search)}` : '';
        api.get<{ data: User[] }>(`/api/admin/users${params}`)
            .then((res) => setUsers(res.data))
            .catch(() => setUsers([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchUsers(); }, [search]);

    const toggleSuspend = async (userId: string, suspend: boolean) => {
        try {
            if (suspend) await api.post(`/api/admin/users/${userId}/suspend`);
            else await api.post(`/api/admin/users/${userId}/unsuspend`);
            fetchUsers();
        } catch {}
    };

    const changeRole = async (userId: string, role: string) => {
        try {
            await api.put(`/api/admin/users/${userId}/role`, { role });
            fetchUsers();
        } catch {}
    };

    return (
        <AppLayout title="Manage Users">
            <Head title="Manage Users" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Users</h1>

                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..."
                    className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">User</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Joined</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{u.name}</p>
                                            <p className="text-xs text-gray-500">{u.email}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                                                className="rounded border px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700">
                                                <option value="customer">Customer</option>
                                                <option value="vendor">Vendor</option>
                                                <option value="rider">Rider</option>
                                                <option value="admin">Admin</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                                u.is_suspended ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                                {u.is_suspended ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                                {u.is_suspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(u.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => toggleSuspend(u.id, !u.is_suspended)}
                                                className={`text-xs font-medium ${u.is_suspended ? 'text-green-600' : 'text-red-600'}`}>
                                                {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
