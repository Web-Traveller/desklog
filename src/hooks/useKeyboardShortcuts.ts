import { useEffect } from 'react';
import { useDesk } from '../context/DeskContext';

export function useKeyboardShortcuts(onToggleHelpModal: () => void) {
  const {
    setIsAddTaskOpen,
    setIsAddCustomerOpen,
    isAddTaskOpen,
    isAddCustomerOpen,
    performSearch,
    searchQuery,
    setCurrentPage,
  } = useDesk();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputActive =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          (activeElement as HTMLElement).isContentEditable);

      const isControlOrCmd = e.ctrlKey || e.metaKey;

      // 1. ESC -> Close modals or clear search
      if (e.key === 'Escape') {
        if (isAddTaskOpen) {
          setIsAddTaskOpen(false);
          e.preventDefault();
          return;
        }
        if (isAddCustomerOpen) {
          setIsAddCustomerOpen(false);
          e.preventDefault();
          return;
        }
        if (searchQuery) {
          performSearch('');
          e.preventDefault();
          return;
        }
      }

      // 2. Ctrl/Cmd + Shift + C -> Add Customer
      if (isControlOrCmd && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        setIsAddCustomerOpen(true);
        return;
      }

      // 3. Ctrl/Cmd + N -> Add Task
      if (isControlOrCmd && !e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        setIsAddTaskOpen(true);
        return;
      }

      // 4. Ctrl/Cmd + 1..4 -> Navigation
      if (isControlOrCmd && !isInputActive) {
        if (e.key === '1') {
          e.preventDefault();
          setCurrentPage('dashboard');
          return;
        }
        if (e.key === '2') {
          e.preventDefault();
          setCurrentPage('customers');
          return;
        }
        if (e.key === '3') {
          e.preventDefault();
          setCurrentPage('calendar');
          return;
        }
        if (e.key === '4') {
          e.preventDefault();
          setCurrentPage('settings');
          return;
        }
      }

      // Below shortcuts only trigger if NOT currently typing inside an input field
      if (isInputActive) return;

      // 5. Slash '/' -> Focus global search input
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // 6. '?' -> Open Hotkeys modal
      if (e.key === '?') {
        e.preventDefault();
        onToggleHelpModal();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAddTaskOpen,
    isAddCustomerOpen,
    searchQuery,
    setIsAddTaskOpen,
    setIsAddCustomerOpen,
    performSearch,
    setCurrentPage,
    onToggleHelpModal,
  ]);
}
