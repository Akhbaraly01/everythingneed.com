import { statusTone } from '@/lib/lifecycle';
import AdminLayout from '@/layouts/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { api, errorMessage, rows } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Stethoscope, Plus, CalendarCheck, ClipboardList, Search, X, Check, FlaskConical } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

/** Real doctors row (DoctorResource). */
interface Doctor {
    id: string;
    full_name: string;
    specialization: string;
    profession: string;
    qualification?: string | null;
    experience_years?: number;
    consultation_fee: number;
    virtual_fee?: number | null;
    home_visit_fee?: number | null;
    is_available: boolean;
    rating?: number | null;
}

/** Real admin health-ticket row (AppointmentController::adminTickets). */
interface HealthTicket {
    id: string;
    ticket_number: string;
    symptoms?: string | null;
    consultation_type?: string | null;
    consultation_fee?: number | null;
    appointment_date?: string | null;
    appointment_time?: string | null;
    status: 'pending' | 'assigned' | 'in_consultation' | 'completed' | 'cancelled';
    created_at: string;
    patient_name?: string | null;
    patient_email?: string | null;
    doctor_name?: string | null;
}

/** Real admin consultation row (HealthCompatController::adminConsultations). */
interface ConsultationRow {
    id: string;
    diagnosis?: string | null;
    notes?: string | null;
    follow_up_date?: string | null;
    created_at: string;
    ticket_number: string;
    consultation_type?: string | null;
    patient_name?: string | null;
    doctor_name?: string | null;
}

/** Real admin lab-test row (LabController::adminList). */
interface LabTest {
    id: string;
    name: string;
    category: string;
    price: number;
    result_time_hours: number;
    preparation_instructions?: string | null;
    is_active: boolean;
}

/** Real prescription oversight row (PharmacyAdminController::prescriptions). */
interface HealthPrescription {
    id: string;
    code: string;
    status: 'active' | 'filled' | 'expired';
    items?: { name?: string }[] | null;
    created_at: string;
    patient?: { id?: string; name?: string | null; email?: string | null } | null;
    doctor?: { full_name?: string | null } | null;
}

/** Real admin lab-booking row (LabController::adminBookings). */
interface LabBooking {
    id: string;
    booking_number: string;
    appointment_date?: string | null;
    appointment_time?: string | null;
    price: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    is_paid: boolean;
    lab_test?: { id?: string; name?: string } | null;
    patient?: { id?: string; name?: string | null; email?: string | null } | null;
}

/** Real health-content row (HealthContentController::adminList). */
interface HealthContent {
    id: string;
    type: string;
    title: string;
    summary?: string | null;
    url?: string | null;
    specialty?: string | null;
    is_active: boolean;
    created_at: string;
}

/** Real admin service-request row (ServiceRequestController::adminList). */
interface ServiceRequest {    id: string;
    request_number: string;
    category: string;
    title: string;
    details?: string | null;
    preferred_date?: string | null;
    location?: string | null;
    status: 'open' | 'contacted' | 'scheduled' | 'closed' | 'cancelled';
    admin_note?: string | null;
    created_at: string;
    patient?: { id?: string; name?: string | null; email?: string | null } | null;
    assigned_doctor?: { id?: string; full_name?: string | null } | null;
}

interface Meta {
    page?: number;
    current_page?: number;
    per_page?: number;
    last_page?: number;
    total: number;
}

type Tab = 'doctors' | 'appointments' | 'consultations' | 'labs' | 'lab-bookings' | 'requests' | 'content' | 'prescriptions';

const PAGE = 15;

