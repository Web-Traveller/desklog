import React, { useState, useEffect, Suspense, lazy } from "react";
import { DeskProvider, useDesk } from "./context/DeskContext";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { PageSkeletonLoader } from "./components/PageSkeletonLoader";
import { AppNotificationBanner } from "./components/AppNotificationBanner";
import { sendHeartbeat, isDeviceBlockedLocally } from "./services/telemetryService";
import { initSilentAutoUpdater } from "./services/autoUpdater";
import * as Sentry from "@sentry/react";
import { APP_VERSION } from "./constants/version";

// Lazy-loaded route pages for code splitting & bundle size optimization
const CustomersPage = lazy(() =>
  import("./pages/CustomersPage").then((m) => ({ default: m.CustomersPage })),
);
const TasksPage = lazy(() =>
  import("./pages/TasksPage").then((m) => ({ default: m.TasksPage })),
);
const CalendarPage = lazy(() =>
  import("./pages/CalendarPage").then((m) => ({ default: m.CalendarPage })),
);
const SearchPage = lazy(() =>
  import("./pages/SearchPage").then((m) => ({ default: m.SearchPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const ServicesPage = lazy(() =>
  import("./pages/ServicesPage").then((m) => ({ default: m.ServicesPage })),
);
const PaymentsPage = lazy(() =>
  import("./pages/PaymentsPage").then((m) => ({ default: m.PaymentsPage })),
);
const BankingPage = lazy(() =>
  import("./pages/BankingPage").then((m) => ({ default: m.BankingPage })),
);

const MainContent: React.FC<{ onOpenHelpModal: () => void }> = ({
  onOpenHelpModal,
}) => {
  const { currentPage } = useDesk();

  return (
    <Suspense fallback={<PageSkeletonLoader />}>
      {(() => {
        switch (currentPage) {
          case "dashboard":
            return <DashboardPage />;
          case "customers":
            return <CustomersPage />;
          case "tasks":
            return <TasksPage />;
          case "calendar":
            return <CalendarPage />;
          case "search":
            return <SearchPage />;
          case "profile":
            return <ProfilePage />;
          case "services":
            return <ServicesPage />;
          case "payments":
            return <PaymentsPage />;
          case "banking":
            return <BankingPage />;
          case "settings":
            return <SettingsPage onOpenHelpModal={onOpenHelpModal} />;
          default:
            return <DashboardPage />;
        }
      })()}
    </Suspense>
  );
};

// Heartbeat frequency: check once every 12 hours (twice daily) to conserve server bandwidth
// Launch check runs asynchronously in the background so app loads instantly for the user
const HEARTBEAT_INTERVAL_MS = 12 * 60 * 60 * 1000;

function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [allowed, setAllowed] = useState<boolean>(() => !isDeviceBlockedLocally());

  useEffect(() => {
    // 0. Log version startup / update event to Sentry
    const prevVersion = localStorage.getItem('desklog_installed_version');
    if (prevVersion !== APP_VERSION) {
      localStorage.setItem('desklog_installed_version', APP_VERSION);
      Sentry.captureMessage(
        prevVersion
          ? `[UPDATE_INSTALLED] DeskLog successfully updated from v${prevVersion} to v${APP_VERSION}`
          : `[INITIAL_INSTALL] DeskLog installed at v${APP_VERSION}`,
        {
          level: 'info',
          tags: {
            event: prevVersion ? 'update_installed' : 'initial_install',
            previous_version: prevVersion || 'none',
            current_version: APP_VERSION,
          },
        }
      );
    }

    // 1. Silent background diagnostic check-in
    // Normal users get instant app launch with zero latency.
    // The background check verifies device status asynchronously and locks the screen only if revoked.
    const performCheck = () => {
      sendHeartbeat().then((res) => {
        if (res) {
          setAllowed(res.allowed);
        }
      }).catch((err) => {
        console.warn('Diagnostic check-in error:', err);
      });
    };

    // Defer the initial check by 1.5 seconds so React completes initial render and paint instantly
    const initialCheckTimer = setTimeout(performCheck, 1500);
    const heartbeatTimer = setInterval(performCheck, HEARTBEAT_INTERVAL_MS);

    // 2. Completely silent background auto-updater (downloads quietly, installs on exit)
    const cleanupUpdater = initSilentAutoUpdater();
    return () => {
      clearTimeout(initialCheckTimer);
      clearInterval(heartbeatTimer);
      cleanupUpdater();
    };
  }, []);

  return (
    <DeskProvider>
      <AppNotificationBanner
        allowed={allowed}
        onRetryCheck={(newAllowed) => setAllowed(newAllowed)}
      />
      <Layout onOpenHelpModal={() => setIsHelpOpen(true)}>
        <MainContent onOpenHelpModal={() => setIsHelpOpen(true)} />
        <KeyboardShortcutsModal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
        />
      </Layout>
    </DeskProvider>
  );
}

export default App;
