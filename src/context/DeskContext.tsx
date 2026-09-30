import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  Customer,
  CustomerRelationship,
  Task,
  ActivityEvent,
  ActivePage,
  TaskStatus,
  GENERAL_CUSTOMER,
  Service,
  Payment,
  Setting,
} from "../types";
import { getFormattedToday, getFormattedNow } from "../utils/dateUtils";
import {
  fetchTauriCustomers,
  saveTauriCustomer,
  updateTauriCustomer,
  deleteTauriCustomer,
  fetchTauriRelationships,
  saveTauriRelationship,
  deleteTauriRelationship,
  fetchTauriTasks,
  saveTauriTask,
  updateTauriTask,
  deleteTauriTask,
  fetchTauriActivities,
  saveTauriActivity,
  triggerDesktopNotification,
  fetchTauriServices,
  saveTauriService,
  updateTauriService,
  deleteTauriService,
  fetchTauriPayments,
  saveTauriPayment,
  fetchTauriSettings,
  saveTauriSetting,
  createTauriBackup,
  restoreTauriBackup,
} from "../api/tauri";
import { createActivityEvent } from "../services/activityService";
import { isTaskOverdue } from "../services/taskService";
import { ConfirmModal } from "../components/ConfirmModal";
import {
  ToastNotification,
  ToastMessage,
} from "../components/ToastNotification";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
}

interface DeskContextType {
  currentPage: ActivePage;
  setCurrentPage: (page: ActivePage) => void;
  previousPage: ActivePage;
  selectedCustomerId: string | null;
  setSelectedCustomerId: (id: string | null) => void;
  highlightedTaskId: string | null;
  setHighlightedTaskId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  taskDateFilter: string;
  setTaskDateFilter: (filter: string) => void;
  selectedCalendarDate: string;
  setSelectedCalendarDate: (date: string) => void;

  customers: Customer[];
  relationships: CustomerRelationship[];
  tasks: Task[];
  activities: ActivityEvent[];
  services: Service[];
  payments: Payment[];
  settings: Setting[];

  addService: (
    service: Omit<Service, "id" | "created_at" | "updated_at">,
  ) => Promise<void>;
  editService: (service: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, "id" | "created_at">) => Promise<void>;

  addCustomer: (
    customerData: Omit<Customer, "id" | "created_at" | "updated_at">,
  ) => Promise<Customer>;
  editCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addRelationship: (
    relatedCustomerId: string,
    relationshipType: string,
  ) => Promise<void>;
  deleteRelationship: (relationshipId: string) => Promise<void>;
  getRelationshipsForCustomer: (customerId: string) => CustomerRelationship[];

