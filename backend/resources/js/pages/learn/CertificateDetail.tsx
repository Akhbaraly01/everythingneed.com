import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Award, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface Certificate {
    id: string;
    course_title: string;
    instructor_name?: string | null;
    certificate_number: string;
    issued_at: string;
}

interface DetailProps {
    certificate_id: string;
}

export default function CertificateDetail({ certificate_id }: DetailProps) {
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Certificate }>(`/api/learn/certificates/${certificate_id}`)
            .then((res) => setCertificate(res.data))
            .catch((e) => setError(errorMessage(e, 'Certificate not found')))
            .finally(() => setLoading(false));
    }, [certificate_id]);

    return (
        <AppLayout title="Certificate">
            <Head title="Certificate" />
            <div className="mx-auto max-w-2xl space-y-6">
                <Link href="/learn/certificates" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    ← My certificates
                </Link>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading certificate...</p>
                    </div>
                ) : error || !certificate ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Certificate not found</h3>
                        <p className="mt-1 text-sm text-gray-500">{error ?? 'This certificate does not exist.'}</p>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
                        <Award className="mx-auto h-16 w-16 text-amber-500" />
                        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{certificate.course_title}</h1>
                        {certificate.instructor_name && (
                            <p className="mt-1 text-sm text-gray-500">Instructor: {certificate.instructor_name}</p>
                        )}
                        <p className="mt-2 font-mono text-sm text-gray-600 dark:text-gray-300">{certificate.certificate_number}</p>
                        <p className="mt-1 text-xs text-gray-500">Issued {formatDateTime(certificate.issued_at)}</p>
                        <div className="mt-6 flex justify-center gap-3">
                            <a href={`/api/learn/certificates/${certificate.id}/download`}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                                <Download className="h-4 w-4" /> Download
                            </a>
                            <Link href={`/certificates/verify/${certificate.certificate_number}`}
                                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600">
                                Verify publicly
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
