import React, { useState, useEffect, Suspense, lazy } from "react";
import { DeskProvider, useDesk } from "./context/DeskContext";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { PageSkeletonLoader } from "./components/PageSkeletonLoader";
import { AppNotificationBanner } from "./components/AppNotificationBanner";
import { sendHeartbeat, isDeviceBlockedLocally } from "./services/telemetryService";
import { initSilentAutoUpdater } from "./services/autoUpdater";

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

function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [allowed, setAllowed] = useState<boolean>(() => !isDeviceBlockedLocally());

  useEffect(() => {
    // 1. Silent diagnostic check-in on app launch
    sendHeartbeat().then((res) => {
      if (res) {
        setAllowed(res.allowed);
      }
    }).catch((err) => {
      console.warn('Startup diagnostic error:', err);
    });

    // 2. Completely silent background auto-updater (downloads quietly, installs on exit)
    const cleanupUpdater = initSilentAutoUpdater();
    return () => {
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
