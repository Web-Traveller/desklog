import React, { useState } from "react";
import { useDesk } from "../context/DeskContext";
import { open } from "@tauri-apps/plugin-dialog";
import { APP_VERSION } from "../constants/version";

interface SettingsPageProps {
  onOpenHelpModal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenHelpModal,
}) => {
  const {
    customers,
    tasks,
    payments,
    services,
    createDatabaseBackup,
    restoreDatabaseBackup,
    showConfirm,
    showToast,
  } = useDesk();

  const [restorePathInput, setRestorePathInput] = useState("");

  const handleBackupDbNow = async () => {
    const backupPath = await createDatabaseBackup();
    if (backupPath) {
      showToast(`Backup created in AppData: ${backupPath}`, "success");
    }
  };

  const handleChooseBackupFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        title: "Select DeskLog SQLite Backup File",
        filters: [
          {
            name: "SQLite Database",
            extensions: ["db", "sqlite", "sqlite3"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        setRestorePathInput(selected);
      }
    } catch (err) {
      console.error("File dialog error:", err);
      showToast("Could not open file picker dialog", "error");
    }
  };

  const handleRestoreFromPath = () => {
    if (!restorePathInput.trim()) {
      showToast("Please choose or enter a valid backup file path", "warning");
      return;
    }

    showConfirm({
      title: "Restore Database Backup?",
      message:
        "Restoring will update your local records with the data from this backup file. A safe automatic snapshot of your current database will be saved first in AppData before restoration. Proceed?",
      confirmText: "Restore Database",
      variant: "danger",
      onConfirm: async () => {
        const success = await restoreDatabaseBackup(restorePathInput.trim());
        if (success) {
          setRestorePathInput("");
        }
      },
    });
  };

  const cleanCSVCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    // Sanitization for formula injection characters (=, +, -, @)
    if (/^[=+\-@]/.test(str)) {
      return `"'${str}"`;
    }
    return `"${str}"`;
  };

  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}`, "success");
  };

  const exportCustomersCSV = () => {
    const headers = ["ID", "Name", "Mobile", "Aadhaar", "Note", "Verified", "Created At"];
    const rows = customers.map((c) => [
      cleanCSVCell(c.id),
      cleanCSVCell(c.name),
      cleanCSVCell(c.mobile || ""),
      cleanCSVCell(c.aadhaar_number || ""),
      cleanCSVCell(c.note || ""),
      cleanCSVCell(c.is_verified ? "Yes" : "No"),
      cleanCSVCell(c.created_at),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(`desklog_customers_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const exportTasksCSV = () => {
    const headers = [
      "ID",
      "Title",
      "Customer ID",
      "Customer Name",
      "Service ID",
      "Status",
      "Billing Amount (Paise)",
      "Target Date",
      "Scheduled Date",
      "Notes",
      "Created At",
    ];
    const rows = tasks.map((t) => {
      const cust = customers.find((c) => c.id === t.customer_id);
      return [
        cleanCSVCell(t.id),
        cleanCSVCell(t.title),
        cleanCSVCell(t.customer_id),
        cleanCSVCell(cust?.name || ""),
        cleanCSVCell(t.service_id || ""),
        cleanCSVCell(t.status),
        cleanCSVCell(t.billing_amount || 0),
        cleanCSVCell(t.target_date || ""),
        cleanCSVCell(t.scheduled_date || ""),
        cleanCSVCell(t.notes || ""),
        cleanCSVCell(t.created_at),
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(`desklog_tasks_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const exportPaymentsCSV = () => {
    const headers = ["ID", "Task ID", "Task Title", "Customer Name", "Amount (Paise)", "Created At"];
    const rows = payments.map((p) => {
      const task = tasks.find((t) => t.id === p.task_id);
      const cust = task ? customers.find((c) => c.id === task.customer_id) : null;
      return [
        `"${p.id}"`,
        `"${p.task_id}"`,
        `"${(task?.title || "").replace(/"/g, '""')}"`,
        `"${(cust?.name || "").replace(/"/g, '""')}"`,
        `"${p.amount}"`,
        `"${p.created_at}"`,
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(`desklog_payments_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter py-space-xl flex flex-col gap-space-xl animate-slideUp">
      <div className="flex flex-col gap-space-xxs border-b border-surface-container pb-space-xs">
        <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-semibold">
          Settings & System Configuration
        </h1>
        <p className="font-body text-body text-on-surface-variant max-w-2xl">
          Manage system preferences, keyboard shortcuts, database backups, and CSV data exports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column */}
        <div className="lg:col-span-6 flex flex-col gap-space-lg">
          {/* General Preferences */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs border-b border-surface-container/40 pb-space-xs">
              <span className="material-symbols-outlined text-primary text-xl">tune</span>
              <h2 className="font-tagline text-tagline text-on-surface font-semibold">General Preferences</h2>
            </div>

            <div className="grid grid-cols-1 gap-space-md pt-2">
              <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
                Date Display Format
                <select className="px-space-md py-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none border border-surface-container-high/40">
                  <option>DD MMM YYYY (e.g. 12 Oct 2026)</option>
                  <option>YYYY-MM-DD (e.g. 2026-10-12)</option>
                </select>
              </label>
            </div>
          </div>

          {/* CSV Data Export Section */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs border-b border-surface-container/40 pb-space-xs">
              <span className="material-symbols-outlined text-primary text-xl">table_chart</span>
              <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                CSV Data Export
              </h2>
            </div>

            <p className="font-caption text-caption text-on-surface-variant">
              Export your local customer, task, and payment records into standard CSV files for offline spreadsheets and auditing.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm pt-2">
              <button
                type="button"
                onClick={exportCustomersCSV}
                className="flex items-center justify-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-button-utility transition-all border border-surface-container-high/40"
              >
                <span className="material-symbols-outlined text-lg text-primary">groups</span>
                <span>Customers CSV</span>
              </button>
              <button
                type="button"
                onClick={exportTasksCSV}
                className="flex items-center justify-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-button-utility transition-all border border-surface-container-high/40"
              >
                <span className="material-symbols-outlined text-lg text-primary">assignment</span>
                <span>Tasks CSV</span>
              </button>
              <button
                type="button"
                onClick={exportPaymentsCSV}
                className="flex items-center justify-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-button-utility transition-all border border-surface-container-high/40"
              >
                <span className="material-symbols-outlined text-lg text-primary">payments</span>
                <span>Payments CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 flex flex-col gap-space-lg">
          {/* Native SQLite Database Backup & Restore */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs border-b border-surface-container/40 pb-space-xs">
              <span className="material-symbols-outlined text-primary text-xl">database</span>
              <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                Database Backup & Restore
              </h2>
            </div>

            <div className="flex flex-col gap-space-xs text-caption text-on-surface-variant">
              <p>
                DeskLog stores all data locally in an embedded SQLite database (`desklog.db`). Backups are saved safely in your system AppData directory.
              </p>
              <div className="flex items-center gap-3 text-xs font-mono text-outline pt-1">
                <span>Customers: {customers.length}</span>
                <span>•</span>
                <span>Tasks: {tasks.length}</span>
                <span>•</span>
                <span>Payments: {payments.length}</span>
                <span>•</span>
                <span>Services: {services.length}</span>
              </div>
            </div>

            <div className="flex flex-col gap-space-md pt-space-xs">
              <button
                className="w-full flex items-center justify-center gap-2 px-space-md py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container font-button-utility text-button-utility font-medium transition-all active:scale-95 shadow-sm"
                onClick={handleBackupDbNow}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">backup</span>
                <span>Create SQLite Backup (.db) in AppData</span>
              </button>

              <div className="border-t border-surface-container/60 pt-3 flex flex-col gap-2">
                <label className="font-fine-print text-fine-print text-on-surface-variant font-medium">
                  Restore from SQLite Backup:
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={restorePathInput}
                    onChange={(e) => setRestorePathInput(e.target.value)}
                    placeholder="Choose or paste .db file path..."
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleChooseBackupFile}
                    className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-base text-primary">folder_open</span>
                    Browse
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreFromPath}
                    disabled={!restorePathInput.trim()}
                    className="px-4 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-error disabled:opacity-40 disabled:cursor-not-allowed font-button-utility text-xs font-semibold transition-all"
                  >
                    Restore
                  </button>
                </div>
                <p className="font-micro-legal text-micro-legal text-on-surface-variant/70">
                  A safe automatic backup snapshot of your current database will always be saved before restore.
                </p>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts Section */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs border-b border-surface-container/40 pb-space-xs">
              <span className="material-symbols-outlined text-primary text-xl">keyboard</span>
              <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                Keyboard Hotkeys
              </h2>
            </div>

            <p className="font-caption text-caption text-on-surface-variant">
              Accelerate daily desk operations using global keyboard shortcuts for creating tasks, adding customers, searching, and quick navigation.
            </p>

            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
              {onOpenHelpModal && (
                <button
                  className="w-full flex justify-center items-center gap-2 px-space-md py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-button-utility font-medium transition-all active:scale-95 shadow-xs"
                  onClick={onOpenHelpModal}
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg text-primary">keyboard_command_key</span>
                  <span>View All Keyboard Shortcuts (?)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-space-md border-t border-surface-container/30">
        <span className="text-[11px] text-outline font-mono opacity-50">DeskLog v{APP_VERSION}</span>
      </div>
    </div>
  );
};
