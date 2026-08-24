import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { type WorkerProfile } from '@/types';
import { formatCurrency, getInitials } from '@/lib/utils';
import {
    MapPin, Star, BadgeCheck, Clock, Briefcase, GraduationCap,
    FolderOpen, ArrowLeft, Send,
} from 'lucide-react';

interface Props {
    worker: WorkerProfile;
}

export default function JobSeekerShow({ worker }: Props) {
    return (
        <AppLayout title={worker.user?.name ?? 'Worker'}>
            <Head title={`${worker.user?.name} — ${worker.category}`} />
            <div className="mx-auto max-w-5xl px-4 py-8">
                <Link href="/job-seekers" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600">
                    <ArrowLeft className="h-4 w-4" /> Back to directory
                </Link>

                {/* Profile header */}
                <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                                {getInitials(worker.user?.name ?? 'W')}
                            </span>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{worker.user?.name}</h1>
                                    {worker.is_verified && <BadgeCheck className="h-5 w-5 text-blue-500" />}
                                </div>
                                <p className="text-gray-600 dark:text-gray-300">{worker.headline}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <strong>{Number(worker.rating_avg).toFixed(1)}</strong> ({worker.rating_count} ratings)
                                    </span>
                                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{[worker.city, worker.country].filter(Boolean).join(', ') || 'Remote'}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${worker.availability === 'available' ? 'bg-green-100 text-green-800' : worker.availability === 'busy' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>
                                        {worker.availability}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Link
                            href={`/job-seekers/request/${worker.id}`}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
                        >
                            <Send className="h-4 w-4" /> Request this worker
                        </Link>
                    </div>

                    {worker.bio && (
                        <p className="mt-4 border-t border-gray-100 pt-4 text-sm leading-relaxed text-gray-600 dark:border-gray-700 dark:text-gray-300">{worker.bio}</p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <Stat label="Hourly rate" value={worker.hourly_rate ? `${formatCurrency(worker.hourly_rate)}/hr` : 'On request'} />
                        <Stat label="Daily rate" value={worker.daily_rate ? `${formatCurrency(worker.daily_rate)}/day` : 'On request'} />
                        <Stat label="Jobs completed" value={String(worker.completed_jobs)} icon={<Clock className="inline h-4 w-4 text-gray-400" />} />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Skills + experience + education */}
                    <div className="space-y-6 lg:col-span-2">
                        {(worker.skills?.length ?? 0) > 0 && (
                            <Section title="Skills">
                                <div className="flex flex-wrap gap-2">
                                    {worker.skills!.map((s) => (
                                        <span key={s.name} className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300">
                                            {s.name}{s.level ? ` · ${s.level}` : ''}
                                        </span>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {(worker.experience?.length ?? 0) > 0 && (
                            <Section title="Experience">
                                <ol className="space-y-4">
                                    {worker.experience!.map((x, i) => (
                                        <li key={i} className="relative border-l-2 border-indigo-200 pl-4 dark:border-indigo-800">
                                            <p className="font-semibold text-gray-900 dark:text-white">{x.title}</p>
                                            <p className="text-sm text-gray-500">{x.company}{x.from ? ` · ${x.from}${x.to ? ` – ${x.to}` : ' – present'}` : ''}</p>
                                            {x.description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{x.description}</p>}
                                        </li>
                                    ))}
                                </ol>
                            </Section>
                        )}

                        {(worker.education?.length ?? 0) > 0 && (
                            <Section title={<><GraduationCap className="mr-2 inline h-4 w-4" />Education</>}>
                                <ul className="space-y-2">
                                    {worker.education!.map((e, i) => (
                                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300">
                                            <span className="font-medium">{e.degree}</span> — {e.institution}{e.year ? `, ${e.year}` : ''}
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}
                    </div>

                    {/* Portfolio sidebar */}
                    <div>
                        {(worker.portfolio?.length ?? 0) > 0 && (
                            <Section title={<><FolderOpen className="mr-2 inline h-4 w-4" />Portfolio</>}>
                                <ul className="space-y-3">
                                    {worker.portfolio!.map((p, i) => (
                                        <li key={i} className="rounded-lg border border-gray-200 p-3 dark:border-gray-600">
                                            <p className="font-medium text-gray-900 dark:text-white">{p.title}</p>
                                            {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}
                        <Section title="Hiring safety">
                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                <li>• Agree scope and rate before work starts.</li>
                                <li>• Payment is recorded when you mark the request paid.</li>
                                <li>• Rate the worker only after completion — ratings are final.</li>
                                <li className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-gray-400" /> {worker.completed_jobs} completed jobs on record</li>
                            </ul>
                        </Section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
            <p className="text-xs text-gray-500">{icon} {label}</p>
            <p className="font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    );
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-3 font-semibold text-gray-900 dark:text-white">{title}</h2>
            {children}
        </div>
    );
}
