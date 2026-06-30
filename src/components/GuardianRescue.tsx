import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, ShieldCheck, ArrowRight, RefreshCw, Calendar, 
  Clock, AlertTriangle, Sparkles, CheckCircle, Undo, Info, 
  ArrowDown, Lock, Moon, Sun, ArrowRightLeft, Hourglass, HelpCircle, Flame, Plus, Play
} from 'lucide-react';
import { Task, Activity, CalendarEvent } from '../types';
import { auth, getRescuePlansHistoryFromFirestore } from '../lib/firebase';

interface GuardianRescueProps {
  tasks: Task[];
  calendarEvents?: CalendarEvent[];
  isDark: boolean;
  onApplyPlan: (
    updatedTasks: Task[], 
    changes: any[], 
    metrics: any,
    optimizedSchedule: any[],
    reasons: string[]
  ) => Promise<void>;
  onUndoPlan: () => Promise<void>;
  activeRescuePlan: any | null;
  addActivityLog: (type: 'create' | 'complete' | 'edit' | 'delete' | 'ai_chat' | 'focus' | 'rescue', content: string) => void;
}

export default function GuardianRescue({
  tasks,
  calendarEvents = [],
  isDark,
  onApplyPlan,
  onUndoPlan,
  activeRescuePlan,
  addActivityLog
}: GuardianRescueProps) {
  // Config state
  const [availableHours, setAvailableHours] = useState(8);
  const [breakPreference, setBreakPreference] = useState<'standard' | 'frequent' | 'minimal'>('standard');

  // Interactive UI state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState<'before' | 'after'>('before');
  const [showExplanation, setShowExplanation] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New applying step states and history states
  const [isApplying, setIsApplying] = useState(false);
  const [applyingStep, setApplyingStep] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [successToast, setSuccessToast] = useState<{ show: boolean; title: string; message: string }>({
    show: false,
    title: "",
    message: ""
  });

  // Analysis steps text
  const steps = [
    "Analyzing deadlines and urgency parameters...",
    "Scanning active calendar configurations & conflicts...",
    "Calculating total required working hours...",
    "Generating optimal reordering & focus slots...",
    "Inserting smart recovery buffers & breaks...",
    "Formulating Guardian Rescue strategy..."
  ];

  // Apply steps sequence
  const applySteps = [
    "Reordering Tasks",
    "Updating Calendar",
    "Creating Focus Blocks",
    "Updating Mission Control",
    "Updating Dashboard",
    "Updating Analytics",
    "Saving Recovery Plan to Firestore",
    "Synchronization Complete"
  ];

  // Run initial trigger check
  const incompleteTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Parse estimated duration helper
  const parseDuration = (dur: string | undefined): number => {
    if (!dur) return 1.5; // default to 1.5 hours
    const cleaned = dur.toLowerCase().trim();
    const hMatch = cleaned.match(/(\d+)\s*h/);
    const mMatch = cleaned.match(/(\d+)\s*m/);
    
    let total = 0;
    if (hMatch) total += parseInt(hMatch[1]);
    if (mMatch) total += parseInt(mMatch[1]) / 60;
    return total > 0 ? total : 1.5;
  };

  // Compute stats before optimization
  const totalRequiredHours = incompleteTasks.reduce((sum, t) => sum + parseDuration(t.estimatedDuration), 0);
  const timeGap = totalRequiredHours - availableHours;
  const now = new Date();

  // Overdue count
  const overdueTasks = incompleteTasks.filter(t => {
    const d = new Date(t.deadline);
    return d.getTime() < now.getTime();
  });

  // High risk tasks (due in less than 24 hours)
  const highRiskTasks = incompleteTasks.filter(t => {
    const d = new Date(t.deadline);
    const diff = d.getTime() - now.getTime();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  });

  // Helpers for scheduling, fixed events, and evaluation
  const getScheduleBlocks = (tasksList: Task[], breakPref: 'standard' | 'frequent' | 'minimal') => {
    const blocks: { start: number; end: number; title: string; category: string }[] = [];
    let currentHour = 9.0;
    const breakLength = breakPref === 'frequent' ? 0.33 : breakPref === 'minimal' ? 0.15 : 0.25;

    tasksList.forEach((task, idx) => {
      const duration = parseDuration(task.estimatedDuration);
      blocks.push({
        start: currentHour,
        end: currentHour + duration,
        title: task.title,
        category: task.category || ""
      });
      currentHour += duration;
      if (idx < tasksList.length - 1) {
        currentHour += breakLength;
      }
    });
    return blocks;
  };

  const parseTimeToHour = (timeStr: string): number => {
    if (!timeStr) return 9.0;
    if (timeStr.includes('T')) {
      try {
        const d = new Date(timeStr);
        if (!isNaN(d.getTime())) {
          return d.getHours() + d.getMinutes() / 60;
        }
      } catch (e) {}
    }
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      const hour = parseInt(parts[0], 10);
      const min = parts[1] ? parseInt(parts[1], 10) : 0;
      if (!isNaN(hour) && !isNaN(min)) {
        return hour + min / 60;
      }
    }
    const parsed = parseFloat(timeStr);
    return isNaN(parsed) ? 9.0 : parsed;
  };

  const getFixedCalendarEvents = () => {
    const events: { title: string; start: number; end: number; category: string }[] = [];
    calendarEvents.forEach(evt => {
      const start = parseTimeToHour(evt.startTime);
      const end = parseTimeToHour(evt.endTime);
      events.push({
        title: evt.title,
        start,
        end,
        category: evt.category || 'meeting'
      });
    });
    return events;
  };

  const evaluateSchedule = (targetTasks: Task[]) => {
    const incomplete = targetTasks.filter(t => t.status !== 'completed');
    const totalReqHours = incomplete.reduce((sum, t) => sum + parseDuration(t.estimatedDuration), 0);
    
    // 1. Working Hours
    const isHoursOverloaded = totalReqHours > availableHours;
    const riskWorkingHours = isHoursOverloaded ? 40 : 0;

    // 2. Overdue Tasks
    const overdue = incomplete.filter(t => {
      const d = new Date(t.deadline);
      return d.getTime() < now.getTime();
    });
    const hasOverdue = overdue.length > 0;
    const riskOverdue = hasOverdue ? 25 : 0;

    // 3. Impossible Deadlines
    const impossibleList = incomplete.filter(t => {
      const deadlineTime = new Date(t.deadline).getTime();
      const duration = parseDuration(t.estimatedDuration);
      const hoursUntilDeadline = (deadlineTime - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilDeadline > 0 && hoursUntilDeadline < duration;
    });
    const hasImpossible = impossibleList.length > 0;
    const riskImpossible = hasImpossible ? 25 : 0;

    // 4. High Priority Density
    const highPriorityToday = incomplete.filter(t => {
      if (t.priority !== 'high') return false;
      const deadlineDate = new Date(t.deadline);
      return deadlineDate.toDateString() === now.toDateString();
    });
    const hasHighPriorityDensity = highPriorityToday.length >= 2;
    const riskDensity = hasHighPriorityDensity ? 15 : 0;

    // 5. Calendar Conflicts
    const workBlocks = getScheduleBlocks(incomplete, breakPreference);
    const fixedEvents = calendarEvents.length > 0 ? getFixedCalendarEvents() : [];
    const overlappingConflicts: { eventTitle: string; eventStart: number; eventEnd: number; blockTitle: string }[] = [];

    if (calendarEvents.length > 0) {
      workBlocks.forEach(block => {
        fixedEvents.forEach(evt => {
          const overlapStart = Math.max(block.start, evt.start);
          const overlapEnd = Math.min(block.end, evt.end);
          if (overlapStart < overlapEnd) {
            overlappingConflicts.push({
              eventTitle: evt.title,
              eventStart: evt.start,
              eventEnd: evt.end,
              blockTitle: block.title
            });
          }
        });
      });
    }
    const hasCalendarConflicts = overlappingConflicts.length > 0;
    const riskConflicts = hasCalendarConflicts ? 10 : 0;

    const riskScore = riskWorkingHours + riskOverdue + riskImpossible + riskDensity + riskConflicts;

    let status: 'balanced' | 'busy' | 'overloaded' | 'impossible' = 'balanced';
    if (riskScore <= 20) {
      status = 'balanced';
    } else if (riskScore <= 45) {
      status = 'busy';
    } else if (riskScore <= 70) {
      status = 'overloaded';
    } else {
      status = 'impossible';
    }

    if (totalReqHours <= availableHours) {
      if (status === 'overloaded' || status === 'impossible') {
        status = (totalReqHours / availableHours > 0.8) ? 'busy' : 'balanced';
      }
    }

    // Compile reasons
    const reasons: string[] = [];
    if (isHoursOverloaded) {
      reasons.push(`Required work (${totalReqHours.toFixed(1)}h) exceeds available capacity (${availableHours}h).`);
    } else {
      const usagePct = Math.round((totalReqHours / availableHours) * 100) || 0;
      reasons.push(`Workload uses ${usagePct}% of available hours.`);
    }

    if (hasOverdue) {
      reasons.push(`${overdue.length} overdue task(s) detected requiring immediate attention.`);
    }

    impossibleList.forEach(t => {
      const dlStr = new Date(t.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      reasons.push(`'${t.title}' cannot realistically be completed before its deadline (${dlStr}).`);
    });

    if (hasHighPriorityDensity) {
      reasons.push(`${highPriorityToday.length} high-priority tasks are concentrated today.`);
    }

    overlappingConflicts.forEach(conf => {
      const formatHourLocal = (h: number) => {
        const hh = Math.floor(h);
        const mm = Math.round((h - hh) * 60);
        const ampm = hh >= 12 ? 'PM' : 'AM';
        const displayH = hh % 12 === 0 ? 12 : hh % 12;
        const displayM = mm < 10 ? `0${mm}` : mm;
        return `${displayH}:${displayM} ${ampm}`;
      };
      reasons.push(`'${conf.eventTitle}' (${formatHourLocal(conf.eventStart)}-${formatHourLocal(conf.eventEnd)}) overlaps with '${conf.blockTitle}' focus block.`);
    });

    return {
      status,
      riskScore,
      reasons,
      totalReqHours,
      overdueCount: overdue.length,
      conflictsCount: overlappingConflicts.length,
      impossibleCount: impossibleList.length,
      highPriorityDensityCount: highPriorityToday.length
    };
  };

  const beforeEvaluation = evaluateSchedule(tasks);
  const scheduleStatus = beforeEvaluation.status;
  const diagnosticReasons = beforeEvaluation.reasons;

  // Check if we meet trigger conditions to suggest rescue
  const isRescueRecommended = scheduleStatus === 'impossible' || scheduleStatus === 'overloaded';

  // Load history from Firestore
  const loadRescueHistory = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    setIsLoadingHistory(true);
    try {
      const hist = await getRescuePlansHistoryFromFirestore(firebaseUser.uid);
      setHistory(hist);
    } catch (err) {
      console.error("Error loading rescue history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadRescueHistory();
  }, []);

  // Analysis Trigger Animation
  const startRescueAnalysis = () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);
    setPlanGenerated(false);
  };

  useEffect(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setAnalysisStep(prev => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              setIsAnalyzing(false);
              setPlanGenerated(true);
              setActiveTab('after');
              addActivityLog('rescue', "Guardian generated schedule recovery strategy");
            }, 600);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isAnalyzing]);

  // -------------------------------------------------------------
  // DETERMINISTIC RECOVERY ALGORITHM & STRATEGY GENERATOR
  // -------------------------------------------------------------
  const generateOptimizedSchedule = () => {
    // 1. Sort tasks by priority (high > medium > low) and then by deadline (earliest first)
    const sortedTasks = [...incompleteTasks].sort((a, b) => {
      const pA = a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1;
      const pB = b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1;
      if (pA !== pB) return pB - pA; // highest priority first
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime(); // closest deadline first
    });

    let currentDayAvailable = availableHours;
    const appliedChanges: any[] = [];
    const finalTasksList: Task[] = [];
    const todayAssigned: Task[] = [];
    const tomorrowAssigned: Task[] = [];

    // Reorganize: Assign tasks to today if they fit, otherwise move flexible (lower priority) tasks to tomorrow
    for (const task of sortedTasks) {
      const duration = parseDuration(task.estimatedDuration);
      
      // If it's a high priority or overdue task, keep it today at all costs
      if (task.priority === 'high' || new Date(task.deadline).getTime() < now.getTime() + 12 * 60 * 60 * 1000) {
        todayAssigned.push(task);
        currentDayAvailable -= duration;
        finalTasksList.push(task); // no deadline change, keep today
      } else {
        // For medium/low priority tasks, check if we have enough space today
        if (currentDayAvailable >= duration) {
          todayAssigned.push(task);
          currentDayAvailable -= duration;
          finalTasksList.push(task);
        } else {
          // Defer task to tomorrow
          tomorrowAssigned.push(task);
          const originalDeadline = task.deadline;
          const tomorrowDate = new Date();
          tomorrowDate.setDate(tomorrowDate.getDate() + 1);
          tomorrowDate.setHours(17, 0, 0, 0); // Default tomorrow afternoon deadline
          const newDeadline = tomorrowDate.toISOString();

          appliedChanges.push({
            taskId: task.id,
            title: task.title,
            originalDeadline,
            newDeadline,
            reasons: [
              "Insufficient available hours today",
              task.priority === 'low' 
                ? "Lower priority than critical goals today"
                : "Balanced spacing avoids dilution of focus"
            ],
            reason: task.priority === 'low' 
              ? "Deferred to tomorrow. Reason: Low-priority work compressed to protect critical goals today."
              : "Reallocated to tomorrow. Reason: Balanced workload spacing avoids focus dilution."
          });

          finalTasksList.push({
            ...task,
            deadline: newDeadline
          });
        }
      }
    }

    // Add back all completed tasks unchanged
    completedTasks.forEach(ct => {
      finalTasksList.push(ct);
    });

    // Smart Schedule Blocks builder for Today
    const smartScheduleBlocks: any[] = [];
    let startHour = 9; // Starts at 9:00 AM
    const breakLength = breakPreference === 'frequent' ? 0.33 : breakPreference === 'minimal' ? 0.15 : 0.25; // in hours

    todayAssigned.forEach((task, idx) => {
      const duration = parseDuration(task.estimatedDuration);
      
      // 1. Insert Deep Focus Block for task
      const focusEnd = startHour + duration;
      const isOverdue = new Date(task.deadline).getTime() < now.getTime();
      const reasonsList: string[] = [];

      if (idx === 0) {
        reasonsList.push("Highest priority");
        reasonsList.push("Earliest deadline");
        reasonsList.push("Protected from interruption");
      } else if (task.priority === 'high') {
        reasonsList.push("Requires uninterrupted work");
        reasonsList.push("Critical deadline milestone");
        reasonsList.push("High-priority goal");
      } else if (isOverdue) {
        reasonsList.push("Overdue deadline prevention");
        reasonsList.push("Urgent delivery targeted first");
        reasonsList.push("Attention fully preserved");
      } else {
        reasonsList.push("Requires uninterrupted work");
        reasonsList.push("Second earliest deadline");
        reasonsList.push("Grouped after preceding blocks to preserve focus");
      }

      smartScheduleBlocks.push({
        id: `focus-${task.id}`,
        type: 'focus_block',
        title: task.title,
        timeSlot: `${formatHour(startHour)} - ${formatHour(focusEnd)}`,
        duration: Math.round(duration * 60),
        task,
        reasons: reasonsList
      });
      startHour = focusEnd;

      // 2. Insert Short Recovery Break (except for last task)
      if (idx < todayAssigned.length - 1) {
        const breakEnd = startHour + breakLength;
        smartScheduleBlocks.push({
          id: `break-${idx}`,
          type: 'break',
          title: "Guardian Recovery Break",
          timeSlot: `${formatHour(startHour)} - ${formatHour(breakEnd)}`,
          duration: Math.round(breakLength * 60),
          reasons: [
            "Reduce risk of missing deadline",
            "Prevent cognitive exhaustion",
            "Restore developer focus momentum"
          ]
        });
        startHour = breakEnd;
      }
    });

    // Calculate After-Recovery metrics
    const afterRequiredHours = todayAssigned.reduce((sum, t) => sum + parseDuration(t.estimatedDuration), 0);
    const afterTimeGap = afterRequiredHours - availableHours;
    const focusBlocksCreatedCount = todayAssigned.length;
    const recoveryTimeGained = Math.max(0, totalRequiredHours - afterRequiredHours);
    const bufferAddedMinutes = appliedChanges.length > 0 ? appliedChanges.length * 30 : 15; // buffer safety minutes

    const afterEvaluation = evaluateSchedule(todayAssigned);

    return {
      finalTasksList,
      appliedChanges,
      smartScheduleBlocks,
      metrics: {
        before: {
          availableHours,
          requiredHours: totalRequiredHours,
          timeGap,
          highRiskCount: beforeEvaluation.impossibleCount,
          conflictsCount: beforeEvaluation.conflictsCount,
          status: scheduleStatus
        },
        after: {
          availableHours,
          requiredHours: afterRequiredHours,
          timeGap: afterTimeGap,
          highRiskCount: afterEvaluation.impossibleCount,
          conflictsCount: afterEvaluation.conflictsCount,
          status: afterEvaluation.status,
          focusBlocksCreatedCount,
          recoveryTimeGained,
          bufferAddedMinutes
        }
      }
    };
  };

  const formatHour = (hourVal: number): string => {
    const hours = Math.floor(hourVal);
    const minutes = Math.round((hourVal - hours) * 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const optimizedPlan = generateOptimizedSchedule();

  // Handle animation ticks for Applying recovery plan
  useEffect(() => {
    if (isApplying) {
      const interval = setInterval(() => {
        setApplyingStep(prev => {
          if (prev >= applySteps.length - 1) {
            clearInterval(interval);
            setTimeout(async () => {
              try {
                // Compile flattened list of explanations/reasons for Firestore
                const allReasons: string[] = [];
                optimizedPlan.appliedChanges.forEach(c => {
                  allReasons.push(`${c.title} (Deferred): ${c.reasons.join(', ')}`);
                });
                optimizedPlan.smartScheduleBlocks.forEach(b => {
                  if (b.type === 'focus_block') {
                    allReasons.push(`${b.task.title} (Focus block): ${b.reasons.join(', ')}`);
                  } else {
                    allReasons.push(`Buffer time break: ${b.reasons.join(', ')}`);
                  }
                });

                await onApplyPlan(
                  optimizedPlan.finalTasksList, 
                  optimizedPlan.appliedChanges, 
                  optimizedPlan.metrics,
                  optimizedPlan.smartScheduleBlocks,
                  allReasons
                );

                // Show success toast
                setSuccessToast({
                  show: true,
                  title: "Guardian Mission Updated",
                  message: "Today's schedule has been optimized. Calendar, Dashboard, Timeline, Analytics and Firestore are now synchronized."
                });

                // Dismiss success toast after 4 seconds
                setTimeout(() => {
                  setSuccessToast(prev => ({ ...prev, show: false }));
                }, 4000);

                setIsApplying(false);
                loadRescueHistory();
              } catch (err) {
                console.error("Failed to apply Rescue Plan in UI interval:", err);
                setIsApplying(false);
                setActionSuccess("Failed to apply the Guardian Rescue plan.");
                setTimeout(() => setActionSuccess(null), 3500);
              }
            }, 600);
            return prev;
          }
          return prev + 1;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [isApplying]);

  const handleApply = async () => {
    setIsApplying(true);
    setApplyingStep(0);
  };

  const handleUndo = async () => {
    setActionSuccess("Restoring original workspace schedule...");
    try {
      await onUndoPlan();
      addActivityLog('rescue', "Guardian Rescue Plan rolled back. Original schedule restored.");
      
      setSuccessToast({
        show: true,
        title: "Workspace Restored",
        message: "Original schedule successfully restored from snapshot. All modifications rolled back."
      });
      setTimeout(() => {
        setSuccessToast(prev => ({ ...prev, show: false }));
      }, 4000);

      setActionSuccess(null);
      loadRescueHistory();
    } catch (err) {
      console.error(err);
      setActionSuccess("Failed to rollback the recovery plan.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'impossible': return 'bg-rose-500 text-white';
      case 'overloaded': return 'bg-amber-500 text-white';
      case 'busy': return 'bg-indigo-500 text-white';
      default: return 'bg-emerald-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'impossible': return 'IMPOSSIBLE TRAJECTORY';
      case 'overloaded': return 'HEAVILY OVERLOADED';
      case 'busy': return 'BUSY BUT MANAGEABLE';
      default: return 'IDEAL & BALANCED';
    }
  };

  const getStatusExplanation = (status: string) => {
    switch (status) {
      case 'impossible': return 'Workload strictly exceeds achievable limits. Overdue deadlines require critical deferrals.';
      case 'overloaded': return 'Current tasks will trigger fatigue. Deadlines overlap on tight delivery windows.';
      case 'busy': return 'Full calendar load. Solid attention management is required to maintain quality.';
      default: return 'Healthy schedule margins. Low friction, ready for flawless execution.';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'impossible': return '🔴 Impossible';
      case 'overloaded': return '🟠 Overloaded';
      case 'busy': return '🟡 Busy';
      default: return '🟢 Balanced';
    }
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'impossible': return 'text-rose-500';
      case 'overloaded': return 'text-orange-500';
      case 'busy': return 'text-amber-500';
      default: return 'text-emerald-500';
    }
  };

  const getStatusBadgeSeparated = (status: string) => {
    let emoji = '🟢';
    let label = 'Balanced';
    switch (status) {
      case 'impossible':
        emoji = '🔴';
        label = 'Impossible';
        break;
      case 'overloaded':
        emoji = '🟠';
        label = 'Overloaded';
        break;
      case 'busy':
        emoji = '🟡';
        label = 'Busy';
        break;
      default:
        emoji = '🟢';
        label = 'Balanced';
        break;
    }
    return (
      <div className="flex flex-col items-center justify-center space-y-0.5">
        <span className="text-sm sm:text-base leading-none">{emoji}</span>
        <span className="text-xs sm:text-sm font-black tracking-tight leading-none">{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Demo Feature Highlight
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-theme-primary mt-1 flex items-center gap-2">
            🛡 Guardian Rescue Plan
          </h1>
          <p className="text-sm text-theme-secondary mt-1">
            Reorganize impossible schedules, resolve overdue bottlenecks, and protect critical milestones.
          </p>
        </div>

        {/* Undo button if a plan is currently applied */}
        {activeRescuePlan && (
          <button
            onClick={handleUndo}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl border border-rose-500/20 font-bold text-xs transition-all cursor-pointer shadow-sm"
          >
            <Undo className="w-4 h-4" />
            <span>Undo Recovery Plan</span>
          </button>
        )}
      </div>

      {/* Action Notification Toast Banner */}
      {actionSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-indigo-600 border border-indigo-400 text-white rounded-2xl flex items-center gap-3 shadow-lg"
        >
          <Sparkles className="w-5 h-5 animate-spin" />
          <span className="text-xs font-semibold">{actionSuccess}</span>
        </motion.div>
      )}

      {/* Main configuration settings box (only visible if we haven't generated a plan or to tweak parameters) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column configuration */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-theme-primary uppercase tracking-wider font-mono flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-indigo-500" />
            <span>Rescue parameters</span>
          </h3>

          {/* Working Hours slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-theme-secondary font-medium">Available Working Hours</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{availableHours} hrs</span>
            </div>
            <input
              type="range"
              min={4}
              max={12}
              step={0.5}
              value={availableHours}
              onChange={(e) => {
                setAvailableHours(parseFloat(e.target.value));
                setPlanGenerated(false);
              }}
              className="w-full accent-indigo-600 h-1.5 bg-theme-bg rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-theme-muted block leading-relaxed">
              Define the maximum hours you can dedicate to today's active tasks.
            </span>
          </div>

          {/* Break Preference */}
          <div className="space-y-2">
            <span className="text-xs text-theme-secondary font-medium">Spaced Recovery Breaks</span>
            <div className="grid grid-cols-3 gap-2">
              {(['minimal', 'standard', 'frequent'] as const).map((pref) => (
                <button
                  key={pref}
                  onClick={() => {
                    setBreakPreference(pref);
                    setPlanGenerated(false);
                  }}
                  className={`py-2 text-[10px] font-bold rounded-xl border capitalize transition-all cursor-pointer ${
                    breakPreference === pref
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-theme-border hover:bg-theme-bg text-theme-secondary'
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnostics warning details based on schedule status */}
          {incompleteTasks.length > 0 && (
            totalRequiredHours <= availableHours ? (
              // Workload fits within available hours!
              <div className={`p-4 rounded-xl border text-xs space-y-2.5 bg-emerald-500/5 border-emerald-500/20 text-emerald-500`}>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 font-bold font-mono uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>🟢 Workload Status: {scheduleStatus === 'busy' ? 'Busy' : 'Balanced'}</span>
                  </div>
                  {(overdueTasks.length > 0 || beforeEvaluation.impossibleCount > 0) && (
                    <div className="flex items-center gap-2 font-bold font-mono uppercase tracking-wider text-rose-500">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>🔴 Deadline Status: Critical</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-[11px] leading-relaxed">
                  <p className="opacity-90">
                    Required Hours: <span className="font-bold">{totalRequiredHours.toFixed(1)}h</span> | Available Hours: <span className="font-bold">{availableHours}h</span> | Free Capacity: <span className="font-bold">{(availableHours - totalRequiredHours).toFixed(1)}h</span>
                  </p>
                  {(overdueTasks.length > 0 || beforeEvaluation.impossibleCount > 0) ? (
                    <p className="text-rose-500 font-medium">Workload fits today's capacity, but overdue or impossible deadlines require attention.</p>
                  ) : (
                    <p className="opacity-75 font-medium">Today's workload fits within your available working hours.</p>
                  )}
                </div>

                {diagnosticReasons.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-current/10 space-y-1">
                    <p className="text-[10px] font-bold font-mono uppercase tracking-wider opacity-90">Diagnostic Analysis:</p>
                    {diagnosticReasons.map((r, i) => (
                      <p key={i} className="text-[10px] leading-relaxed opacity-85 flex items-start gap-1">
                        <span>•</span>
                        <span>{r}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Workload is overloaded!
              <div className={`p-4 rounded-xl border text-xs space-y-2.5 bg-orange-500/10 border-orange-500/20 text-orange-500`}>
                <div className="flex items-center gap-2 font-bold font-mono uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span>🟠 Overload Detected</span>
                </div>

                <div className="space-y-1 text-[11px] leading-relaxed">
                  <p className="opacity-90">
                    Required Hours: <span className="font-bold">{totalRequiredHours.toFixed(1)}h</span> | Available Hours: <span className="font-bold">{availableHours}h</span> | Time Deficit: <span className="font-bold text-rose-500">{(totalRequiredHours - availableHours).toFixed(1)}h</span>
                  </p>
                  <p className="opacity-75">Required hours exceed available capacity. Guardian Rescue is recommended.</p>
                </div>

                {diagnosticReasons.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-current/10 space-y-1">
                    <p className="text-[10px] font-bold font-mono uppercase tracking-wider opacity-90">Diagnostic Analysis:</p>
                    {diagnosticReasons.map((r, i) => (
                      <p key={i} className="text-[10px] leading-relaxed opacity-85 flex items-start gap-1">
                        <span>•</span>
                        <span>{r}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {/* Calendar Analysis Block */}
          <div className="p-4 rounded-xl border border-theme-border bg-theme-bg/40 text-xs space-y-2">
            <span className="text-[10px] font-mono text-theme-muted uppercase font-bold tracking-wider block">Calendar Analysis</span>
            {calendarEvents.length === 0 ? (
              <div className="space-y-1">
                <p className="text-emerald-500 font-semibold flex items-center gap-1.5 font-mono text-[11px]">
                  <span>✓</span> No calendar events found.
                </p>
                <p className="text-theme-secondary font-mono text-[10px]">
                  ✓ Conflict analysis skipped.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-indigo-500 font-semibold flex items-center gap-1.5 font-mono text-[11px]">
                  <span>ℹ</span> {calendarEvents.length} calendar event{calendarEvents.length > 1 ? 's' : ''} detected.
                </p>
                <div className="space-y-1">
                  {calendarEvents.map((evt, idx) => (
                    <p key={evt.id || idx} className="text-[10px] text-theme-secondary font-mono leading-relaxed truncate">
                      • {evt.title} ({evt.startTime} – {evt.endTime})
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Manual generation trigger */}
          <button
            onClick={startRescueAnalysis}
            disabled={isAnalyzing || incompleteTasks.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15 disabled:opacity-40 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Generate Recovery Plan</span>
          </button>
        </div>

        {/* Left column sub-panel: Firestore Rescue History Log */}
        <div className="bg-theme-card border border-theme-border rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-theme-primary uppercase tracking-wider font-mono flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>Rescue History Log</span>
          </h3>

          {isLoadingHistory ? (
            <div className="flex items-center gap-2 text-xs text-theme-muted font-mono animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>Syncing history...</span>
            </div>
          ) : history.length === 0 ? (
            <p className="text-[10px] text-theme-muted leading-relaxed font-mono">
              No previously applied rescue plans found. Apply a recovery strategy to establish historical logs in Firestore.
            </p>
          ) : (
            <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1 scrollbar-thin">
              {history.map((h, hidx) => (
                <div key={h.id || hidx} className="p-3 bg-theme-bg/60 border border-theme-border rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-theme-muted">
                      {new Date(h.timestamp).toLocaleDateString()} {new Date(h.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                      h.isApplied 
                        ? 'bg-emerald-500/15 text-emerald-500' 
                        : 'bg-slate-500/10 text-theme-muted'
                    }`}>
                      {h.isApplied ? 'ACTIVE' : 'UNDONE'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-semibold text-theme-primary">
                    <span>Tasks: {h.metrics?.after?.focusBlocksCreatedCount || h.originalTasks?.length || 0} slots</span>
                    <span className="text-indigo-500">{h.metrics?.after?.bufferAddedMinutes || 15}m buffers</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 2 columns: Analysis loading state or the interactive results panel */}
        <div className="lg:col-span-2 min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* 1. INITIAL IDLE / PRE-ANALYSIS STATE */}
            {!isAnalyzing && !planGenerated && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-theme-card border border-theme-border rounded-2xl p-8 flex flex-col items-center justify-center text-center flex-1"
              >
                <div className="relative p-5 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 rounded-3xl mb-5">
                  <ShieldCheck className="w-12 h-12" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" 
                  />
                </div>
                <h2 className="text-xl font-extrabold text-theme-primary">Guardian Recovery Diagnostics</h2>
                <p className="text-xs text-theme-secondary mt-2 max-w-md leading-relaxed">
                  Analyze your required workload against available working capacity. If your current tasks are overloaded, overlapping, or overdue, the Guardian will compute an optimized recovery layout.
                </p>

                {incompleteTasks.length === 0 ? (
                  <div className="mt-6 text-xs text-theme-muted bg-theme-bg px-4 py-2.5 rounded-xl border border-theme-border font-mono">
                    No active pending tasks. Add tasks to enable Guardian diagnostics.
                  </div>
                ) : (
                  <button
                    onClick={startRescueAnalysis}
                    className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    Initiate Diagnostics
                  </button>
                )}
              </motion.div>
            )}

            {/* 2. PREMIUM GUARDIAN ANALYSIS STEPS ANIMATION */}
            {isAnalyzing && (
              <motion.div
                key="analyzing-shimmer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-gradient-to-br from-indigo-950 via-slate-950 to-black border border-indigo-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center flex-1 relative overflow-hidden"
              >
                {/* Background active pulse rings */}
                <div className="absolute w-72 h-72 rounded-full border border-indigo-500/10 animate-ping -z-10" />
                <div className="absolute w-48 h-48 rounded-full border border-violet-500/10 animate-pulse -z-10" />
                
                <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-full animate-spin mb-6">
                  <Sparkles className="w-10 h-10" />
                </div>

                <h3 className="text-base font-extrabold text-white tracking-wide font-sans">
                  Computing Schedule Recovery Vectors...
                </h3>

                <div className="mt-8 space-y-3 w-full max-w-sm">
                  {steps.map((text, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-left">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                        idx < analysisStep 
                          ? 'bg-emerald-500 text-white' 
                          : idx === analysisStep 
                            ? 'bg-indigo-500 text-white animate-pulse' 
                            : 'bg-slate-800 text-slate-500'
                      }`}>
                        {idx < analysisStep ? '✓' : idx + 1}
                      </span>
                      <span className={`text-[11px] font-mono transition-all ${
                        idx < analysisStep 
                          ? 'text-slate-400 line-through' 
                          : idx === analysisStep 
                            ? 'text-indigo-300 font-extrabold' 
                            : 'text-slate-600'
                      }`}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 3. RECOVERY PLAN GENERATED - RESULTS INTERACTIVE VIEW */}
            {planGenerated && !isApplying && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm flex flex-col flex-1 space-y-6"
              >
                {/* Upper banner displaying status */}
                <div className="p-5 rounded-2xl bg-theme-bg border border-theme-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md font-mono tracking-wider ${
                      getStatusColor(optimizedPlan.metrics.before.status)
                    }`}>
                      {getStatusLabel(optimizedPlan.metrics.before.status)}
                    </span>
                    <h3 className="text-sm font-extrabold text-theme-primary mt-1.5">
                      {getStatusExplanation(optimizedPlan.metrics.before.status)}
                    </h3>
                  </div>

                  <button
                    onClick={handleApply}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shrink-0 shadow-md transition-all cursor-pointer flex items-center gap-1.5 animate-pulse"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Apply Recovery Plan</span>
                  </button>
                </div>

                {/* Guardian Summary Panel */}
                <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-emerald-500/5 border border-indigo-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-indigo-500/10 text-indigo-400 rounded">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <h4 className="text-xs font-black text-theme-primary uppercase tracking-wider font-mono">🛡️ Guardian Summary</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-theme-bg/60 border border-theme-border rounded-xl p-3 flex flex-col justify-center items-center text-center min-h-24 min-w-0 shadow-sm hover:border-indigo-500/30 transition-all">
                      <span className="text-[10px] font-mono text-theme-muted uppercase font-bold tracking-wider leading-tight">
                        Focus<br />Blocks
                      </span>
                      <p className="text-base font-black text-indigo-500 mt-1.5">
                        {optimizedPlan.metrics.after.focusBlocksCreatedCount}
                      </p>
                    </div>
                    <div className="bg-theme-bg/60 border border-theme-border rounded-xl p-3 flex flex-col justify-center items-center text-center min-h-24 min-w-0 shadow-sm hover:border-indigo-500/30 transition-all">
                      <span className="text-[10px] font-mono text-theme-muted uppercase font-bold tracking-wider leading-tight">
                        Conflicts<br />Removed
                      </span>
                      <p className="text-base font-black text-indigo-500 mt-1.5">
                        {optimizedPlan.metrics.before.conflictsCount}
                      </p>
                    </div>
                    <div className="bg-theme-bg/60 border border-theme-border rounded-xl p-3 flex flex-col justify-center items-center text-center min-h-24 min-w-0 shadow-sm hover:border-indigo-500/30 transition-all">
                      <span className="text-[10px] font-mono text-theme-muted uppercase font-bold tracking-wider leading-tight">
                        Tasks<br />Deferred
                      </span>
                      <p className="text-base font-black text-amber-500 mt-1.5">
                        {optimizedPlan.appliedChanges.length}
                      </p>
                    </div>
                    <div className="bg-theme-bg/60 border border-theme-border rounded-xl p-3 flex flex-col justify-center items-center text-center min-h-24 min-w-0 shadow-sm hover:border-indigo-500/30 transition-all">
                      <span className="text-[10px] font-mono text-theme-muted uppercase font-bold tracking-wider leading-tight">
                        Buffer<br />Added
                      </span>
                      <p className="text-base font-black text-emerald-500 mt-1.5">
                        {optimizedPlan.metrics.after.bufferAddedMinutes} min
                      </p>
                    </div>
                    <div className="bg-theme-bg/60 border border-theme-border rounded-xl p-3 flex flex-col justify-center items-center text-center min-h-24 min-w-0 shadow-sm hover:border-indigo-500/30 transition-all">
                      <span className="text-[10px] font-mono text-theme-muted uppercase font-bold tracking-wider leading-tight">
                        Status
                      </span>
                      <div className={`mt-1.5 font-black ${getStatusColorClass(optimizedPlan.metrics.after.status)}`}>
                        {getStatusBadgeSeparated(optimizedPlan.metrics.after.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs to compare BEFORE vs AFTER */}
                <div className="flex items-center border-b border-theme-border">
                  <button
                    onClick={() => setActiveTab('before')}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      activeTab === 'before'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    1. BEFORE RECOVERY
                  </button>
                  <button
                    onClick={() => setActiveTab('after')}
                    className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                      activeTab === 'after'
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-theme-secondary hover:text-theme-primary'
                    }`}
                  >
                    2. AFTER RECOVERY (OPTIMIZED)
                  </button>
                </div>

                {/* Comparison content viewports */}
                <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-5 scrollbar-thin">
                  
                  {/* BEFORE VIEWPORT */}
                  {activeTab === 'before' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      {/* Metric widgets row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-theme-bg border border-theme-border rounded-xl p-3 text-center">
                          <span className="text-[9px] font-mono text-theme-muted uppercase font-bold">Available Hours</span>
                          <p className="text-base font-black text-theme-primary mt-0.5">{optimizedPlan.metrics.before.availableHours}h</p>
                        </div>
                        <div className="bg-theme-bg border border-theme-border rounded-xl p-3 text-center">
                          <span className="text-[9px] font-mono text-theme-muted uppercase font-bold">Required Work</span>
                          <p className="text-base font-black text-rose-500 mt-0.5">{optimizedPlan.metrics.before.requiredHours.toFixed(1)}h</p>
                        </div>
                        <div className="bg-theme-bg border border-theme-border rounded-xl p-3 text-center">
                          {optimizedPlan.metrics.before.requiredHours <= optimizedPlan.metrics.before.availableHours ? (
                            <>
                              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">Free Capacity</span>
                              <p className="text-base font-black text-emerald-500 mt-0.5">
                                {(optimizedPlan.metrics.before.availableHours - optimizedPlan.metrics.before.requiredHours).toFixed(1)}h
                              </p>
                            </>
                          ) : (
                            <>
                              <span className="text-[9px] font-mono text-rose-600 dark:text-rose-400 uppercase font-bold">Time Deficit</span>
                              <p className="text-base font-black text-rose-500 mt-0.5">
                                {(optimizedPlan.metrics.before.requiredHours - optimizedPlan.metrics.before.availableHours).toFixed(1)}h
                              </p>
                            </>
                          )}
                        </div>
                        <div className="bg-theme-bg border border-theme-border rounded-xl p-3 text-center">
                          <span className="text-[9px] font-mono text-theme-muted uppercase font-bold">Active Conflicts</span>
                          <p className="text-base font-black text-rose-500 mt-0.5">{optimizedPlan.metrics.before.conflictsCount}</p>
                        </div>
                      </div>

                      {/* Current Schedule layout with overlapping alerts */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-theme-primary">Current Problematic Workload</h4>
                        <div className="space-y-2">
                          {incompleteTasks.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-theme-bg/60 border border-theme-border text-xs">
                              <div className="flex items-center gap-2.5 truncate">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${
                                  t.priority === 'high' ? 'bg-rose-500' : t.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} />
                                <div className="truncate">
                                  <p className="font-bold text-theme-primary truncate">{t.title}</p>
                                  <p className="text-[10px] text-theme-muted truncate">{t.category}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 font-mono text-[10px] shrink-0 text-theme-secondary">
                                <span>Estim: {t.estimatedDuration || "1.5h"}</span>
                                {t.priority === 'high' && (
                                  <span className="text-[9px] font-bold font-sans bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded">
                                    HIGH-RISK
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* AFTER VIEWPORT */}
                  {activeTab === 'after' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-5"
                    >
                      {/* Metric widgets row with clean status transitions */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-3 text-center">
                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">Required Work</span>
                          <p className="text-base font-black text-emerald-500 mt-0.5">{optimizedPlan.metrics.after.requiredHours.toFixed(1)}h</p>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-3 text-center">
                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">Conflicts Left</span>
                          <p className="text-base font-black text-emerald-500 mt-0.5">0</p>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-3 text-center">
                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">Deep Focus Created</span>
                          <p className="text-base font-black text-emerald-500 mt-0.5">{optimizedPlan.metrics.after.focusBlocksCreatedCount}</p>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-3 text-center">
                          {optimizedPlan.metrics.before.status === 'balanced' ? (
                            <>
                              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">Recovery Needed</span>
                              <p className="text-base font-black text-emerald-500 mt-0.5">No</p>
                            </>
                          ) : (optimizedPlan.metrics.before.status === 'busy' || totalRequiredHours <= availableHours) ? (
                            <>
                              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">Free Capacity</span>
                              <p className="text-base font-black text-emerald-500 mt-0.5">
                                {Math.max(0, availableHours - totalRequiredHours).toFixed(1)}h
                              </p>
                            </>
                          ) : (
                            <>
                              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 uppercase font-bold">Recovered Time</span>
                              <p className="text-base font-black text-emerald-500 mt-0.5">
                                +{optimizedPlan.metrics.after.recoveryTimeGained.toFixed(1)}h
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Visual Schedule Block Transitions - Dynamic calendar animation */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-theme-primary">Optimized Daily Agenda Map (Today)</h4>
                        
                        <div className="space-y-2.5 relative border-l border-emerald-500/30 pl-4 ml-2">
                          {optimizedPlan.smartScheduleBlocks.map((block, i) => (
                            <motion.div
                              key={block.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className={`p-3.5 rounded-xl border text-xs relative ${
                                block.type === 'break'
                                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-theme-bg border-theme-border text-theme-primary shadow-sm'
                              }`}
                            >
                              {/* Left dot timeline indicator */}
                              <span className={`absolute -left-[21px] top-4 w-2.5 h-2.5 rounded-full border-2 border-theme-card ${
                                block.type === 'break' ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`} />

                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold flex items-center gap-1.5 text-theme-primary">
                                  {block.type === 'break' ? '☕' : '🎯'}
                                  {block.title}
                                </p>
                                <span className="font-mono text-[9px] text-theme-muted uppercase tracking-wider bg-theme-bg px-2 py-0.5 rounded border border-theme-border">
                                  {block.timeSlot}
                                </span>
                              </div>
                              
                              {/* Optimization reasons explanation list */}
                              {block.reasons && block.reasons.length > 0 && (
                                <div className="mt-2 pl-3 border-l-2 border-indigo-500/20 space-y-1">
                                  <p className="text-[9px] font-black text-theme-muted uppercase tracking-wider font-mono">Optimization Reasons</p>
                                  {block.reasons.map((reasonStr: string, rIdx: number) => (
                                    <p key={rIdx} className="text-[10px] text-theme-secondary flex items-start gap-1">
                                      <span className="text-indigo-500 font-extrabold">•</span>
                                      <span>{reasonStr}</span>
                                    </p>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Explicitly Moved tasks list */}
                      {optimizedPlan.appliedChanges.length > 0 && (
                        <div className="space-y-2 mt-4 pt-4 border-t border-theme-border">
                          <h4 className="text-xs font-bold text-theme-primary flex items-center gap-1">
                            <ArrowRightLeft className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>Postponed / Deallocated Task Vectors (Tomorrow)</span>
                          </h4>
                          <div className="space-y-2">
                            {optimizedPlan.appliedChanges.map((change) => (
                              <div key={change.taskId} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs space-y-2">
                                <div className="flex justify-between items-center">
                                  <p className="font-bold text-theme-primary">{change.title}</p>
                                  <span className="text-[9px] font-mono text-amber-500 uppercase font-extrabold bg-amber-500/10 px-1.5 py-0.5 rounded">
                                    Deferred
                                  </span>
                                </div>
                                <p className="text-[10px] text-theme-secondary leading-relaxed italic">
                                  "{change.reason}"
                                </p>

                                {/* Deferral explanations */}
                                {change.reasons && change.reasons.length > 0 && (
                                  <div className="pl-3 border-l-2 border-amber-500/25 space-y-1">
                                    <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono">Deferral Reasons</p>
                                    {change.reasons.map((reasonStr: string, rIdx: number) => (
                                      <p key={rIdx} className="text-[10px] text-theme-secondary flex items-start gap-1">
                                        <span className="text-amber-500 font-extrabold">•</span>
                                        <span>{reasonStr}</span>
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 4. PREMIUM GUARDIAN APPLY STEPS ANIMATION OVERLAY */}
            {isApplying && (
              <motion.div
                key="applying-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center flex-1 relative overflow-hidden"
              >
                <div className="absolute w-80 h-80 rounded-full border border-indigo-500/10 animate-ping -z-10" />
                <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-full animate-bounce mb-6">
                  <ShieldCheck className="w-10 h-10 text-indigo-400" />
                </div>

                <h3 className="text-base font-extrabold text-white tracking-wide font-sans">
                  Guardian Applying Recovery Plan...
                </h3>
                <p className="text-xs text-indigo-300 font-mono mt-1">
                  Synchronizing high-priority active schedules across components and Firestore...
                </p>

                <div className="mt-8 space-y-3 w-full max-w-sm">
                  {applySteps.map((stepText, idx) => {
                    const isCompleted = idx < applyingStep;
                    const isCurrent = idx === applyingStep;
                    return (
                      <div key={idx} className="flex items-center justify-between text-left">
                        <span className={`text-[11px] font-mono transition-all ${
                          isCompleted 
                            ? 'text-emerald-400 line-through font-medium opacity-80' 
                            : isCurrent 
                              ? 'text-indigo-300 font-black animate-pulse' 
                              : 'text-slate-600'
                        }`}>
                          {isCompleted ? `✓ ${stepText}` : stepText}
                        </span>
                        <span>
                          {isCompleted ? (
                            <span className="text-emerald-400 text-[10px] font-bold">✓ Complete</span>
                          ) : isCurrent ? (
                            <span className="text-indigo-400 text-[10px] font-mono animate-pulse">Running...</span>
                          ) : (
                            <span className="text-slate-700 text-[10px]">Pending</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Success Toast Popup */}
      <AnimatePresence>
        {successToast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/30 text-white rounded-2xl p-4 shadow-2xl max-w-sm flex gap-3.5"
          >
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0 h-min mt-0.5">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 font-sans">
                {successToast.title}
              </h4>
              <p className="text-[11px] font-semibold text-slate-100 leading-relaxed">
                {successToast.message}
              </p>
              <p className="text-[9px] font-mono text-slate-400 leading-relaxed">
                Calendar, Dashboard, Timeline, Analytics and Firestore are now synchronized.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