  addTask: (
    taskData: Omit<Task, "id" | "created_at" | "updated_at">,
  ) => Promise<void>;
  updateTaskStatus: (
    taskId: string,
    newStatus: TaskStatus,
    cancellationReason?: string,
  ) => Promise<void>;
  updateTask: (taskId: string, taskData: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  saveAppSetting: (key: string, value: string) => Promise<void>;
  getSettingValue: (key: string, defaultValue?: string) => string;

  createDatabaseBackup: () => Promise<string | null>;
  restoreDatabaseBackup: (backupPath: string) => Promise<boolean>;

  confirmDeleteTask: (task: Task) => void;
  confirmDeleteCustomer: (customer: Customer) => void;
  showConfirm: (options: ConfirmOptions) => void;
  showToast: (
    message: string,
    type?: "info" | "success" | "warning" | "error",
  ) => void;

  isAddCustomerOpen: boolean;
  setIsAddCustomerOpen: (open: boolean) => void;
  isAddTaskOpen: boolean;
  setIsAddTaskOpen: (open: boolean) => void;
  isEditTaskOpen: boolean;
  setIsEditTaskOpen: (open: boolean) => void;
  selectedTaskToEdit: Task | null;
  setSelectedTaskToEdit: (task: Task | null) => void;

  navigateToCustomerProfile: (customerId: string) => void;
  navigateToCustomerTaskProfile: (customerId: string, taskId: string) => void;
  performSearch: (query: string) => void;

  taskPage: number;
  setTaskPage: (page: number | ((prev: number) => number)) => void;
  customerPage: number;
  setCustomerPage: (page: number | ((prev: number) => number)) => void;
  ITEMS_PER_PAGE: number;
}

const DeskContext = createContext<DeskContextType | undefined>(undefined);

export const DeskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentPage, setCurrentPageInternal] =
    useState<ActivePage>("dashboard");
  const [previousPage, setPreviousPage] = useState<ActivePage>("dashboard");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    "cust-general",
  );
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [taskDateFilter, setTaskDateFilter] = useState("Last 7 days");
  const [selectedCalendarDate, setSelectedCalendarDate] =
    useState<string>(getFormattedToday());

  const [customers, setCustomers] = useState<Customer[]>([GENERAL_CUSTOMER]);
  const [relationships, setRelationships] = useState<CustomerRelationship[]>(
    [],
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<Setting[]>([]);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(
    null,
  );

  const [taskPage, setTaskPage] = useState(0);
  const [customerPage, setCustomerPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showToast = (
    message: string,
    type: "info" | "success" | "warning" | "error" = "info",
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmState({
      isOpen: true,
      ...options,
    });
  };

  const notifiedKeysRef = useRef<Set<string>>(new Set());

  const setCurrentPage = (page: ActivePage) => {
    if (page !== "search") {
      setPreviousPage(page);
    }
    setCurrentPageInternal(page);
  };

  const loadAllData = async () => {
    const dbCusts = await fetchTauriCustomers();
    if (dbCusts && dbCusts.length > 0) setCustomers(dbCusts);

    const dbTasks = await fetchTauriTasks();
    if (dbTasks) setTasks(dbTasks);

    const dbActs = await fetchTauriActivities();
    if (dbActs) setActivities(dbActs);

    const dbSvcs = await fetchTauriServices();
    if (dbSvcs) setServices(dbSvcs);

    const dbPay = await fetchTauriPayments();
    if (dbPay) setPayments(dbPay);

    const dbSets = await fetchTauriSettings();
    if (dbSets) setSettings(dbSets);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Fetch relationships when selected customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      fetchTauriRelationships(selectedCustomerId).then((rels) => {
        if (rels) setRelationships(rels);
      });
    }
  }, [selectedCustomerId]);

  // Notifications Loop
  useEffect(() => {
    const checkScheduledNotifications = () => {
      const now = new Date();
      const todayStr = getFormattedToday();

      tasks.forEach((task) => {
        if (task.status === "DELIVERED" || task.status === "CANCELLED") return;
        const customerName =
          customers.find((c) => c.id === task.customer_id)?.name || "";

        if (task.scheduled_date) {
          const parts = task.scheduled_date.split("-").map(Number);
          if (parts.length === 3 && !parts.some(isNaN)) {
            const [y, m, d] = parts;
            let hrs = 9;
            let mins = 0;
            if (task.scheduled_time) {
              const timeParts = task.scheduled_time.split(":");
              if (timeParts.length >= 2) {
                const parsedH = parseInt(timeParts[0], 10);
                const parsedM = parseInt(timeParts[1], 10);
                if (!isNaN(parsedH)) hrs = parsedH;
                if (!isNaN(parsedM)) mins = parsedM;
              }
            }
            const scheduleTime = new Date(y, m - 1, d, hrs, mins);
            const timeDiff = scheduleTime.getTime() - now.getTime();
            const keyTime = `${task.id}-sched-time-${scheduleTime.getTime()}`;

            if (
              timeDiff <= 0 &&
              timeDiff >= -5 * 60 * 1000 &&
              !notifiedKeysRef.current.has(keyTime)
            ) {
              notifiedKeysRef.current.add(keyTime);
              triggerDesktopNotification(
                "⏰ DeskLog: Scheduled Task Reminder!",
                `Task '${task.title}' for ${customerName} is scheduled NOW!`,
              );
            }
          }
        }

        if (isTaskOverdue(task)) {
          const keyOverdue = `${task.id}-overdue-${todayStr}`;
          if (!notifiedKeysRef.current.has(keyOverdue)) {
            notifiedKeysRef.current.add(keyOverdue);
            triggerDesktopNotification(
              "⚠️ DeskLog: Overdue Task Alert!",
              `Task '${task.title}' for ${customerName} target completion date has passed!`,
            );
          }
        }
      });
    };

    checkScheduledNotifications();
    const interval = setInterval(checkScheduledNotifications, 30000);
    return () => clearInterval(interval);
  }, [tasks, customers]);

  // --- CUSTOMER OPERATIONS ---
  const addCustomer = async (
    customerData: Omit<Customer, "id" | "created_at" | "updated_at">,
  ): Promise<Customer> => {
    const newId = `cust-${Date.now()}`;
    const initials = customerData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const newCust: Customer = {
      ...customerData,
      id: newId,
      created_at: getFormattedToday(),
      updated_at: getFormattedToday(),
      is_active: true,
      avatar_initials: initials || "DS",
      avatar_color: "bg-primary-fixed text-on-primary-fixed",
    };

    setCustomers((prev) => [newCust, ...prev]);
    await saveTauriCustomer(newCust);

    // Automatic Activity Generation
    const act = createActivityEvent({
      type: "customer_created",
      title: `Enrolled Customer: ${newCust.name}`,
      description: `Registered new customer profile with mobile ${newCust.mobile || "N/A"}.`,
      customerId: newCust.id,
      customerName: newCust.name,
      customerPhone: newCust.mobile || "",
      badgeText: "ENROLLED",
    });
    await saveTauriActivity(act);
    setActivities((prev) => [act, ...prev]);

    showToast(`Registered ${newCust.name} successfully`, "success");
    return newCust;
  };

  const editCustomer = async (id: string, customerData: Partial<Customer>) => {
    const existing = customers.find((c) => c.id === id);
    if (!existing) return;

    const newName = customerData.name || existing.name;
    const newMobile = customerData.mobile !== undefined ? customerData.mobile : existing.mobile;
    const newNote = customerData.note !== undefined ? customerData.note : existing.note;

    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...customerData } : c)),
    );

    await updateTauriCustomer(id, newName, newMobile, newNote);

    // Automatic Activity Generation
    const act = createActivityEvent({
      type: "customer_updated",
      title: `Updated Profile: ${newName}`,
      description: "Customer contact or profile information was updated.",
      customerId: id,
      customerName: newName,
      customerPhone: newMobile || "",
      badgeText: "UPDATED",
    });
    await saveTauriActivity(act);
    setActivities((prev) => [act, ...prev]);
  };

  const deleteCustomer = async (id: string) => {
    if (id === "cust-general") {
      showToast(
        "System Default Walk-in customer profile cannot be deleted.",
        "warning",
      );
      return;
    }
    const success = await deleteTauriCustomer(id);
    if (success) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selectedCustomerId === id) {
        setSelectedCustomerId("cust-general");
      }
      showToast("Customer profile archived successfully", "success");
    } else {
      showToast("Error: Failed to delete customer.", "error");
    }
  };

  // --- RELATIONSHIP OPERATIONS ---
  const addRelationship = async (
    relatedCustomerId: string,
    relationshipType: string,
  ) => {
    if (!selectedCustomerId || selectedCustomerId === relatedCustomerId) return;
    const rel: CustomerRelationship = {
      id: `rel-${Date.now()}`,
      customer_id: selectedCustomerId,
      related_customer_id: relatedCustomerId,
      relationship_type: relationshipType,
      created_at: getFormattedNow(),
    };
    const saved = await saveTauriRelationship(rel);
    if (saved) {
      setRelationships((prev) => [saved, ...prev]);
      showToast("Family / related customer linked successfully", "success");
    }
  };

  const deleteRelationship = async (relationshipId: string) => {
    const success = await deleteTauriRelationship(relationshipId);
    if (success) {
      setRelationships((prev) => prev.filter((r) => r.id !== relationshipId));
      showToast("Relationship unlinked successfully", "success");
    }
  };

  const getRelationshipsForCustomer = (customerId: string) => {
    return relationships.filter(
      (r) =>
        r.customer_id === customerId || r.related_customer_id === customerId,
    );
  };

  // --- TASK OPERATIONS ---
  const addTask = async (
    taskData: Omit<Task, "id" | "created_at" | "updated_at">,
  ) => {
    const newTaskId = `task-${Date.now()}`;
    const nowFormatted = getFormattedNow();

    const newTask: Task = {
      ...taskData,
      id: newTaskId,
      created_at: nowFormatted,
      updated_at: nowFormatted,
    };

    const savedTask = await saveTauriTask(newTask);
    if (!savedTask) {
      showToast("Error: Failed to save task to database.", "error");
      return;
    }

    setTasks((prev) => [savedTask, ...prev]);

    const cust = customers.find((c) => c.id === savedTask.customer_id);
    const customerName = cust?.name || "";
    const customerMobile = cust?.mobile || "";

    // Automatic Activity Generation
    const act = createActivityEvent({
      type: "task_created",
      title: `Created Task: ${savedTask.title}`,
      description: `Task logged with status ${savedTask.status}. Billing: ₹${savedTask.billing_amount || 0}`,
      taskId: newTaskId,
      customerId: savedTask.customer_id,
      customerName,
      customerPhone: customerMobile,
      badgeText: savedTask.status,
    });
    await saveTauriActivity(act);
    setActivities((prev) => [act, ...prev]);

    showToast(`Task '${savedTask.title}' logged successfully`, "success");
  };

  const updateTaskStatus = async (
    taskId: string,
    newStatus: TaskStatus,
    cancellationReason?: string,
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTime = getFormattedNow();
    const isCompleted = newStatus === "DELIVERED";
    const completedAt = isCompleted ? updatedTime : task.completed_at;

    const updatedTask: Task = {
      ...task,
      status: newStatus,
      cancellation_reason: cancellationReason || task.cancellation_reason,
      updated_at: updatedTime,
      completed_at: completedAt,
    };

    const success = await updateTauriTask(updatedTask);
    if (!success) {
      showToast("Error: Failed to update task status in database.", "error");
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    const cust = customers.find((c) => c.id === task.customer_id);
    const customerName = cust?.name || "";
    const customerMobile = cust?.mobile || "";

    // Automatic Activity Generation
    let actType = "status_changed";
    let badge = newStatus;
    let desc = `Status moved from ${task.status} to ${newStatus}.`;

    if (newStatus === "READY") {
      actType = "task_ready";
      desc = `Work completed! Task '${task.title}' marked READY for delivery.`;
    } else if (newStatus === "DELIVERED") {
      actType = "task_delivered";
      desc = `Task '${task.title}' marked DELIVERED / Handed over to customer.`;
    } else if (newStatus === "CANCELLED") {
      actType = "task_cancelled";
      desc = `Task '${task.title}' CANCELLED.${cancellationReason ? ` Reason: ${cancellationReason}` : ""}`;
    }

    const act = createActivityEvent({
      type: actType,
      title: `Status: ${newStatus} — ${task.title}`,
      description: desc,
      taskId: task.id,
      customerId: task.customer_id,
      customerName,
      customerPhone: customerMobile,
      badgeText: badge,
    });
    await saveTauriActivity(act);
    setActivities((prev) => [act, ...prev]);

    showToast(`Task status updated to ${newStatus}`, "success");
  };

  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    const oldTask = tasks.find((t) => t.id === taskId);
    if (!oldTask) return;

    const updatedTime = getFormattedNow();
    const updatedTask: Task = {
      ...oldTask,
      ...taskData,
      updated_at: updatedTime,
    };

    const success = await updateTauriTask(updatedTask);
    if (!success) {
      showToast("Error: Failed to save task changes to database.", "error");
      return;
    }

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    const cust = customers.find((c) => c.id === oldTask.customer_id);
    const isRescheduled =
      taskData.scheduled_date &&
      taskData.scheduled_date !== oldTask.scheduled_date;

    const act = createActivityEvent({
      type: isRescheduled ? "task_rescheduled" : "task_edited",
      title: isRescheduled
        ? `Rescheduled Task: ${oldTask.title}`
        : `Updated Task: ${oldTask.title}`,
      description: isRescheduled
        ? `Rescheduled task for ${taskData.scheduled_date}`
        : "Task details or billing amount updated.",
      taskId: oldTask.id,
      customerId: oldTask.customer_id,
      customerName: cust?.name || "",
      customerPhone: cust?.mobile || "",
      badgeText: isRescheduled ? "RESCHEDULED" : "EDITED",
    });
    await saveTauriActivity(act);
    setActivities((prev) => [act, ...prev]);

    showToast("Task updated successfully", "success");
  };

  const deleteTask = async (taskId: string) => {
    const success = await deleteTauriTask(taskId);
    if (success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setActivities((prev) => prev.filter((a) => a.taskId !== taskId));
      setPayments((prev) => prev.filter((p) => p.task_id !== taskId));
      showToast("Task deleted successfully", "success");
    } else {
      showToast("Error: Failed to delete task.", "error");
    }
  };

  // --- SERVICE OPERATIONS ---
  const addService = async (
    serviceData: Omit<Service, "id" | "created_at" | "updated_at">,
  ) => {
    const newSvc: Service = {
      ...serviceData,
      id: `svc-${Date.now()}`,
      created_at: getFormattedToday(),
      updated_at: getFormattedToday(),
    };
    const saved = await saveTauriService(newSvc);
    if (saved) {
      setServices((prev) => [...prev, saved]);
      showToast(`Added service template '${saved.name}'`, "success");
    }
  };

  const editService = async (service: Service) => {
    const success = await updateTauriService(service);
    if (success) {
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? service : s)),
      );
      showToast(`Updated service '${service.name}'`, "success");
    }
  };

  const deleteService = async (id: string) => {
    const success = await deleteTauriService(id);
    if (success) {
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: false } : s)),
      );
      showToast("Service template deactivated", "success");
    }
  };

  // --- PAYMENT OPERATIONS ---
  const addPayment = async (
    paymentData: Omit<Payment, "id" | "created_at">,
  ) => {
    const newPay: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      created_at: getFormattedNow(),
    };
    const saved = await saveTauriPayment(newPay);
    if (saved) {
      setPayments((prev) => [...prev, saved]);

      const task = tasks.find((t) => t.id === paymentData.task_id);
      const cust = task
        ? customers.find((c) => c.id === task.customer_id)
        : null;

      // Automatic Activity Generation
      const act = createActivityEvent({
        type: "payment_added",
        title: `Payment Received: ₹${saved.amount}`,
        description: `Recorded payment of ₹${saved.amount} for task '${task?.title || ""}'.`,
        taskId: paymentData.task_id,
        customerId: task?.customer_id,
        customerName: cust?.name || "",
        customerPhone: cust?.mobile || "",
        badgeText: "PAYMENT",
      });
      await saveTauriActivity(act);
      setActivities((prev) => [act, ...prev]);

      showToast(`Payment of ₹${saved.amount} recorded`, "success");
    }
  };

  // --- SETTINGS OPERATIONS ---
  const saveAppSetting = async (key: string, value: string) => {
    const success = await saveTauriSetting(key, value);
    if (success) {
      setSettings((prev) => {
        const exists = prev.some((s) => s.key === key);
        if (exists)
          return prev.map((s) => (s.key === key ? { key, value } : s));
        return [...prev, { key, value }];
      });
    }
  };

  const getSettingValue = (key: string, defaultValue: string = "") => {
    const found = settings.find((s) => s.key === key);
    return found ? found.value : defaultValue;
  };

  // --- BACKUP & RESTORE ---
  const createDatabaseBackup = async (): Promise<string | null> => {
    const path = await createTauriBackup();
    if (path) {
      showToast("SQLite Database Backup created successfully", "success");
      return path;
    } else {
      showToast("Error creating SQLite database backup.", "error");
      return null;
    }
  };

  const restoreDatabaseBackup = async (
    backupPath: string,
  ): Promise<boolean> => {
    const success = await restoreTauriBackup(backupPath);
    if (success) {
      await loadAllData();
      showToast("Database restored successfully from backup!", "success");
      return true;
    } else {
      showToast(
        "Error: Failed to restore database backup. File may be invalid.",
        "error",
      );
      return false;
    }
  };

  // --- CONFIRMATION DIALOG HELPERS ---
  const confirmDeleteTask = (task: Task) => {
    const customerName =
      customers.find((c) => c.id === task.customer_id)?.name || "";
    showConfirm({
      title: "Delete Desk Task?",
      message: `Are you sure you want to delete task "${task.title}" for ${customerName}? This record will be permanently removed.`,
      confirmText: "Delete Task",
      variant: "danger",
      onConfirm: () => deleteTask(task.id),
    });
  };

  const confirmDeleteCustomer = (customer: Customer) => {
    if (customer.id === "cust-general") {
      showToast(
        "System Default Walk-in customer profile cannot be deleted.",
        "warning",
      );
      return;
    }
    showConfirm({
      title: "Archive Customer Profile?",
      message: `Are you sure you want to archive customer "${customer.name}"? Their profile will be deactivated while preserving historical task records.`,
      confirmText: "Archive Customer",
      variant: "danger",
      onConfirm: () => deleteCustomer(customer.id),
    });
  };

  const navigateToCustomerProfile = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setHighlightedTaskId(null);
    setCurrentPage("profile");
  };

  const navigateToCustomerTaskProfile = (
    customerId: string,
    taskId: string,
  ) => {
    setSelectedCustomerId(customerId);
    setHighlightedTaskId(taskId);
    setCurrentPage("profile");
    setTimeout(() => {
      setHighlightedTaskId(null);
    }, 4000);
  };

  const performSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() !== "") {
      if (currentPage !== "search") {
        setPreviousPage(currentPage);
      }
      setCurrentPageInternal("search");
    } else {
      setCurrentPageInternal(
        previousPage === "search" ? "dashboard" : previousPage,
      );
    }
  };

  return (
    <DeskContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        previousPage,
        selectedCustomerId,
        setSelectedCustomerId,
        highlightedTaskId,
        setHighlightedTaskId,
        searchQuery,
        setSearchQuery,
        taskDateFilter,
        setTaskDateFilter,
        selectedCalendarDate,
        setSelectedCalendarDate,
        customers,
        relationships,
        tasks,
        activities,
        services,
        payments,
        settings,
        addService,
        editService,
        deleteService,
        addPayment,
        addCustomer,
        editCustomer,
        deleteCustomer,
        addRelationship,
        deleteRelationship,
        getRelationshipsForCustomer,
        addTask,
        updateTaskStatus,
        updateTask,
        deleteTask,
        saveAppSetting,
        getSettingValue,
        createDatabaseBackup,
        restoreDatabaseBackup,
        confirmDeleteTask,
        confirmDeleteCustomer,
        showConfirm,
        showToast,
        isAddCustomerOpen,
        setIsAddCustomerOpen,
        isAddTaskOpen,
        setIsAddTaskOpen,
        isEditTaskOpen,
        setIsEditTaskOpen,
        selectedTaskToEdit,
        setSelectedTaskToEdit,
        navigateToCustomerProfile,
        navigateToCustomerTaskProfile,
        performSearch,
        taskPage,
        setTaskPage,
        customerPage,
        setCustomerPage,
        ITEMS_PER_PAGE,
      }}
    >
      {children}
      <ConfirmModal
        cancelText={confirmState.cancelText}
        confirmText={confirmState.confirmText}
        isOpen={confirmState.isOpen}
        message={confirmState.message}
        title={confirmState.title}
        variant={confirmState.variant}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }}
      />
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
    </DeskContext.Provider>
  );
};

export const useDesk = () => {
  const context = useContext(DeskContext);
  if (!context) {
    throw new Error("useDesk must be used within a DeskProvider");
  }
  return context;
};
