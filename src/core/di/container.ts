/**
 * Tiny DI container. Modules resolve dependencies by contract token, never
 * by concrete class. Mirrors Laravel's service container `bind/make`.
 */
const registry = new Map<symbol, unknown>();

export function register<T>(token: symbol, impl: T): void {
  registry.set(token, impl);
}

export function resolve<T>(token: symbol): T {
  const impl = registry.get(token);
  if (!impl) throw new Error(`No implementation registered for ${token.toString()}`);
  return impl as T;
}

export function has(token: symbol): boolean {
  return registry.has(token);
}

export function reset(): void {
  registry.clear();
}

// Canonical contract tokens.
export const TOKENS = {
  Payment: Symbol.for("contract:Payment"),
  Notification: Symbol.for("contract:Notification"),
  Storage: Symbol.for("contract:Storage"),
  Search: Symbol.for("contract:Search"),
  Messaging: Symbol.for("contract:Messaging"),
  Analytics: Symbol.for("contract:Analytics"),
  Audit: Symbol.for("contract:Audit"),
  Cache: Symbol.for("contract:Cache"),
} as const;
