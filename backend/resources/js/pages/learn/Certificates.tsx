import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { Award, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Certificate {
    id: string;
    certificate_number: string;
    issued_at: string;
    course?: { id: string; title: string };
    user?: { name: string; email: string };
}

interface MyCertificatesProps {
    certificates: Certificate[];
}

export default function MyCertificates({ certificates }: MyCertificatesProps) {
    const handleDownload = (certId: string) => {
        window.open(`/api/learn/my-certificates/${certId}/download`, '_blank');
    };

    return (
        <AppLayout title="My Certificates">
            <Head title="My Certificates" />

            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Certificates</h1>

                {certificates.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Award className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No certificates yet</h3>
                        <p className="mt-2 text-gray-500">Complete courses and pass quizzes to earn certificates.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {certificates.map((cert) => (
                            <div key={cert.id} className="rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow dark:from-indigo-900/20 dark:to-gray-800 dark:border-indigo-800">
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
