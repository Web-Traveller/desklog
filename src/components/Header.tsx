import React from "react";
import { useDesk } from "../context/DeskContext";

interface HeaderProps {
  onOpenHelpModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHelpModal }) => {
  const {
    searchQuery,
    performSearch,
    taskDateFilter,
    setTaskDateFilter,
    setIsAddCustomerOpen,
    setIsAddTaskOpen,
  } = useDesk();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-surface-container/60">
      <div className="h-16 w-full px-gutter flex items-center justify-between gap-space-md">
        {/* Brand / Logo */}
        <div className="flex items-center gap-space-sm min-w-max">
          <div className="h-8 w-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold shadow-sm">
            <span className="material-symbols-outlined text-xl">
              folder_managed
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-tagline text-tagline text-primary tracking-tight font-semibold">
              DeskLog
            </span>
            <span className="font-micro-legal text-micro-legal text-on-surface-variant uppercase tracking-wider">
              Desk Manager
            </span>
          </div>
        </div>

        {/* Global Search Bar with '/' Hotkey Badge */}
        <div className="flex-1 max-w-xl mx-space-sm">
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-space-sm text-outline pointer-events-none text-xl">
              search
            </span>
            <input
              id="global-search-input"
              className="w-full pl-10 pr-12 py-space-xs rounded-full bg-surface-container-low text-on-surface placeholder:text-outline font-button-utility text-button-utility transition-all focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-inner"
              placeholder="Search customer name, mobile, or task..."
              type="text"
              value={searchQuery}
              onChange={(e) => performSearch(e.target.value)}
            />
            {searchQuery ? (
              <button
                className="absolute right-space-sm text-outline hover:text-on-surface p-0.5 rounded-full"
                onClick={() => performSearch("")}
                title="Clear search (Esc)"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            ) : (
              <kbd className="absolute right-3 px-1.5 py-0.5 rounded bg-surface-container text-outline font-mono text-[10px] font-bold border border-surface-container-high/60 pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Top Header Controls */}
        <div className="flex items-center gap-space-sm min-w-max">
          {/* Keyboard Shortcuts Trigger Button */}
          {onOpenHelpModal && (
            <button
              className="hidden md:flex items-center gap-1 px-space-xs py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-fine-print text-fine-print transition-all border border-surface-container-high/50"
              onClick={onOpenHelpModal}
              title="Keyboard Shortcuts (?)"
              type="button"
            >
              <span className="material-symbols-outlined text-sm text-primary">
                keyboard
              </span>
              <span>Hotkeys</span>
            </button>
          )}

          {/* Task Date Filter */}
          <div className="flex items-center gap-1 px-space-sm py-1.5 rounded-full bg-surface-container text-on-surface font-fine-print text-fine-print border border-surface-container-high/50">
            <span className="material-symbols-outlined text-sm text-outline">
              calendar_today
            </span>
            <span className="text-on-surface-variant">Tasks:</span>
            <select
              className="bg-transparent font-medium text-on-surface focus:outline-none cursor-pointer pr-1"
              value={taskDateFilter}
              onChange={(e) => setTaskDateFilter(e.target.value)}
            >
              <option value="Last 7 days">Last 7 days</option>
              <option value="Last 3 days">Last 3 days</option>
              <option value="Today">Today</option>
            </select>
          </div>

          {/* Quick Action Buttons */}
          <button
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container hover:bg-surface-container-high transition-all active:scale-95 text-on-surface font-button-utility text-button-utility shadow-sm border border-surface-container-high/50"
            onClick={() => setIsAddCustomerOpen(true)}
            title="Add New Customer (Ctrl+Shift+C)"
            type="button"
          >
            <span className="material-symbols-outlined text-lg text-primary">
              person_add
            </span>
            <span>+ Add Customer</span>
          </button>

          <button
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-primary-container hover:bg-primary transition-all active:scale-95 text-on-primary font-button-utility text-button-utility shadow-[0_2px_8px_rgba(0,102,204,0.3)] font-medium"
            onClick={() => setIsAddTaskOpen(true)}
            title="Create New Task (Ctrl+N)"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">add_task</span>
            <span>+ Add Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};
