import React, { useState } from 'react';
import { useDesk } from '../context/DeskContext';
import { MetricCard } from '../components/MetricCard';
import { CustomerSearchPicker } from '../components/CustomerSearchPicker';
import { TaskCard } from '../components/TaskCard';
import { dateMatchesCalendarDate, getFormattedToday } from '../utils/dateUtils';

export const CalendarPage: React.FC = () => {
  const {
    selectedCalendarDate,
    setSelectedCalendarDate,
    customers,
    tasks,
    activities,
    addTask,
    navigateToCustomerTaskProfile,
  } = useDesk();

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDayNum, setSelectedDayNum] = useState<number>(new Date().getDate());
  const [quickCustId, setQuickCustId] = useState<string>('cust-general');
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [activityFilter, setActivityFilter] = useState<string>('all');

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const daysInMonthCount = new Date(year, month + 1, 0).getDate();
  const daysInMonth = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const prevMonthDaysCount = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from({ length: startOffset }, (_, i) => prevMonthDaysCount - startOffset + i + 1);

  const handleSelectDay = (day: number) => {
    setSelectedDayNum(day);
    const dateStr = `${day} ${currentMonthDate.toLocaleString('default', { month: 'short' })} ${year}`;
    setSelectedCalendarDate(dateStr);
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const cust = customers.find((c) => c.id === quickCustId) || customers[0];

    addTask({
      customerId: cust.id,
      customerName: cust.name,
      customerPhone: cust.phone,
      title: quickTitle.trim(),
      status: 'pending',
      subStatus: `Scheduled for ${selectedCalendarDate}`,
    });

    setQuickTitle('');
  };

  // Filter tasks specifically for the selected date
  const tasksForSelectedDate = tasks.filter((t) => {
    return (
      dateMatchesCalendarDate(t.createdDate, selectedCalendarDate) ||
      dateMatchesCalendarDate(t.updatedDate, selectedCalendarDate) ||
      dateMatchesCalendarDate(t.targetDate, selectedCalendarDate) ||
      dateMatchesCalendarDate(t.scheduleDate, selectedCalendarDate)
    );
  });

  // Filter activities for the selected date
  const activitiesForSelectedDate = activities.filter((act) => {
    if (act.taskId && !tasks.some((t) => t.id === act.taskId)) {
      return false;
    }
    const isDateMatch = !act.date || dateMatchesCalendarDate(act.date, selectedCalendarDate);
    if (!isDateMatch) return false;

    if (activityFilter === 'created') return act.type === 'task_created';
    if (activityFilter === 'completed') return act.type === 'task_completed';
    if (activityFilter === 'customers') return act.type === 'customer_registered';
    return true;
  });

  return (
    <div className="w-full max-w-[1400px] mx-auto px-gutter py-space-xl flex flex-col gap-space-xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg border-b border-surface-container pb-space-xs">
        <div className="flex flex-col gap-space-xxs">
          <h1 className="font-display-md text-display-md text-on-surface tracking-tight font-semibold">
            Calendar & Daily Log
          </h1>
          <p className="font-body text-body text-on-surface-variant max-w-2xl">
            Select any date to review customer visits, tasks created, and completed handovers for that specific day.
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
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <button
              className="px-space-sm py-1 font-caption-strong text-caption-strong text-primary hover:bg-surface-container rounded-full transition-colors"
              onClick={() => {
                const todayObj = new Date();
                const todayStr = getFormattedToday();
                setCurrentMonthDate(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1));
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
              onClick={() => handleSelectDay(Math.min(daysInMonthCount, selectedDayNum + 1))}
              type="button"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
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
                <button onClick={prevMonth} className="p-1 hover:bg-surface-container rounded-full">
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="font-tagline text-tagline text-on-surface font-semibold">
                  {currentMonthDate.toLocaleString('default', { month: 'long' })} {year}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-surface-container rounded-full">
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
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
              {prevMonthDays.map(day => (
                <span key={`prev-${day}`} className="py-2 text-outline-variant font-light">{day}</span>
              ))}
              {daysInMonth.map((day) => {
                const isSelected = day === selectedDayNum;
                const dayDateStr = `${day} ${currentMonthDate.toLocaleString('default', { month: 'short' })} ${year}`;
                const hasDot = tasks.some(
                  (t) =>
                    dateMatchesCalendarDate(t.createdDate, dayDateStr) ||
                    dateMatchesCalendarDate(t.targetDate, dayDateStr) ||
                    dateMatchesCalendarDate(t.scheduleDate, dayDateStr)
                );

                return (
                  <button
                    key={day}
                    className={`py-1.5 flex flex-col items-center justify-center rounded-full transition-all ${
                      isSelected
                        ? 'bg-primary text-on-primary font-bold shadow-sm'
                        : 'hover:bg-surface-container-low text-on-surface'
                    }`}
                    onClick={() => handleSelectDay(day)}
                    type="button"
                  >
                    <span>{day}</span>
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected
                          ? 'bg-primary-fixed'
                          : hasDot
                          ? 'bg-secondary'
                          : 'bg-transparent'
                      }`}
                    ></span>
                  </button>
                );
              })}
            </div>

            <div className="pt-space-sm flex items-center justify-between font-fine-print text-fine-print text-on-surface-variant border-t border-surface-container/40">
              <div className="flex items-center gap-space-sm">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>Days with records</span>
                </span>
              </div>
              <button
                className="text-primary font-semibold hover:underline flex items-center gap-0.5"
                onClick={() => {
                  const todayObj = new Date();
                  const todayStr = getFormattedToday();
                  setCurrentMonthDate(new Date(todayObj.getFullYear(), todayObj.getMonth(), 1));
                  setSelectedDayNum(todayObj.getDate());
                  setSelectedCalendarDate(todayStr);
                }}
                type="button"
              >
                <span>Jump to Today</span>
                <span className="material-symbols-outlined text-sm">north_east</span>
              </button>
            </div>
          </div>

          {/* Quick Add Task Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-xl">
                  bookmark_add
                </span>
                <span className="font-body-strong text-body-strong text-on-surface">
                  Quick Add for {selectedCalendarDate}
                </span>
              </div>
            </div>

            <form className="flex flex-col gap-space-sm" onSubmit={handleQuickAdd}>
              <CustomerSearchPicker
                customers={customers}
                label="Customer Name / Walk-in"
                selectedCustomerId={quickCustId}
                onSelectCustomer={(c) => setQuickCustId(c.id)}
              />

              <div className="flex flex-col gap-1">
                <label className="font-fine-print text-fine-print text-on-surface-variant">
                  Task / Service Title
                </label>
                <input
                  required
                  className="w-full bg-surface-container-low text-on-surface rounded-xl px-space-md py-2.5 font-button-utility text-button-utility focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 border border-surface-container-high/40"
                  placeholder="e.g. Caste Certificate, Aadhaar Update"
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                />
              </div>

              <button
                className="w-full py-2.5 px-space-md bg-primary hover:bg-primary-container text-on-primary rounded-full font-button-utility text-button-utility font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm mt-1"
                type="submit"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>Record Task</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Selected Date Tasks & Activity Timeline */}
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
                <div className="flex items-center gap-space-xs">
                  <h2 className="font-tagline text-tagline text-on-surface font-semibold">
                    {selectedCalendarDate}
                  </h2>
                </div>
                <span className="font-caption text-caption text-on-surface-variant">
                  {tasksForSelectedDate.length} tasks scheduled/recorded for this date
                </span>
              </div>
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm">
            <MetricCard
              icon="person_add"
              iconColorClass="text-primary"
              subtitle="Registered clients"
              title="Total Clients"
              value={customers.filter((c) => c.id !== 'cust-general').length}
            />
            <MetricCard
              icon="assignment"
              iconColorClass="text-secondary"
              subtitle="For selected date"
              title="Tasks Scheduled"
              value={tasksForSelectedDate.length}
            />
            <MetricCard
              icon="task_alt"
              iconColorClass="text-primary"
              subtitle="For selected date"
              title="Completed / Handed"
              value={tasksForSelectedDate.filter((t) => t.status === 'done').length}
            />
            <MetricCard
              icon="pending_actions"
              iconColorClass="text-tertiary"
              subtitle="For selected date"
              title="Pending Action"
              value={tasksForSelectedDate.filter((t) => t.status === 'pending').length}
            />
          </div>

          {/* Tasks for Selected Date Section */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-surface-container/60 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
              <h2 className="font-tagline text-tagline text-on-surface font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">event_available</span>
                <span>Tasks Scheduled for {selectedCalendarDate}</span>
              </h2>
              <span className="font-fine-print text-fine-print text-outline">
                {tasksForSelectedDate.length} records
              </span>
            </div>

            {tasksForSelectedDate.length === 0 ? (
              <div className="py-12 text-center text-fine-print text-outline font-caption flex flex-col items-center gap-1.5">
                <span className="material-symbols-outlined text-3xl text-outline/40">event_busy</span>
                <span className="font-medium text-on-surface-variant">No tasks scheduled or recorded on {selectedCalendarDate}</span>
                <span>Use the Quick Add box to record a task for this date.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-space-xs">
                {tasksForSelectedDate.map((task) => (
                  <TaskCard key={task.id} layout="list" task={task} />
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline List */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between flex-wrap gap-space-sm pt-space-xs">
              <div className="flex items-center gap-space-xs flex-wrap font-fine-print text-fine-print">
                <button
                  className={`px-space-md py-1.5 rounded-full transition-all ${
                    activityFilter === 'all'
                      ? 'bg-on-surface text-surface-bright font-semibold'
                      : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface shadow-xs'
                  }`}
                  onClick={() => setActivityFilter('all')}
                >
                  All Register Logs ({activitiesForSelectedDate.length})
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm">
              {activitiesForSelectedDate.length === 0 ? (
                <div className="py-8 text-center text-fine-print text-outline font-caption flex flex-col items-center gap-1 bg-surface-container-lowest rounded-2xl border border-surface-container/60">
                  <span className="material-symbols-outlined text-3xl text-outline/40">history</span>
                  <span>No general activity logs recorded for this day.</span>
                </div>
              ) : (
                activitiesForSelectedDate.map((act) => (
                  <div
                    key={act.id}
                    className="bg-surface-container-lowest rounded-2xl p-space-md shadow-xs border border-surface-container/60 flex flex-col md:flex-row md:items-center justify-between gap-space-md transition-all hover:border-primary/30 cursor-pointer"
                    onClick={() => {
                      const matchedTask = tasks.find((t) => t.title === act.title || t.id === act.taskId);
                      if (matchedTask) {
                        navigateToCustomerTaskProfile(matchedTask.customerId, matchedTask.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-space-md">
                      <div className="flex flex-col items-center justify-center min-w-[70px] pt-1">
                        <span className="font-caption-strong text-caption-strong text-on-surface font-semibold">
                          {act.time}
                        </span>
                        <span className="font-micro-legal text-micro-legal text-outline">
                          {act.timePeriod}
                        </span>
                      </div>

                      <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary flex-shrink-0">
                        <span className="material-symbols-outlined text-xl">
                          {act.type === 'task_completed'
                            ? 'check_circle'
                            : act.type === 'customer_registered'
                            ? 'person_add'
                            : 'assignment'}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <div className="flex items-center gap-space-xs flex-wrap">
                          <span className="font-body-strong text-body-strong text-on-surface font-semibold hover:text-primary hover:underline">
                            {act.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant font-fine-print text-fine-print">
                            {act.badgeText}
                          </span>
                        </div>

                        <div className="flex items-center gap-space-xs text-on-surface-variant font-caption text-caption mt-0.5">
                          <span className="font-medium text-on-surface">{act.customerName}</span>
                          <span>•</span>
                          <span className="font-fine-print text-fine-print text-outline font-mono">
                            {act.customerPhone}
                          </span>
                        </div>

                        <p className="font-fine-print text-fine-print text-outline mt-1">
                          {act.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-space-xs self-end md:self-center">
                      <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-caption-strong text-caption-strong flex items-center gap-1 text-xs">
                        <span>View Task →</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
