import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { KycVerification } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { BadgeCheck, ShieldAlert, UploadCloud } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import { prepareForUpload } from '@/lib/media-compress';

const DOCUMENT_TYPES = ['passport', 'national_id', 'drivers_license', 'voters_id'];

const stateTone: Record<string, string> = {
    verified: 'bg-green-100 text-green-800',
    under_review: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    not_started: 'bg-gray-100 text-gray-600',
    rejected: 'bg-red-100 text-red-800',
    requires_action: 'bg-orange-100 text-orange-800',
};

const stateLabel = (state: string) => state.replace(/_/g, ' ');

export default function KycSubmit() {
    const [verification, setVerification] = useState<KycVerification | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState<'front' | 'back' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [fullName, setFullName] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [nationality, setNationality] = useState('');
    const [address, setAddress] = useState('');
    const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
    const [documentNumber, setDocumentNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [frontPath, setFrontPath] = useState('');
    const [backPath, setBackPath] = useState('');

    const load = () => {
        setLoading(true);
        api.get<{ data: KycVerification }>('/api/kyc')
            .then((res) => setVerification(res.data))
            .catch((e) => setError(errorMessage(e, 'Failed to load verification status')))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const uploadDocument = async (side: 'front' | 'back', file: File) => {
        setUploading(side);
        setError(null);
        try {
            const prepared = await prepareForUpload(file);
            const fd = new FormData();
            fd.append('file', prepared.file);
            fd.append('folder', 'kyc-documents');
            const res = await api.post<{ data: { path: string } }>('/api/upload', fd);
            if (side === 'front') setFrontPath(res.data.path);
            else setBackPath(res.data.path);
        } catch (e) {
            setError(errorMessage(e, 'Document upload failed'));
        } finally {
            setUploading(null);
        }
    };

    const submit = async () => {
        if (!documentNumber.trim()) {
            setError('Document number is required.');
            return;
        }
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        try {
            await api.post('/api/kyc/submit', {
                document_type: documentType,
                document_number: documentNumber.trim(),
                document_front_path: frontPath || undefined,
                document_back_path: backPath || undefined,
                full_name: fullName.trim() || undefined,
                date_of_birth: dateOfBirth || undefined,
                nationality: nationality.trim() || undefined,
                address: address.trim() || undefined,
                id_expiry_date: expiryDate || undefined,
            });
            setSuccess('Verification submitted. You will be notified once it is reviewed.');
            setFrontPath('');
            setBackPath('');
            load();
        } catch (e) {
            setError(errorMessage(e, 'Submission failed'));
        } finally {
            setSubmitting(false);
        }
    };

    const hasRow = Boolean(verification?.id);
    const status = verification?.status ?? 'pending';
    const showForm = !hasRow || status === 'rejected' || status === 'requires_action' || status === 'approved';

    return (
        <AppLayout title="Identity Verification">
            <Head title="Identity Verification" />
            <div className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Identity Verification (KYC)</h1>
                <p className="text-sm text-gray-500">
                    Verification unlocks withdrawals, transfers and wallet payments. Your documents are only
                    visible to you and our review team — never published.
                </p>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading verification status...</p>
                    </div>
                ) : (
                    <>
                        {verification && (
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${stateTone[verification.verification_state] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {stateLabel(verification.verification_state)}
                                    </span>
                                    {(verification.attempts ?? 0) > 1 && (
                                        <span className="text-xs text-gray-500">Attempt {verification.attempts}</span>
                                    )}
                                </div>
                                {verification.status === 'approved' && (
                                    <p className="mt-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                                        <BadgeCheck className="h-4 w-4" />
                                        Identity verified{verification.verified_at ? ` on ${formatDateTime(verification.verified_at)}` : ''}.
                                        <Link href="/wallet" className="font-medium underline">Go to Wallet</Link>
                                    </p>
                                )}
                                {(status === 'rejected' || status === 'requires_action') && verification.rejection_reason && (
                                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
                                        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                        {verification.rejection_reason}
                                    </p>
                                )}
                                {verification.document_number_masked && (
                                    <p className="mt-3 text-xs text-gray-500">
                                        {verification.document_type} · {verification.document_number_masked}
                                    </p>
                                )}
                            </div>
                        )}

                        {showForm && (
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {hasRow ? 'Submit a new verification' : 'Verify your identity'}
                                </h2>
                                <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full name</label>
                                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date of birth</label>
                                            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nationality (3-letter code)</label>
                                            <input type="text" maxLength={3} value={nationality} onChange={(e) => setNationality(e.target.value.toUpperCase())}
                                                placeholder="GHA"
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID expiry date</label>
                                            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
                                            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document type *</label>
                                            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                                {DOCUMENT_TYPES.map((t) => (
                                                    <option key={t} value={t}>{stateLabel(t)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Document number *</label>
                                            <input type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)}
                                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" />
                                        </div>
                                    </div>
                                    {(['front', 'back'] as const).map((side) => (
                                        <div key={side}>
                                            <label className="block text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                                                Document {side} (image or PDF, max 10MB)
                                            </label>
                                            <div className="mt-1 flex items-center gap-3">
                                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600">
                                                    <UploadCloud className="h-4 w-4" />
                                                    {uploading === side ? 'Uploading...' : 'Choose file'}
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        className="hidden"
                                                        disabled={uploading !== null}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) void uploadDocument(side, file);
                                                            e.target.value = '';
                                                        }}
                                                    />
                                                </label>
                                                {(side === 'front' ? frontPath : backPath) !== '' && (
                                                    <span className="text-xs text-green-600">Uploaded ✓</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {error && (
                                    <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                        {success}
                                    </div>
                                )}

                                <button
                                    onClick={submit}
                                    disabled={submitting || uploading !== null}
                                    className="mt-6 w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : hasRow ? 'Resubmit verification' : 'Submit for verification'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
