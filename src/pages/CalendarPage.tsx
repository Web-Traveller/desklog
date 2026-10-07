import React, { useState } from "react";
import { useDesk } from "../context/DeskContext";
import { CustomerSearchPicker } from "../components/CustomerSearchPicker";
import { TaskCard } from "../components/TaskCard";
import { dateMatchesCalendarDate, getFormattedToday } from "../utils/dateUtils";
import { formatRupees } from "../utils/currencyUtils";

export const CalendarPage: React.FC = () => {
  const {
    selectedCalendarDate,
    setSelectedCalendarDate,
    customers,
    tasks,
    activities,
    bankingTransactions,
    addTask,
  } = useDesk();

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDayNum, setSelectedDayNum] = useState<number>(
    new Date().getDate(),
  );
  const [quickCustId, setQuickCustId] = useState<string>("cust-general");
  const [quickTitle, setQuickTitle] = useState<string>("");
  const activityFilter: string = "all";

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonthCount = new Date(year, month + 1, 0).getDate();
  const daysInMonth = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const prevMonthDaysCount = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from(
    { length: startOffset },
    (_, i) => prevMonthDaysCount - startOffset + i + 1,
  );

  const handleSelectDay = (day: number) => {
    setSelectedDayNum(day);
    const dateStr = `${day} ${currentMonthDate.toLocaleString("default", { month: "short" })} ${year}`;
    setSelectedCalendarDate(dateStr);
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    await addTask({
      customer_id: quickCustId,
      title: quickTitle.trim(),
      status: "PENDING",
      scheduled_date: selectedCalendarDate,
      notes: `Scheduled for ${selectedCalendarDate}`,
    });

    setQuickTitle("");
  };

  // 1. Scheduled Work : Tasks planned for this date
  const scheduledWorkForDate = tasks.filter((t) => {
    return (
      (t.scheduled_date &&
        dateMatchesCalendarDate(t.scheduled_date, selectedCalendarDate)) ||
      (t.target_date &&
        dateMatchesCalendarDate(t.target_date, selectedCalendarDate))
    );
  });

  // 2. Activity History : Operational logs that actually happened on this date
  const activitiesForDate = activities.filter((act) => {
    const isDateMatch =
      !act.date || dateMatchesCalendarDate(act.date, selectedCalendarDate);
    if (!isDateMatch) return false;

    if (activityFilter === "created") return act.type === "task_created";
    if (activityFilter === "completed")
      return act.type === "task_completed" || act.type === "task_delivered";
    if (activityFilter === "payments") return act.type === "payment_added";
    return true;
  });

  // 3. Banking Transactions : Money movements that happened on this date
  const bankingTransactionsForDate = bankingTransactions.filter((tx) => {
    return !tx.is_deleted && dateMatchesCalendarDate(tx.transaction_date, selectedCalendarDate);
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter py-space-xl flex flex-col gap-space-xl animate-slideUp">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg border-b border-surface-container pb-space-xs">
        <div className="flex flex-col gap-space-xxs">
          <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-semibold">
            Calendar & Daily Work Log
          </h1>
          <p className="font-body text-body text-on-surface-variant max-w-2xl">
            Review scheduled tasks and historical operational activity for any
            date.
          </p>
        </div>

        {/* Quick Date Controls */}
        <div className="flex items-center gap-space-sm flex-wrap">
          <div className="flex items-center bg-surface-container-low rounded-full p-1 shadow-xs border border-surface-container-high/50">
            <button
              aria-label="Previous Day"
              className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-transform active:scale-95"
              onClick={() => handleSelectDay(Math.max(1, selectedDayNum - 1))}
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                chevron_left
              </span>
            </button>
            <button
              className="px-space-sm py-1 font-caption-strong text-caption-strong text-primary hover:bg-surface-container rounded-full transition-colors"
              onClick={() => {
                const todayObj = new Date();
                const todayStr = getFormattedToday();
                setCurrentMonthDate(
                  new Date(todayObj.getFullYear(), todayObj.getMonth(), 1),
                );
                setSelectedDayNum(todayObj.getDate());
                setSelectedCalendarDate(todayStr);
              }}
              type="button"
            >
              Today
            </button>
            <button
              aria-label="Next Day"
              className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-transform active:scale-95"
              onClick={() =>
                handleSelectDay(Math.min(daysInMonthCount, selectedDayNum + 1))
              }
              type="button"
            >
              <span className="material-symbols-outlined text-base">
                chevron_right
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-space-md py-2 rounded-full bg-surface-container-lowest shadow-xs border border-surface-container/60 text-on-surface font-caption-strong text-caption-strong">
            <span className="material-symbols-outlined text-base text-primary">
              calendar_month
            </span>
            <span>{selectedCalendarDate}</span>
          </div>
        </div>
      </div>

      {/* Two-Column Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column: Calendar & Fast Entry */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-space-lg">
          {/* Interactive Month Calendar Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <button
                  onClick={prevMonth}
                  className="p-1 hover:bg-surface-container rounded-full"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_left
                  </span>
                </button>
                <span className="font-tagline text-tagline text-on-surface font-semibold">
                  {currentMonthDate.toLocaleString("default", {
                    month: "long",
                  })}{" "}
                  {year}
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1 hover:bg-surface-container rounded-full"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center font-fine-print text-fine-print text-outline font-medium">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center font-caption text-caption items-center">
              {prevMonthDays.map((day) => (
                <span
                  key={`prev-${day}`}
                  className="py-2 text-outline-variant font-light"
                >
                  {day}
                </span>
              ))}
              {daysInMonth.map((day) => {
                const isSelected = day === selectedDayNum;
                const dayDateStr = `${day} ${currentMonthDate.toLocaleString("default", { month: "short" })} ${year}`;
                const hasWork = tasks.some(
                  (t) =>
                    (t.scheduled_date &&
                      dateMatchesCalendarDate(t.scheduled_date, dayDateStr)) ||
                    (t.target_date &&
                      dateMatchesCalendarDate(t.target_date, dayDateStr)),
                );

                return (
                  <button
                    key={day}
                    className={`py-1.5 flex flex-col items-center justify-center rounded-full transition-all ${
                      isSelected
                        ? "bg-primary text-on-primary font-bold shadow-sm"
                        : "hover:bg-surface-container-low text-on-surface"
                    }`}
                    onClick={() => handleSelectDay(day)}
                    type="button"
                  >
                    <span>{day}</span>
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected
                          ? "bg-primary-fixed"
                          : hasWork
                            ? "bg-secondary"
                            : "bg-transparent"
                      }`}
                    ></span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Schedule Task Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-xl">
                  bookmark_add
                </span>
                <span className="font-body-strong text-body-strong text-on-surface font-semibold">
                  Quick Schedule for {selectedCalendarDate}
                </span>
              </div>
            </div>

            <form
              className="flex flex-col gap-space-sm"
              onSubmit={handleQuickAdd}
            >
              <CustomerSearchPicker
                customers={customers}
                label="Customer Name / Walk-in"
                selectedCustomerId={quickCustId}
                onSelectCustomer={(c) => setQuickCustId(c.id)}
              />

              <div className="flex flex-col gap-1">
                <label className="font-fine-print text-fine-print text-on-surface-variant">
                  Task Title *
                </label>
                <input
                  required
                  className="w-full bg-surface-container-low text-on-surface rounded-xl px-space-md py-2.5 font-button-utility text-button-utility focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 border border-surface-container-high/40"
                  placeholder="e.g. Bank Account KYC Filing"
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                />
              </div>

              <button
                className="w-full py-2.5 px-space-md bg-primary hover:bg-primary-container text-on-primary rounded-full font-button-utility text-button-utility font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm mt-1"
                type="submit"
              >
                <span className="material-symbols-outlined text-lg">
                  alarm_add
                </span>
                <span>Schedule Work</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Scheduled Work vs Historical Activity Timeline */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-space-lg">
          {/* Selected Date Header Banner */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-md">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex flex-col items-center justify-center text-primary font-bold border border-surface-container-high/40">
                <span className="font-micro-legal text-micro-legal uppercase tracking-wider text-outline">
                  DATE
                </span>
                <span className="font-tagline text-tagline leading-none">
                  {selectedDayNum}
                </span>
              </div>
              <div className="flex flex-col">
                <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                  {selectedCalendarDate}
                </h2>
                <span className="font-caption text-caption text-on-surface-variant">
                  {scheduledWorkForDate.length} scheduled task(s) •{" "}
                  {activitiesForDate.length} activity event(s) •{" "}
                  {bankingTransactionsForDate.length} banking tx(s)
                </span>
              </div>
            </div>
          </div>

          {/* CONCEPT 1 : Scheduled Work (Planned for this date) */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <h2 className="font-tagline text-tagline text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">
                  event_available
                </span>
                <span>1. Scheduled Work (Planned Tasks)</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-primary-container text-on-primary font-fine-print text-fine-print font-bold">
                {scheduledWorkForDate.length} Tasks
              </span>
            </div>

            {scheduledWorkForDate.length === 0 ? (
              <div className="py-8 text-center text-fine-print text-outline font-caption flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-3xl text-outline/40">
                  event_busy
                </span>
                <span>
                  No work planned or scheduled for {selectedCalendarDate}.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-space-xs">
                {scheduledWorkForDate.map((task) => (
                  <TaskCard key={task.id} layout="list" task={task} />
                ))}
              </div>
            )}
          </div>

          {/* CONCEPT 2 : Activity History (What actually happened on this date) */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <h2 className="font-tagline text-tagline text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">
                  history
                </span>
                <span>2. Operational Activity Log (What Happened)</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-fine-print text-fine-print font-bold">
                {activitiesForDate.length} Logs
              </span>
            </div>

            {activitiesForDate.length === 0 ? (
              <div className="py-8 text-center text-fine-print text-outline font-caption flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-3xl text-outline/40">
                  history
                </span>
                <span>No operational activity logs recorded for this day.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-space-sm">
                {activitiesForDate.map((act) => (
                  <div
                    key={act.id}
                    className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col md:flex-row md:items-center justify-between gap-space-md transition-all hover:border-primary/30"
                  >
                    <div className="flex items-start gap-space-md">
                      <div className="flex flex-col items-center justify-center min-w-[70px] pt-1">
                        <span className="font-caption-strong text-caption-strong text-on-surface font-semibold">
                          {act.time}
                        </span>
                      </div>

                      <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-lg">
                          {act.type === "task_completed" ||
                          act.type === "task_delivered"
                            ? "check_circle"
                            : act.type === "payment_added"
                              ? "payments"
                              : act.type === "customer_created"
                                ? "person_add"
                                : "assignment"}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs flex-wrap">
                          <span className="font-body-strong text-body-strong text-on-surface font-semibold">
                            {act.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-fine-print text-fine-print font-bold">
                            {act.badgeText}
                          </span>
                        </div>
                        <p className="font-fine-print text-fine-print text-outline mt-0.5">
                          {act.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CONCEPT 3 : Banking Transactions */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <h2 className="font-tagline text-tagline text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-xl">
                  account_balance
                </span>
                <span>3. Banking Ledger</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-fine-print text-fine-print font-bold">
                {bankingTransactionsForDate.length} Tx
              </span>
            </div>

            {bankingTransactionsForDate.length === 0 ? (
              <div className="py-8 text-center text-fine-print text-outline font-caption flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-3xl text-outline/40">
                  account_balance_wallet
                </span>
                <span>No banking transactions recorded for this day.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-space-sm">
                {bankingTransactionsForDate.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-space-md rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col md:flex-row md:items-center justify-between gap-space-md transition-all hover:border-tertiary/30"
                  >
                    <div className="flex items-start gap-space-md">
                      <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-tertiary flex-shrink-0">
                        <span className="material-symbols-outlined text-lg">
                          {tx.transaction_type === "Transfer" ? "swap_horiz" : tx.transaction_type === "Withdrawal" ? "arrow_downward" : "arrow_upward"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs flex-wrap">
                          <span className="font-body-strong text-body-strong text-on-surface font-semibold">
                            {tx.transaction_type} via {tx.payment_mode}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-fine-print text-fine-print font-bold">
                            {formatRupees(tx.amount)}
                          </span>
                        </div>
                        <p className="font-fine-print text-fine-print text-outline mt-0.5">
                          {tx.transaction_ref_no ? `Ref: ${tx.transaction_ref_no}` : 'No Ref'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
