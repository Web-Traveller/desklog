import React, { useState } from 'react';
import { DeskProvider, useDesk } from './context/DeskContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { TasksPage } from './pages/TasksPage';
import { CalendarPage } from './pages/CalendarPage';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { ServicesPage } from './pages/ServicesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';

const MainContent: React.FC<{ onOpenHelpModal: () => void }> = ({ onOpenHelpModal }) => {
  const { currentPage } = useDesk();

  switch (currentPage) {
    case 'dashboard':
      return <DashboardPage />;
    case 'customers':
      return <CustomersPage />;
    case 'tasks':
      return <TasksPage />;
    case 'calendar':
      return <CalendarPage />;
    case 'search':
      return <SearchPage />;
    case 'profile':
      return <ProfilePage />;
    case 'services':
      return <ServicesPage />;
    case 'payments':
      return <PaymentsPage />;
    case 'settings':
      return <SettingsPage onOpenHelpModal={onOpenHelpModal} />;
    default:
      return <DashboardPage />;
  }
};

function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <DeskProvider>
      <Layout onOpenHelpModal={() => setIsHelpOpen(true)}>
        <MainContent onOpenHelpModal={() => setIsHelpOpen(true)} />
        <KeyboardShortcutsModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      </Layout>
    </DeskProvider>
  );
}

export default App;
