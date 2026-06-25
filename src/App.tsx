import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, LayoutDashboard, ListTodo, Calendar as CalendarIcon, 
  Sparkles, LineChart, Settings as SettingsIcon, LogOut, Sun, Moon, Sparkle
} from 'lucide-react';

import { Task, Message, Activity, UserProfile } from './types';
import { 
  INITIAL_TASKS, INITIAL_ACTIVITIES, INITIAL_CHAT_MESSAGES, 
  INITIAL_PROFILE, getRelativeDate 
} from './utils/mockData';

// Screens
import Splash from './components/Splash';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import AIAssistant from './components/AIAssistant';
import Analytics from './components/Analytics';
import Settings from './components/Settings';

export default function App() {
  // 1. Initial Core States
  const [isSplashComplete, setIsSplashComplete] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 2. Data State
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [messages, setMessages] = useState<Message[]>(INITIAL_CHAT_MESSAGES);

  // Trigger modal in Task component if direct task request from AI or Quick Actions
  const [triggerAddTaskModal, setTriggerAddTaskModal] = useState(false);

  // 3. Theme Synchronization Hook
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

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
  const handleAddTask = (newTaskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: `task-${Date.now()}`,
    };
    setTasks(prev => [newTask, ...prev]);
    addActivityLog('create', `Created task "${newTask.title}"`);
    
    // Update profile complete ratios if needed
    if (newTask.status === 'completed') {
      setProfile(prev => ({ ...prev, completedCount: prev.completedCount + 1 }));
    }
  };

  const handleEditTask = (id: string, updatedFields: Partial<Task>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        // Track complete transitions to log
        if (updatedFields.status === 'completed' && task.status !== 'completed') {
          addActivityLog('complete', `Completed task "${task.title || updatedFields.title}"`);
          setProfile(p => ({ ...p, completedCount: p.completedCount + 1 }));
        } else if (updatedFields.status && updatedFields.status !== 'completed' && task.status === 'completed') {
          setProfile(p => ({ ...p, completedCount: Math.max(0, p.completedCount - 1) }));
        } else {
          addActivityLog('edit', `Updated parameters for "${task.title}"`);
        }
        return { ...task, ...updatedFields };
      }
      return task;
    }));
  };

  const handleDeleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete) {
      setTasks(prev => prev.filter(t => t.id !== id));
      addActivityLog('delete', `Removed task "${taskToDelete.title}"`);
      if (taskToDelete.status === 'completed') {
        setProfile(p => ({ ...p, completedCount: Math.max(0, p.completedCount - 1) }));
      }
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
  const handleAddTaskDirectly = (newTaskData: Omit<Task, 'id'>) => {
    handleAddTask(newTaskData);
    setActiveTab('tasks');
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
  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updated }));
    addActivityLog('edit', 'Updated security user profile settings');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveTab('dashboard');
    addActivityLog('edit', 'Logged out user session');
  };

  // 8. Navigation configuration
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Workspace', icon: ListTodo },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
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
        return <Analytics tasks={tasks} isDark={isDarkMode} />;
      case 'settings':
        return (
          <Settings
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            activities={activities}
            isDark={isDarkMode}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            onLogout={handleLogout}
          />
        );
      default:
        return <div>Screen not found</div>;
    }
  };

  // RENDER SEQUENCES
  if (!isSplashComplete) {
    return <Splash onComplete={() => setIsSplashComplete(true)} />;
  }

  if (!isLoggedIn) {
    return <Login onLogin={(user) => { setProfile(user); setIsLoggedIn(true); }} isDark={isDarkMode} />;
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
            onClick={() => setIsDarkMode(!isDarkMode)}
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
          {renderActiveScreen()}
        </div>
      </main>

    </div>
  );
}
