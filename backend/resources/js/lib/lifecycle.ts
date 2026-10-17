/**
 * W7 shared lifecycle map: one canonical tone set + label set for every
 * status pill in the UI (replaces the 28 per-page statusColors/statusTone
 * records that had drifted - e.g. cancelled red vs grey, completed green
 * vs blue), plus ordered lifecycle chains used for documentation/labels.
 */

/** Canonical status -> Tailwind tone classes. */
const TONES: Record<string, string> = {
    // waiting on someone
    pending: 'bg-amber-100 text-amber-800',
    requested: 'bg-yellow-100 text-yellow-800',
    waiting: 'bg-yellow-100 text-yellow-800',
    open: 'bg-blue-100 text-blue-800',
    submitted: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-blue-100 text-blue-800',
    accepted: 'bg-blue-100 text-blue-800',
    assigned: 'bg-blue-100 text-blue-800',
    checked_in: 'bg-blue-100 text-blue-800',
    in_review: 'bg-amber-100 text-amber-800',
    trial: 'bg-amber-100 text-amber-800',
    reviewing: 'bg-sky-100 text-sky-800',
    contacted: 'bg-sky-100 text-sky-800',
    scheduled: 'bg-teal-100 text-teal-800',
    negotiating: 'bg-amber-100 text-amber-800',
    // in flight
    processing: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-indigo-100 text-indigo-800',
    in_consultation: 'bg-indigo-100 text-indigo-800',
    offered: 'bg-indigo-100 text-indigo-800',
    // content / moderation (Learn 2.0)
    under_review: 'bg-sky-100 text-sky-800',
    needs_information: 'bg-orange-100 text-orange-800',
    draft: 'bg-gray-100 text-gray-600',
    hidden: 'bg-amber-100 text-amber-700',
    removed: 'bg-rose-100 text-rose-700',
    // money
    paid: 'bg-cyan-100 text-cyan-800',
    succeeded: 'bg-green-100 text-green-800',
    refund_requested: 'bg-amber-100 text-amber-800',
    refunded: 'bg-orange-100 text-orange-800',
    returned: 'bg-orange-100 text-orange-800',
    // logistics
    shipped: 'bg-purple-100 text-purple-800',
    in_transit: 'bg-purple-100 text-purple-800',
    picked_up: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    // done / positive
    completed: 'bg-green-100 text-green-800',
    approved: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    filled: 'bg-emerald-100 text-emerald-800',
    verified: 'bg-green-100 text-green-800',
    // closed / muted
    checked_out: 'bg-gray-100 text-gray-800',
    closed: 'bg-gray-100 text-gray-800',
    resolved: 'bg-gray-100 text-gray-800',
    expired: 'bg-gray-100 text-gray-600',
    paused: 'bg-yellow-100 text-yellow-800',
    // negative
    cancelled: 'bg-red-100 text-red-700',
    rejected: 'bg-red-100 text-red-700',
    suspended: 'bg-red-100 text-red-700',
    failed: 'bg-red-100 text-red-800',
    disputed: 'bg-rose-100 text-rose-800',
    requires_action: 'bg-orange-100 text-orange-800',
};

const FALLBACK = 'bg-gray-100 text-gray-600';

/** Tone classes for a status value (neutral pill when unknown). */
export function statusTone(status?: string | null): string {
    if (!status) return FALLBACK;
    return TONES[status] ?? FALLBACK;
}

/** `in_progress` -> `In Progress`; explicit overrides win. */
const LABELS: Record<string, string> = {
    in_progress: 'In Progress',
    in_transit: 'In Transit',
    in_consultation: 'In Consultation',
    in_review: 'In Review',
    under_review: 'Under Review',
    needs_information: 'Needs Information',
    refund_requested: 'Refund Requested',
    requires_action: 'Requires Action',
    checked_in: 'Checked In',
    checked_out: 'Checked Out',
    picked_up: 'Picked Up',
    succeeded: 'Succeeded',
};

export function statusLabel(status?: string | null): string {
    if (!status) return '-';
    if (LABELS[status]) return LABELS[status];
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Canonical lifecycle chains (server enforced - see the domain
 * controllers' invalid_transition 422 responses). Display/documentation
 * helper: nextStatuses() powers future transition pickers.
 */
export const LIFECYCLES: Record<string, readonly string[]> = {
    order: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed'],
    order_return: ['pending', 'approved', 'received', 'refunded'],
    medicine_order: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    ride: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'],
    job_application: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
    work_request: ['open', 'negotiating', 'accepted', 'paid', 'cancelled'],
    ticket: ['open', 'pending', 'resolved', 'closed'],
    delivery: ['pending', 'picked_up', 'in_transit', 'delivered'],
    kyc: ['pending', 'in_review', 'approved', 'rejected'],
    subscription: ['pending', 'active', 'paused', 'expired', 'cancelled'],
};

/** Allowed next statuses for a domain + current status (empty = unknown/terminal). */
export function nextStatuses(domain: string, status: string): string[] {
    const chain = LIFECYCLES[domain];
    if (!chain) return [];
    const idx = chain.indexOf(status);
    if (idx < 0 || idx >= chain.length - 1) return [];
    return [chain[idx + 1]];
}
