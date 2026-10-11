import type { NeedOffer, NeedRequestDetail, NeedStatus } from '@/types';

export const NEED_STATUS_LABELS: Record<NeedStatus, string> = {
    draft: 'Draft',
    pending: 'Submitted',
    published: 'Published',
    reviewing: 'Reviewing offers',
    offered: 'Offers received',
    negotiating: 'Negotiation',
    accepted: 'Accepted',
    payment_pending: 'Payment pending',
    paid: 'Paid',
    in_progress: 'In progress',
    fulfilled: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
    expired: 'Expired',
    disputed: 'Disputed',
    refunded: 'Refunded',
};

/** Tailwind pill classes per lifecycle bucket (spec S13). */
export function needStatusClasses(status: NeedStatus): string {
    switch (status) {
        case 'draft':
            return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        case 'pending':
        case 'published':
        case 'reviewing':
        case 'offered':
        case 'negotiating':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
        case 'accepted':
        case 'payment_pending':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
        case 'paid':
        case 'in_progress':
        case 'fulfilled':
            return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
        case 'completed':
            return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
        case 'disputed':
            return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
        default:
            return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    }
}

/** Canonical detail URL for a request (spec S12 /needs/{category}/{id}). */
export function needDetailUrl(need: NeedRequestDetail): string {
    return need.category?.slug
        ? `/needs/${need.category.slug}/${need.id}`
        : `/needs/requests/${need.id}`;
}

export function acceptedOffer(need: NeedRequestDetail): NeedOffer | undefined {
    return (need.offers ?? []).find((o) => o.status === 'accepted');
}
