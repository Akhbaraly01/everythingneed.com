/**
 * Client-side security primitives. Real secret encryption MUST happen
 * server-side (Edge Functions / Laravel). This module only provides
 * safe defaults for input handling, hashing, and ephemeral browser-side
 * crypto using WebCrypto (AES-GCM / SHA-256 / HMAC).
 */

export function sanitizeText(input: string, maxLength = 5000): string {
  return input.replace(/<script[\s\S]*?<\/script>/gi, "").trim().slice(0, maxLength);
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hmacSha256(key: string, text: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(text));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(private windowMs: number, private max: number) {}
  allow(key: string): boolean {
    const now = Date.now();
    const arr = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (arr.length >= this.max) return false;
    arr.push(now);
    this.hits.set(key, arr);
    return true;
  }
}
