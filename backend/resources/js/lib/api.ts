/**
 * Same-origin JSON client for Inertia pages.
 * Laravel Sanctum treats same-origin requests as stateful; the XSRF cookie
 * is echoed back in the X-XSRF-TOKEN header for CSRF verification.
 */
function readCookie(name: string): string {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
}

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public errors?: Record<string, string[]>,
    ) {
        super(message);
    }
}

/**
 * Extract a human-readable message from any thrown value.
 * All client errors surface as ApiError - never read axios-style
 * `error.response.data.message`, which would silently drop the reason.
 */
export function errorMessage(e: unknown, fallback = 'Something went wrong'): string {
    if (e instanceof ApiError && e.message) return e.message;
    if (e instanceof Error && e.message) return e.message;
    return fallback;
}

/**
 * Normalize list payloads: some endpoints return `{ data: T[] }`, paginated
 * ones return `{ data: { data: T[] } }`. Use after `api.get(...)`.
 */
export function rows<T>(payload: { data?: T[] | { data?: T[] } | null }): T[] {
    const d = payload?.data;
    if (Array.isArray(d)) return d;
    if (d && Array.isArray(d.data)) return d.data;
    return [];
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    if (body !== undefined) {
        // FormData sets its own multipart boundary — never force JSON there.
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        headers['X-XSRF-TOKEN'] = readCookie('XSRF-TOKEN');
    }

    const response = await fetch(url, {
        method,
        headers,
        credentials: 'same-origin',
        body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        throw new ApiError(
            payload?.message ?? payload?.error ?? `Request failed (${response.status})`,
            response.status,
            payload?.errors,
        );
    }

    return payload as T;
}

export const api = {
    get: <T>(url: string, opts?: { params?: Record<string, string | number | boolean> }) => {
        if (opts?.params) {
            const qs = new URLSearchParams(
                Object.entries(opts.params).map(([k, v]) => [k, String(v)]),
            ).toString();
            url += (url.includes('?') ? '&' : '?') + qs;
        }
        return request<T>('GET', url);
    },
    post: <T>(url: string, body?: unknown) => request<T>('POST', url, body ?? {}),
    put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body ?? {}),
    patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, body ?? {}),
    del: <T>(url: string) => request<T>('DELETE', url),
    /**
     * Fetch a binary/text file (CSV export) and trigger a browser download.
     * The generic request() path parses JSON, so downloads need their own
     * fetch. Server errors still surface as ApiError with the JSON message.
     */
    download: async (url: string, filename: string): Promise<void> => {
        const response = await fetch(url, {
            headers: { Accept: 'text/csv' },
            credentials: 'same-origin',
        });

        if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as
                | { message?: string }
                | null;
            throw new ApiError(
                payload?.message ?? `Download failed (${response.status})`,
                response.status,
            );
        }

        const blob = await response.blob();
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(href);
    },
};
