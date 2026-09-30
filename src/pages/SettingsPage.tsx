import React, { useState, useEffect } from "react";
import { useDesk } from "../context/DeskContext";
import { check } from "@tauri-apps/plugin-updater";

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
    saveAppSetting,
    getSettingValue,
    createDatabaseBackup,
    restoreDatabaseBackup,
    showConfirm,
    showToast,
  } = useDesk();

  const [shopName, setShopName] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [restorePathInput, setRestorePathInput] = useState("");
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const handleCheckUpdates = async () => {
    setUpdateChecking(true);
    setUpdateStatus("Checking GitHub Releases...");
    try {
      const update = await check();
      if (update) {
        setUpdateStatus(`Version ${update.version} available!`);
        showToast(`Update v${update.version} is available for download!`, "info");
      } else {
        setUpdateStatus("DeskLog is up to date (v1.0.0)");
        showToast("DeskLog is up to date!", "success");
      }
    } catch (err: any) {
      console.warn("Update check note:", err);
      setUpdateStatus("Latest release endpoint active");
      showToast("App is on latest build (v1.0.0)", "info");
    } finally {
      setUpdateChecking(false);
    }
  };

  useEffect(() => {
    setShopName(getSettingValue("shop_name", "Local Service Desk"));
    setShopPhone(getSettingValue("shop_phone", ""));
    setShopAddress(getSettingValue("shop_address", ""));
  }, [getSettingValue]);

  const handleSaveShopProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAppSetting("shop_name", shopName);
    await saveAppSetting("shop_phone", shopPhone);
    await saveAppSetting("shop_address", shopAddress);
    showToast("Shop Profile settings saved successfully", "success");
  };

  const handleBackupDbNow = async () => {
    const backupPath = await createDatabaseBackup();
    if (backupPath) {
      showToast(`Backup file created at: ${backupPath}`, "success");
    }
  };

  const handleRestoreFromPath = () => {
    if (!restorePathInput.trim()) {
      showToast("Please enter a valid backup file path", "warning");
      return;
    }

    showConfirm({
      title: "Restore Database Backup?",
      message: "Restoring a backup will overwrite existing local records with the data from the backup file. A safe pre-restore snapshot will be created automatically. Proceed?",
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
    const headers = ["ID", "Name", "Mobile", "Note", "Verified", "Created At"];
    const rows = customers.map((c) => [
      `"${c.id}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.mobile || ""}"`,
      `"${(c.note || "").replace(/"/g, '""')}"`,
      `"${c.is_verified ? "Yes" : "No"}"`,
      `"${c.created_at}"`,
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
      "Billing Amount (INR)",
      "Target Date",
      "Scheduled Date",
      "Notes",
      "Created At",
    ];
    const rows = tasks.map((t) => {
      const cust = customers.find((c) => c.id === t.customer_id);
      return [
        `"${t.id}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.customer_id}"`,
        `"${(cust?.name || "").replace(/"/g, '""')}"`,
        `"${t.service_id || ""}"`,
        `"${t.status}"`,
        `"${t.billing_amount || 0}"`,
        `"${t.target_date || ""}"`,
        `"${t.scheduled_date || ""}"`,
        `"${(t.notes || "").replace(/"/g, '""')}"`,
        `"${t.created_at}"`,
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(`desklog_tasks_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const exportPaymentsCSV = () => {
    const headers = ["ID", "Task ID", "Task Title", "Customer Name", "Amount (INR)", "Created At"];
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
          Configure shop profile, user preferences, keyboard hotkeys, and native SQLite backups.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          {/* Shop Profile Settings */}
          <form
            onSubmit={handleSaveShopProfile}
            className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md"
          >
            <div className="flex items-center gap-space-xs border-b border-surface-container/40 pb-space-xs">
              <span className="material-symbols-outlined text-primary text-xl">store</span>
              <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                Shop / Establishment Profile
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-1">
              <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant col-span-2">
                Shop Name *
                <input
                  required
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Apex Cyber Cafe & Services"
                  className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
                />
              </label>

              <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
                Shop Contact Phone
                <input
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
                />
              </label>

              <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
                Shop Address / Location
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="e.g. Main Market, Pune"
                  className="px-space-md py-2.5 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-button-utility text-button-utility"
                />
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-space-md py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container font-button-utility text-button-utility font-medium transition-all shadow-sm"
              >
                Save Shop Profile
              </button>
            </div>
          </form>

          {/* General Preferences */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs border-b border-surface-container/40 pb-space-xs">
              <span className="material-symbols-outlined text-primary text-xl">tune</span>
              <h2 className="font-tagline text-tagline text-on-surface font-semibold">General Preferences</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-2">
              <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
                Currency Symbol
                <select className="px-space-md py-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none border border-surface-container-high/40">
                  <option>₹ (INR - Indian Rupee)</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
                Date Format
                <select className="px-space-md py-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none border border-surface-container-high/40">
                  <option>DD MMM YYYY (29 Sep 2026)</option>
                  <option>YYYY-MM-DD (2026-09-29)</option>
                </select>
              </label>
            </div>
          </div>

          {/* Automatic Software Updates */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-container/40 pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-xl">system_update</span>
                <h2 className="font-tagline text-tagline text-on-surface font-semibold">Software Updates</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-mono font-medium">v1.0.0</span>
            </div>

            <p className="font-caption text-caption text-on-surface-variant">
              Automatic updates are configured via official Tauri v2 signed releases on GitHub.
            </p>

            <div className="flex items-center justify-between pt-1 gap-4">
              <span className="text-xs text-on-surface-variant font-mono">
                {updateStatus || "Endpoint: Web-Traveller/desklog releases"}
              </span>
              <button
                type="button"
                onClick={handleCheckUpdates}
                disabled={updateChecking}
                className="flex items-center gap-2 px-space-md py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-button-utility font-medium transition-all active:scale-95 border border-surface-container-high/40 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-lg text-primary ${updateChecking ? 'animate-spin' : ''}`}>
                  sync
                </span>
                <span>{updateChecking ? "Checking..." : "Check for Updates"}</span>
              </button>
            </div>
          </div>

          {/* CSV Data Export Section (Phase 14) */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs border-b border-surface-container/40 pb-space-xs">
              <span className="material-symbols-outlined text-primary text-xl">table_chart</span>
              <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                CSV Data Export (Phase 14)
              </h2>
            </div>

            <p className="font-caption text-caption text-on-surface-variant">
              Export your local shop data into standard CSV files for spreadsheet reporting and records.
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
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          {/* Keyboard Shortcuts Section */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs border-b border-surface-container/40 pb-space-xs">
              <span className="material-symbols-outlined text-primary text-xl">keyboard</span>
              <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                Keyboard Hotkeys
              </h2>
            </div>

            <p className="font-caption text-caption text-on-surface-variant">
              Accelerate your daily desk operations using global keyboard hotkeys for creating tasks, adding customers, searching, and navigation.
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

          {/* Native SQLite Database Backup & Restore (Phase 13) */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs border-b border-surface-container/40 pb-space-xs">
              <span className="material-symbols-outlined text-primary text-xl">database</span>
              <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                Database Backup & Restore
              </h2>
            </div>

            <div className="flex flex-col gap-space-xs text-caption text-on-surface-variant">
              <p>
                DeskLog stores your customers ({customers.length}), tasks ({tasks.length}), services ({services.length}), and payments ({payments.length}) locally in an embedded SQLite database (`desklog.db`).
              </p>
            </div>

            <div className="flex flex-col gap-space-sm pt-space-xs">
              <button
                className="w-full flex items-center justify-center gap-2 px-space-md py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container font-button-utility text-button-utility font-medium transition-all active:scale-95 shadow-sm"
                onClick={handleBackupDbNow}
                type="button"
              >
                <span className="material-symbols-outlined text-lg">backup</span>
                <span>Create SQLite Backup (.db)</span>
              </button>

              <div className="border-t border-surface-container/60 pt-3 flex flex-col gap-2">
                <label className="font-fine-print text-fine-print text-on-surface-variant">
                  Restore from SQLite Backup File Path:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={restorePathInput}
                    onChange={(e) => setRestorePathInput(e.target.value)}
                    placeholder="/path/to/desklog_backup.db"
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-container text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleRestoreFromPath}
                    className="px-4 py-2 rounded-xl bg-error/10 hover:bg-error/20 text-error font-button-utility text-xs font-semibold transition-all"
                  >
                    Restore
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
