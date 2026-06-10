import { describe, it, expect, beforeEach, vi } from "vitest";
import { sanitizeText, escapeHtml, sha256, hmacSha256, RateLimiter } from "../index";

describe("sanitizeText", () => {
  it("strips <script> blocks", () => {
    expect(sanitizeText("hi<script>alert(1)</script>!")).toBe("hi!");
  });
  it("strips multiline script tags case-insensitively", () => {
    expect(sanitizeText("a<SCRIPT>\nx\n</SCRIPT>b")).toBe("ab");
  });
  it("trims and enforces maxLength", () => {
    expect(sanitizeText("  hello  ", 3)).toBe("hel");
  });
  it("passes through safe text", () => {
    expect(sanitizeText("Plain text 123")).toBe("Plain text 123");
  });
});

describe("escapeHtml", () => {
  it.each([
    ["<", "&lt;"],
    [">", "&gt;"],
    ["&", "&amp;"],
    ['"', "&quot;"],
    ["'", "&#39;"],
  ])("escapes %s", (input, out) => {
    expect(escapeHtml(input)).toBe(out);
  });
  it("escapes a full XSS payload", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });
});

describe("sha256", () => {
  it("matches known answer for empty string", async () => {
    expect(await sha256("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
  it("matches known answer for 'abc'", async () => {
    expect(await sha256("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
  it("is deterministic", async () => {
    expect(await sha256("lovable")).toBe(await sha256("lovable"));
  });
});

describe("hmacSha256", () => {
  it("matches RFC 4231 test vector (key='key', data='The quick brown fox jumps over the lazy dog')", async () => {
    expect(await hmacSha256("key", "The quick brown fox jumps over the lazy dog")).toBe(
      "f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8",
    );
  });
  it("detects tamper: different message ⇒ different signature", async () => {
    const sigA = await hmacSha256("k", "hello");
    const sigB = await hmacSha256("k", "hellp");
    expect(sigA).not.toBe(sigB);
  });
  it("detects tamper: different key ⇒ different signature", async () => {
    const sigA = await hmacSha256("k1", "msg");
    const sigB = await hmacSha256("k2", "msg");
    expect(sigA).not.toBe(sigB);
  });
});

describe("RateLimiter", () => {
  beforeEach(() => vi.useFakeTimers());

  it("allows up to max and blocks after", () => {
    const rl = new RateLimiter(1000, 3);
    expect(rl.allow("u")).toBe(true);
    expect(rl.allow("u")).toBe(true);
    expect(rl.allow("u")).toBe(true);
    expect(rl.allow("u")).toBe(false);
  });

  it("isolates keys", () => {
    const rl = new RateLimiter(1000, 1);
    expect(rl.allow("a")).toBe(true);
    expect(rl.allow("b")).toBe(true);
    expect(rl.allow("a")).toBe(false);
  });

  it("resets after window expiry", () => {
    const rl = new RateLimiter(1000, 1);
    expect(rl.allow("u")).toBe(true);
    expect(rl.allow("u")).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rl.allow("u")).toBe(true);
  });
});
