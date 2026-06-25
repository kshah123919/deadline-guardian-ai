import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, Circle, AlertTriangle, Play, Calendar, 
  TrendingUp, Sparkles, Plus, ChevronRight, Activity as ActivityIcon, Clock, Award
} from 'lucide-react';
import { Task, Activity, UserProfile } from '../types';
import { MOTIVATIONAL_QUOTES } from '../utils/mockData';

interface DashboardProps {
  tasks: Task[];
  activities: Activity[];
  profile: UserProfile;
  onNavigate: (tab: string) => void;
  onCreateTaskClick: () => void;
  onToggleTaskStatus: (id: string) => void;
  isDark: boolean;
}

export default function Dashboard({
  tasks,
  activities,
  profile,
  onNavigate,
  onCreateTaskClick,
  onToggleTaskStatus,
  isDark
}: DashboardProps) {
  const [quote, setQuote] = useState({ text: '', author: '' });

  useEffect(() => {
    // Select a random quote
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setQuote(randomQuote);
  }, []);

  // Filter tasks for today
  const todayTasks = tasks.filter(task => {
    if (task.status === 'completed') return false;
    const taskDate = new Date(task.deadline);
    const today = new Date();
    return taskDate.getDate() === today.getDate() &&
           taskDate.getMonth() === today.getMonth() &&
           taskDate.getFullYear() === today.getFullYear();
  });

  // Upcoming deadlines (Incomplete tasks sorted by closest deadline)
  const upcomingDeadlines = tasks
    .filter(task => task.status !== 'completed')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 3);

  // Calculations for productivity overview
  const totalIncomplete = tasks.filter(t => t.status !== 'completed').length;
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const totalTasksCount = tasks.length;
  const completedPercentage = totalTasksCount > 0 
    ? Math.round((completedTasks.length / totalTasksCount) * 100) 
    : 0;

  // Let's formulate a Productivity Score out of 100 based on completion rate and priority ratios
  const highPriorityTasks = tasks.filter(t => t.priority === 'high');
  const completedHigh = highPriorityTasks.filter(t => t.status === 'completed');
  const highRatio = highPriorityTasks.length > 0 ? (completedHigh.length / highPriorityTasks.length) : 1;
  const productivityScore = Math.min(
    100,
    Math.round((completedPercentage * 0.7) + (highRatio * 30))
  );

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20';
      default: return 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20';
    }
  };

  const getRelativeTimeString = (deadlineStr: string) => {
    const diffMs = new Date(deadlineStr).getTime() - new Date().getTime();
    if (diffMs < 0) return 'Overdue';
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `Due in ${diffMins}m`;
    }
    if (diffHrs < 24) {
      return `Due in ${diffHrs}h`;
    }
    const diffDays = Math.floor(diffHrs / 24);
    return `Due in ${diffDays}d`;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-theme-primary flex items-center gap-2">
            Welcome, {profile.name}
            <motion.span 
              animate={{ rotate: [0, 20, -10, 20, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1 }}
              className="inline-block origin-bottom-right"
            >
              👋
            </motion.span>
          </h1>
          <p className="text-sm text-theme-secondary mt-1">
            Guardian Core active. You have <span className="font-semibold text-indigo-500 dark:text-indigo-400">{totalIncomplete} active tasks</span> to protect today.
          </p>
        </div>

        <button
          onClick={onCreateTaskClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/10 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Grid Layout of Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Productivity Overview Card (Left 5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-theme-primary">Productivity Health</h3>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="flex items-center gap-6 my-4">
              {/* Score Circular gauge */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className="stroke-theme-bg fill-transparent"
                    strokeWidth="8"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    className="stroke-indigo-600 dark:stroke-indigo-400 fill-transparent transition-all duration-1000"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * productivityScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-theme-primary leading-none">{productivityScore}</span>
                  <span className="text-[10px] text-theme-muted uppercase tracking-widest font-mono mt-0.5">Score</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-mono text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider">Guardian Rating</span>
                <h4 className="text-lg font-bold text-theme-primary mt-0.5">
                  {productivityScore >= 85 ? 'Outstanding Shield' : productivityScore >= 65 ? 'Optimal Focus' : 'Vulnerable Deadlines'}
                </h4>
                <p className="text-xs text-theme-secondary mt-1 max-w-xs">
                  {productivityScore >= 85 
                    ? 'Excellent focus! All critical parameters are perfectly secured.' 
                    : 'A few upcoming deadlines require your attention to prevent breach.'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-theme-border pt-4 mt-4 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-theme-secondary">Weekly Goal Progress</span>
                <span className="font-mono text-theme-primary font-semibold">
                  {profile.completedCount} / {profile.weeklyGoal} tasks
                </span>
              </div>
              <div className="w-full h-2 bg-theme-bg rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                  style={{ width: `${Math.min(100, (profile.completedCount / profile.weeklyGoal) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-theme-bg/50 border border-theme-border/40 rounded-xl px-3.5 py-2">
              <div className="flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-amber-500" />
                <span className="text-xs text-theme-secondary">Completion Velocity</span>
              </div>
              <span className="text-xs font-mono font-bold text-theme-primary">
                +{completedPercentage}% Completed
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions (Right 7 cols) */}
        <div className="lg:col-span-7 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-theme-primary mb-4">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => onNavigate('tasks')}
                className="flex flex-col items-start text-left p-4 rounded-xl border border-theme-border hover:bg-theme-bg transition-colors cursor-pointer group"
              >
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-theme-primary mt-3">Task Workspace</span>
                <span className="text-xs text-theme-muted mt-1">Manage & organize board</span>
              </button>

              <button 
                onClick={() => onNavigate('ai')}
                className="flex flex-col items-start text-left p-4 rounded-xl border border-theme-border hover:bg-theme-bg transition-colors cursor-pointer group"
              >
                <div className="p-2 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-theme-primary mt-3">AI Assistant</span>
                <span className="text-xs text-theme-muted mt-1">Breakdown & schedule chat</span>
              </button>

              <button 
                onClick={() => onNavigate('calendar')}
                className="flex flex-col items-start text-left p-4 rounded-xl border border-theme-border hover:bg-theme-bg transition-colors cursor-pointer group"
              >
                <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-theme-primary mt-3">Calendar</span>
                <span className="text-xs text-theme-muted mt-1">Weekly & monthly views</span>
              </button>

              <button 
                onClick={() => onNavigate('analytics')}
                className="flex flex-col items-start text-left p-4 rounded-xl border border-theme-border hover:bg-theme-bg transition-colors cursor-pointer group"
              >
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-theme-primary mt-3">Analytics</span>
                <span className="text-xs text-theme-muted mt-1">Productivity metrics</span>
              </button>
            </div>
          </div>

          {/* Render typeset motivational quote */}
          <div className="mt-6 pt-4 border-t border-theme-border flex items-start gap-3 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 p-3 rounded-xl border border-indigo-500/10">
            <span className="text-xl text-indigo-500 font-serif leading-none shrink-0">“</span>
            <div className="space-y-1">
              <p className="text-xs italic text-theme-secondary font-sans leading-relaxed">
                {quote.text || "Your future is created by what you do today, not tomorrow."}
              </p>
              <p className="text-[10px] text-theme-muted font-semibold font-mono">
                — {quote.author || "Robert Kiyosaki"}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Row with Dynamic Content: Today's Tasks & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Today's Tasks List (7 cols) */}
        <div className="lg:col-span-7 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
              <h3 className="text-base font-bold text-theme-primary">Today's Tasks</h3>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-theme-bg border border-theme-border text-theme-secondary rounded-lg">
              {todayTasks.length} pending
            </span>
          </div>

          {todayTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-theme-border rounded-xl text-center">
              <CheckCircle2 className="w-8 h-8 text-indigo-500 stroke-[1.5] mb-2" />
              <p className="text-sm font-semibold text-theme-primary">All set for today!</p>
              <p className="text-xs text-theme-muted mt-1 max-w-[200px]">No active tasks scheduled due today. Enjoy your day!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-start justify-between gap-3 p-3.5 border border-theme-border hover:border-indigo-500/30 bg-theme-bg/40 rounded-xl group transition-all"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggleTaskStatus(task.id)}
                      className="mt-0.5 text-theme-muted hover:text-indigo-500 shrink-0 transition-colors cursor-pointer"
                    >
                      <Circle className="w-5 h-5 group-hover:scale-105 transition-transform" />
                    </button>
                    <div>
                      <h4 className="text-sm font-semibold text-theme-primary line-clamp-1">{task.title}</h4>
                      <p className="text-xs text-theme-secondary line-clamp-1 mt-0.5">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-theme-secondary font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded font-medium">
                          {task.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-theme-secondary shrink-0">
                    {task.progress}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Deadlines (5 cols) */}
        <div className="lg:col-span-5 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-theme-primary">Upcoming Deadlines</h3>
              <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-theme-muted text-center py-6">No pending deadlines on your agenda.</p>
            ) : (
              <div className="space-y-4">
                {upcomingDeadlines.map((task) => {
                  const relativeTime = getRelativeTimeString(task.deadline);
                  const isOverdue = relativeTime === 'Overdue';
                  return (
                    <div key={task.id} className="flex items-center justify-between border-b border-theme-border pb-3 last:border-b-0 last:pb-0">
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-theme-primary line-clamp-1">{task.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-extrabold font-mono px-1.5 py-0.5 rounded uppercase ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-theme-secondary">
                            {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${
                        isOverdue 
                          ? 'text-rose-500 bg-rose-500/10' 
                          : relativeTime.includes('h') || relativeTime.includes('m')
                            ? 'text-amber-500 bg-amber-500/10' 
                            : 'text-indigo-500 bg-indigo-500/10 dark:text-indigo-400 dark:bg-indigo-500/20'
                      }`}>
                        {relativeTime}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-theme-border pt-4 mt-4 flex items-center justify-between">
            <h4 className="text-xs font-bold text-theme-primary flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-indigo-500" />
              <span>Recent Logs</span>
            </h4>
            <button 
              onClick={() => onNavigate('settings')} 
              className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 flex items-center gap-0.5 hover:underline"
            >
              <span>View Board Activity</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
