import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import {  api, errorMessage } from '@/lib/api';
import { prepareForUpload } from '@/lib/media-compress';
import { useState } from 'react';
import { FileUp, Pill, ArrowRight } from 'lucide-react';

export default function PrescriptionUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) { setError('Please select a prescription file'); return; }
        setSubmitting(true); setError('');
        try {
            const prepared = await prepareForUpload(file);
            const fd = new FormData();
            fd.append('prescription', prepared.file);
            fd.append('notes', notes);
            const res = await api.post<{ data: { id: string } }>('/api/pharmacy/prescriptions', fd);
            router.visit(`/pharmacy/orders/${res.data.id}`);
        } catch (err: unknown) { setError(errorMessage(err, 'Upload failed')); setSubmitting(false); }
    };

    return (
        <AppLayout title="Upload Prescription">
            <Head title="Upload Prescription" />
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Pill className="h-6 w-6" /> Upload Prescription</h1>
                <p className="text-gray-500">Upload your prescription to order prescription medicines</p>
                {error && <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20">{error}</div>}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4">
                    <div className="rounded-lg border-2 border-dashed p-8 text-center dark:border-gray-600">
                        <FileUp className="mx-auto h-10 w-10 text-gray-400" />
                        <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-4 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
                        {file && <p className="mt-2 text-sm text-green-600">{file.name}</p>}
                    </div>
                    <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any additional notes for the pharmacist..." className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></div>
                </div>
                <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? 'Uploading...' : 'Upload Prescription'} <ArrowRight className="h-4 w-4" />
                </button>
            </form>
        </AppLayout>
    );
}
