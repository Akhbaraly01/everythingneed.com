import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/shared/Button';

interface Doctor {
    id: string;
    full_name: string;
    specialization: string;
}

interface Medicine {
    id: string;
    name: string;
    category: string;
    price: number;
}

interface Lab {
    id: string;
    name: string;
    category?: string | null;
    price?: number | null;
    result_time_hours?: number | null;
}

export default function HealthcareSearch() {
    const [query, setQuery] = useState('');
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [labs, setLabs] = useState<Lab[]>([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = (e: FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (q === '') return;
        setLoading(true);
        setError(null);
        Promise.all([
            api.get<{ data: Doctor[] }>(`/api/doctors?q=${encodeURIComponent(q)}&per_page=10`),
            api.get<{ data: Medicine[] }>(`/api/medicines?search=${encodeURIComponent(q)}&per_page=10`),
            api.get<{ data: Lab[] }>('/api/health/labs'),
        ])
            .then(([docs, meds, labList]) => {
                setDoctors(rows<Doctor>(docs));
                setMedicines(rows<Medicine>(meds));
                const needle = q.toLowerCase();
                setLabs((Array.isArray(labList.data) ? labList.data : []).filter((lab) =>
                    lab.name.toLowerCase().includes(needle)).slice(0, 10));
                setSearched(true);
            })
            .catch((e) => setError(errorMessage(e, 'Search failed')))
            .finally(() => setLoading(false));
    };

    const empty = searched && doctors.length === 0 && medicines.length === 0 && labs.length === 0;

    return (
        <AppLayout title="Search Healthcare">
            <Head title="Search Healthcare" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Healthcare</h1>

                <form onSubmit={search} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Doctors, medicines, lab tests..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 dark:border-gray-600 dark:bg-gray-700"
                        />
                    </div>
                    <Button type="submit" loading={loading}>
                        Search
                    </Button>
                </form>

                {error && <p className="text-sm text-red-600">{error}</p>}

                {empty && (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">No doctors, medicines or lab tests match “{query}”.</p>
                    </div>
                )}

                {doctors.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Doctors ({doctors.length})</h2>
                        <div className="mt-2 divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                            {doctors.map((doctor) => (
                                <Link key={doctor.id} href={`/healthcare/doctors/${doctor.id}`}
                                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{doctor.full_name}</p>
                                        <p className="text-xs text-gray-500">{doctor.specialization}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {medicines.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Medicines ({medicines.length})</h2>
                        <div className="mt-2 divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                            {medicines.map((medicine) => (
                                <Link key={medicine.id} href={`/pharmacy/products/${medicine.id}`}
                                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{medicine.name}</p>
                                        <p className="text-xs capitalize text-gray-500">{medicine.category}</p>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(medicine.price)}</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {labs.length > 0 && (
                    <section>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Lab tests ({labs.length})</h2>
                        <div className="mt-2 divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                            {labs.map((lab) => (
                                <Link key={lab.id} href={`/healthcare/labs/${lab.id}`}
                                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{lab.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {[lab.category, lab.result_time_hours != null ? `${lab.result_time_hours}h turnaround` : null]
                                                .filter(Boolean).join(' · ')}
                                        </p>
                                    </div>
                                    {lab.price != null && (
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(lab.price)}</span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
