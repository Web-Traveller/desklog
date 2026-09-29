import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  Customer,
  Task,
  ActivityEvent,
  ActivePage,
  TaskStatus,
  GENERAL_CUSTOMER,
} from "../types";
import { getFormattedToday, getFormattedNow } from "../utils/dateUtils";
import {
  fetchTauriCustomers,
  saveTauriCustomer,
  updateTauriCustomer,
  deleteTauriCustomer,
  fetchTauriTasks,
  saveTauriTask,
  updateTauriTaskStatus,
  updateTauriTask,
  deleteTauriTask,
  fetchTauriActivities,
  saveTauriActivity,
  triggerDesktopNotification,
} from "../api/tauri";
import { ConfirmModal } from "../components/ConfirmModal";
import { ToastNotification, ToastMessage } from "../components/ToastNotification";

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
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
  tasks: Task[];
  activities: ActivityEvent[];

  addCustomer: (customer: Omit<Customer, "id" | "registeredDate">) => Customer;
  editCustomer: (id: string, customerData: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addTask: (task: Omit<Task, "id" | "createdDate">) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  updateTask: (taskId: string, taskData: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  confirmDeleteTask: (task: Task) => void;
  confirmDeleteCustomer: (customer: Customer) => void;
  showConfirm: (options: ConfirmOptions) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;

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

  // Pure state
  const [customers, setCustomers] = useState<Customer[]>([GENERAL_CUSTOMER]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);

  const [taskPage, setTaskPage] = useState(0);
  const [customerPage, setCustomerPage] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Custom Toast & Confirmation modal state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
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

  // Initialize data from Tauri Rust SQLite database
  useEffect(() => {
    async function initData() {
      const dbCusts = await fetchTauriCustomers();
      if (dbCusts && dbCusts.length > 0) {
        setCustomers(dbCusts);
      }

      const dbTasks = await fetchTauriTasks();
      if (dbTasks) {
        setTasks(dbTasks);
      }

      const dbActs = await fetchTauriActivities();
      if (dbActs) {
        setActivities(dbActs);
      }
    }
    initData();
  }, []);

  // Background interval checking for scheduled task reminders and due alarms every 30 seconds
  useEffect(() => {
    const checkScheduledNotifications = () => {
      const now = new Date();
      const todayStr = getFormattedToday();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = `${tomorrow.getDate()} ${tomorrow.toLocaleString('default', { month: 'short' })} ${tomorrow.getFullYear()}`;

      tasks.forEach((task) => {
        if (task.status === 'done') return;

        // 1. Check scheduleDate (alarm for exact time or day)
        if (task.scheduleDate) {
          const scheduleTime = new Date(task.scheduleDate);
          if (!isNaN(scheduleTime.getTime())) {
            const timeDiff = scheduleTime.getTime() - now.getTime();
            const keyTime = `${task.id}-sched-time-${scheduleTime.getTime()}`;

            // Alarm when scheduled time has arrived (within last 5 minutes or due right now)
            if (timeDiff <= 0 && timeDiff >= -5 * 60 * 1000 && !notifiedKeysRef.current.has(keyTime)) {
              notifiedKeysRef.current.add(keyTime);
              triggerDesktopNotification(
                "⏰ DeskLog: Scheduled Task Reminder!",
                `Task '${task.title}' for ${task.customerName} is scheduled NOW!`
              );
            }

            // Morning reminder if scheduled for today
            const schedStr = `${scheduleTime.getDate()} ${scheduleTime.toLocaleString('default', { month: 'short' })} ${scheduleTime.getFullYear()}`;
            const keyToday = `${task.id}-sched-today-${schedStr}`;
            if (schedStr === todayStr && timeDiff > 0 && !notifiedKeysRef.current.has(keyToday)) {
              notifiedKeysRef.current.add(keyToday);
              triggerDesktopNotification(
                "📅 DeskLog: Task Scheduled Today",
                `Task '${task.title}' for ${task.customerName} is scheduled for today.`
              );
            }
          }
        }

        // 2. Check targetDate (target completion deadline)
        if (task.targetDate) {
          const targetDay = new Date(task.targetDate);
          if (!isNaN(targetDay.getTime())) {
            const targetStr = `${targetDay.getDate()} ${targetDay.toLocaleString('default', { month: 'short' })} ${targetDay.getFullYear()}`;
            const keyTargetToday = `${task.id}-target-today-${targetStr}`;
            const keyTargetTomorrow = `${task.id}-target-tomorrow-${targetStr}`;

            if (targetStr === todayStr && !notifiedKeysRef.current.has(keyTargetToday)) {
              notifiedKeysRef.current.add(keyTargetToday);
              triggerDesktopNotification(
                "⚠️ DeskLog: Target Completion Today!",
                `Task '${task.title}' for ${task.customerName} target date is TODAY.`
              );
            } else if (targetStr === tomorrowStr && !notifiedKeysRef.current.has(keyTargetTomorrow)) {
              notifiedKeysRef.current.add(keyTargetTomorrow);
              triggerDesktopNotification(
                "📌 DeskLog: Target Completion Tomorrow",
                `Task '${task.title}' for ${task.customerName} target date is tomorrow.`
              );
            }
          }
        }
      });
    };

    checkScheduledNotifications();
    const interval = setInterval(checkScheduledNotifications, 30000);
    return () => clearInterval(interval);
  }, [tasks]);

  const addCustomer = (
    customerData: Omit<Customer, "id" | "registeredDate">,
  ) => {
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
      registeredDate: getFormattedToday(),
      avatarInitials: initials || "DS",
      avatarColor: "bg-primary-fixed text-on-primary-fixed",
    };

    setCustomers((prev) => [newCust, ...prev]);

    // Persist via Tauri SQLite & Desktop Notification
    saveTauriCustomer(newCust);

    // Create activity log for customer enrollment
    const newAct: ActivityEvent = {
      id: `act-${Date.now()}`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timePeriod: "Just Now",
      type: "customer_registered",
      title: `Registered: ${newCust.name}`,
      customerName: newCust.name,
      customerPhone: newCust.phone,
      description: "New customer profile registered in desk log.",
      badgeText: "ENROLLED",
      status: "new",
      date: getFormattedToday(),
    };
    saveTauriActivity(newAct);
    setActivities((prev) => [newAct, ...prev]);

    triggerDesktopNotification(
      "DeskLog: Customer Enrolled",
      `Registered ${newCust.name} (${newCust.phone}) in desk database.`,
    );

    return newCust;
  };

  const editCustomer = async (id: string, customerData: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...customerData } : c)),
    );

    // Also update denormalized fields in tasks state
    if (customerData.name || customerData.phone) {
      setTasks((prev) =>
        prev.map((t) =>
          t.customerId === id
            ? {
                ...t,
                customerName: customerData.name || t.customerName,
                customerPhone: customerData.phone || t.customerPhone,
              }
            : t
        )
      );
    }

    const updated = customers.find((c) => c.id === id);
    if (updated) {
      await updateTauriCustomer(
        id,
        customerData.name || updated.name,
        customerData.phone || updated.phone,
        customerData.notes !== undefined ? customerData.notes : updated.notes,
      );
    }
  };

  const deleteCustomer = async (id: string) => {
    if (id === 'cust-general') {
      showToast("System Default Walk-in customer profile cannot be deleted.", "warning");
      return;
    }
    const deletedTaskIds = tasks.filter((t) => t.customerId === id).map((t) => t.id);
    const success = await deleteTauriCustomer(id);
    if (success) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      setTasks((prev) => prev.filter((t) => t.customerId !== id));
      setActivities((prev) => prev.filter((a) => !a.taskId || !deletedTaskIds.includes(a.taskId)));
      if (selectedCustomerId === id) {
        setSelectedCustomerId('cust-general');
      }
      showToast("Customer profile deleted successfully", "success");
    } else {
      showToast("Error: Failed to delete customer from database.", "error");
    }
  };

  const addTask = async (taskData: Omit<Task, "id" | "createdDate">) => {
    const newTaskId = `task-${Date.now()}`;
    const nowFormatted = getFormattedNow();

    // Auto-calculate billing status based on math
    let autoBillingStatus = taskData.billingStatus || "pending";
    if (taskData.billingAmount !== undefined) {
      const paid = taskData.amountPaid || 0;
      if (paid >= taskData.billingAmount && taskData.billingAmount > 0) {
        autoBillingStatus = "paid";
      } else if (paid > 0 && paid < taskData.billingAmount) {
        autoBillingStatus = "partial";
      } else if (paid === 0) {
        autoBillingStatus = "unpaid";
      }
    }

    const newTask: Task = {
      ...taskData,
      id: newTaskId,
      createdDate: nowFormatted,
      billingStatus: autoBillingStatus,
    };
    
    // Persist via Tauri SQLite BEFORE updating UI
    const savedTask = await saveTauriTask(newTask);
    if (!savedTask) {
      alert("Error: Failed to save task to database. Disk might be full or database locked.");
      return;
    }

    setTasks((prev) => [savedTask, ...prev]);

    // Add activity log
    const newAct: ActivityEvent = {
      id: `act-${Date.now()}`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timePeriod: "Just Now",
      type: "task_created",
      title: savedTask.title,
      customerName: savedTask.customerName,
      customerPhone: savedTask.customerPhone,
      description: `Task logged with status: ${savedTask.status.toUpperCase()}`,
      badgeText: savedTask.status.toUpperCase(),
      status: savedTask.status,
      taskId: newTaskId,
      date: getFormattedToday(),
    };
    
    // Save to DB
    await saveTauriActivity(newAct);
    setActivities((prev) => [newAct, ...prev]);

    triggerDesktopNotification(
      "DeskLog: New Task Logged",
      `Registered task '${savedTask.title}' for ${savedTask.customerName}.`,
    );
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const updatedTime = getFormattedNow();
    const subStatus = newStatus === "done" ? "Ready for handover" : undefined;

    // Persist via Tauri SQLite
    const success = await updateTauriTaskStatus(taskId, newStatus, updatedTime, subStatus);
    if (!success) {
      alert("Error: Failed to update task status in database.");
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              updatedDate: updatedTime,
              subStatus: subStatus || t.subStatus,
            }
          : t,
      ),
    );

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      if (newStatus === "done") {
        const newAct: ActivityEvent = {
          id: `act-${Date.now()}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          timePeriod: "Just Now",
          type: "task_completed",
          title: task.title,
          customerName: task.customerName,
          customerPhone: task.customerPhone,
          description: "Task marked as DONE / Ready for handover.",
          badgeText: "READY",
          status: "done",
          taskId: task.id,
          date: getFormattedToday(),
        };
        await saveTauriActivity(newAct);
        setActivities((prev) => [newAct, ...prev]);

        triggerDesktopNotification(
          "DeskLog: Task Completed ✓",
          `Task '${task.title}' for ${task.customerName} is now ready for delivery.`,
        );
      }
    }
  };

  const updateTask = async (taskId: string, taskData: Partial<Task>) => {
    const updatedTime = getFormattedNow();
    const oldTask = tasks.find(t => t.id === taskId);
    if (!oldTask) return;

    const updatedTask = { ...oldTask, ...taskData, updatedDate: updatedTime };
    
    // Auto-calculate billing status based on math
    if (updatedTask.billingAmount !== undefined) {
      const paid = updatedTask.amountPaid || 0;
      if (paid >= updatedTask.billingAmount && updatedTask.billingAmount > 0) {
        updatedTask.billingStatus = "paid";
      } else if (paid > 0 && paid < updatedTask.billingAmount) {
        updatedTask.billingStatus = "partial";
      } else if (paid === 0 && updatedTask.billingStatus === "paid") {
        updatedTask.billingStatus = "unpaid"; // rollback if amount paid set to 0
      }
    }

    // Call full update in Tauri DB BEFORE updating UI
    const success = await updateTauriTask(updatedTask);
    if (!success) {
      alert("Error: Failed to save changes to database.");
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? updatedTask : t))
    );
  };

  const deleteTask = async (taskId: string) => {
    const success = await deleteTauriTask(taskId);
    if (success) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setActivities((prev) => prev.filter((a) => a.taskId !== taskId));
      showToast("Task deleted successfully", "success");
    } else {
      showToast("Error: Failed to delete task from database.", "error");
    }
  };

  const confirmDeleteTask = (task: Task) => {
    showConfirm({
      title: "Delete Desk Task?",
      message: `Are you sure you want to delete task "${task.title}" for ${task.customerName}? This record will be permanently removed.`,
      confirmText: "Delete Task",
      variant: "danger",
      onConfirm: () => deleteTask(task.id),
    });
  };

  const confirmDeleteCustomer = (customer: Customer) => {
    if (customer.id === 'cust-general') {
      showToast("System Default Walk-in customer profile cannot be deleted.", "warning");
      return;
    }
    showConfirm({
      title: "Delete Customer Profile?",
      message: `Are you sure you want to delete customer "${customer.name}" and all associated task records? This action cannot be undone.`,
      confirmText: "Delete Customer",
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

    // Automatically remove highlight after 4 seconds
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
        tasks,
        activities,
        addCustomer,
        editCustomer,
        deleteCustomer,
        addTask,
        updateTaskStatus,
        updateTask,
        deleteTask,
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
