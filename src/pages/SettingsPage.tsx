import React from "react";
import { useDesk } from "../context/DeskContext";

interface SettingsPageProps {
  onOpenHelpModal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onOpenHelpModal,
}) => {
  const { addCustomer, addTask, customers, tasks, showToast } = useDesk();

  const handleExportData = () => {
    const data = JSON.stringify({ customers, tasks }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `desklog_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported register backup file successfully", "success");
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.tasks)) {
          let importedCusts = 0;
          let importedTasks = 0;

          for (const cust of parsed.customers) {
            if (!customers.some((c) => c.id === cust.id || c.phone === cust.phone)) {
              addCustomer({
                name: cust.name,
                phone: cust.phone,
                notes: cust.notes,
                isVerified: cust.isVerified,
              });
              importedCusts++;
            }
          }

          for (const t of parsed.tasks) {
            if (!tasks.some((existing) => existing.id === t.id)) {
              await addTask({
                customerId: t.customerId,
                customerName: t.customerName,
                customerPhone: t.customerPhone,
                title: t.title,
                status: t.status,
                targetDate: t.targetDate,
                subStatus: t.subStatus,
                notes: t.notes,
                billingAmount: t.billingAmount,
                amountPaid: t.amountPaid,
                billingStatus: t.billingStatus,
                scheduleDate: t.scheduleDate,
              });
              importedTasks++;
            }
          }

          showToast(`Import successful! Added ${importedCusts} customers and ${importedTasks} tasks.`, 'success');
        } else {
          showToast("Error: Invalid JSON format. Expected object with customers and tasks.", 'error');
        }
      } catch (err) {
        showToast("Error parsing backup JSON file.", 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-gutter py-space-xl flex flex-col gap-space-xl">
      <div className="flex flex-col gap-space-xxs border-b border-surface-container pb-space-xs">
        <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-semibold">
          Settings & System Configuration
        </h1>
        <p className="font-body text-body text-on-surface-variant">
          Configure desktop environment, Tauri native capabilities, shortcuts,
          and data backups.
        </p>
      </div>

      {/* Keyboard Shortcuts Section */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary text-xl">
            keyboard
          </span>
          <h2 className="font-tagline text-tagline text-on-surface font-semibold">
            Keyboard Hotkeys & Navigation
          </h2>
        </div>

        <p className="font-caption text-caption text-on-surface-variant">
          Accelerate your daily desk operations using global keyboard hotkeys
          for creating tasks, adding customers, searching, and navigation.
        </p>

        <div className="flex flex-wrap items-center gap-space-sm pt-space-xs border-t border-surface-container/40">
          {onOpenHelpModal && (
            <button
              className="flex items-center gap-2 px-space-md py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-button-utility font-medium transition-all active:scale-95 border border-surface-container-high/60 shadow-xs"
              onClick={onOpenHelpModal}
              type="button"
            >
              <span className="material-symbols-outlined text-lg text-primary">
                keyboard_command_key
              </span>
              <span>View All Keyboard Shortcuts (?)</span>
            </button>
          )}
        </div>
      </div>

      {/* Tauri Native App Status & Data Backup */}
      <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-primary text-xl">
            desktop_windows
          </span>
          <h2 className="font-tagline text-tagline text-on-surface font-semibold">
            Tauri & Local Storage Data Management
          </h2>
        </div>

        <div className="flex flex-col gap-space-xs text-caption text-caption text-on-surface-variant">
          <p>
            DeskLog runs as a lightweight, secure desktop app powered by Tauri
            and React. Your customer records ({customers.length}) and task logs
            ({tasks.length}) are stored locally in an embedded SQLite database
            for offline access.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm pt-space-xs border-t border-surface-container/40">
          <button
            className="flex items-center gap-2 px-space-md py-2 rounded-full bg-primary-container text-on-primary hover:bg-primary font-button-utility text-button-utility font-medium transition-all active:scale-95 shadow-sm"
            onClick={handleExportData}
            type="button"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span>Export Register Backup (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-space-md py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-button-utility font-medium transition-all active:scale-95 border border-surface-container-high/60 shadow-xs cursor-pointer">
            <span className="material-symbols-outlined text-lg text-primary">upload</span>
            <span>Import Register Backup (JSON)</span>
            <input
              accept=".json"
              className="hidden"
              type="file"
              onChange={handleImportData}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