export default function AdminHealthcare() {
    const { auth } = usePage().props as unknown as { auth: { roles?: string[] } };
    const isSuper = (auth?.roles ?? []).includes('super_admin');

    const [tab, setTab] = useState<Tab>('doctors');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [doctorMeta, setDoctorMeta] = useState<Meta | null>(null);
    const [doctorPage, setDoctorPage] = useState(1);

    const [tickets, setTickets] = useState<HealthTicket[]>([]);
    const [ticketMeta, setTicketMeta] = useState<Meta | null>(null);
    const [ticketPage, setTicketPage] = useState(1);
    const [ticketStatus, setTicketStatus] = useState('all');

    const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
    const [consultMeta, setConsultMeta] = useState<Meta | null>(null);
    const [consultPage, setConsultPage] = useState(1);

    const [labs, setLabs] = useState<LabTest[]>([]);
    const [labMeta, setLabMeta] = useState<Meta | null>(null);
    const [labPage, setLabPage] = useState(1);

    const [labBookings, setLabBookings] = useState<LabBooking[]>([]);
    const [labBookingMeta, setLabBookingMeta] = useState<Meta | null>(null);
    const [labBookingPage, setLabBookingPage] = useState(1);
    const [labStatus, setLabStatus] = useState('all');

    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [requestsMeta, setRequestsMeta] = useState<Meta | null>(null);
    const [requestsPage, setRequestsPage] = useState(1);
    const [requestStatus, setRequestStatus] = useState('all');

    const [contents, setContents] = useState<HealthContent[]>([]);
    const [contentMeta, setContentMeta] = useState<Meta | null>(null);
    const [contentPage, setContentPage] = useState(1);
    const [contentType, setContentType] = useState('all');
    const [showContentForm, setShowContentForm] = useState(false);
    const [savingContent, setSavingContent] = useState(false);
    const [contentForm, setContentForm] = useState({ type: 'prevention_guide', title: '', summary: '', url: '', specialty: '' });

    const [rxList, setRxList] = useState<HealthPrescription[]>([]);
    const [rxMeta, setRxMeta] = useState<Meta | null>(null);
    const [rxPage, setRxPage] = useState(1);
    const [rxStatus, setRxStatus] = useState('all');

    const [search, setSearch] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ full_name: '', specialization: '', profession: 'doctor', qualification: '', experience_years: 0, consultation_fee: 0, virtual_fee: '', home_visit_fee: '' });

    const [showLabForm, setShowLabForm] = useState(false);
    const [savingLab, setSavingLab] = useState(false);
    const [labForm, setLabForm] = useState({ name: '', category: '', price: 0, result_time_hours: 24, preparation_instructions: '' });

    const [assigning, setAssigning] = useState<string | null>(null);
    const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
    const [doctorChoice, setDoctorChoice] = useState('');

    const [deciding, setDeciding] = useState<string | null>(null);
    const [decideAction, setDecideAction] = useState('contacted');
    const [decideNote, setDecideNote] = useState('');

    useEffect(() => {
        setLoading(true);
        setError(null);
        const page = tab === 'doctors' ? doctorPage
            : tab === 'appointments' ? ticketPage
            : tab === 'consultations' ? consultPage
            : tab === 'labs' ? labPage
            : tab === 'requests' ? requestsPage
            : tab === 'content' ? contentPage
            : tab === 'prescriptions' ? rxPage
            : labBookingPage;
        const qs = new URLSearchParams({ page: String(page) });

        const req =
            tab === 'doctors'
                ? api.get<{ data: Doctor[]; meta: Meta }>(`/api/doctors?${qs}`)
                : tab === 'appointments'
                    ? api.get<{ data: HealthTicket[]; meta: Meta }>(`/api/admin/healthcare/tickets?${qs}&status=${ticketStatus}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
                    : tab === 'consultations'
                        ? api.get<{ data: ConsultationRow[]; meta: Meta }>(`/api/admin/healthcare/consultations?${qs}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
                        : tab === 'labs'
                            ? api.get<{ data: LabTest[]; meta: Meta }>(`/api/admin/healthcare/labs?${qs}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
                            : tab === 'requests'
                                ? api.get<{ data: ServiceRequest[]; meta: Meta }>(`/api/admin/healthcare/service-requests?${qs}&status=${requestStatus}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
                                : tab === 'content'
                                    ? api.get<{ data: HealthContent[]; meta: Meta }>(`/api/admin/healthcare/content?${qs}${contentType !== 'all' ? `&type=${contentType}` : ''}${search ? `&search=${encodeURIComponent(search)}` : ''}`)
                                    : tab === 'prescriptions'
                                        ? api.get<{ data: HealthPrescription[]; meta: Meta }>(`/api/admin/pharmacy/prescriptions?${qs}&status=${rxStatus}`)
                                        : api.get<{ data: LabBooking[]; meta: Meta }>(`/api/admin/healthcare/labs/bookings?${qs}&status=${labStatus}`);

        req
            .then((res) => {
                const meta = res.meta;
                if (tab === 'doctors') {
                    setDoctors(rows<Doctor>(res as { data?: Doctor[] }));
                    setDoctorMeta(meta);
                } else if (tab === 'appointments') {
                    setTickets(rows<HealthTicket>(res as { data?: HealthTicket[] }));
                    setTicketMeta(meta);
                } else if (tab === 'consultations') {
                    setConsultations(rows<ConsultationRow>(res as { data?: ConsultationRow[] }));
                    setConsultMeta(meta);
                } else if (tab === 'labs') {
                    setLabs(rows<LabTest>(res as { data?: LabTest[] }));
                    setLabMeta(meta);
                } else if (tab === 'requests') {
                    setRequests(rows<ServiceRequest>(res as { data?: ServiceRequest[] }));
                    setRequestsMeta(meta);
                } else if (tab === 'content') {
                    setContents(rows<HealthContent>(res as { data?: HealthContent[] }));
                    setContentMeta(meta);
                } else if (tab === 'prescriptions') {
                    setRxList(rows<HealthPrescription>(res as { data?: HealthPrescription[] }));
                    setRxMeta(meta);
                } else {
                    setLabBookings(rows<LabBooking>(res as { data?: LabBooking[] }));
                    setLabBookingMeta(meta);
                }
            })
            .catch((e) => {
                if (tab === 'doctors') setDoctors([]);
                else if (tab === 'appointments') setTickets([]);
                else if (tab === 'consultations') setConsultations([]);
                else if (tab === 'labs') setLabs([]);
                else if (tab === 'requests') setRequests([]);
                else if (tab === 'content') setContents([]);
                else if (tab === 'prescriptions') setRxList([]);
                else setLabBookings([]);
                setError(errorMessage(e, 'Failed to load data'));
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, doctorPage, ticketPage, consultPage, ticketStatus, labPage, labBookingPage, labStatus, requestsPage, requestStatus, contentPage, contentType, rxPage, rxStatus]);

    const searchNow = (e: FormEvent) => {
        e.preventDefault();
        if (tab === 'appointments') setTicketPage(1);
        if (tab === 'consultations') setConsultPage(1);
        if (tab === 'labs') setLabPage(1);
        setLoading(true);
        const qs = new URLSearchParams({ page: '1' });
        if (search) qs.set('search', search);
        const req =
            tab === 'appointments'
                ? api.get<{ data: HealthTicket[]; meta: Meta }>(`/api/admin/healthcare/tickets?${qs}&status=${ticketStatus}`)
                : tab === 'consultations'
                    ? api.get<{ data: ConsultationRow[]; meta: Meta }>(`/api/admin/healthcare/consultations?${qs}`)
                    : tab === 'requests'
                        ? api.get<{ data: ServiceRequest[]; meta: Meta }>(`/api/admin/healthcare/service-requests?${qs}&status=${requestStatus}`)
                        : tab === 'content'
                            ? api.get<{ data: HealthContent[]; meta: Meta }>(`/api/admin/healthcare/content?${qs}${contentType !== 'all' ? `&type=${contentType}` : ''}`)
                            : tab === 'prescriptions'
                                ? api.get<{ data: HealthPrescription[]; meta: Meta }>(`/api/admin/pharmacy/prescriptions?${qs}&status=${rxStatus}`)
                                : api.get<{ data: LabTest[]; meta: Meta }>(`/api/admin/healthcare/labs?${qs}`);
        if (tab === 'doctors' || tab === 'lab-bookings') { setLoading(false); return; }
        req
            .then((res) => {
                if (tab === 'appointments') { setTickets(rows<HealthTicket>(res as { data?: HealthTicket[] })); setTicketMeta(res.meta); }
                else if (tab === 'consultations') { setConsultations(rows<ConsultationRow>(res as { data?: ConsultationRow[] })); setConsultMeta(res.meta); }
                else if (tab === 'requests') { setRequests(rows<ServiceRequest>(res as { data?: ServiceRequest[] })); setRequestsMeta(res.meta); }
                else if (tab === 'content') { setContents(rows<HealthContent>(res as { data?: HealthContent[] })); setContentMeta(res.meta); }
                else if (tab === 'prescriptions') { setRxList(rows<HealthPrescription>(res as { data?: HealthPrescription[] })); setRxMeta(res.meta); }
                else { setLabs(rows<LabTest>(res as { data?: LabTest[] })); setLabMeta(res.meta); }
            })
            .catch((e) => toast.error(errorMessage(e, 'Search failed')))
            .finally(() => setLoading(false));
    };

    const submitLab = async (e: FormEvent) => {
        e.preventDefault();
        setSavingLab(true);
        try {
            await api.post('/api/admin/healthcare/labs', {
                name: labForm.name.trim(),
                category: labForm.category.trim(),
                price: Number(labForm.price) || 0,
                result_time_hours: Number(labForm.result_time_hours) || 1,
                preparation_instructions: labForm.preparation_instructions.trim() || undefined,
            });
            toast.success('Lab test created.');
            setShowLabForm(false);
            setLabForm({ name: '', category: '', price: 0, result_time_hours: 24, preparation_instructions: '' });
            setLabPage(1);
            setLoading(true);
            api.get<{ data: LabTest[]; meta: Meta }>(`/api/admin/healthcare/labs?page=1`)
                .then((res) => { setLabs(rows<LabTest>(res)); setLabMeta(res.meta); })
                .finally(() => setLoading(false));
        } catch (err) {
            toast.error(errorMessage(err, 'Create failed'));
        } finally {
            setSavingLab(false);
        }
    };

    const toggleLabActive = async (lab: LabTest) => {
        try {
            await api.put(`/api/admin/healthcare/labs/${lab.id}`, { is_active: !lab.is_active });
            setLabs(labs.map((l) => (l.id === lab.id ? { ...l, is_active: !l.is_active } : l)));
            toast.success(lab.is_active ? 'Deactivated.' : 'Activated.');
        } catch (err) {
            toast.error(errorMessage(err, 'Update failed'));
        }
    };

const submitDoctor = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                full_name: form.full_name.trim(),
                specialization: form.specialization.trim(),
                profession: form.profession,
                qualification: form.qualification.trim(),
                experience_years: Number(form.experience_years) || 0,
                consultation_fee: Number(form.consultation_fee) || 0,
            };
            if (form.virtual_fee !== '') payload.virtual_fee = Number(form.virtual_fee);
            if (form.home_visit_fee !== '') payload.home_visit_fee = Number(form.home_visit_fee);
            await api.post('/api/doctors', payload);
            toast.success('Doctor created.');
            setShowForm(false);
            setForm({ full_name: '', specialization: '', profession: 'doctor', qualification: '', experience_years: 0, consultation_fee: 0, virtual_fee: '', home_visit_fee: '' });
            setDoctorPage(1);
            setLoading(true);
            api.get<{ data: Doctor[]; meta: Meta }>(`/api/doctors?page=${doctorPage}`)
                .then((res) => { setDoctors(rows<Doctor>(res)); setDoctorMeta(res.meta); })
                .finally(() => setLoading(false));
        } catch (err) {
            toast.error(errorMessage(err, 'Create failed'));
        } finally {
            setSaving(false);
        }
    };

    const startAssign = async (ticketId: string) => {
        setAssigning(ticketId);
        setDoctorChoice('');
        if (allDoctors.length === 0) {
            try {
                const res = await api.get<{ data: Doctor[] }>('/api/doctors?per_page=100');
                setAllDoctors(rows<Doctor>(res));
            } catch {
                toast.error('Failed to load doctors');
            }
        }
    };

    const assign = async () => {
        if (!assigning || !doctorChoice) return;
        try {
            await api.post(`/api/appointments/${assigning}/assign-doctor`, { doctor_id: doctorChoice });
            const doc = allDoctors.find((d) => d.id === doctorChoice);
            setTickets(tickets.map((t) => (t.id === assigning ? { ...t, status: 'assigned', doctor_name: doc?.full_name ?? t.doctor_name } : t)));
            toast.success('Doctor assigned.');
            setAssigning(null);
        } catch (e) {
            toast.error(errorMessage(e, 'Assign failed'));
        }
    };

    const meta = tab === 'doctors' ? doctorMeta
        : tab === 'appointments' ? ticketMeta
        : tab === 'consultations' ? consultMeta
        : tab === 'labs' ? labMeta
        : tab === 'requests' ? requestsMeta
        : tab === 'content' ? contentMeta
        : tab === 'prescriptions' ? rxMeta
        : labBookingMeta;
    const page = tab === 'doctors' ? doctorPage
        : tab === 'appointments' ? ticketPage
        : tab === 'consultations' ? consultPage
        : tab === 'labs' ? labPage
        : tab === 'requests' ? requestsPage
        : tab === 'content' ? contentPage
        : tab === 'prescriptions' ? rxPage
        : labBookingPage;
    const setPage = tab === 'doctors' ? setDoctorPage
        : tab === 'appointments' ? setTicketPage
        : tab === 'consultations' ? setConsultPage
        : tab === 'labs' ? setLabPage
        : tab === 'requests' ? setRequestsPage
        : tab === 'content' ? setContentPage
        : tab === 'prescriptions' ? setRxPage
        : setLabBookingPage;
    const list: { id: string }[] = tab === 'doctors' ? doctors
        : tab === 'appointments' ? tickets
        : tab === 'consultations' ? consultations
        : tab === 'labs' ? labs
        : tab === 'requests' ? requests
        : tab === 'content' ? contents
        : tab === 'prescriptions' ? rxList
        : labBookings;

    const tabs: { key: Tab; label: string; icon: typeof Stethoscope }[] = [
        { key: 'doctors', label: 'Doctors', icon: Stethoscope },
        { key: 'appointments', label: 'Appointments', icon: CalendarCheck },
        { key: 'consultations', label: 'Consultations', icon: ClipboardList },
        { key: 'labs', label: 'Lab Tests', icon: FlaskConical },
        { key: 'lab-bookings', label: 'Lab Bookings', icon: CalendarCheck },
        { key: 'requests', label: 'Requests', icon: ClipboardList },
        { key: 'content', label: 'Content', icon: ClipboardList },
        { key: 'prescriptions', label: 'Prescriptions', icon: ClipboardList },
    ];

    const startDecide = (requestId: string) => {
        setDeciding(requestId);
        setDecideAction('contacted');
        setDecideNote('');
        if (allDoctors.length === 0) {
            api.get<{ data: Doctor[] }>('/api/doctors?per_page=100')
                .then((res) => setAllDoctors(rows<Doctor>(res)))
                .catch(() => toast.error('Failed to load doctors'));
        }
    };

    const decide = async () => {
        if (!deciding) return;
        try {
            const action = decideAction === 'contacted' ? 'contact'
                : decideAction === 'scheduled' ? 'schedule'
                : decideAction === 'closed' ? 'close' : 'cancel';
            const res = await api.put<{ data: ServiceRequest }>(`/api/admin/healthcare/service-requests/${deciding}`, {
                action,
                assigned_doctor_id: doctorChoice || undefined,
                admin_note: decideNote.trim() || undefined,
            });
            const updated = res.data;
            setRequests(requests.map((r) => (r.id === deciding ? { ...r, ...updated } : r)));
            toast.success('Request updated.');
            setDeciding(null);
            setDoctorChoice('');
        } catch (e) {
            toast.error(errorMessage(e, 'Update failed'));
        }
    };

    const submitContent = async (e: FormEvent) => {
        e.preventDefault();
        if (!contentForm.title.trim()) {
            toast.error('Title is required');
            return;
        }
        setSavingContent(true);
        try {
            await api.post('/api/admin/healthcare/content', {
                type: contentForm.type,
                title: contentForm.title.trim(),
                summary: contentForm.summary.trim() || undefined,
                url: contentForm.url.trim() || undefined,
                specialty: contentForm.specialty.trim() || undefined,
                is_active: true,
            });
            toast.success('Content published.');
            setShowContentForm(false);
            setContentForm({ type: 'prevention_guide', title: '', summary: '', url: '', specialty: '' });
            setContentPage(1);
            setLoading(true);
            api.get<{ data: HealthContent[]; meta: Meta }>('/api/admin/healthcare/content?page=1')
                .then((res) => { setContents(rows<HealthContent>(res)); setContentMeta(res.meta); })
                .finally(() => setLoading(false));
        } catch (err) {
            toast.error(errorMessage(err, 'Create failed'));
        } finally {
            setSavingContent(false);
        }
    };

    const toggleContentActive = async (item: HealthContent) => {
        try {
            await api.put(`/api/admin/healthcare/content/${item.id}`, { is_active: !item.is_active });
            setContents(contents.map((c) => (c.id === item.id ? { ...c, is_active: !c.is_active } : c)));
            toast.success(item.is_active ? 'Unpublished.' : 'Published.');
        } catch (err) {
            toast.error(errorMessage(err, 'Update failed'));
        }
    };

    return (
        <AdminLayout title="Healthcare">
            <Head title="Healthcare" />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Healthcare Management</h1>
                    {tab === 'doctors' && (
                        <button onClick={() => setShowForm(!showForm)}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                            <Plus className="h-4 w-4" /> New Doctor
                        </button>
                    )}
                    {tab === 'labs' && (
                        <button onClick={() => setShowLabForm(!showLabForm)}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                            <Plus className="h-4 w-4" /> New Lab Test
                        </button>
                    )}
                    {tab === 'content' && (
                        <button onClick={() => setShowContentForm(!showContentForm)}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                            <Plus className="h-4 w-4" /> New Content
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap gap-2">
                    {tabs.map((t) => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
                                tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                            <t.icon className="h-4 w-4" /> {t.label}
                        </button>
                    ))}
                </div>

{tab === 'doctors' && showForm && (
                    <form onSubmit={submitDoctor} className="space-y-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Add Doctor</h2>
                            <button type="button" onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <label className="text-sm">Full name *
                                <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Specialization *
                                <input required maxLength={100} value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Profession *
                                <select required value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                    <option value="doctor">Doctor</option>
                                    <option value="nurse">Nurse</option>
                                    <option value="chew">CHEW</option>
                                    <option value="dentist">Dentist</option>
                                    <option value="pharmacist">Pharmacist</option>
                                    <option value="medical_laboratory_scientist">Medical Laboratory Scientist</option>
                                    <option value="physiotherapist">Physiotherapist</option>
                                    <option value="optometrist">Optometrist</option>
                                    <option value="midwife">Midwife</option>
                                    <option value="dietitian">Dietitian</option>
                                    <option value="psychologist">Psychologist</option>
                                    <option value="other">Other</option>
                                </select></label>
                            <label className="text-sm">Qualification *
                                <input required value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Experience (years) *
                                <input required type="number" min={0} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Consultation fee *
                                <input required type="number" min={0} step="0.01" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: Number(e.target.value) })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Virtual fee
                                <input type="number" min={0} step="0.01" value={form.virtual_fee} onChange={(e) => setForm({ ...form, virtual_fee: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Home visit fee
                                <input type="number" min={0} step="0.01" value={form.home_visit_fee} onChange={(e) => setForm({ ...form, home_visit_fee: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                        </div>
                        <button type="submit" disabled={saving}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                            {saving ? 'Saving...' : 'Create Doctor'}
                        </button>
                    </form>
                )}

                {tab === 'labs' && showLabForm && (
                    <form onSubmit={submitLab} className="space-y-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Add Lab Test</h2>
                            <button type="button" onClick={() => setShowLabForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <label className="text-sm">Name *
                                <input required maxLength={150} value={labForm.name} onChange={(e) => setLabForm({ ...labForm, name: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Category *
                                <input required maxLength={100} value={labForm.category} onChange={(e) => setLabForm({ ...labForm, category: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Price *
                                <input required type="number" min={0} step="0.01" value={labForm.price} onChange={(e) => setLabForm({ ...labForm, price: Number(e.target.value) })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Result time (hours) *
                                <input required type="number" min={1} max={720} value={labForm.result_time_hours} onChange={(e) => setLabForm({ ...labForm, result_time_hours: Number(e.target.value) })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm sm:col-span-2">Preparation instructions
                                <input maxLength={1000} value={labForm.preparation_instructions} onChange={(e) => setLabForm({ ...labForm, preparation_instructions: e.target.value })}
                                    placeholder="e.g. Fast 8-10 hours beforehand"
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                        </div>
                        <button type="submit" disabled={savingLab}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                            {savingLab ? 'Saving...' : 'Create Lab Test'}
                        </button>
                    </form>
                )}

                {tab !== 'doctors' && tab !== 'lab-bookings' && (
                    <form onSubmit={searchNow} className="flex gap-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder={tab === 'labs' ? 'Test name or category...' : 'Ticket number or name...'}
                                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700" />
                        </div>
                        <button type="submit" className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 dark:bg-gray-600">Search</button>
                    </form>
                )}

                {tab === 'appointments' && (
                    <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'assigned', 'in_consultation', 'completed', 'cancelled'].map((s) => (
                            <button key={s} onClick={() => { setTicketStatus(s); setTicketPage(1); }}
                                className={`rounded-full px-3 py-1 text-sm font-medium ${ticketStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                )}

                {tab === 'lab-bookings' && (
                    <div className="flex flex-wrap gap-2">
                        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
                            <button key={s} onClick={() => { setLabStatus(s); setLabBookingPage(1); }}
                                className={`rounded-full px-3 py-1 text-sm font-medium ${labStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {tab === 'requests' && (
                    <div className="flex flex-wrap gap-2">
                        {['all', 'open', 'contacted', 'scheduled', 'closed', 'cancelled'].map((s) => (
                            <button key={s} onClick={() => { setRequestStatus(s); setRequestsPage(1); }}
                                className={`rounded-full px-3 py-1 text-sm font-medium ${requestStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {tab === 'content' && (
                    <div className="flex flex-wrap gap-2">
                        {['all', 'video', 'document', 'category', 'prevention_guide'].map((s) => (
                            <button key={s} onClick={() => { setContentType(s); setContentPage(1); }}
                                className={`rounded-full px-3 py-1 text-sm font-medium ${contentType === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                )}

                {tab === 'prescriptions' && (
                    <div className="flex flex-wrap gap-2">
                        {['all', 'active', 'filled', 'expired'].map((s) => (
                            <button key={s} onClick={() => { setRxStatus(s); setRxPage(1); }}
                                className={`rounded-full px-3 py-1 text-sm font-medium ${rxStatus === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {tab === 'content' && showContentForm && (
                    <form onSubmit={submitContent} className="space-y-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Publish Content</h2>
                            <button type="button" onClick={() => setShowContentForm(false)}><X className="h-4 w-4 text-gray-400" /></button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="text-sm">Type *
                                <select required value={contentForm.type} onChange={(e) => setContentForm({ ...contentForm, type: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                                    <option value="video">Video</option>
                                    <option value="document">Document</option>
                                    <option value="category">Category</option>
                                    <option value="prevention_guide">Prevention guide</option>
                                </select></label>
                            <label className="text-sm">Title *
                                <input required maxLength={255} value={contentForm.title} onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm sm:col-span-2">Summary
                                <input maxLength={2000} value={contentForm.summary} onChange={(e) => setContentForm({ ...contentForm, summary: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">URL
                                <input type="url" maxLength={2000} value={contentForm.url} onChange={(e) => setContentForm({ ...contentForm, url: e.target.value })}
                                    placeholder="https://…"
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                            <label className="text-sm">Specialty
                                <input maxLength={100} value={contentForm.specialty} onChange={(e) => setContentForm({ ...contentForm, specialty: e.target.value })}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700" /></label>
                        </div>
                        <button type="submit" disabled={savingContent}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                            {savingContent ? 'Publishing...' : 'Publish'}
                        </button>
                    </form>
                )}

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="font-medium text-red-600">{error}</p>
                    </div>
) : list.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <Stethoscope className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">Nothing here yet</p>
                    </div>
                ) : tab === 'doctors' ? (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Doctor</th>
                                    <th className="px-4 py-3">Profession</th>
                                    <th className="px-4 py-3">Specialization</th>
                                    <th className="px-4 py-3">Fee</th>
                                    <th className="px-4 py-3">Available</th>
                                    <th className="px-4 py-3">Rating</th>
                                    <th className="px-4 py-3">Experience</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {doctors.map((d) => (
                                    <tr key={d.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">Dr. {d.full_name}</p>
                                            <p className="text-xs text-gray-500">{d.qualification}</p>
                                        </td>
                                        <td className="px-4 py-3 capitalize text-sm text-indigo-600">{d.profession.replace('_', ' ')}</td>
                                        <td className="px-4 py-3 text-sm text-indigo-600">{d.specialization}</td>
                                        <td className="px-4 py-3 font-semibold">{formatCurrency(d.consultation_fee)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${d.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                {d.is_available ? 'Available' : 'Unavailable'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{d.rating != null ? Number(d.rating).toFixed(1) : '—'}</td>
                                        <td className="px-4 py-3">{d.experience_years ?? '—'} yrs</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : tab === 'appointments' ? (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Ticket</th>
                                    <th className="px-4 py-3">Patient</th>
                                    <th className="px-4 py-3">Doctor</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {tickets.map((t) => (
                                    <tr key={t.id}>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.ticket_number}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{t.patient_name}</p>
                                            <p className="text-xs text-gray-500">{t.patient_email}</p>
                                        </td>
                                        <td className="px-4 py-3">{t.doctor_name ?? '—'}</td>
                                        <td className="px-4 py-3 capitalize">{t.consultation_type ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{t.appointment_date ? formatDateTime(`${t.appointment_date}T${t.appointment_time ?? '00:00'}`) : '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(t.status)}`}>
                                                {t.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {t.status === 'pending' && (
                                                isSuper ? (
                                                    assigning === t.id ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <select value={doctorChoice} onChange={(e) => setDoctorChoice(e.target.value)}
                                                                className="rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700">
                                                                <option value="">Select doctor</option>
                                                                {allDoctors.map((d) => <option key={d.id} value={d.id}>Dr. {d.full_name}</option>)}
                                                            </select>
                                                            <button onClick={assign} disabled={!doctorChoice} title="Confirm"
                                                                className="rounded p-1 text-green-600 disabled:opacity-40"><Check className="h-4 w-4" /></button>
                                                            <button onClick={() => setAssigning(null)} title="Cancel"
                                                                className="rounded p-1 text-gray-500"><X className="h-4 w-4" /></button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => startAssign(t.id)}
                                                            className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500">Assign</button>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : tab === 'labs' ? (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Test</th>
                                    <th className="px-4 py-3">Category</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3">Result (hrs)</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {labs.map((lab) => (
                                    <tr key={lab.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{lab.name}</p>
                                            {lab.preparation_instructions && (
                                                <p className="text-xs text-gray-500">{lab.preparation_instructions}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-indigo-600">{lab.category}</td>
                                        <td className="px-4 py-3 font-semibold">{formatCurrency(lab.price)}</td>
                                        <td className="px-4 py-3">{lab.result_time_hours}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${lab.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                {lab.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => toggleLabActive(lab)}
                                                className="rounded-lg bg-gray-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-gray-700 dark:bg-gray-600">
                                                {lab.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : tab === 'lab-bookings' ? (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Booking</th>
                                    <th className="px-4 py-3">Patient</th>
                                    <th className="px-4 py-3">Test</th>
                                    <th className="px-4 py-3">Scheduled</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3">Paid</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {labBookings.map((b) => (
                                    <tr key={b.id}>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.booking_number}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{b.patient?.name ?? '—'}</p>
                                            <p className="text-xs text-gray-500">{b.patient?.email ?? ''}</p>
                                        </td>
                                        <td className="px-4 py-3">{b.lab_test?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {b.appointment_date ? `${b.appointment_date} ${b.appointment_time ?? ''}`.trim() : '—'}
                                        </td>
                                        <td className="px-4 py-3 font-semibold">{formatCurrency(b.price)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.is_paid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                {b.is_paid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(b.status)}`}>
                                                {b.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : tab === 'requests' ? (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Request</th>
                                    <th className="px-4 py-3">Patient</th>
                                    <th className="px-4 py-3">Professional</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {requests.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{r.title}</p>
                                            <p className="font-mono text-xs text-gray-500">{r.request_number} • {r.category}</p>
                                            <p className="max-w-xs text-xs text-gray-600 dark:text-gray-300">{r.details}</p>
                                            {r.admin_note && (
                                                <p className="mt-1 max-w-xs rounded bg-indigo-50 p-1.5 text-xs text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">
                                                    Note: {r.admin_note}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{r.patient?.name ?? '—'}</p>
                                            <p className="text-xs text-gray-500">{r.patient?.email ?? ''}</p>
                                        </td>
                                        <td className="px-4 py-3">{r.assigned_doctor?.full_name ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(r.status)}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {!['closed', 'cancelled'].includes(r.status) && (
                                                deciding === r.id ? (
                                                    <div className="min-w-52 space-y-1.5">
                                                        <select value={decideAction} onChange={(e) => setDecideAction(e.target.value)}
                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700">
                                                            {['contacted', 'scheduled', 'closed', 'cancelled']
                                                                .filter((s) => s !== r.status)
                                                                .map((s) => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                        <select value={doctorChoice} onChange={(e) => setDoctorChoice(e.target.value)}
                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700">
                                                            <option value="">No professional</option>
                                                            {allDoctors.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                                                        </select>
                                                        <input value={decideNote} onChange={(e) => setDecideNote(e.target.value)}
                                                            placeholder="Note for patient (optional)"
                                                            className="w-full rounded border border-gray-300 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700" />
                                                        <div className="flex items-center gap-1.5">
                                                            <button onClick={decide} title="Confirm"
                                                                className="rounded p-1 text-green-600"><Check className="h-4 w-4" /></button>
                                                            <button onClick={() => setDeciding(null)} title="Cancel"
                                                                className="rounded p-1 text-gray-500"><X className="h-4 w-4" /></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => startDecide(r.id)}
                                                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-500">Review</button>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : tab === 'content' ? (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Title</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Specialty</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {contents.map((c) => (
                                    <tr key={c.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{c.title}</p>
                                            {c.summary && (
                                                <p className="max-w-xs text-xs text-gray-500">{c.summary}</p>
                                            )}
                                            {c.url && (
                                                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">Open link</a>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm capitalize text-indigo-600">{c.type.replace('_', ' ')}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{c.specialty ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                {c.is_active ? 'Published' : 'Hidden'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => toggleContentActive(c)}
                                                className="rounded-lg bg-gray-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-gray-700 dark:bg-gray-600">
                                                {c.is_active ? 'Unpublish' : 'Publish'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : tab === 'prescriptions' ? (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Code</th>
                                    <th className="px-4 py-3">Patient</th>
                                    <th className="px-4 py-3">Doctor</th>
                                    <th className="px-4 py-3">Items</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Issued</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {rxList.map((p) => (
                                    <tr key={p.id}>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.code}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{p.patient?.name ?? '—'}</p>
                                            <p className="text-xs text-gray-500">{p.patient?.email ?? ''}</p>
                                        </td>
                                        <td className="px-4 py-3">{p.doctor?.full_name ?? '—'}</td>
                                        <td className="max-w-xs px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                                            {(p.items ?? []).map((i) => i.name).filter(Boolean).join(', ') || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusTone(p.status)}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(p.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Ticket</th>
                                    <th className="px-4 py-3">Patient</th>
                                    <th className="px-4 py-3">Doctor</th>
                                    <th className="px-4 py-3">Diagnosis</th>
                                    <th className="px-4 py-3">Follow-up</th>
                                    <th className="px-4 py-3">Recorded</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {consultations.map((c) => (
                                    <tr key={c.id}>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.ticket_number}</td>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.patient_name}</td>
                                        <td className="px-4 py-3">{c.doctor_name ?? '—'}</td>
                                        <td className="max-w-xs px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{c.diagnosis || '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{c.follow_up_date ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDateTime(c.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {meta && meta.total > (meta.per_page ?? PAGE) && (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Page {meta.page ?? meta.current_page} · {meta.total} records</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Previous</button>
                            <button disabled={page * (meta.per_page ?? PAGE) >= meta.total} onClick={() => setPage(page + 1)}
                                className="rounded-lg border border-gray-300 px-3 py-1 disabled:opacity-40 dark:border-gray-600">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
