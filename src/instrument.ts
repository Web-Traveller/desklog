import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || "https://affd4ddc87871dff8e862426b2a53b4b@o4512177683562496.ingest.us.sentry.io/4512177713774592";

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^\//],
  debug: false,
});
