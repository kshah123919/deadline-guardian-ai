import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, Timer, CheckCircle2, AlertTriangle, 
  Play, Square, Sparkles, ShieldCheck, Activity, X, Award, EyeOff, Volume2
} from 'lucide-react';
import { Task, FocusSession, FocusInterruption } from '../types';
import { playReminderSound } from '../utils/audio';

interface FocusSessionModeProps {
  task: Task;
  onFinishSession: (sessionData: Omit<FocusSession, 'id'>) => void;
  onCancelSession: () => void;
  focusReminderMode?: 'silent' | 'gentle' | 'bell' | 'voice';
}

export default function FocusSessionMode({ 
  task, 
  onFinishSession, 
  onCancelSession,
  focusReminderMode = 'gentle'
}: FocusSessionModeProps) {
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [interruptions, setInterruptions] = useState<FocusInterruption[]>([]);
  const [isInterrupted, setIsInterrupted] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  
  // Focus Recovery States
  const [pendingInterruption, setPendingInterruption] = useState<FocusInterruption | null>(null);
  const [showMotivational, setShowMotivational] = useState<boolean>(false);
  const [showRecoveryCard, setShowRecoveryCard] = useState<boolean>(false);
  const [socialGamingCount, setSocialGamingCount] = useState<number>(0);
  const [showBreakTimer, setShowBreakTimer] = useState<boolean>(false);
  const [breakSeconds, setBreakSeconds] = useState<number>(600); // 10 minutes (600 seconds)

  // Keep track of current interruption state
  const activeInterruptionRef = useRef<{ startTime: number; eventType: 'visibilitychange' | 'blur' } | null>(null);

  // Focus Timer ticks every 100ms for responsiveness
  useEffect(() => {
    const interval = setInterval(() => {
      // Timer should only tick if we are NOT interrupted and NOT in a break timer
      if (!isInterrupted && !showBreakTimer && !pendingInterruption && !showRecoveryCard && !showMotivational) {
        setElapsedMs(Date.now() - startTime - getTotalInterruptionDuration(interruptions));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, isInterrupted, interruptions, showBreakTimer, pendingInterruption, showRecoveryCard, showMotivational]);

  // Keep track of the current reminder mode so callbacks inside useEffect can see the latest value
  const focusReminderModeRef = useRef(focusReminderMode);
  useEffect(() => {
    focusReminderModeRef.current = focusReminderMode;
  }, [focusReminderMode]);

  // Keep track of the current elapsed ms so callbacks inside useEffect can see the latest value
  const elapsedMsRef = useRef(elapsedMs);
  useEffect(() => {
    elapsedMsRef.current = elapsedMs;
  }, [elapsedMs]);

  // Interruption detection triggers
  useEffect(() => {
    const handleInterruptionStart = (eventType: 'visibilitychange' | 'blur') => {
      // Avoid starting a new interruption if we are currently classifying or in a modal/break
      if (activeInterruptionRef.current || pendingInterruption || showBreakTimer || showRecoveryCard || showMotivational) {
        return;
      }
      activeInterruptionRef.current = {
        startTime: Date.now(),
        eventType
      };
      setIsInterrupted(true);
      console.log(`[Focus UI] Interruption started via event: ${eventType}`);
    };

    const handleInterruptionEnd = () => {
      const active = activeInterruptionRef.current;
      if (active) {
        const returnTime = Date.now();
        const duration = returnTime - active.startTime;

        if (duration > 500) { // filter micro-blur glitches
          const newInterruption: FocusInterruption = {
            startTime: active.startTime,
            returnTime,
            duration,
            eventType: active.eventType
          };

          // If away for > 30 seconds (30,000 ms), trigger the classification flow!
          if (duration > 30000) {
            setPendingInterruption(newInterruption);
            // Play notification/alert sound depending on settings
            playReminderSound(focusReminderModeRef.current, {
              taskName: task.title,
              isCompleted: task.status === 'completed',
              elapsedMs: elapsedMsRef.current,
              awayMs: duration,
              estimatedDuration: task.estimatedDuration
            });
          } else {
            // Small interruption: just save and continue
            setInterruptions(prev => [...prev, newInterruption]);
            setIsInterrupted(false);
          }
        } else {
          // Micro-blur: resolve and continue
          setIsInterrupted(false);
        }
        activeInterruptionRef.current = null;
        console.log(`[Focus UI] Interruption resolved. Duration: ${duration}ms`);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleInterruptionStart('visibilitychange');
      } else {
        handleInterruptionEnd();
      }
    };

    const onBlur = () => {
      handleInterruptionStart('blur');
    };

    const onFocus = () => {
      handleInterruptionEnd();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, [pendingInterruption, showBreakTimer, showRecoveryCard, showMotivational]);

  // Browser navigation block dialog
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Focus Session is active! Exiting will lose progress.';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Break countdown timer handler
  useEffect(() => {
    if (!showBreakTimer) return;
    const timer = setInterval(() => {
      setBreakSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowBreakTimer(false);
          setIsInterrupted(false); // Resume focus
          return 600;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showBreakTimer]);

  const getTotalInterruptionDuration = (list: FocusInterruption[]) => {
    return list.reduce((sum, item) => sum + item.duration, 0);
  };

  const handleSelectCategory = (optionId: string) => {
    if (!pendingInterruption) return;

    const classified: FocusInterruption = {
      ...pendingInterruption,
      category: optionId
    };

    setInterruptions(prev => {
      const updated = [...prev, classified];
      const isDistraction = optionId === 'entertainment' || optionId === 'gaming';
      
      if (isDistraction) {
        setSocialGamingCount(c => {
          const newCount = c + 1;
          if (newCount >= 3) {
            setShowRecoveryCard(true);
          } else {
            setShowMotivational(true);
          }
          return newCount;
        });
      } else {
        setIsInterrupted(false); // Resume focus
      }
      return updated;
    });

    setPendingInterruption(null);
  };

  const handleContinueFocus = () => {
    setShowRecoveryCard(false);
    setSocialGamingCount(0); // Reset the distraction counter
    setIsInterrupted(false); // Resume focus
  };

  const handleTakeBreak = () => {
    setShowRecoveryCard(false);
    setSocialGamingCount(0); // Reset counter
    setBreakSeconds(600); // 10 minutes
    setShowBreakTimer(true);
  };

  const handleEndSession = () => {
    setShowRecoveryCard(false);
    handleFinish();
  };

  const handleFinish = () => {
    // Resolve any pending/current interruption before calculations
    let finalInterruptions = [...interruptions];
    if (activeInterruptionRef.current) {
      const returnTime = Date.now();
      const duration = returnTime - activeInterruptionRef.current.startTime;
      if (duration > 500) {
        finalInterruptions.push({
          startTime: activeInterruptionRef.current.startTime,
          returnTime,
          duration,
          eventType: activeInterruptionRef.current.eventType,
          category: 'skip' // Default classification if unfinished
        });
      }
    }

    const endTime = Date.now();
    const totalInterruptedTime = finalInterruptions.reduce((sum, item) => sum + item.duration, 0);
    const focusedTime = Math.max(0, (endTime - startTime) - totalInterruptedTime);
    const longestInterruption = finalInterruptions.length > 0
      ? Math.max(...finalInterruptions.map(item => item.duration))
      : 0;
    
    const focusEfficiency = endTime - startTime > 0
      ? Math.round((focusedTime / (endTime - startTime)) * 100)
      : 100;

    onFinishSession({
      taskId: task.id,
      taskTitle: task.title,
      startTime,
      endTime,
      focusedTime,
      interruptionCount: finalInterruptions.length,
      totalInterruptedTime,
      longestInterruption,
      focusEfficiency,
      interruptions: finalInterruptions
    });
  };

  const formatTimer = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const formatBreakTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-y-auto">
      {/* Background ambient aesthetic light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Immersive distraction-free layout */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-between relative z-10 min-h-screen">
        
        {/* Top Header Section */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/10">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest font-black text-indigo-400 block">System Shield Mode</span>
              <h2 className="text-base font-bold text-slate-200 mt-0.5">Focus Session Active</h2>
            </div>
          </div>

          <button
            onClick={() => setShowCancelConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs font-mono font-bold text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Abort Session</span>
          </button>
        </div>

        {/* Core Focusing Workspace (Middle) */}
        <div className="my-12 flex flex-col items-center text-center space-y-8">
          
          {/* Animated Stopwatch Indicator */}
          <div className="relative flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full blur-[40px] transition-all duration-700 ${
              isInterrupted ? 'bg-amber-500/10' : 'bg-indigo-500/15 scale-110'
            }`} />
            
            <div className={`w-64 h-64 rounded-full border-4 flex flex-col items-center justify-center relative transition-all duration-700 bg-slate-900/40 backdrop-blur-md ${
              isInterrupted ? 'border-amber-500/40 scale-95' : 'border-indigo-500/40'
            }`}>
              {/* Dynamic status helper */}
              <span className="text-[10px] font-mono uppercase tracking-widest font-black text-slate-500">
                {isInterrupted ? 'Shield Breached' : 'Shield Locked'}
              </span>
              
              {/* Large elapsed timer */}
              <span className="text-5xl font-black font-mono tracking-tight text-slate-100 mt-2">
                {formatTimer(elapsedMs)}
              </span>

              {/* Mini detail label */}
              <span className="text-[10px] text-slate-400 font-medium font-sans mt-3 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-indigo-400" />
                Focused duration
              </span>
            </div>
          </div>

          {/* Current Task Panel */}
          <div className="max-w-md w-full bg-slate-900/30 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full font-extrabold">
              {task.category}
            </span>
            <h3 className="text-lg font-bold text-slate-100 mt-4 leading-snug">{task.title}</h3>
            {task.description && (
              <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">{task.description}</p>
            )}
          </div>

          {/* Interruption warning layout */}
          <AnimatePresence>
            {isInterrupted && !pendingInterruption && !showRecoveryCard && !showBreakTimer && !showMotivational && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="max-w-md w-full p-4.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3.5 text-left text-amber-300"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="text-sm font-bold font-sans">Shield Warning: Interruption Detected</h4>
                  <p className="text-xs text-amber-300/80 mt-1 leading-relaxed">
                    Browser tab hidden or window focus lost. Focus timer is paused. Return to this screen immediately to re-engage the shield.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Bottom Actions Row */}
        <div className="border-t border-slate-900 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Interruptions: <strong className="text-slate-200">{interruptions.length}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-amber-500" />
              <span>Interrupted: <strong className="text-slate-200">{formatTimer(getTotalInterruptionDuration(interruptions))}</strong></span>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-xl shadow-indigo-600/10 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4.5 h-4.5" />
            <span>Finish Focus Session</span>
          </button>
        </div>

      </div>

      {/* Confirmation Modals & Focus Recovery Overlays */}
      <AnimatePresence>
        {/* Cancel Confirmation */}
        {showCancelConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-100">Abort Focus Session?</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Are you absolutely sure you want to exit? Your focus duration for this session will not be recorded in your dashboard analytics.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer transition-colors"
                >
                  Continue Focusing
                </button>
                <button
                  onClick={onCancelSession}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white cursor-pointer transition-colors"
                >
                  Abort & Discard
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 1. AWAY CLASSIFICATION MODAL */}
        {pendingInterruption && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6.5 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-indigo-600" />
              
              <div className="text-center space-y-2 mb-6">
                <span className="text-[10px] font-mono uppercase tracking-widest font-black text-amber-500">Focus Recovery Shield</span>
                <h3 className="text-xl font-extrabold text-slate-100">"What were you doing?"</h3>
                <p className="text-xs text-slate-400">
                  Accountability recovery active. Your away duration was{' '}
                  <span className="text-amber-400 font-bold font-mono">
                    {formatTimer(pendingInterruption.duration)}
                  </span>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                {[
                  { label: '📚 Learning / Watching Tutorial', id: 'learning' },
                  { label: '💻 Coding (VS Code / IDE)', id: 'coding' },
                  { label: '📖 Reading Documentation', id: 'reading' },
                  { label: '📞 Meeting / Call', id: 'meeting' },
                  { label: '☕ Break', id: 'break' },
                  { label: '🍽 Lunch', id: 'lunch' },
                  { label: '📱 Social Media / Entertainment', id: 'entertainment' },
                  { label: '🎮 Gaming', id: 'gaming' },
                  { label: '❌ Skip', id: 'skip' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelectCategory(option.id)}
                    className="flex items-center justify-between px-4.5 py-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 hover:bg-indigo-600/15 hover:border-indigo-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer text-left active:scale-[0.98]"
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* 2. FRIENDLY MOTIVATIONAL OVERLAY */}
        {showMotivational && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6.5 text-center space-y-5 shadow-2xl relative"
            >
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                <Sparkles className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-100">Defend Your Deadline</h3>
                <p className="text-sm text-indigo-300 font-medium leading-relaxed">
                  "Your deadline is getting closer. Let's get back to work and finish today's mission."
                </p>
                <p className="text-xs text-slate-400">
                  You can do this. Lock in and block distractions.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMotivational(false);
                  setIsInterrupted(false); // Resume focus
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15 cursor-pointer transition-colors active:scale-95"
              >
                Locked In. Back to Work!
              </button>
            </motion.div>
          </div>
        )}

        {/* 3. ESCALATION RECOVERY CARD */}
        {showRecoveryCard && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-7 text-center space-y-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500" />
              
              <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
                <AlertTriangle className="w-7 h-7 animate-bounce" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-black text-rose-500">Security Escalation Level 3</span>
                <h3 className="text-lg font-extrabold text-slate-100">Critical Distraction Alert</h3>
                
                {(() => {
                  const totalAwayMs = interruptions.reduce((sum, item) => sum + item.duration, 0);
                  const totalAwayMins = Math.round(totalAwayMs / 60000) || 1;
                  return (
                    <p className="text-sm text-slate-300 leading-relaxed">
                      You've been away for <span className="font-bold text-rose-400">{totalAwayMins} minutes</span>.<br />
                      Estimated deadline risk has increased.
                    </p>
                  );
                })()}
                
                <p className="text-xs text-slate-400">
                  Would you like to restart your focus session, take a break, or continue focusing?
                </p>
              </div>
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleContinueFocus}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15 cursor-pointer transition-colors active:scale-95"
                >
                  Continue Focus
                </button>
                <button
                  onClick={handleTakeBreak}
                  className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 cursor-pointer transition-colors active:scale-95"
                >
                  Take a 10-minute Break
                </button>
                <button
                  onClick={handleEndSession}
                  className="w-full py-3 bg-rose-950/40 hover:bg-rose-950/60 text-rose-400 rounded-xl text-xs font-bold border border-rose-500/20 cursor-pointer transition-colors active:scale-95"
                >
                  End Session
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 4. 10-MINUTE BREAK TIMER OVERLAY */}
        {showBreakTimer && (
          <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans select-none overflow-y-auto">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-md w-full text-center space-y-8 z-10 animate-fade-in"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest font-black text-emerald-400">Recharge Active</span>
                <h3 className="text-2xl font-black text-slate-100">Take a Deep Breath</h3>
                <p className="text-xs text-slate-400">
                  Step away from all screens, rest your eyes, and stretch.
                </p>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full blur-[40px] bg-emerald-500/10 scale-110" />
                <div className="w-56 h-56 rounded-full border-4 border-emerald-500/30 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md">
                  <span className="text-4xl font-black font-mono tracking-tight text-slate-100">
                    {formatBreakTime(breakSeconds)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-2 uppercase tracking-wider">Break Timer</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowBreakTimer(false);
                  setIsInterrupted(false); // Resume focus
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/15 cursor-pointer transition-colors active:scale-95"
              >
                Skip Break & Resume Focus
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
