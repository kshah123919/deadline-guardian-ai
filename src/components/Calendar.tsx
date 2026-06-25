import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, Plus, Circle, CheckCircle2, ChevronDown, ListTodo, MapPin, Tag
} from 'lucide-react';
import { Task } from '../types';

interface CalendarProps {
  tasks: Task[];
  isDark: boolean;
  onNavigateToTasks: () => void;
}

export default function Calendar({ tasks, isDark, onNavigateToTasks }: CalendarProps) {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Month navigation helpers
  const handlePrevRange = () => {
    setCurrentDate(prev => {
      const copy = new Date(prev);
      if (viewMode === 'month') {
        copy.setMonth(copy.getMonth() - 1);
      } else {
        copy.setDate(copy.getDate() - 7);
      }
      return copy;
    });
  };

  const handleNextRange = () => {
    setCurrentDate(prev => {
      const copy = new Date(prev);
      if (viewMode === 'month') {
        copy.setMonth(copy.getMonth() + 1);
      } else {
        copy.setDate(copy.getDate() + 7);
      }
      return copy;
    });
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  // Check if a task falls on a specific date
  const getTasksOnDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.deadline);
      return taskDate.getDate() === date.getDate() &&
             taskDate.getMonth() === date.getMonth() &&
             taskDate.getFullYear() === date.getFullYear();
    });
  };

  // Generate Month Grid Days
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of current month
    const firstDayOfMonth = new Date(year, month, 1);
    // Day of the week for the first day (0 = Sunday, 6 = Saturday)
    const startDayOfWeek = firstDayOfMonth.getDay();

    // Total days in current month
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Pad days from the previous month
    const prevMonthDaysCount = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDaysCount - i),
        isCurrentMonth: false
      });
    }

    // Days in current month
    for (let i = 1; i <= totalDaysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Pad remaining grid slots from the next month to fit full rows (multiples of 7)
    const remainingSlots = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  // Generate Week Days (starts from Sunday of the current week)
  const getWeekDays = () => {
    const days: Date[] = [];
    const copy = new Date(currentDate);
    const dayOfWeek = copy.getDay(); // 0-6
    copy.setDate(copy.getDate() - dayOfWeek); // Snap to Sunday

    for (let i = 0; i < 7; i++) {
      days.push(new Date(copy));
      copy.setDate(copy.getDate() + 1);
    }
    return days;
  };

  // Format month name
  const formattedMonth = currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' });

  // WEEK days names
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getPriorityBadgeColor = (p: string) => {
    switch (p) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Calendar Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-theme-primary">Time Matrix</h1>
          <p className="text-sm text-theme-secondary mt-1">
            Analyze upcoming deadline trajectories and scheduled parameters.
          </p>
        </div>

        {/* View Mode & Time Jump controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggler */}
          <div className="flex items-center bg-theme-card border border-theme-border p-1 rounded-xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'month'
                  ? 'bg-theme-bg text-indigo-600 dark:text-indigo-400 shadow-sm border border-theme-border/10'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              Month Grid
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                viewMode === 'week'
                  ? 'bg-theme-bg text-indigo-600 dark:text-indigo-400 shadow-sm border border-theme-border/10'
                  : 'text-theme-secondary hover:text-theme-primary'
              }`}
            >
              Weekly Schedule
            </button>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevRange}
              className="p-2 rounded-xl border border-theme-border hover:bg-theme-card text-theme-secondary hover:text-theme-primary cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleGoToday}
              className="px-3 py-2 rounded-xl border border-theme-border text-xs font-semibold hover:bg-theme-card text-theme-secondary hover:text-theme-primary cursor-pointer transition-all"
            >
              Today
            </button>
            <button
              onClick={handleNextRange}
              className="p-2 rounded-xl border border-theme-border hover:bg-theme-card text-theme-secondary hover:text-theme-primary cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Date Header Title */}
      <div className="flex items-center gap-3">
        <CalendarIcon className="w-5.5 h-5.5 text-indigo-500" />
        <h2 className="text-xl font-extrabold text-theme-primary font-sans tracking-tight">
          {viewMode === 'month' 
            ? formattedMonth 
            : `Week of ${getWeekDays()[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${getWeekDays()[6].toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`}
        </h2>
      </div>

      {/* RENDER VIEWPORTS */}
      {viewMode === 'month' ? (
        /* Monthly Grid Viewport */
        <div className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden shadow-sm">
          {/* Weekday names header */}
          <div className="grid grid-cols-7 border-b border-theme-border text-center py-2.5 bg-theme-bg/50">
            {weekdays.map((day) => (
              <span key={day} className="text-xs font-mono font-bold text-theme-muted uppercase tracking-widest">
                {day}
              </span>
            ))}
          </div>

          {/* Monthly grid cell block */}
          <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr divide-x divide-y divide-theme-border">
            {getMonthDays().map(({ date, isCurrentMonth }, i) => {
              const dayTasks = getTasksOnDate(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={i}
                  className={`min-h-[96px] p-2 flex flex-col justify-between hover:bg-theme-bg/30 transition-colors ${
                    isCurrentMonth ? '' : 'opacity-30'
                  }`}
                >
                  {/* Day digit */}
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                      isToday 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                        : 'text-theme-secondary'
                    }`}>
                      {date.getDate()}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] font-bold font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 rounded">
                        {dayTasks.length} task{dayTasks.length > 1 && 's'}
                      </span>
                    )}
                  </div>

                  {/* Tasks on this day list */}
                  <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[64px] scrollbar-thin">
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={onNavigateToTasks}
                        className={`text-[10px] font-medium leading-none px-1.5 py-1 rounded border cursor-pointer hover:translate-x-0.5 transition-transform truncate flex items-center gap-1 ${
                          task.status === 'completed'
                            ? 'bg-theme-bg text-theme-muted line-through border-theme-border'
                            : 'bg-indigo-50/50 text-indigo-900 border-indigo-100/50 dark:bg-indigo-950/20 dark:text-indigo-200 dark:border-indigo-950/50'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityBadgeColor(task.priority)}`} />
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Weekly Schedule Viewport */
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {getWeekDays().map((date, i) => {
            const dayTasks = getTasksOnDate(date);
            const isToday = new Date().toDateString() === date.toDateString();
            const formattedDay = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

            return (
              <div
                key={i}
                className={`flex flex-col border rounded-2xl p-4 min-h-[300px] bg-theme-card transition-all ${
                  isToday 
                    ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500/20' 
                    : 'border-theme-border'
                }`}
              >
                {/* Column header */}
                <div className="border-b border-theme-border pb-3 mb-3 flex flex-col">
                  <span className="text-xs font-mono font-bold text-theme-muted uppercase tracking-widest">
                    {weekdays[date.getDay()]}
                  </span>
                  <span className={`text-base font-extrabold mt-0.5 ${
                    isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-theme-primary'
                  }`}>
                    {formattedDay}
                  </span>
                </div>

                {/* Vertical lists for Weekday schedule */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {dayTasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-center text-theme-muted">
                      <ListTodo className="w-6 h-6 stroke-[1.5] opacity-40 mb-1" />
                      <span className="text-[10px] font-semibold">Free Day</span>
                    </div>
                  ) : (
                    dayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={onNavigateToTasks}
                        className={`p-2.5 rounded-xl border cursor-pointer hover:-translate-y-0.5 transition-all space-y-1 bg-theme-bg/50 ${
                          task.status === 'completed'
                            ? 'border-theme-border opacity-60'
                            : 'border-theme-border hover:border-indigo-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[9px]">
                          <span className="font-mono text-theme-muted flex items-center gap-0.5 truncate uppercase">
                            <Tag className="w-2.5 h-2.5 shrink-0" />
                            {task.category}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getPriorityBadgeColor(task.priority)}`} />
                        </div>
                        <h4 className={`text-xs font-bold leading-tight ${
                          task.status === 'completed' ? 'line-through text-theme-muted' : 'text-theme-primary'
                        }`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-1 text-[9px] text-theme-muted">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
