import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { Stethoscope } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Doctor {
    id: string;
    name: string;
    specialty: string;
    status: string;
    total_appointments: number;
    user_email?: string;
}

export default function AdminHealthcare() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Doctor[] }>('/api/admin/healthcare/doctors')
            .then((res) => setDoctors(res.data))
            .catch(() => setDoctors([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Healthcare Admin">
            <Head title="Healthcare Admin" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Healthcare Management</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : doctors.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Stethoscope className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No doctors registered</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Doctor</th>
                                    <th className="px-4 py-3">Specialty</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Appointments</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {doctors.map((d) => (
                                    <tr key={d.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">Dr. {d.name}</p>
                                            <p className="text-xs text-gray-500">{d.user_email}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-indigo-600">{d.specialty}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                d.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>{d.status}</span>
                                        </td>
                                        <td className="px-4 py-3">{d.total_appointments}</td>
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
