import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Award, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import EmptyState from '@/components/shared/EmptyState';
import LoadingState, { ErrorState } from '@/components/shared/LoadingState';

interface Certificate {
    id: string;
    certificate_number: string;
    issued_at: string;
    course?: { id: string; title: string };
    user?: { name: string; email: string };
}

interface MyCertificatesProps {
    certificates?: Certificate[];
}

export default function MyCertificates({ certificates: initialCertificates }: MyCertificatesProps) {
    const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates ?? []);
    const [loading, setLoading] = useState(!initialCertificates);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (initialCertificates) return;
        setLoading(true);
        setError(null);
        api.get<{ data: Certificate[] }>('/api/learn/my-certificates')
            .then((res) => setCertificates(res.data ?? []))
            .catch((e) => {
                setCertificates([]);
                setError(errorMessage(e, 'Failed to load your certificates'));
            })
            .finally(() => setLoading(false));
    }, [initialCertificates, attempt]);

    const handleDownload = (certId: string) => {
        const card = document.getElementById(`certificate-${certId}`);
        if (!card) return;
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) return;
        printWindow.document.write(
            `<html><head><title>Certificate</title></head><body>${card.outerHTML}</body></html>`,
        );
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    };

    if (loading) {
        return (
            <AppLayout>
                <Head title="My Certificates" />
                <LoadingState />
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="My Certificates" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Certificates</h1>

                {error ? (
                    <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
                ) : certificates.length === 0 ? (
                    <EmptyState
                        icon={<Award className="h-10 w-10" />}
                        title="No certificates yet"
                        hint="Complete courses and pass quizzes to earn certificates."
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {certificates.map((cert) => (
                            <div key={cert.id} id={`certificate-${cert.id}`} className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow dark:from-indigo-900/20 dark:to-gray-800 dark:border-indigo-800">
                                <Award className="h-10 w-10 text-indigo-600" />
                                <p className="mt-3 font-bold text-gray-900 dark:text-white">{cert.course?.title ?? 'Course'}</p>
                                <p className="text-sm text-gray-500">Certificate #{cert.certificate_number}</p>
                                <p className="text-sm text-gray-500">Issued: {formatDateTime(cert.issued_at)}</p>
                                <button onClick={() => handleDownload(cert.id)}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
                                    <Download className="h-4 w-4" /> Download
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
