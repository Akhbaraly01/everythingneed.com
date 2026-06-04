// Global app configuration. Read env once, expose typed config.
export const appConfig = {
  appName: "EverythingNeed",
  defaultLocale: "en",
  defaultCurrency: "USD",
  isProd: import.meta.env.PROD,
} as const;
