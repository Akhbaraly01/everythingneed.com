function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}
class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
function errorMessage(e, fallback = "Something went wrong") {
  if (e instanceof ApiError && e.message) return e.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
function rows(payload) {
  const d = payload == null ? void 0 : payload.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  return [];
}
async function request(method, url, body) {
  const headers = { Accept: "application/json" };
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== void 0) {
    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }
    headers["X-XSRF-TOKEN"] = readCookie("XSRF-TOKEN");
  }
  const response = await fetch(url, {
    method,
    headers,
    credentials: "same-origin",
    body: body === void 0 ? void 0 : isFormData ? body : JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      (payload == null ? void 0 : payload.message) ?? (payload == null ? void 0 : payload.error) ?? `Request failed (${response.status})`,
      response.status,
      payload == null ? void 0 : payload.errors
    );
  }
  return payload;
}
const api = {
  get: (url, opts) => {
    if (opts == null ? void 0 : opts.params) {
      const qs = new URLSearchParams(
        Object.entries(opts.params).map(([k, v]) => [k, String(v)])
      ).toString();
      url += (url.includes("?") ? "&" : "?") + qs;
    }
    return request("GET", url);
  },
  post: (url, body) => request("POST", url, body ?? {}),
  put: (url, body) => request("PUT", url, body ?? {}),
  patch: (url, body) => request("PATCH", url, body ?? {}),
  del: (url) => request("DELETE", url)
};
export {
  ApiError as A,
  api as a,
  errorMessage as e,
  rows as r
};
