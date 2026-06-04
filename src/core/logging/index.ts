type Level = "debug" | "info" | "warn" | "error";
const enabled: Record<Level, boolean> = {
  debug: !import.meta.env.PROD,
  info: true,
  warn: true,
  error: true,
};
function log(level: Level, scope: string, ...args: unknown[]) {
  if (!enabled[level]) return;
  // eslint-disable-next-line no-console
  console[level === "debug" ? "log" : level](`[${scope}]`, ...args);
}
export const logger = {
  debug: (scope: string, ...a: unknown[]) => log("debug", scope, ...a),
  info: (scope: string, ...a: unknown[]) => log("info", scope, ...a),
  warn: (scope: string, ...a: unknown[]) => log("warn", scope, ...a),
  error: (scope: string, ...a: unknown[]) => log("error", scope, ...a),
};
