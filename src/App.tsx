import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, LayoutDashboard, ListTodo, Calendar as CalendarIcon, 
  Sparkles, LineChart, Settings as SettingsIcon, LogOut, Sun, Moon, Sparkle, Award,
  ShieldAlert
} from 'lucide-react';

import { Task, Message, Activity, UserProfile, FocusSession, CalendarEvent } from './types';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  auth, 
  syncUserToFirestore, 
  logOutFromFirebase,
  getTasksFromFirestore,
  addTaskToFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  addFocusSessionToFirestore,
  getFocusSessionsFromFirestore,
  updateUserProfileInFirestore,
  saveRescuePlanToFirestore,
  getLatestRescuePlanFromFirestore,
  deleteRescuePlanFromFirestore,
  getCalendarEventsFromFirestore,
  db
} from './lib/firebase';

// Screens
import Splash from './components/Splash';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import AIAssistant from './components/AIAssistant';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import FocusSessionMode from './components/FocusSessionMode';
import GuardianRescue from './components/GuardianRescue';

export default function App() {
  // 1. Initial Core States
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('is_guest') === 'true';
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('themePreference');
    if (saved) {
      return saved === 'dark';
    }
    return false; // brand-new user: default to false (Light Mode)
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 2. Data State
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Guest User',
    email: 'guest@deadlineguardian.ai',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    role: 'Engineer',
    weeklyGoal: 10,
    completedCount: 0,
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Auth initialization and tasks loading state
  const [authInitializing, setAuthInitializing] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Trigger modal in Task component if direct task request from AI or Quick Actions
  const [triggerAddTaskModal, setTriggerAddTaskModal] = useState(false);

  // 6. Focus Session State
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [completedReport, setCompletedReport] = useState<FocusSession | null>(null);
  const [focusReminderMode, setFocusReminderMode] = useState<'silent' | 'gentle' | 'bell' | 'voice'>(() => {
    return (localStorage.getItem('focusReminderMode') as 'silent' | 'gentle' | 'bell' | 'voice') || 'gentle';
  });
  const [activeRescuePlan, setActiveRescuePlan] = useState<any | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const handleUpdateFocusReminderMode = (mode: 'silent' | 'gentle' | 'bell' | 'voice') => {
    setFocusReminderMode(mode);
    localStorage.setItem('focusReminderMode', mode);
  };

  // 3. Theme Synchronization Hook
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleToggleTheme = async () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    const themeVal = nextDark ? 'dark' : 'light';
    localStorage.setItem('themePreference', themeVal);
    
    // Update local profile state
    setProfile(prev => ({ ...prev, themePreference: themeVal }));
    
    // Update Firebase if logged in
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        await updateUserProfileInFirestore(firebaseUser.uid, { themePreference: themeVal });
      } catch (err) {
        console.error('[App Firestore Error] Failed to persist theme preference:', err);
      }
    }
  };

  // Keyboard shortcut listener for theme toggle (Ctrl + T)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleToggleTheme();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDarkMode]);

  // AI Welcome Message helper
  const getAIWelcomeMessage = (name: string): Message => ({
    id: `msg-welcome-${Date.now()}`,
    sender: 'ai',
    text: `Hello, ${name}! I'm your Deadline Guardian AI assistant. I can help you break down complex tasks, write schedule plans, prioritize your deadlines, or create structured items in your list. Try clicking a suggestion below or write a prompt!`,
    timestamp: new Date()
  });

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log(`[App Auth] Authenticated user detected: UID=${firebaseUser.uid}, Email=${firebaseUser.email}, Anonymous=${firebaseUser.isAnonymous}`);
        setTasksLoading(true);
        setError(null);
        try {
          // Synchronize user profile
          const syncedProfile = await syncUserToFirestore(firebaseUser);
          setProfile(syncedProfile);
          
          // Restore theme preference immediately
          if (syncedProfile.themePreference) {
            const isProfileDark = syncedProfile.themePreference === 'dark';
            setIsDarkMode(isProfileDark);
            localStorage.setItem('themePreference', syncedProfile.themePreference);
          } else {
            // Write local theme to new user if not set in cloud
            const localTheme = localStorage.getItem('themePreference') || 'light';
            await updateUserProfileInFirestore(firebaseUser.uid, { themePreference: localTheme as 'light' | 'dark' });
          }
          
          // Retrieve tasks directly from Firestore
          console.log(`[App Firestore Operation] READING tasks from Firestore for user ${firebaseUser.uid}...`);
          let dbTasks = await getTasksFromFirestore(firebaseUser.uid);
          console.log(`[App Firestore Operation] Successfully READ ${dbTasks.length} tasks from Firestore.`);
          
          setTasks(dbTasks);

          // Retrieve focus sessions directly from Firestore
          console.log(`[App Firestore Operation] READING focus sessions from Firestore for user ${firebaseUser.uid}...`);
          let dbSessions = await getFocusSessionsFromFirestore(firebaseUser.uid);
          console.log(`[App Firestore Operation] Successfully READ ${dbSessions.length} focus sessions from Firestore.`);
          setFocusSessions(dbSessions);

          // Retrieve active rescue plan directly from Firestore
          try {
            console.log(`[App Firestore Operation] READING rescue plan from Firestore for user ${firebaseUser.uid}...`);
            let latestPlan = await getLatestRescuePlanFromFirestore(firebaseUser.uid);
            if (latestPlan) {
              console.log("[App Firestore Operation] Successfully loaded active rescue plan.");
              setActiveRescuePlan(latestPlan);
            } else {
              setActiveRescuePlan(null);
            }
          } catch (planErr) {
            console.error("[App Firestore Operation] Failed to load latest rescue plan:", planErr);
            setActiveRescuePlan(null);
          }

          // Retrieve calendar events directly from Firestore
          try {
            console.log(`[App Firestore Operation] READING calendar events from Firestore for user ${firebaseUser.uid}...`);
            let dbEvents = await getCalendarEventsFromFirestore(firebaseUser.uid);
            console.log(`[App Firestore Operation] Successfully READ ${dbEvents.length} calendar events from Firestore.`);
            setCalendarEvents(dbEvents);
          } catch (calErr) {
            console.error("[App Firestore Operation] Failed to load calendar events:", calErr);
            setCalendarEvents([]);
          }

          setMessages([getAIWelcomeMessage(syncedProfile.name)]);
          setActivities([
            {
              id: `act-${Date.now()}`,
              type: 'ai_chat',
              content: `Synchronized session for ${syncedProfile.name}`,
              timestamp: 'Just now'
            }
          ]);
          setIsLoggedIn(true);
        } catch (err: any) {
          console.error("[App Firestore Error] Failed to sync authenticated user profile or tasks:", err);
          setError(`Cloud Firestore Integration Error: ${err.message || err.toString()}`);
          setIsLoggedIn(true);
        } finally {
          setTasksLoading(false);
        }
      } else {
        console.log('[App Auth] No authenticated user. Clearing local states.');
        setIsLoggedIn(false);
        setTasks([]);
        setActivities([]);
        setMessages([]);
        setFocusSessions([]);
      }
      setAuthInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  // 4. Activity Logger Helper
  const addActivityLog = (type: Activity['type'], content: string) => {
    const newLog: Activity = {
      id: `act-${Date.now()}`,
      type,
      content,
      timestamp: 'Just now',
    };
    setActivities(prev => [newLog, ...prev]);
  };

  // 5. CRUD Task Actions
  const handleAddTask = async (newTaskData: Omit<Task, 'id'>) => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      console.log("[App Firestore Operation] CREATING task in Firestore for user", firebaseUser.uid, newTaskData);
      try {
        const docId = await addTaskToFirestore(firebaseUser.uid, newTaskData);
        console.log(`[App Firestore Operation] Successfully CREATED task in Firestore with ID: ${docId}`);
        addActivityLog('create', `Created task "${newTaskData.title}"`);
        
        if (newTaskData.status === 'completed') {
          setProfile(prev => ({ ...prev, completedCount: prev.completedCount + 1 }));
        }

        // Fetch updated list from Firestore to update UI directly
        console.log("[App Firestore Operation] RE-READING tasks from Firestore after CREATE...");
        const dbTasks = await getTasksFromFirestore(firebaseUser.uid);
        setTasks(dbTasks);
      } catch (err: any) {
        console.error("[App Firestore Error] Failed to add task to Firestore:", err);
        setError(`Failed to save new task to Cloud Firestore: ${err.message || err.toString()}`);
      }
    } else {
      console.warn("[App Auth Warning] No authenticated user found when calling handleAddTask.");
      setError("No authenticated user found. Task cannot be created.");
    }
  };

  const handleEditTask = async (id: string, updatedFields: Partial<Task>) => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      console.log(`[App Firestore Operation] UPDATING task ${id} in Firestore for user ${firebaseUser.uid}:`, updatedFields);
      try {
        const currentTask = tasks.find(t => t.id === id);
        if (currentTask) {
          if (updatedFields.status === 'completed' && currentTask.status !== 'completed') {
            addActivityLog('complete', `Completed task "${currentTask.title || updatedFields.title}"`);
            setProfile(p => ({ ...p, completedCount: p.completedCount + 1 }));
          } else if (updatedFields.status && updatedFields.status !== 'completed' && currentTask.status === 'completed') {
            setProfile(p => ({ ...p, completedCount: Math.max(0, p.completedCount - 1) }));
          } else {
            addActivityLog('edit', `Updated parameters for "${currentTask.title}"`);
          }
        }

        await updateTaskInFirestore(firebaseUser.uid, id, updatedFields);
        console.log(`[App Firestore Operation] Successfully UPDATED task ${id} in Firestore.`);

        // Fetch updated list from Firestore to update UI directly
        console.log("[App Firestore Operation] RE-READING tasks from Firestore after UPDATE...");
        const dbTasks = await getTasksFromFirestore(firebaseUser.uid);
        setTasks(dbTasks);
      } catch (err: any) {
        console.error("[App Firestore Error] Failed to update task in Firestore:", err);
        setError(`Failed to update task in Cloud Firestore: ${err.message || err.toString()}`);
      }
    } else {
      console.warn("[App Auth Warning] No authenticated user found when calling handleEditTask.");
      setError("No authenticated user found. Task cannot be edited.");
    }
  };

  const handleDeleteTask = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete) {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        console.log(`[App Firestore Operation] DELETING task ${id} from Firestore for user ${firebaseUser.uid}`);
        try {
          await deleteTaskFromFirestore(firebaseUser.uid, id);
          console.log(`[App Firestore Operation] Successfully DELETED task ${id} from Firestore.`);
          addActivityLog('delete', `Removed task "${taskToDelete.title}"`);
          if (taskToDelete.status === 'completed') {
            setProfile(p => ({ ...p, completedCount: Math.max(0, p.completedCount - 1) }));
          }

          // Fetch updated list from Firestore to update UI directly
          console.log("[App Firestore Operation] RE-READING tasks from Firestore after DELETE...");
          const dbTasks = await getTasksFromFirestore(firebaseUser.uid);
          setTasks(dbTasks);
        } catch (err: any) {
          console.error("[App Firestore Error] Failed to delete task from Firestore:", err);
          setError(`Failed to delete task from Cloud Firestore: ${err.message || err.toString()}`);
        }
      } else {
        console.warn("[App Auth Warning] No authenticated user found when calling handleDeleteTask.");
        setError("No authenticated user found. Task cannot be deleted.");
      }
    }
  };

  const handleApplyRescuePlan = async (
    updatedTasks: Task[], 
    appliedChanges: any[], 
    metrics: any,
    optimizedSchedule: any[] = [],
    reasons: string[] = []
  ) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return;
    
    try {
      // 1. Snapshot original tasks list before plan
      const originalTasksSnapshot = [...tasks];
      
      // 2. Persist the plan metadata to Firestore
      const rescuePlanData = {
        id: `rescue-${Date.now()}`,
        originalTasks: originalTasksSnapshot,
        optimizedSchedule,
        appliedChanges,
        metrics,
        timestamp: new Date().toISOString(),
        isApplied: true,
        reasons
      };
      
      await saveRescuePlanToFirestore(firebaseUser.uid, rescuePlanData);
      setActiveRescuePlan(rescuePlanData);

      // 3. Apply changes (update deadlines of modified tasks) in Firestore
      for (const change of appliedChanges) {
        await updateTaskInFirestore(firebaseUser.uid, change.taskId, { deadline: change.newDeadline });
      }

      // 4. Fetch and update local tasks list
      const dbTasks = await getTasksFromFirestore(firebaseUser.uid);
      setTasks(dbTasks);

      // 5. Add custom activities logs
      addActivityLog('rescue', "Guardian detected overload");
      addActivityLog('rescue', "Recovery plan accepted");
      addActivityLog('rescue', "Tasks reordered");
      addActivityLog('rescue', "Focus blocks created");
      addActivityLog('rescue', "Calendar optimized");
    } catch (err: any) {
      console.error("Failed to apply Rescue Plan:", err);
      setError(`Failed to apply Rescue Plan: ${err.message || err.toString()}`);
      throw err;
    }
  };

  const handleUndoRescuePlan = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !activeRescuePlan) return;

    try {
      // 1. Restore each task's original deadline
      const originalTasks = activeRescuePlan.originalTasks as Task[];
      for (const originalTask of originalTasks) {
        const currentTask = tasks.find(t => t.id === originalTask.id);
        if (currentTask && currentTask.deadline !== originalTask.deadline) {
          await updateTaskInFirestore(firebaseUser.uid, originalTask.id, { deadline: originalTask.deadline });
        }
      }

      // 2. Mark historical plan as unapplied, then delete latest pointer from Firestore
      const planId = activeRescuePlan.id;
      if (planId && planId !== 'latest') {
        try {
          const planHistoryRef = doc(db, 'users', firebaseUser.uid, 'rescuePlans', planId);
          await updateDoc(planHistoryRef, { isApplied: false });
        } catch (dbErr) {
          console.warn("Failed to mark historical plan as isApplied=false, but proceeding:", dbErr);
        }
      }

      await deleteRescuePlanFromFirestore(firebaseUser.uid);
      setActiveRescuePlan(null);

      // 3. Fetch and update local tasks list
      const dbTasks = await getTasksFromFirestore(firebaseUser.uid);
      setTasks(dbTasks);

      addActivityLog('rescue', "Recovery plan rolled back");
      addActivityLog('rescue', "Original schedule restored");
    } catch (err: any) {
      console.error("Failed to undo Rescue Plan:", err);
      setError(`Failed to undo Rescue Plan: ${err.message || err.toString()}`);
      throw err;
    }
  };

  const handleToggleTaskStatus = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
      const nextProgress = nextStatus === 'completed' ? 100 : 0;
      handleEditTask(id, { status: nextStatus, progress: nextProgress });
    }
  };

  // Helper for direct proposal task additions from AI Assistant Card
  const [proposalAddTaskData, setProposalAddTaskData] = useState<Partial<Task> | null>(null);
  const handleAddTaskDirectly = (newTaskData: Omit<Task, 'id'>) => {
    handleAddTask(newTaskData);
    setActiveTab('tasks');
  };

  // 6. Focus Session Actions
  const handleStartFocusSession = (task: Task) => {
    console.log(`[App Focus] Initiating focus session for task ID: ${task.id}, title: "${task.title}"`);
    setActiveFocusTask(task);
  };

  const handleFinishFocusSession = async (sessionData: Omit<FocusSession, 'id'>) => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        console.log("[App Focus] Saving completed focus session to Cloud Firestore:", sessionData);
        const docId = await addFocusSessionToFirestore(firebaseUser.uid, sessionData);
        const fullSession: FocusSession = {
          ...sessionData,
          id: docId
        };
        setFocusSessions(prev => [fullSession, ...prev]);
        
        // Push focus activity log
        addActivityLog('focus', `Completed Focus Session for "${sessionData.taskTitle}" (${Math.round(sessionData.focusedTime / 60000)}m)`);
        
        setCompletedReport(fullSession);
      } catch (err: any) {
        console.error("[App Focus Error] Failed to write focus session to Firestore:", err);
        setError(`Failed to save Focus Session to Cloud Firestore: ${err.message || err.toString()}`);
      }
    } else {
      console.warn("[App Focus Warning] Guest completed a focus session. Logging session locally.");
      const guestSession: FocusSession = {
        ...sessionData,
        id: `guest-${Date.now()}`
      };
      setFocusSessions(prev => [guestSession, ...prev]);
      setCompletedReport(guestSession);
    }
    setActiveFocusTask(null);
  };

  // 6. Chat History Actions
  const handleSendMessage = (text: string | Message) => {
    if (typeof text === 'string') {
      // User message
      const userMsg: Message = {
        id: `user-msg-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg]);
      addActivityLog('ai_chat', `Asked AI: "${text.slice(0, 30)}..."`);
    } else {
      // AI response (fully constructed Message object from AIAssistant component)
      setMessages(prev => [...prev, text]);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        sender: 'ai',
        text: "System history purged. Let's outline a new roadmap! Ask me any scheduler or plan question.",
        timestamp: new Date(),
      }
    ]);
  };

  // 7. Profile Updates
  const handleUpdateProfile = async (updated: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updated }));
    addActivityLog('edit', 'Updated security user profile settings');
    
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      try {
        await updateUserProfileInFirestore(firebaseUser.uid, updated);
      } catch (err) {
        console.error('[App Firestore Error] Failed to update user profile:', err);
      }
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('is_guest');
    try {
      await logOutFromFirebase();
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setIsLoggedIn(false);
    setActiveTab('dashboard');
    addActivityLog('edit', 'Logged out user session');
  };

  // 8. Navigation configuration
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Workspace', icon: ListTodo },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'rescue', label: 'Guardian Rescue', icon: ShieldAlert },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  // RENDER APP SCREEN VIEWS
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            tasks={tasks}
            activities={activities}
            profile={profile}
            onNavigate={setActiveTab}
            onCreateTaskClick={() => {
              setTriggerAddTaskModal(true);
              setActiveTab('tasks');
            }}
            onToggleTaskStatus={handleToggleTaskStatus}
            isDark={isDarkMode}
            focusSessions={focusSessions}
            onStartFocusSession={handleStartFocusSession}
          />
        );
      case 'tasks':
        return (
          <Tasks
            tasks={tasks}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onToggleTaskStatus={handleToggleTaskStatus}
            isDark={isDarkMode}
            isAddModalOpenInitially={triggerAddTaskModal}
            onCloseAddModalInitially={() => setTriggerAddTaskModal(false)}
            onStartFocusSession={handleStartFocusSession}
          />
        );
      case 'calendar':
        return (
          <Calendar
            tasks={tasks}
            isDark={isDarkMode}
            onNavigateToTasks={() => setActiveTab('tasks')}
          />
        );
      case 'rescue':
        return (
          <GuardianRescue
            tasks={tasks}
            calendarEvents={calendarEvents}
            isDark={isDarkMode}
            onApplyPlan={handleApplyRescuePlan}
            onUndoPlan={handleUndoRescuePlan}
            activeRescuePlan={activeRescuePlan}
            addActivityLog={addActivityLog}
          />
        );
      case 'ai':
        return (
          <AIAssistant
            messages={messages}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
            onAddTaskDirectly={handleAddTaskDirectly}
            isDark={isDarkMode}
            tasks={tasks}
            profile={profile}
          />
        );
      case 'analytics':
        return <Analytics tasks={tasks} isDark={isDarkMode} focusSessions={focusSessions} />;
      case 'settings':
        return (
          <Settings
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            activities={activities}
            isDark={isDarkMode}
            onToggleTheme={handleToggleTheme}
            onLogout={handleLogout}
            focusReminderMode={focusReminderMode}
            onUpdateFocusReminderMode={handleUpdateFocusReminderMode}
          />
        );
      default:
        return <div>Screen not found</div>;
    }
  };

  // RENDER SEQUENCES
  if (!isSplashComplete || authInitializing) {
    return <Splash onComplete={() => setIsSplashComplete(true)} isDark={isDarkMode} />;
  }

  if (!isLoggedIn) {
    return (
      <Login 
        onLogin={(user) => { 
          setProfile(user); 
          setIsLoggedIn(true); 
        }} 
        isDark={isDarkMode} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row transition-colors duration-300 bg-theme-bg text-theme-primary">
      
      {/* 1. SIDEBAR NAVIGATION - DESKTOP ONLY */}
      <aside className="hidden md:flex flex-col justify-between w-64 border-r border-theme-border shrink-0 p-5 bg-theme-card/60 backdrop-blur-xl">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-2">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
              <Shield className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight leading-tight text-theme-primary">Deadline Guardian</span>
              <span className="text-[10px] font-mono text-indigo-500 font-bold tracking-widest uppercase">Guard Core AI</span>
            </div>
          </div>

          {/* User profile brief */}
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-theme-border bg-theme-bg/40">
            <img
              src={profile.avatar}
              alt="Avatar"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover shrink-0"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold truncate text-theme-primary">{profile.name}</h4>
              <p className="text-[10px] text-theme-secondary font-mono truncate">{profile.role}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer active:scale-98 transition-all relative ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                      : 'text-theme-secondary hover:text-theme-primary hover:bg-theme-bg'
                  }`}
                >
                  <IconComponent className="w-4.5 h-4.5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom actions in Sidebar */}
        <div className="space-y-4 pt-4 border-t border-theme-border">
          {/* Quick theme toggler in sidebar */}
          <button
            onClick={handleToggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors hover:bg-theme-bg text-theme-secondary hover:text-theme-primary"
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{isDarkMode ? 'Twilight Mode' : 'Daylight Mode'}</span>
            </div>
            <span className="text-[9px] font-mono font-bold bg-theme-bg border border-theme-border px-1.5 py-0.5 rounded text-theme-muted">
              Ctrl+T
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
            <span>Log out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. FLOATING BOTTOM NAVIGATION - MOBILE ONLY */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 z-40 flex items-center justify-around p-2.5 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all bg-theme-card/95 border-theme-border text-theme-primary">
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative cursor-pointer ${
                isActive 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-theme-secondary'
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="text-[9px] font-bold mt-1 font-sans">{item.label.split(' ')[0]}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -bottom-1 w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* 3. MAIN WORKSPACE VIEWPORT */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 md:pb-8 pb-24">
        {/* Render Active Dashboard Screen */}
        <div className="max-w-6xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-medium flex items-center justify-between shadow-sm animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold ml-4 text-sm shrink-0">✕</button>
            </div>
          )}
          {tasksLoading && (
            <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-500 font-medium flex items-center gap-3 shadow-sm">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Updating workspace and syncing live parameters with Cloud Firestore...</span>
            </div>
          )}
          {renderActiveScreen()}
        </div>
      </main>

      {/* 4. IMMERSIVE FOCUS SESSION MODE OVERLAY */}
      {activeFocusTask && (
        <FocusSessionMode
          task={activeFocusTask}
          onFinishSession={handleFinishFocusSession}
          onCancelSession={() => setActiveFocusTask(null)}
          focusReminderMode={focusReminderMode}
        />
      )}

      {/* 5. PREMIUM COMPLETED FOCUS REPORT MODAL */}
      <AnimatePresence>
        {completedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-theme-card border border-theme-border rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-full flex items-center justify-center mx-auto border border-indigo-500/15">
                  <Award className="w-7 h-7 animate-pulse" />
                </div>
                
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-500 uppercase">Focus Shield Completed</span>
                  <h3 className="text-lg font-black text-theme-primary mt-1">Focus Session Secured</h3>
                  <p className="text-xs text-theme-secondary mt-1">
                    Task: <strong>{completedReport.taskTitle}</strong>
                  </p>
                </div>

                <div className="border-t border-b border-theme-border py-4 my-2 grid grid-cols-2 gap-3">
                  <div className="text-left p-2.5 rounded-xl bg-theme-bg border border-theme-border">
                    <span className="text-[9px] font-mono text-theme-muted uppercase font-bold">Focused Time</span>
                    <span className="text-sm font-extrabold text-theme-primary block mt-0.5">
                      {Math.floor(completedReport.focusedTime / 60000)}m {Math.floor((completedReport.focusedTime % 60000) / 1000)}s
                    </span>
                  </div>

                  <div className="text-left p-2.5 rounded-xl bg-theme-bg border border-theme-border">
                    <span className="text-[9px] font-mono text-theme-muted uppercase font-bold">Efficiency</span>
                    <span className="text-sm font-extrabold text-theme-primary block mt-0.5">
                      {completedReport.focusEfficiency}%
                    </span>
                  </div>

                  <div className="text-left p-2.5 rounded-xl bg-theme-bg border border-theme-border">
                    <span className="text-[9px] font-mono text-theme-muted uppercase font-bold">Interruptions</span>
                    <span className="text-sm font-extrabold text-theme-primary block mt-0.5">
                      {completedReport.interruptionCount} times
                    </span>
                  </div>

                  <div className="text-left p-2.5 rounded-xl bg-theme-bg border border-theme-border">
                    <span className="text-[9px] font-mono text-theme-muted uppercase font-bold">Total Paused</span>
                    <span className="text-sm font-extrabold text-theme-primary block mt-0.5">
                      {Math.floor(completedReport.totalInterruptedTime / 60000)}m {Math.floor((completedReport.totalInterruptedTime % 60000) / 1000)}s
                    </span>
                  </div>
                </div>

                {/* Efficiency helpful message */}
                <p className="text-xs text-theme-secondary italic leading-relaxed px-1">
                  {completedReport.focusEfficiency >= 90 
                    ? "Perfect focus! Your mind was completely shielded against external distractions."
                    : completedReport.focusEfficiency >= 70
                    ? "Excellent focus shielding! You navigated distractions with high efficiency."
                    : "Low efficiency. Prioritize keeping your browser tab focused to avoid interruption."}
                </p>

                <button
                  onClick={() => setCompletedReport(null)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md cursor-pointer transition-colors"
                >
                  Acknowledge Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
