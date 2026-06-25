import { motion } from 'motion/react';
import { 
  TrendingUp, CheckCircle2, AlertCircle, Clock, Calendar, 
  Award, BarChart2, PieChart, ShieldAlert, Sparkles 
} from 'lucide-react';
import { Task } from '../types';

interface AnalyticsProps {
  tasks: Task[];
  isDark: boolean;
}

export default function Analytics({ tasks, isDark }: AnalyticsProps) {
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
  // Formula: (Completion % * 0.6) + (High Priority Completion % * 0.4)
  const highPriority = tasks.filter(t => t.priority === 'high');
  const highCompleted = highPriority.filter(t => t.status === 'completed');
  const highRatio = highPriority.length > 0 ? (highCompleted.length / highPriority.length) : 1;
  const rawScore = (weeklyCompletionRate * 0.6) + (highRatio * 40);
  const productivityScore = Math.max(0, Math.min(100, Math.round(rawScore)));

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

  // 4. Mock 7-Day Completion Velocity (Custom SVG line graph)
  // Maps days of week to task completed numbers (e.g. [Mon: 1, Tue: 3, Wed: 2, Thu: 4, Fri: 2, Sat: 0, Sun: 1])
  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mockWeeklyCompleted = [1, 2, 0, 4, 2, 1, 3]; // Mock historical points
  // Add today's actual live completed tasks count into the weekday slot representing "today"
  const todayIndex = (new Date().getDay() + 6) % 7; // Convert 0 (Sun)-6 (Sat) to 0 (Mon)-6 (Sun)
  mockWeeklyCompleted[todayIndex] = Math.max(mockWeeklyCompleted[todayIndex], completedCount);

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

    </div>
  );
}
