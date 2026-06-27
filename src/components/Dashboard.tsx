import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, Circle, AlertTriangle, Play, Calendar, 
  TrendingUp, Sparkles, Plus, ChevronRight, Activity as ActivityIcon, Clock, Award,
  LayoutDashboard, Loader2, ShieldAlert
} from 'lucide-react';
import { Task, Activity, UserProfile, FocusSession } from '../types';
import { MOTIVATIONAL_QUOTES } from '../utils/mockData';

interface DashboardProps {
  tasks: Task[];
  activities: Activity[];
  profile: UserProfile;
  onNavigate: (tab: string) => void;
  onCreateTaskClick: () => void;
  onToggleTaskStatus: (id: string) => void;
  isDark: boolean;
  focusSessions?: FocusSession[];
  onStartFocusSession?: (task: Task) => void;
}

export default function Dashboard({
  tasks,
  activities,
  profile,
  onNavigate,
  onCreateTaskClick,
  onToggleTaskStatus,
  isDark,
  focusSessions = [],
  onStartFocusSession
}: DashboardProps) {
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [currentSubTab, setCurrentSubTab] = useState<'core' | 'mission'>('core');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    // Select a random quote
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setQuote(randomQuote);
  }, []);

  useEffect(() => {
    const fetchMissionControl = async () => {
      setIsLoadingAnalysis(true);
      setAnalysisError(null);
      try {
        const response = await fetch("/api/mission-control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks,
            userProfile: profile
          })
        });
        if (!response.ok) {
          throw new Error(`Server returned status: ${response.status}`);
        }
        const data = await response.json();
        setAnalysis(data);
      } catch (err: any) {
        console.error("Error fetching Mission Control:", err);
        setAnalysisError(err.message || "Failed to load Mission Control metrics.");
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    fetchMissionControl();
  }, [tasks, profile]);

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-extrabold text-indigo-600 dark:text-indigo-400">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

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

  // Let's formulate a Productivity Score out of 100 based on completion rate, priority ratios, progress, and overdue deadlines
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && new Date(t.deadline).getTime() < Date.now());
  const highPriorityTasks = tasks.filter(t => t.priority === 'high');
  const completedHigh = highPriorityTasks.filter(t => t.status === 'completed');
  
  const completionRate = totalTasksCount > 0 ? (completedTasks.length / totalTasksCount) : 0;
  const highPriorityRatio = highPriorityTasks.length > 0 ? (completedHigh.length / highPriorityTasks.length) : 1;
  const averageProgress = totalTasksCount > 0 ? (tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasksCount) : 0;
  
  // Deadline performance: Ratio of non-overdue tasks to total pending tasks
  const deadlinePerformance = pendingTasks.length > 0 
    ? (1 - (overdueTasks.length / pendingTasks.length)) 
    : 1;

  // Combine components into a precise 100-point dynamic scale:
  // - 40% completion rate
  // - 20% high priority ratio
  // - 20% average progress
  // - 20% deadline performance (lack of overdue tasks)
  const calculatedScore = totalTasksCount > 0
    ? Math.round(
        (completionRate * 40) + 
        (highPriorityRatio * 20) + 
        ((averageProgress / 100) * 20) + 
        (deadlinePerformance * 20)
      )
    : 0;

  const productivityScore = Math.max(0, Math.min(100, calculatedScore));

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

      {/* Segmented Controller for Dashboard Modes */}
      <div className="flex items-center p-1.5 bg-theme-card border border-theme-border rounded-2xl w-full sm:w-fit gap-1">
        <button
          onClick={() => setCurrentSubTab('core')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            currentSubTab === 'core'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
              : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-bg'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Guardian Core</span>
        </button>

        <button
          onClick={() => setCurrentSubTab('mission')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
            currentSubTab === 'mission'
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20'
              : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-bg'
          }`}
        >
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>AI Mission Control</span>
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest bg-amber-500 text-slate-900 rounded-full font-mono scale-90">
            PRO
          </span>
        </button>
      </div>

      {currentSubTab === 'core' ? (
        totalTasksCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-theme-border rounded-2xl text-center max-w-xl mx-auto bg-theme-card/30 p-8">
            <div className="p-4 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 rounded-full mb-4">
              <CheckCircle2 className="w-10 h-10 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-theme-primary">Your Workspace is Empty</h3>
            <p className="text-xs text-theme-secondary mt-2 leading-relaxed">
              Create your first task to begin tracking productivity.
            </p>
            <button
              onClick={onCreateTaskClick}
              className="mt-6 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
            >
              Create Your First Task
            </button>
          </div>
        ) : (
          <>
            {/* Grid Layout of Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Productivity Overview Card (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-theme-primary">Productivity Health</h3>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="flex flex-col items-center gap-4 my-4">
              {/* Score Circular gauge */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="stroke-theme-bg fill-transparent"
                    strokeWidth="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    className="stroke-indigo-600 dark:stroke-indigo-400 fill-transparent transition-all duration-1000"
                    strokeWidth="6"
                    strokeDasharray={201.1}
                    strokeDashoffset={201.1 - (201.1 * productivityScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-black text-theme-primary leading-none">{productivityScore}</span>
                  <span className="text-[8px] text-theme-muted uppercase tracking-widest font-mono mt-0.5">Score</span>
                </div>
              </div>

              <div className="text-center md:text-left">
                <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider">Guardian Rating</span>
                <h4 className="text-sm font-bold text-theme-primary mt-0.5">
                  {productivityScore >= 85 ? 'Outstanding Shield' : productivityScore >= 65 ? 'Optimal Focus' : 'Vulnerable Deadlines'}
                </h4>
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

            <div className="flex justify-between items-center bg-theme-bg/50 border border-theme-border/40 rounded-xl px-3 py-1.5">
              <span className="text-xs text-theme-secondary">Velocity</span>
              <span className="text-xs font-mono font-bold text-theme-primary">
                +{completedPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Today's Focus Card (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-theme-primary">Today's Focus</h3>
              <div className="p-1.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg">
                <Play className="w-4 h-4 fill-current animate-pulse" />
              </div>
            </div>

            {(() => {
              const todayDateStr = new Date().toDateString();
              const todaySessions = focusSessions.filter(s => new Date(s.startTime).toDateString() === todayDateStr);
              
              const totalFocusMs = todaySessions.reduce((sum, s) => sum + s.focusedTime, 0);
              const totalInterruptions = todaySessions.reduce((sum, s) => sum + s.interruptionCount, 0);
              const avgEfficiency = todaySessions.length > 0 
                ? Math.round(todaySessions.reduce((sum, s) => sum + s.focusEfficiency, 0) / todaySessions.length)
                : 100;
              const longestMs = todaySessions.length > 0
                ? Math.max(...todaySessions.map(s => s.focusedTime))
                : 0;

              const formatFocusMs = (ms: number) => {
                if (ms <= 0) return '0m';
                const seconds = Math.floor(ms / 1000);
                const minutes = Math.floor(seconds / 60);
                if (minutes > 0) return `${minutes}m`;
                return `${seconds}s`;
              };

              if (todaySessions.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <span className="text-xs text-theme-muted font-medium">No sessions completed today.</span>
                    <button
                      onClick={() => onNavigate('tasks')}
                      className="mt-4 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 dark:hover:text-white text-xs font-semibold rounded-xl border border-indigo-500/10 transition-colors cursor-pointer"
                    >
                      Start Focus Session
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-2.5 my-1">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-theme-bg border border-theme-border">
                      <span className="text-[8px] text-theme-muted uppercase font-mono font-bold block">Focus Time</span>
                      <span className="text-sm font-extrabold text-theme-primary mt-0.5 block">{formatFocusMs(totalFocusMs)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-theme-bg border border-theme-border">
                      <span className="text-[8px] text-theme-muted uppercase font-mono font-bold block">Interruptions</span>
                      <span className="text-sm font-extrabold text-theme-primary mt-0.5 block">{totalInterruptions}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-theme-bg border border-theme-border">
                      <span className="text-[8px] text-theme-muted uppercase font-mono font-bold block">Avg Efficiency</span>
                      <span className="text-sm font-extrabold text-theme-primary mt-0.5 block">{avgEfficiency}%</span>
                    </div>
                    <div className="p-2 rounded-xl bg-theme-bg border border-theme-border">
                      <span className="text-[8px] text-theme-muted uppercase font-mono font-bold block">Longest Run</span>
                      <span className="text-sm font-extrabold text-theme-primary mt-0.5 block">{formatFocusMs(longestMs)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="border-t border-theme-border pt-4 mt-4 flex items-center justify-between text-[10px] text-theme-muted uppercase font-mono font-bold">
            <span>Interruption Shielding</span>
            <span className="text-indigo-500">Live Tracker</span>
          </div>
        </div>

        {/* Focus Insights Card (3 cols) */}
        {(() => {
          const calculateFocusStreak = (sessions: FocusSession[]) => {
            if (sessions.length === 0) return 0;
            
            const dates = Array.from(new Set(
              sessions.map(s => {
                const d = new Date(s.startTime);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              })
            )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

            if (dates.length === 0) return 0;

            let streak = 0;
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

            if (dates[0] !== todayStr && dates[0] !== yesterdayStr) {
              return 0;
            }

            let currentExpected = new Date(dates[0]);
            for (let i = 0; i < dates.length; i++) {
              const dStr = dates[i];
              const expectedStr = `${currentExpected.getFullYear()}-${String(currentExpected.getMonth() + 1).padStart(2, '0')}-${String(currentExpected.getDate()).padStart(2, '0')}`;
              
              if (dStr === expectedStr) {
                streak++;
                currentExpected.setDate(currentExpected.getDate() - 1);
              } else {
                break;
              }
            }
            return streak;
          };

          const todayStr = new Date().toDateString();
          const todaySessions = focusSessions.filter(s => new Date(s.startTime).toDateString() === todayStr);

          const todayDeepWorkMs = todaySessions.reduce((sum, s) => sum + s.focusedTime, 0);

          let todayLearningMs = 0;
          let todayBreakMs = 0;
          let todayEntertainmentMs = 0;

          todaySessions.forEach(s => {
            (s.interruptions || []).forEach(inter => {
              const cat = inter.category;
              if (cat === 'learning' || cat === 'reading') {
                todayLearningMs += inter.duration;
              } else if (cat === 'break' || cat === 'lunch') {
                todayBreakMs += inter.duration;
              } else if (cat === 'entertainment' || cat === 'gaming') {
                todayEntertainmentMs += inter.duration;
              }
            });
          });

          const longestSessionMs = focusSessions.length > 0
            ? Math.max(...focusSessions.map(s => s.focusedTime))
            : 0;

          const streakDays = calculateFocusStreak(focusSessions);

          const formatMins = (ms: number) => {
            const mins = Math.round(ms / 60000);
            if (mins <= 0 && ms > 0) return '1m';
            return `${mins}m`;
          };

          return (
            <div className="lg:col-span-3 flex flex-col justify-between bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-theme-primary">Focus Insights</h3>
                  <ActivityIcon className="w-4 h-4 text-indigo-500" />
                </div>

                <div className="space-y-2.5 my-1 text-xs">
                  <div className="flex items-center justify-between border-b border-theme-border/50 pb-1.5">
                    <span className="text-theme-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                      Deep Work
                    </span>
                    <span className="font-mono font-bold text-theme-primary">{formatMins(todayDeepWorkMs)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-theme-border/50 pb-1.5">
                    <span className="text-theme-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      Learning
                    </span>
                    <span className="font-mono font-bold text-theme-primary">{formatMins(todayLearningMs)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-theme-border/50 pb-1.5">
                    <span className="text-theme-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      Breaks
                    </span>
                    <span className="font-mono font-bold text-theme-primary">{formatMins(todayBreakMs)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-theme-border/50 pb-1.5">
                    <span className="text-theme-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      Entertainment
                    </span>
                    <span className="font-mono font-bold text-theme-primary">{formatMins(todayEntertainmentMs)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-theme-border/50 pb-1.5">
                    <span className="text-theme-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full" />
                      Longest Run
                    </span>
                    <span className="font-mono font-bold text-theme-primary">{formatMins(longestSessionMs)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-theme-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                      Focus Streak
                    </span>
                    <span className="font-mono font-bold text-amber-500">{streakDays} days</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-theme-border pt-4 mt-4 flex items-center justify-between text-[10px] text-theme-muted uppercase font-mono font-bold">
                <span>Recovery Assistant</span>
                <span className="text-emerald-500">Active</span>
              </div>
            </div>
          );
        })()}

        {/* Quick Actions (3 cols) */}
        <div className="lg:col-span-3 bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-theme-primary mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onNavigate('tasks')}
                className="flex flex-col items-start text-left p-2.5 rounded-xl border border-theme-border hover:bg-theme-bg transition-colors cursor-pointer group"
              >
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-theme-primary mt-2">Tasks</span>
              </button>

              <button 
                onClick={() => onNavigate('ai')}
                className="flex flex-col items-start text-left p-2.5 rounded-xl border border-theme-border hover:bg-theme-bg transition-colors cursor-pointer group"
              >
                <div className="p-1.5 bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-theme-primary mt-2">AI Help</span>
              </button>

              <button 
                onClick={() => onNavigate('calendar')}
                className="flex flex-col items-start text-left p-2.5 rounded-xl border border-theme-border hover:bg-theme-bg transition-colors cursor-pointer group"
              >
                <div className="p-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-105 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-theme-primary mt-2">Calendar</span>
              </button>

              <button 
                onClick={() => onNavigate('analytics')}
                className="flex flex-col items-start text-left p-2.5 rounded-xl border border-theme-border hover:bg-theme-bg transition-colors cursor-pointer group"
              >
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-theme-primary mt-2">Metrics</span>
              </button>
            </div>
          </div>

          {/* Render typeset motivational quote */}
          <div className="mt-4 pt-3.5 border-t border-theme-border flex items-start gap-2 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 p-2.5 rounded-xl border border-indigo-500/10">
            <span className="text-lg text-indigo-500 font-serif leading-none shrink-0">“</span>
            <div className="space-y-0.5">
              <p className="text-[10px] italic text-theme-secondary font-sans leading-relaxed line-clamp-2">
                {quote.text || "Your future is created by what you do today, not tomorrow."}
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

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono font-bold text-theme-secondary">
                      {task.progress}%
                    </span>
                    {onStartFocusSession && (
                      <button
                        onClick={() => onStartFocusSession(task)}
                        title="Start Focus Session"
                        className="p-1.5 rounded-lg border border-indigo-500/10 text-indigo-500 hover:text-white hover:bg-indigo-600 dark:border-indigo-500/20 dark:text-indigo-400 dark:hover:text-white transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    )}
                  </div>
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
          </>
        )
      ) : (
        /* MISSION CONTROL DASHBOARD */
        <div className="space-y-6">
          {isLoadingAnalysis && !analysis ? (
            /* DYNAMIC HIGH-FIDELITY LOADING SHIMMER */
            <div className="space-y-6 animate-pulse">
              <div className="bg-theme-card border border-theme-border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  <div className="h-4 bg-theme-bg/60 rounded w-48"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-theme-bg/60 rounded w-full"></div>
                  <div className="h-4 bg-theme-bg/60 rounded w-5/6"></div>
                  <div className="h-4 bg-theme-bg/60 rounded w-4/5"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-theme-card border border-theme-border rounded-2xl p-6 space-y-4 h-64">
                  <div className="h-5 bg-theme-bg/60 rounded w-1/3"></div>
                  <div className="h-10 bg-theme-bg/60 rounded-full w-full"></div>
                  <div className="h-4 bg-theme-bg/60 rounded w-3/4"></div>
                </div>

                <div className="bg-theme-card border border-theme-border rounded-2xl p-6 space-y-4 h-64">
                  <div className="h-5 bg-theme-bg/60 rounded w-1/3"></div>
                  <div className="space-y-3">
                    <div className="h-12 bg-theme-bg/60 rounded-xl"></div>
                    <div className="h-12 bg-theme-bg/60 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : analysisError ? (
            /* ERROR RESOLUTION PANEL */
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto">
              <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-theme-primary">Analysis Sync Failure</h4>
              <p className="text-xs text-theme-secondary mt-1">{analysisError}</p>
              <button 
                onClick={() => {
                  setAnalysis(null);
                  setAnalysisError(null);
                  setIsLoadingAnalysis(true);
                }}
                className="mt-4 px-4 py-2 bg-theme-bg hover:bg-theme-border border border-theme-border rounded-xl text-xs font-semibold text-theme-primary cursor-pointer"
              >
                Retry Mission Control analysis
              </button>
            </div>
          ) : tasks.length === 0 || (analysis && analysis.noTasks) ? (
            /* EMPTY TASK STATE */
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-theme-border rounded-2xl text-center max-w-xl mx-auto bg-theme-card/30 p-8">
              <div className="p-4 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 rounded-full mb-4">
                <Sparkles className="w-10 h-10 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-theme-primary">Your Mission Control is Ready</h3>
              <p className="text-xs text-theme-secondary mt-2 leading-relaxed">
                You currently don't have any active tasks in your workspace. Add a task to initiate Guardian's AI-powered automated scheduling briefing, risk analysis, workload metrics, and smart timelines.
              </p>
              <button
                onClick={onCreateTaskClick}
                className="mt-6 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
              >
                Create Your First Task
              </button>
            </div>
          ) : (
            /* DYNAMIC AI PREMIUM DASHBOARDS */
            <div className="space-y-6">
              
              {/* 6. Emergency Mode Banner */}
              {analysis?.emergencyMode?.isTriggered && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-xl"
                >
                  <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl -z-10" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-rose-500 text-white rounded-xl animate-bounce shrink-0 shadow-md shadow-rose-500/20">
                        <AlertTriangle className="w-5 h-5 stroke-[2]" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded font-mono">
                            EMERGENCY ACTIVATED
                          </span>
                          <span className="text-xs text-rose-500 font-semibold font-mono animate-pulse">
                            BREACH RISK HIGH
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-theme-primary mt-1">
                          Critical Deadline At Risk: <span className="text-rose-500 font-black">"{analysis.emergencyMode.criticalTaskTitle || 'Workspace Task'}"</span>
                        </h3>
                        <p className="text-xs text-theme-secondary max-w-2xl leading-relaxed mt-0.5">
                          {analysis.emergencyMode.remainingWorkExplanation || "A pending task deadline is expiring soon. Immediate intervention is required to secure this milestone."}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-start md:items-end shrink-0 gap-1.5 p-3 bg-theme-bg/60 border border-rose-500/25 rounded-xl font-mono text-xs w-full md:w-auto">
                      <span className="text-theme-muted uppercase tracking-widest text-[9px] font-bold">Secure Probability</span>
                      <span className="text-xl font-black text-rose-500">
                        {analysis.emergencyMode.estimatedCompletionProbability || 25}%
                      </span>
                    </div>
                  </div>

                  {analysis.emergencyMode.immediateRecommendation && (
                    <div className="mt-4 pt-3 border-t border-rose-500/20 flex items-start gap-2 bg-rose-500/5 -mx-5 -mb-5 px-5 py-3">
                      <span className="text-xs font-bold text-rose-500 shrink-0 font-mono">RESCUE TACTIC:</span>
                      <p className="text-xs text-theme-primary italic font-medium leading-relaxed">
                        {analysis.emergencyMode.immediateRecommendation}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* 1. Daily Briefing Card */}
              <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-indigo-500/10">
                  <Sparkles className="w-32 h-32 rotate-12" />
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-theme-primary uppercase tracking-widest font-mono">
                    Daily Productivity Briefing
                  </h3>
                  {isLoadingAnalysis && (
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin ml-2" />
                  )}
                </div>

                <div className="text-sm text-theme-primary leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
                  {renderMarkdown(analysis.dailyBriefing)}
                </div>
              </div>

              {/* Mid Columns (Workload Meter & Smart Execution Plan vs Smart Timeline) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Workload & Plan (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* 3. AI Workload Meter */}
                  <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-theme-primary">AI Workload Meter</h3>
                        <Clock className="w-4.5 h-4.5 text-theme-muted" />
                      </div>

                      {/* Meter Display */}
                      <div className="my-6">
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <span className="text-[10px] text-theme-muted uppercase tracking-widest font-mono block">Workload Rating</span>
                            <span className={`text-2xl font-black ${
                              analysis.workloadMeter?.level === 'Light' ? 'text-emerald-500' :
                              analysis.workloadMeter?.level === 'Balanced' ? 'text-indigo-500 dark:text-indigo-400' :
                              analysis.workloadMeter?.level === 'Heavy' ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                              {analysis.workloadMeter?.level || 'Balanced'}
                            </span>
                          </div>
                          
                          <span className={`w-3 h-3 rounded-full ${
                            analysis.workloadMeter?.level === 'Light' ? 'bg-emerald-500' :
                            analysis.workloadMeter?.level === 'Balanced' ? 'bg-indigo-500' :
                            analysis.workloadMeter?.level === 'Heavy' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                        </div>

                        <div className="w-full h-3 bg-theme-bg border border-theme-border/50 rounded-full overflow-hidden flex gap-0.5">
                          <div className={`h-full rounded-l-full transition-all duration-500 ${
                            analysis.workloadMeter?.level === 'Light' ? 'w-[25%] bg-emerald-500' :
                            analysis.workloadMeter?.level === 'Balanced' ? 'w-[50%] bg-indigo-500' :
                            analysis.workloadMeter?.level === 'Heavy' ? 'w-[75%] bg-amber-500' : 'w-[100%] bg-rose-500'
                          }`} />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-theme-secondary bg-theme-bg/40 p-3.5 border border-theme-border/40 rounded-xl leading-relaxed">
                      {analysis.workloadMeter?.explanation}
                    </p>
                  </div>

                  {/* 4. Smart Execution Plan */}
                  <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4.5 h-4.5 text-indigo-500" />
                      <h3 className="text-base font-bold text-theme-primary">Smart Execution Plan</h3>
                    </div>

                    <div className="space-y-4">
                      {analysis.executionPlan?.map((step: any, index: number) => {
                        const originalTask = tasks.find(t => t.id === step.taskId);
                        return (
                          <div key={step.taskId || index} className="flex gap-4 items-start relative group">
                            {index < analysis.executionPlan.length - 1 && (
                              <div className="absolute top-8 left-4 bottom-0 w-0.5 bg-theme-border group-hover:bg-indigo-500/30 transition-colors" />
                            )}
                            
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-500/20">
                              {index + 1}
                            </div>

                            <div className="flex-1 bg-theme-bg/30 border border-theme-border hover:border-indigo-500/30 p-3.5 rounded-xl transition-all">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-theme-primary">{step.taskTitle}</h4>
                                {originalTask && (
                                  <span className="text-[10px] font-mono text-theme-secondary font-bold">
                                    {originalTask.progress}% Complete
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-theme-secondary mt-1.5 leading-relaxed font-sans">
                                {step.reason}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Right Side: Smart Timeline (5 cols) */}
                <div className="lg:col-span-5">
                  {/* 5. Smart Timeline */}
                  <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4.5 h-4.5 text-indigo-500" />
                          <h3 className="text-base font-bold text-theme-primary">AI Smart Timeline</h3>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-theme-bg border border-theme-border text-theme-secondary rounded-lg">
                          Visual Day
                        </span>
                      </div>

                      <div className="space-y-3 font-sans">
                        {analysis.smartTimeline?.map((block: any, index: number) => {
                          return (
                            <div 
                              key={index} 
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border rounded-xl gap-2 transition-all ${
                                block.isTask 
                                  ? 'bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40' 
                                  : 'bg-theme-bg/40 border-theme-border border-dashed'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-mono font-bold text-indigo-500 dark:text-indigo-400 shrink-0 bg-indigo-500/10 dark:bg-indigo-500/25 px-2.5 py-1 rounded-lg">
                                  {block.timeSlot}
                                </span>
                                <div className="overflow-hidden">
                                  <h4 className="text-xs font-bold text-theme-primary truncate">{block.activity}</h4>
                                  <p className="text-[10px] text-theme-secondary mt-0.5 font-mono">{block.durationMinutes} minutes</p>
                                </div>
                              </div>

                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono w-fit uppercase ${
                                block.isTask 
                                  ? 'bg-indigo-600 text-white' 
                                  : 'bg-theme-border text-theme-secondary'
                              }`}>
                                {block.isTask ? 'FOCUS' : 'REST'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* 2. Deadline Risk Predictor */}
              <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                    <h3 className="text-base font-bold text-theme-primary">Deadline Risk Predictor</h3>
                  </div>
                  <span className="text-xs font-mono font-semibold text-theme-secondary">
                    Active risk matrices
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.deadlineRisks?.map((risk: any, index: number) => {
                    const isCritical = risk.riskLevel === 'critical';
                    const isModerate = risk.riskLevel === 'moderate';
                    return (
                      <div 
                        key={risk.taskId || index} 
                        className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                          isCritical ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40' :
                          isModerate ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' :
                          'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="text-xs font-bold text-theme-primary line-clamp-1">{risk.taskTitle}</h4>
                            <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded uppercase ${
                              isCritical ? 'bg-rose-500 text-white' :
                              isModerate ? 'bg-amber-500 text-slate-900' :
                              'bg-emerald-500 text-white'
                            }`}>
                              {risk.riskLevel}
                            </span>
                          </div>

                          <p className="text-xs text-theme-secondary line-clamp-3 leading-relaxed mb-4">
                            {risk.reason}
                          </p>
                        </div>

                        <div className="border-t border-theme-border/40 pt-3 mt-3 space-y-3">
                          <div>
                            <div className="flex justify-between text-[10px] mb-1 font-mono">
                              <span className="text-theme-secondary">Completion Probability</span>
                              <span className={`font-bold ${
                                isCritical ? 'text-rose-500' : isModerate ? 'text-amber-500' : 'text-emerald-500'
                              }`}>{risk.successProbability}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-theme-bg rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isCritical ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${risk.successProbability}%` }}
                              />
                            </div>
                          </div>

                          <div className="bg-theme-bg/60 border border-theme-border/30 p-2 rounded-xl">
                            <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 font-mono block uppercase">Guardian Move:</span>
                            <p className="text-[11px] text-theme-primary italic mt-0.5 font-sans leading-relaxed line-clamp-2">
                              {risk.recommendedAction}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
