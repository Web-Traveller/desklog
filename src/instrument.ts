import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  // Performance Monitoring / Tracing sample rate
  tracesSampleRate: 1.0,
  // Enable trace propagation for local requests
  tracePropagationTargets: ["localhost", /^\//],
  // Disable debug output by default
  debug: false,
});
