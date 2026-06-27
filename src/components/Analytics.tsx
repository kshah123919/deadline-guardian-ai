import { motion } from 'motion/react';
import { 
  TrendingUp, CheckCircle2, AlertCircle, Clock, Calendar, 
  Award, BarChart2, PieChart, ShieldAlert, Sparkles, Brain, Zap, Activity
} from 'lucide-react';
import { Task, FocusSession } from '../types';

interface AnalyticsProps {
  tasks: Task[];
  isDark: boolean;
  focusSessions?: FocusSession[];
}

export default function Analytics({ tasks, isDark, focusSessions = [] }: AnalyticsProps) {
  // 1. Calculations
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const totalTasks = tasks.length;
  
  const completedCount = completedTasks.length;
  const pendingCount = pendingTasks.length;
  
  // Weekly goal parameters
  const weeklyGoal = 10;
  const weeklyCompletionRate = Math.round((completedCount / Math.max(1, totalTasks)) * 100);

  // Dynamic Productivity Score out of 100
  // Calculated using completed tasks, pending tasks, overdue tasks, progress percentages, high-priority completion, and deadline performance
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.deadline).getTime() < Date.now());
  const highPriority = tasks.filter(t => t.priority === 'high');
  const highCompleted = highPriority.filter(t => t.status === 'completed');
  
  const completionRate = totalTasks > 0 ? (completedCount / totalTasks) : 0;
  const highPriorityRatio = highPriority.length > 0 ? (highCompleted.length / highPriority.length) : 1;
  const averageProgress = totalTasks > 0 ? (tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks) : 0;
  
  // Deadline performance: Ratio of non-overdue tasks to total pending tasks
  const deadlinePerformance = pendingTasks.length > 0 
    ? (1 - (overdueTasks.length / pendingTasks.length)) 
    : 1;

  // Combine components into a precise 100-point dynamic scale:
  // - 40% completion rate
  // - 20% high priority ratio
  // - 20% average progress
  // - 20% deadline performance (lack of overdue tasks)
  const calculatedScore = totalTasks > 0
    ? Math.round(
        (completionRate * 40) + 
        (highPriorityRatio * 20) + 
        ((averageProgress / 100) * 20) + 
        (deadlinePerformance * 20)
      )
    : 0;

  const productivityScore = Math.max(0, Math.min(100, calculatedScore));

  // 2. Priority Breakdowns
  const highCount = tasks.filter(t => t.priority === 'high').length;
  const mediumCount = tasks.filter(t => t.priority === 'medium').length;
  const lowCount = tasks.filter(t => t.priority === 'low').length;

  // 3. Category Breakdowns
  const categoryCounts: { [key: string]: number } = {};
  tasks.forEach(t => {
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  });
  const categoriesList = Object.entries(categoryCounts).map(([name, val]) => ({ name, val }));

  // 4. Dynamic 7-Day Completion Velocity (Custom SVG line graph)
  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mockWeeklyCompleted = [0, 0, 0, 0, 0, 0, 0];
  completedTasks.forEach(task => {
    try {
      const date = new Date(task.deadline);
      if (!isNaN(date.getTime())) {
        const dayOfWeek = (date.getDay() + 6) % 7; // Convert 0 (Sun)-6 (Sat) to 0 (Mon)-6 (Sun)
        mockWeeklyCompleted[dayOfWeek]++;
      }
    } catch (e) {
      // Ignore invalid date
    }
  });

  // SVG parameters for chart drawing
  const chartHeight = 160;
  const chartWidth = 500;
  const padding = 30;
  const graphHeight = chartHeight - padding * 2;
  const graphWidth = chartWidth - padding * 2;
  const maxVal = Math.max(...mockWeeklyCompleted, 5);

  // Generate SVG Points for Line Chart
  const linePoints = mockWeeklyCompleted.map((val, i) => {
    const x = padding + (i * graphWidth) / (mockWeeklyCompleted.length - 1);
    const y = chartHeight - padding - (val * graphHeight) / maxVal;
    return `${x},${y}`;
  }).join(' ');

  // Generate SVG Points for Grid Background
  const gridLinesY = Array.from({ length: 4 }).map((_, idx) => {
    const val = (maxVal / 3) * idx;
    const y = chartHeight - padding - (val * graphHeight) / maxVal;
    return y;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-theme-primary">Productivity Intelligence</h1>
        <p className="text-sm text-theme-secondary mt-1">
          Historical trends, completion ratios, and dynamic priority allocations.
        </p>
      </div>

      {totalTasks === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-theme-border rounded-2xl text-center max-w-xl mx-auto bg-theme-card/30 p-8">
          <div className="p-4 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 rounded-full mb-4">
            <BarChart2 className="w-10 h-10 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-theme-primary">Analytics Empty</h3>
          <p className="text-xs text-theme-secondary mt-2 leading-relaxed">
            Create your first task to begin tracking productivity.
          </p>
        </div>
      ) : (
        <>

      {/* Grid of Key Numerical Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Core Score */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-indigo-500">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Productivity Index</span>
            <Award className="w-5 h-5" />
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-4xl font-black text-theme-primary">{productivityScore}</span>
            <span className="text-xs text-theme-muted font-mono">/ 100</span>
          </div>
          <p className="text-[11px] text-theme-secondary mt-2">
            Based on high-priority deadlines completed and timing precision.
          </p>
        </div>

        {/* Completed items */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Completed Goals</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-4xl font-black text-theme-primary">{completedCount}</span>
            <span className="text-xs text-theme-muted font-mono">Tasks secured</span>
          </div>
          <p className="text-[11px] text-theme-secondary mt-2">
            Current system items that have been marked fully completed.
          </p>
        </div>

        {/* Pending items */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Vulnerable Slots</span>
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-4xl font-black text-theme-primary">{pendingCount}</span>
            <span className="text-xs text-theme-muted font-mono">Guards pending</span>
          </div>
          <p className="text-[11px] text-theme-secondary mt-2">
            Active items on your board currently demanding timeline protection.
          </p>
        </div>

        {/* Completion rate */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-violet-500">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">Velocity rate</span>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-4xl font-black text-theme-primary">{weeklyCompletionRate}%</span>
            <span className="text-xs text-theme-muted font-mono">Secured</span>
          </div>
          <p className="text-[11px] text-theme-secondary mt-2">
            Total completion ratio of currently available tasks.
          </p>
        </div>

      </div>

      {/* Row containing Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Completion Trend SVG Chart (7 cols) */}
        <div className="lg:col-span-7 bg-theme-card border border-theme-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4.5 h-4.5 text-indigo-500" />
              <h3 className="text-base font-bold text-theme-primary">Weekly Completion Velocity</h3>
            </div>
            <span className="text-xs text-theme-muted font-mono">Daily task outputs</span>
          </div>

          {/* SVG Chart Frame */}
          <div className="w-full h-48 relative mt-6">
            <svg 
              viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              {/* Grid Background Lines */}
              {gridLinesY.map((yVal, index) => (
                <line 
                  key={index}
                  x1={padding}
                  y1={yVal}
                  x2={chartWidth - padding}
                  y2={yVal}
                  className="stroke-theme-border/60"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Glowing gradient stroke for line */}
              <defs>
                <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Area path */}
              <path
                d={`M${padding},${chartHeight - padding} L${linePoints} L${chartWidth - padding},${chartHeight - padding} Z`}
                fill="url(#chartGrad)"
              />

              {/* Line path */}
              <path
                d={`M${linePoints}`}
                fill="none"
                stroke="#6366F1"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points (dots) */}
              {mockWeeklyCompleted.map((val, i) => {
                const cx = padding + (i * graphWidth) / (mockWeeklyCompleted.length - 1);
                const cy = chartHeight - padding - (val * graphHeight) / maxVal;
                return (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r="5"
                    className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-950"
                    strokeWidth="2.5"
                  />
                );
              })}

              {/* Weekday labels */}
              {weekdayLabels.map((day, i) => {
                const x = padding + (i * graphWidth) / (weekdayLabels.length - 1);
                return (
                  <text
                    key={day}
                    x={x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className="fill-theme-secondary font-mono text-[10px] font-bold"
                  >
                    {day}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Priority and Category Allocation Cards (5 cols) */}
        <div className="lg:col-span-5 bg-theme-card border border-theme-border p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4.5 h-4.5 text-indigo-500" />
                <h3 className="text-base font-bold text-theme-primary">Priority Matrix Density</h3>
              </div>
            </div>

            {totalTasks === 0 ? (
              <p className="text-xs text-theme-muted py-6 text-center">No tasks to analyze priority density.</p>
            ) : (
              <div className="space-y-4 my-6">
                {/* High priority metric bar */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-rose-500 flex items-center gap-1.5 uppercase font-mono text-[10px]">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                      Critical (High)
                    </span>
                    <span className="font-mono text-theme-secondary font-bold">
                      {highCount} tasks ({Math.round((highCount / totalTasks) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-theme-bg rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(highCount / totalTasks) * 100}%` }} />
                  </div>
                </div>

                {/* Medium priority metric bar */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-amber-500 flex items-center gap-1.5 uppercase font-mono text-[10px]">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      Optimal (Medium)
                    </span>
                    <span className="font-mono text-theme-secondary font-bold">
                      {mediumCount} tasks ({Math.round((mediumCount / totalTasks) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-theme-bg rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(mediumCount / totalTasks) * 100}%` }} />
                  </div>
                </div>

                {/* Low priority metric bar */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-emerald-500 flex items-center gap-1.5 uppercase font-mono text-[10px]">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      Passive (Low)
                    </span>
                    <span className="font-mono text-theme-secondary font-bold">
                      {lowCount} tasks ({Math.round((lowCount / totalTasks) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-theme-bg rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(lowCount / totalTasks) * 100}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-theme-border pt-4 flex items-center justify-between">
            <span className="text-[10px] text-theme-muted font-mono uppercase tracking-widest font-bold">Guardian Core</span>
            <div className="flex items-center gap-1 text-[11px] text-theme-secondary">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Priority matrix optimized</span>
            </div>
          </div>
        </div>

      </div>

      {/* Categories Allocations Horizontal Cards */}
      <div className="bg-theme-card border border-theme-border p-6 rounded-2xl shadow-sm">
        <h3 className="text-base font-bold text-theme-primary mb-6">Workplace Categorization Dispersion</h3>
        
        {categoriesList.length === 0 ? (
          <p className="text-xs text-theme-muted text-center py-6">No categorizations established.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categoriesList.map(({ name, val }) => (
              <div 
                key={name} 
                className="p-3.5 border rounded-xl flex flex-col justify-between h-24 bg-theme-bg border-theme-border"
              >
                <span className="text-xs font-mono font-bold text-theme-secondary uppercase truncate">{name}</span>
                <div>
                  <span className="text-2xl font-black text-theme-primary">{val}</span>
                  <span className="text-[10px] text-theme-muted ml-1">task{val > 1 && 's'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Focus Interruption Tracker Analytics */}
      <div className="bg-theme-card border border-theme-border p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-theme-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 rounded-xl">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme-primary">Focus & Interruption Insights</h3>
              <p className="text-xs text-theme-secondary mt-0.5">Understand your attention shielding and interruption metrics.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-2.5 py-1 rounded-lg uppercase tracking-wider">
            Premium Focus Tracker
          </span>
        </div>

        {focusSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-theme-border rounded-xl">
            <Activity className="w-8 h-8 text-theme-muted mb-2 animate-pulse" />
            <p className="text-sm font-semibold text-theme-primary">No Focus Sessions Logged</p>
            <p className="text-xs text-theme-muted mt-1 max-w-xs">Start focus sessions on your Workspace tasks to unlock analytics.</p>
          </div>
        ) : (
          <>
            {(() => {
              const formatFocusMs = (ms: number) => {
                if (ms <= 0) return '0m';
                const seconds = Math.floor(ms / 1000);
                const minutes = Math.floor(seconds / 60);
                if (minutes > 0) return `${minutes}m`;
                return `${seconds}s`;
              };

              const totalFocusTimeMs = focusSessions.reduce((sum, s) => sum + s.focusedTime, 0);

              let totalLearningMs = 0;
              let totalCodingMs = 0;
              let totalBreakMs = 0;
              let totalEntertainmentMs = 0;
              let totalMeetingsMs = 0;

              focusSessions.forEach(s => {
                (s.interruptions || []).forEach(inter => {
                  const cat = inter.category;
                  if (cat === 'learning' || cat === 'reading') {
                    totalLearningMs += inter.duration;
                  } else if (cat === 'coding') {
                    totalCodingMs += inter.duration;
                  } else if (cat === 'break' || cat === 'lunch') {
                    totalBreakMs += inter.duration;
                  } else if (cat === 'entertainment' || cat === 'gaming') {
                    totalEntertainmentMs += inter.duration;
                  } else if (cat === 'meeting') {
                    totalMeetingsMs += inter.duration;
                  }
                });
              });

              const totalAwayMs = totalLearningMs + totalCodingMs + totalBreakMs + totalEntertainmentMs + totalMeetingsMs;

              return (
                <div className="space-y-6">
                  {/* Category Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="p-4 rounded-xl border bg-theme-bg border-theme-border shadow-xs">
                      <span className="text-[10px] font-mono text-theme-secondary uppercase font-bold tracking-wider block">Focus Time</span>
                      <h4 className="text-xl font-extrabold text-indigo-500 mt-1">{formatFocusMs(totalFocusTimeMs)}</h4>
                      <div className="w-full h-1.5 bg-indigo-500/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-theme-bg border-theme-border shadow-xs">
                      <span className="text-[10px] font-mono text-theme-secondary uppercase font-bold tracking-wider block">Learning Time</span>
                      <h4 className="text-xl font-extrabold text-emerald-500 mt-1">{formatFocusMs(totalLearningMs)}</h4>
                      <div className="w-full h-1.5 bg-emerald-500/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, totalAwayMs > 0 ? (totalLearningMs / totalAwayMs) * 100 : 0)}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-theme-bg border-theme-border shadow-xs">
                      <span className="text-[10px] font-mono text-theme-secondary uppercase font-bold tracking-wider block">Coding Time</span>
                      <h4 className="text-xl font-extrabold text-cyan-500 mt-1">{formatFocusMs(totalCodingMs)}</h4>
                      <div className="w-full h-1.5 bg-cyan-500/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, totalAwayMs > 0 ? (totalCodingMs / totalAwayMs) * 100 : 0)}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-theme-bg border-theme-border shadow-xs">
                      <span className="text-[10px] font-mono text-theme-secondary uppercase font-bold tracking-wider block">Break Time</span>
                      <h4 className="text-xl font-extrabold text-amber-500 mt-1">{formatFocusMs(totalBreakMs)}</h4>
                      <div className="w-full h-1.5 bg-amber-500/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, totalAwayMs > 0 ? (totalBreakMs / totalAwayMs) * 100 : 0)}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-theme-bg border-theme-border shadow-xs">
                      <span className="text-[10px] font-mono text-theme-secondary uppercase font-bold tracking-wider block">Entertainment</span>
                      <h4 className="text-xl font-extrabold text-rose-500 mt-1">{formatFocusMs(totalEntertainmentMs)}</h4>
                      <div className="w-full h-1.5 bg-rose-500/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, totalAwayMs > 0 ? (totalEntertainmentMs / totalAwayMs) * 100 : 0)}%` }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-theme-bg border-theme-border shadow-xs">
                      <span className="text-[10px] font-mono text-theme-secondary uppercase font-bold tracking-wider block">Meetings & Calls</span>
                      <h4 className="text-xl font-extrabold text-violet-500 mt-1">{formatFocusMs(totalMeetingsMs)}</h4>
                      <div className="w-full h-1.5 bg-violet-500/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, totalAwayMs > 0 ? (totalMeetingsMs / totalAwayMs) * 100 : 0)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Visual Charts and Recent Logs */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Focus Trend Card (7 cols) */}
                    <div className="lg:col-span-7 p-5 border rounded-xl bg-theme-bg border-theme-border flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase text-theme-secondary tracking-wider mb-4 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-indigo-500" />
                          Focus Shield Efficiency Trend (%)
                        </h4>

                        <div className="w-full overflow-x-auto">
                          <div className="min-w-[440px] h-[160px] relative">
                            {(() => {
                              const lastSeven = [...focusSessions].slice(0, 7).reverse();
                              const focusChartHeight = 160;
                              const focusPadding = 30;
                              const focusGraphWidth = 440 - focusPadding * 2;
                              const focusGraphHeight = focusChartHeight - focusPadding * 2;

                              const points = lastSeven.map((s, i) => {
                                const x = focusPadding + (i * focusGraphWidth) / Math.max(1, lastSeven.length - 1);
                                const y = focusChartHeight - focusPadding - (s.focusEfficiency * focusGraphHeight) / 100;
                                return `${x},${y}`;
                              }).join(' ');

                              const areaPoints = lastSeven.length > 0
                                ? `${focusPadding},${focusChartHeight - focusPadding} ` + points + ` ${focusPadding + focusGraphWidth},${focusChartHeight - focusPadding}`
                                : '';

                              return (
                                <svg className="w-full h-full">
                                  <defs>
                                    <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                                    </linearGradient>
                                  </defs>

                                  {/* Grid Lines */}
                                  <line x1={focusPadding} y1={focusPadding} x2={focusPadding + focusGraphWidth} y2={focusPadding} className="stroke-theme-border/20" strokeWidth="1" />
                                  <line x1={focusPadding} y1={focusPadding + focusGraphHeight / 2} x2={focusPadding + focusGraphWidth} y2={focusPadding + focusGraphHeight / 2} className="stroke-theme-border/10" strokeWidth="1" />
                                  <line x1={focusPadding} y1={focusChartHeight - focusPadding} x2={focusPadding + focusGraphWidth} y2={focusChartHeight - focusPadding} className="stroke-theme-border/40" strokeWidth="1" />

                                  {/* Left Y Axis Efficiency Labels */}
                                  <text x={focusPadding - 8} y={focusPadding + 4} textAnchor="end" className="fill-theme-secondary font-mono text-[9px] font-bold">100%</text>
                                  <text x={focusPadding - 8} y={focusPadding + focusGraphHeight / 2 + 4} textAnchor="end" className="fill-theme-secondary font-mono text-[9px] font-bold">50%</text>
                                  <text x={focusPadding - 8} y={focusChartHeight - focusPadding + 4} textAnchor="end" className="fill-theme-secondary font-mono text-[9px] font-bold">0%</text>

                                  {/* Filled Area */}
                                  {lastSeven.length > 0 && (
                                    <polygon points={areaPoints} fill="url(#focusGrad)" />
                                  )}

                                  {/* Line */}
                                  {lastSeven.length > 0 && (
                                    <polyline
                                      fill="none"
                                      stroke="#4f46e5"
                                      strokeWidth="3"
                                      points={points}
                                      strokeLinecap="round"
                                    />
                                  )}

                                  {/* Dots */}
                                  {lastSeven.map((s, i) => {
                                    const cx = focusPadding + (i * focusGraphWidth) / Math.max(1, lastSeven.length - 1);
                                    const cy = focusChartHeight - focusPadding - (s.focusEfficiency * focusGraphHeight) / 100;
                                    return (
                                      <g key={s.id}>
                                        <circle
                                          cx={cx}
                                          cy={cy}
                                          r="4.5"
                                          className="fill-indigo-500 stroke-white dark:stroke-slate-950"
                                          strokeWidth="2"
                                        />
                                      </g>
                                    );
                                  })}

                                  {/* X Axis Indexes */}
                                  {lastSeven.map((s, i) => {
                                    const x = focusPadding + (i * focusGraphWidth) / Math.max(1, lastSeven.length - 1);
                                    return (
                                      <text
                                        key={s.id}
                                        x={x}
                                        y={focusChartHeight - 8}
                                        textAnchor="middle"
                                        className="fill-theme-secondary font-mono text-[8px] font-bold"
                                      >
                                        S{focusSessions.length - lastSeven.length + i + 1}
                                      </text>
                                    );
                                  })}
                                </svg>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Focus Logs (5 cols) */}
                    <div className="lg:col-span-5 p-5 border rounded-xl bg-theme-bg border-theme-border flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase text-theme-secondary tracking-wider mb-3 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-indigo-500" />
                          Recent Focus Sessions
                        </h4>

                        <div className="space-y-3">
                          {[...focusSessions].slice(0, 3).map((session) => {
                            const mins = Math.floor(session.focusedTime / 60000);
                            const secs = Math.floor((session.focusedTime % 60000) / 1000);
                            return (
                              <div key={session.id} className="p-3 border rounded-lg bg-theme-card/60 border-theme-border flex flex-col justify-between gap-1">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-xs font-bold text-theme-primary line-clamp-1">{session.taskTitle}</span>
                                  <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold">
                                    {session.focusEfficiency}% Eff
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-theme-secondary mt-1">
                                  <span>Time: {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`}</span>
                                  <span>{session.interruptionCount} interruption{session.interruptionCount !== 1 && 's'}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>

        </>
      )}

    </div>
  );
}
