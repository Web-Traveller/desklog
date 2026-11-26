import React, { useState } from "react";
import { useDesk } from "../context/DeskContext";
import { open } from "@tauri-apps/plugin-dialog";
import { APP_VERSION } from "../constants/version";
import { useAppUpdater } from "../hooks/useAppUpdater";

interface SettingsPageProps {
  onOpenHelpModal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const {
    customers,
    tasks,
    payments,
    services,
    bankingTransactions,
    createDatabaseBackup,
    restoreDatabaseBackup,
    showConfirm,
    showToast,
    bankSchemes,
    addBankScheme,
    updateBankScheme,
    deleteBankScheme,
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    portals,
    addPortal,
    updatePortal,
    deletePortal,
    shopName,
    updateShopName,
  } = useDesk();

  const [restorePathInput, setRestorePathInput] = useState("");
  const [dateFormat, setDateFormat] = useState<string>(() => {
    try {
      return localStorage.getItem('desklog_date_format') || 'DD MMM YYYY';
    } catch {
      return 'DD MMM YYYY';
    }
  });

  // Shop / Portal Name state
  const [shopNameInput, setShopNameInput] = useState(shopName);

  // New item inputs
  const [newSchemeInput, setNewSchemeInput] = useState("");
  const [editingSchemeId, setEditingSchemeId] = useState<number | null>(null);
  const [editingSchemeName, setEditingSchemeName] = useState("");

  const [newPaymentMethodInput, setNewPaymentMethodInput] = useState("");
  const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<number | null>(null);
  const [editingPaymentMethodName, setEditingPaymentMethodName] = useState("");

  const [newPortalInput, setNewPortalInput] = useState("");
  const [editingPortalOld, setEditingPortalOld] = useState<string | null>(null);
  const [editingPortalNew, setEditingPortalNew] = useState("");

  const handleSaveShopName = async () => {
    if (!shopNameInput.trim()) {
      showToast("Shop / Business name cannot be empty", "warning");
      return;
    }
    await updateShopName(shopNameInput.trim());
  };

