import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://affd4ddc87871dff8e862426b2a53b4b@o4512177713774592.ingest.us.sentry.io/4512177713774592",
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
