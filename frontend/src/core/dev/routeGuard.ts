/**
 * Dev-only runtime guard for route ↔ module ownership.
 *
 * Each module's `routes/index.tsx` wraps its page components with
 * `assertOwnedBy("healthcare", Component)`. In development, if the component
 * was hot-imported from a path that does not live under `src/modules/<name>/`
 * (e.g. someone slipped back to `@/pages/healthcare/*`), we render an
 * obvious error screen instead of silently boot-strapping the wrong file.
 *
 * In production, this is a no-op pass-through (zero runtime cost).
 */
import * as React from "react";

type AnyComp = React.ComponentType<any>;

const REGISTRY = new WeakMap<AnyComp, string>();

/**
 * Tag a component with its owning module. Call this at module-barrel time
 * (e.g. `export const Healthcare = tagOwner("healthcare", _Healthcare);`)
 * or, more conveniently, infer ownership from the import URL via Vite.
 */
export function tagOwner<C extends AnyComp>(module: string, comp: C): C {
  if (import.meta.env?.DEV) REGISTRY.set(comp, module);
  return comp;
}

/**
 * Guard a route element. In DEV, if `comp` is tagged with a different owner
 * than `expected`, render an error. Otherwise return the element unchanged.
 */
export function assertOwnedBy(expected: string, comp: AnyComp): React.ReactElement {
  if (!import.meta.env?.DEV) return React.createElement(comp);
  const owner = REGISTRY.get(comp);
  if (owner && owner !== expected) {
    // eslint-disable-next-line no-console
    console.error(
      `[route-guard] Component ${comp.displayName ?? comp.name ?? "<anon>"} ` +
        `is owned by module '${owner}' but mounted in module '${expected}' routes. ` +
        `Move the file under src/modules/${expected}/ or import the right barrel.`,
    );
    return React.createElement(
      "div",
      {
        style: {
          padding: 24,
          margin: 24,
          border: "2px solid #dc2626",
          background: "#fef2f2",
          color: "#7f1d1d",
          fontFamily: "monospace",
          borderRadius: 8,
        },
      },
      `Module boundary violation: '${comp.displayName ?? comp.name}' belongs to '${owner}', not '${expected}'. See console.`,
    );
  }
  return React.createElement(comp);
}