  const handleAddScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchemeInput.trim()) return;
    await addBankScheme(newSchemeInput.trim());
    setNewSchemeInput("");
  };

  const handleSaveEditScheme = async (id: number) => {
    if (!editingSchemeName.trim()) return;
    await updateBankScheme(id, editingSchemeName.trim());
    setEditingSchemeId(null);
  };

  const handleAddPaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaymentMethodInput.trim()) return;
    await addPaymentMethod(newPaymentMethodInput.trim());
    setNewPaymentMethodInput("");
  };

  const handleSaveEditPaymentMethod = async (id: number) => {
    if (!editingPaymentMethodName.trim()) return;
    await updatePaymentMethod(id, editingPaymentMethodName.trim());
    setEditingPaymentMethodId(null);
  };

  const handleAddPortal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortalInput.trim()) return;
    await addPortal(newPortalInput.trim());
    setNewPortalInput("");
  };

  const handleSaveEditPortal = async (oldName: string) => {
    if (!editingPortalNew.trim()) return;
    await updatePortal(oldName, editingPortalNew.trim());
    setEditingPortalOld(null);
  };

  const handleDateFormatChange = (newFormat: string) => {
    setDateFormat(newFormat);
    try {
      localStorage.setItem('desklog_date_format', newFormat);
      showToast(`Date format set to ${newFormat}`, 'info');
    } catch {}
  };

  const openExternal = async (url: string) => {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
    } catch {
      window.open(url, '_blank');
    }
  };

  const {
    checkForUpdates,
    isChecking,
    availableUpdate,
    isDownloading,
    downloadProgress,
    installUpdate,
    statusMessage,
  } = useAppUpdater();

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
      "Work Type",
      "Tracker ID",
      "Document Number",
      "Customer ID",
      "Customer Name",
      "Customer Mobile",
      "Service ID",
      "Status",
      "Billing Amount (₹)",
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
        cleanCSVCell(t.work_type || ""),
        cleanCSVCell(t.tracker_id || ""),
        cleanCSVCell(t.document_number || ""),
        cleanCSVCell(t.customer_id),
        cleanCSVCell(cust?.name || ""),
        cleanCSVCell(cust?.mobile || ""),
        cleanCSVCell(t.service_id || ""),
        cleanCSVCell(t.status),
        cleanCSVCell(t.billing_amount !== undefined ? Math.floor(t.billing_amount / 100) : 0),
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
    const headers = ["ID", "Task ID", "Task Title", "Customer Name", "Customer Mobile", "Amount (₹)", "Created At"];
    const rows = payments.map((p) => {
      const task = tasks.find((t) => t.id === p.task_id);
      const cust = task ? customers.find((c) => c.id === task.customer_id) : null;
      return [
        cleanCSVCell(p.id),
        cleanCSVCell(p.task_id),
        cleanCSVCell(task?.title || ""),
        cleanCSVCell(cust?.name || ""),
        cleanCSVCell(cust?.mobile || ""),
        cleanCSVCell(Math.floor((p.amount || 0) / 100)),
        cleanCSVCell(p.created_at),
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(`desklog_payments_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const exportBankingCSV = () => {
    const headers = [
      "ID",
      "Date",
      "Mode",
      "Customer Name",
      "Mobile",
      "Account / Aadhaar / Ref",
      "Bank / Biller",
      "Portal / Company",
      "Amount (₹)",
      "Customer Fee (₹)",
      "Company Cost (₹)",
      "Refund (₹)",
      "Commission (₹)",
      "Status",
      "Remark",
    ];
    const rows = bankingTransactions.map((tx) => [
      cleanCSVCell(tx.id || ""),
      cleanCSVCell(tx.transaction_date || ""),
      cleanCSVCell(tx.transaction_type || ""),
      cleanCSVCell(tx.customer_name || ""),
      cleanCSVCell(tx.customer_mobile || ""),
      cleanCSVCell(tx.account_or_aadhaar || tx.transaction_ref_no || ""),
      cleanCSVCell(tx.bank_name || ""),
      cleanCSVCell(tx.company_name || ""),
      cleanCSVCell(Math.floor((tx.amount || 0) / 100)),
      cleanCSVCell(Math.floor((tx.charges || 0) / 100)),
      cleanCSVCell(Math.floor((tx.company_charge || 0) / 100)),
      cleanCSVCell(Math.floor((tx.refund || 0) / 100)),
      cleanCSVCell(Math.floor((tx.commission || Math.max(0, (tx.charges || 0) - (tx.company_charge || 0))) / 100)),
      cleanCSVCell(tx.status || "SUCCESS"),
      cleanCSVCell(tx.remark || ""),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(`desklog_banking_ledger_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter py-space-xl flex flex-col gap-space-xl animate-slideUp">
      <div className="flex flex-col gap-space-xxs border-b border-surface-container pb-space-xs">
        <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-semibold">
          Settings & System Configuration
        </h1>
        <p className="font-body text-body text-on-surface-variant max-w-2xl">
          Manage shop branding, bank schemes, payment methods, counter portals, database backups, and exports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column */}
        <div className="lg:col-span-6 flex flex-col gap-space-lg">
          
          {/* Shop / Portal Branding & General Preferences */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-xs border-b border-surface-container/40 pb-space-xs">
              <span className="material-symbols-outlined text-primary text-xl">storefront</span>
              <h2 className="font-tagline text-tagline text-on-surface font-semibold">Shop & Portal Branding</h2>
            </div>

            <div className="flex flex-col gap-space-sm pt-1">
              <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant">
                Shop / Company / Kiosk Name (Appears on printouts & header)
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={shopNameInput}
                    onChange={(e) => setShopNameInput(e.target.value)}
                    placeholder="e.g. IRSHAD COMMUNICATION"
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface focus:outline-none border border-surface-container-high/40 text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleSaveShopName}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-button-utility text-xs font-semibold transition"
                  >
                    Save Name
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-1 font-fine-print text-fine-print text-on-surface-variant pt-2">
                Date Display Format
                <select
                  value={dateFormat}
                  onChange={(e) => handleDateFormatChange(e.target.value)}
                  className="px-space-md py-2.5 rounded-xl bg-surface-container-low text-on-surface focus:outline-none border border-surface-container-high/40 text-xs"
                >
                  <option value="DD MMM YYYY">DD MMM YYYY (e.g. 12 Oct 2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-10-12)</option>
                </select>
              </label>
            </div>
          </div>

          {/* Bank Schemes / Partner Banks CRUD */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-container/40 pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-xl">account_balance</span>
                <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                  Bank Schemes ({bankSchemes.length})
                </h2>
              </div>
              <span className="text-[10px] text-outline">Used in Account Opening</span>
            </div>

            <form onSubmit={handleAddScheme} className="flex gap-2">
              <input
                type="text"
                value={newSchemeInput}
                onChange={(e) => setNewSchemeInput(e.target.value)}
                placeholder="Add new bank scheme (e.g. SBI, HDFC)..."
                className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newSchemeInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-primary text-on-primary disabled:opacity-40 font-button-utility text-xs font-bold transition flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add</span>
              </button>
            </form>

            <div className="max-h-56 overflow-y-auto flex flex-col gap-1.5 pr-1 divide-y divide-surface-container/40">
              {bankSchemes.map((s) => (
                <div key={s.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs py-1">
                  {editingSchemeId === s.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingSchemeName}
                        onChange={(e) => setEditingSchemeName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditScheme(s.id)}
                        className="text-primary hover:underline font-bold text-xs"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSchemeId(null)}
                        className="text-outline hover:underline text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-on-surface">{s.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSchemeId(s.id);
                            setEditingSchemeName(s.name);
                          }}
                          className="p-1 hover:bg-surface-container rounded text-outline hover:text-on-surface"
                          title="Edit Scheme Name"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            showConfirm({
                              title: `Delete scheme "${s.name}"?`,
                              message: "Existing customer accounts with this scheme will remain safe in database.",
                              confirmText: "Delete",
                              variant: "danger",
                              onConfirm: () => deleteBankScheme(s.id),
                            });
                          }}
                          className="p-1 hover:bg-error/10 rounded text-outline hover:text-error"
                          title="Delete Scheme"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
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
              Export your counter banking ledger, customers, tasks, and payment records into standard CSV files for offline auditing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-2">
              <button
                type="button"
                onClick={exportBankingCSV}
                className="flex items-center justify-center gap-2 px-space-md py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-button-utility text-button-utility transition-all border border-surface-container-high/40"
              >
                <span className="material-symbols-outlined text-lg text-primary">account_balance</span>
                <span>Banking Ledger CSV</span>
              </button>
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

          {/* Payment Methods & Transaction Modes CRUD */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-container/40 pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-xl">payments</span>
                <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                  Payment Modes / Methods ({paymentMethods.length})
                </h2>
              </div>
              <span className="text-[10px] text-outline">DMT, AEPS, UPI, etc.</span>
            </div>

            <form onSubmit={handleAddPaymentMethod} className="flex gap-2">
              <input
                type="text"
                value={newPaymentMethodInput}
                onChange={(e) => setNewPaymentMethodInput(e.target.value)}
                placeholder="Add custom mode (e.g. FASTAG, QR CASH)..."
                className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newPaymentMethodInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-primary text-on-primary disabled:opacity-40 font-button-utility text-xs font-bold transition flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add</span>
              </button>
            </form>

            <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1 divide-y divide-surface-container/40">
              {paymentMethods.map((m) => (
                <div key={m.id} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs py-1">
                  {editingPaymentMethodId === m.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingPaymentMethodName}
                        onChange={(e) => setEditingPaymentMethodName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditPaymentMethod(m.id)}
                        className="text-primary hover:underline font-bold text-xs"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPaymentMethodId(null)}
                        className="text-outline hover:underline text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-on-surface">{m.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPaymentMethodId(m.id);
                            setEditingPaymentMethodName(m.name);
                          }}
                          className="p-1 hover:bg-surface-container rounded text-outline hover:text-on-surface"
                          title="Edit Mode Name"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            showConfirm({
                              title: `Delete payment mode "${m.name}"?`,
                              message: "Existing ledger transactions using this mode will remain untouched.",
                              confirmText: "Delete",
                              variant: "danger",
                              onConfirm: () => deletePaymentMethod(m.id),
                            });
                          }}
                          className="p-1 hover:bg-error/10 rounded text-outline hover:text-error"
                          title="Delete Mode"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Counter Portals / Companies CRUD */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-container/40 pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-xl">hub</span>
                <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                  Counter Portals & Companies ({portals.length})
                </h2>
              </div>
              <span className="text-[10px] text-outline">SAFEPAY, PAYBINGO, etc.</span>
            </div>

            <form onSubmit={handleAddPortal} className="flex gap-2">
              <input
                type="text"
                value={newPortalInput}
                onChange={(e) => setNewPortalInput(e.target.value)}
                placeholder="Add portal (e.g. SPICE MONEY, RNFI)..."
                className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low text-on-surface text-xs border border-surface-container-high/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newPortalInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-primary text-on-primary disabled:opacity-40 font-button-utility text-xs font-bold transition flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add</span>
              </button>
            </form>

            <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1 divide-y divide-surface-container/40">
              {portals.map((p) => (
                <div key={p} className="pt-1.5 first:pt-0 flex items-center justify-between text-xs py-1">
                  {editingPortalOld === p ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingPortalNew}
                        onChange={(e) => setEditingPortalNew(e.target.value)}
                        className="flex-1 px-2 py-1 bg-surface-container rounded-lg text-xs font-semibold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditPortal(p)}
                        className="text-primary hover:underline font-bold text-xs"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPortalOld(null)}
                        className="text-outline hover:underline text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-on-surface">{p}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPortalOld(p);
                            setEditingPortalNew(p);
                          }}
                          className="p-1 hover:bg-surface-container rounded text-outline hover:text-on-surface"
                          title="Edit Portal Name"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            showConfirm({
                              title: `Delete portal "${p}"?`,
                              message: "Existing transactions with this portal will remain saved.",
                              confirmText: "Delete",
                              variant: "danger",
                              onConfirm: () => deletePortal(p),
                            });
                          }}
                          className="p-1 hover:bg-error/10 rounded text-outline hover:text-error"
                          title="Delete Portal"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

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
              <div className="flex items-center gap-2.5 text-xs font-mono text-outline pt-1 flex-wrap">
                <span>Customers: {customers.length}</span>
                <span>•</span>
                <span>Banking: {bankingTransactions.length}</span>
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

          {/* Minimal Version & Update Status */}
          <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-surface-container/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-on-surface">DeskLog v{APP_VERSION}</span>
                <span className="text-outline">&middot; Production</span>
              </div>
              <button
                type="button"
                onClick={() => checkForUpdates(true)}
                disabled={isChecking || isDownloading}
                className="text-xs text-primary hover:underline font-semibold disabled:opacity-50"
              >
                {isChecking ? "Checking..." : "Check update"}
              </button>
            </div>

            {statusMessage && (
              <p className="text-[11px] text-center text-outline">
                {statusMessage}
              </p>
            )}

            {availableUpdate && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-2.5 flex items-center justify-between mt-1">
                <span className="text-xs font-semibold text-primary">
                  New update v{availableUpdate.version} ready
                </span>
                <button
                  onClick={installUpdate}
                  disabled={isDownloading}
                  className="px-3 py-1 bg-primary text-on-primary rounded-full text-xs font-bold hover:bg-primary-container transition"
                >
                  {isDownloading ? `Downloading (${downloadProgress}%)` : "Install"}
                </button>
              </div>
            )}
          </div>

          {/* Developer Contact Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-3.5 shadow-xs border border-surface-container/60 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/70"></span>
                <span className="font-semibold text-on-surface">Developer Contact</span>
                <span className="text-outline">&middot; Direct Support</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openExternal(`https://wa.me/918975805393?text=Hi%20Ajinkya%2C%20I%20am%20using%20DeskLog%20v${APP_VERSION}%20and%20need%20assistance.`)}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  WhatsApp
                </button>
                <span className="text-outline/40">·</span>
                <button
                  type="button"
                  onClick={() => openExternal('tel:+918975805393')}
                  className="text-xs text-on-surface hover:text-primary font-mono transition-colors"
                >
                  +91 8975805393
                </button>
              </div>
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
