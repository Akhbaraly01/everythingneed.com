import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Stethoscope, Star, ArrowLeft, Clock } from 'lucide-react';
import Image from '@/components/shared/Image';

interface DoctorProfileProps {
    doctor: { id: string; name: string; specialty: string; bio?: string; image_url?: string; rating?: number; years_experience?: number; consultation_fee?: number };
    availability: Record<string, Array<{ time: string; available: boolean }>>;
}

export default function DoctorProfile({ doctor, availability }: DoctorProfileProps) {
    return (
        <AppLayout>
            <Head title={`Dr. ${doctor.name}`} />
            <div className="max-w-3xl mx-auto space-y-6">
                <Link href="/healthcare/doctors" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to doctors
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-6">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gray-100">
                            {doctor.image_url ? <Image src={doctor.image_url} alt="" className="h-full w-full object-cover" /> :
                                <div className="flex h-full items-center justify-center text-gray-400"><Stethoscope className="h-12 w-12" /></div>}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dr. {doctor.name}</h1>
                            <p className="text-indigo-600 font-medium">{doctor.specialty}</p>
                            {doctor.years_experience && <p className="text-sm text-gray-500">{doctor.years_experience} years experience</p>}
                            {doctor.rating && <p className="flex items-center gap-1 text-sm text-yellow-600"><Star className="h-4 w-4 fill-yellow-400" /> {doctor.rating} rating</p>}
                        </div>
                    </div>
                    {doctor.bio && <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{doctor.bio}</p>}
                                <Link href={`/healthcare/doctors/${doctor.id}/book`} className="mt-4 inline-flex rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
                        Book Appointment
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        <Link href={`/healthcare/doctors/${doctor.id}/reviews`} className="font-medium text-indigo-600 hover:text-indigo-500">
                            Read reviews
                        </Link>
                        <Link href={`/healthcare/doctors/${doctor.id}/availability`} className="font-medium text-indigo-600 hover:text-indigo-500">
                            Full availability
                        </Link>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Clock className="h-5 w-5" /> Available Time Slots</h2>
                    <div className="mt-4 grid grid-cols-7 gap-2">
                        {Object.entries(availability).slice(0, 14).map(([date, slots]) => (
                            <div key={date}>
                                <p className="text-[10px] text-center text-gray-500 mb-1">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                <div className="space-y-1">
                                    {slots.filter((s) => s.available).slice(0, 3).map((s) => (
                                        <p key={s.time} className="text-[10px] bg-green-50 text-green-700 text-center rounded py-0.5 dark:bg-green-900/20 dark:text-green-400">{s.time}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
