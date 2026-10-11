import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { BadgeCheck, ShieldX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface Verification {
    valid: boolean;
    certificate_number?: string;
    course_title?: string;
    instructor_name?: string | null;
    holder_name?: string | null;
    issued_at?: string;
}

interface VerifyProps {
    code: string;
}

export default function VerifyCertificate({ code }: VerifyProps) {
    const [result, setResult] = useState<Verification | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Verification }>(`/api/learn/certificates/verify/${code}`)
            .then((res) => setResult(res.data))
            .catch((e) => {
                setError(errorMessage(e, 'Certificate not found'));
                setResult({ valid: false });
            })
            .finally(() => setLoading(false));
    }, [code]);

    return (
        <AppLayout title="Verify Certificate">
            <Head title="Verify Certificate" />
            <div className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Certificate Verification</h1>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Verifying {code}...</p>
                    </div>
                ) : result?.valid ? (
                    <div className="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
                        <BadgeCheck className="mx-auto h-16 w-16 text-green-500" />
                        <h2 className="mt-4 text-xl font-bold text-green-700 dark:text-green-300">Valid certificate</h2>
                        <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{result.course_title}</p>
                        {result.holder_name && <p className="text-sm text-gray-500">Awarded to {result.holder_name}</p>}
                        {result.instructor_name && <p className="text-sm text-gray-500">Instructor: {result.instructor_name}</p>}
                        {result.issued_at && <p className="mt-1 text-xs text-gray-500">Issued {formatDateTime(result.issued_at)}</p>}
                        <p className="mt-3 font-mono text-xs text-gray-500">{result.certificate_number}</p>
                    </div>
                ) : (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <ShieldX className="mx-auto h-12 w-12 text-red-400" />
                        <h2 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Not a valid certificate</h2>
                        <p className="mt-1 text-sm text-gray-500">{error ?? `No certificate matches code “${code}”.`}</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
