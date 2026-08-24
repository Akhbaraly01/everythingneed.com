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

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        headers['X-XSRF-TOKEN'] = readCookie('XSRF-TOKEN');
    }

    const response = await fetch(url, {
        method,
        headers,
        credentials: 'same-origin',
        body: body === undefined ? undefined : JSON.stringify(body),
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
    get: <T>(url: string) => request<T>('GET', url),
    post: <T>(url: string, body?: unknown) => request<T>('POST', url, body ?? {}),
    put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body ?? {}),
};
