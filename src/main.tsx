// Sentry initialization MUST be imported first!
import "./instrument";
import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

const container = document.getElementById("root") as HTMLElement;

const root = ReactDOM.createRoot(container, {
  // React 19 error hooks integrated with Sentry
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.error("Uncaught error captured by Sentry:", error, errorInfo.componentStack);
  }),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
});

root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-screen bg-surface text-on-surface">
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-outline mb-4">An unexpected error occurred. It has been automatically logged.</p>
          <button
            className="px-4 py-2 bg-primary text-on-primary rounded-full font-semibold"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
