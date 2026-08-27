import AppLayout from '@/layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { Briefcase, ArrowLeft, Check } from 'lucide-react';
import { useState } from 'react';

interface JobApplyProps {
    job: { id: string; title: string; company?: string; location?: string };
}

export default function JobApply({ job }: JobApplyProps) {
    const [coverLetter, setCoverLetter] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleApply = async () => {
        setSubmitting(true);
        try {
            await api.post(`/api/jobs/${job.id}/apply`, {
                cover_letter: coverLetter || undefined,
                resume_url: resumeUrl || undefined,
            });
            alert('Application submitted!');
            router.visit('/jobs/applications');
        } catch (e: any) {
            alert(e.message ?? 'Failed to apply');
        }
        setSubmitting(false);
    };

    return (
        <AppLayout>
            <Head title={`Apply to ${job.title}`} />
            <div className="max-w-2xl mx-auto space-y-6">
                <button onClick={() => history.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to job
                </button>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Apply for {job.title}</h1>
                    {job.company && <p className="text-sm text-gray-500">{job.company}{job.location ? ` - ${job.location}` : ''}</p>}

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resume URL (optional)</label>
                            <input type="url" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="https://..."
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cover Letter</label>
                            <textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={6}
                                placeholder="Tell the employer why you're a great fit..."
                                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                    </div>

                    <button onClick={handleApply} disabled={submitting}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        <Check className="h-5 w-5" /> {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}
