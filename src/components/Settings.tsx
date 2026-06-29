import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, Sun, Moon, Bell, Info, ShieldAlert, Check, 
  RefreshCw, LogOut, Shield, Award, Mail, Briefcase, Activity as ActivityIcon, Brain
} from 'lucide-react';
import { UserProfile, Activity } from '../types';

interface SettingsProps {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  activities: Activity[];
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  focusReminderMode: 'silent' | 'gentle' | 'bell' | 'voice';
  onUpdateFocusReminderMode: (mode: 'silent' | 'gentle' | 'bell' | 'voice') => void;
}

export default function Settings({
  profile,
  onUpdateProfile,
  activities,
  isDark,
  onToggleTheme,
  onLogout,
  focusReminderMode,
  onUpdateFocusReminderMode
}: SettingsProps) {
  // Local profile states
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [role, setRole] = useState(profile.role);
  const [goal, setGoal] = useState(profile.weeklyGoal);
  const [savedStatus, setSavedStatus] = useState(false);

  // Notifications toggles
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [aiDigest, setAiDigest] = useState(true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      email,
      role,
      weeklyGoal: parseInt(goal as any) || 10,
    });
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 2000);
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'complete': return 'bg-emerald-500 text-white';
      case 'create': return 'bg-indigo-500 text-white';
      case 'ai_chat': return 'bg-violet-500 text-white';
      case 'rescue': return 'bg-amber-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-theme-primary">Preferences & Settings</h1>
        <p className="text-sm text-theme-secondary mt-1">
          Configure visual parameters, update credentials, and verify operational timeline logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column (8 cols): Profile & Notification Settings */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Theme & Visual Switcher Card */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-theme-primary mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500 dark:hidden" />
              <Moon className="w-5 h-5 text-indigo-400 hidden dark:block" />
              <span>Theme Appearance</span>
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-theme-primary">
                  {isDark ? 'Dark Mode Active' : 'Light Mode Active'}
                </p>
                <p className="text-xs text-theme-muted mt-0.5">Toggle default dashboard colors to match focus conditions.</p>
              </div>

              {/* Slider switch button */}
              <button
                onClick={onToggleTheme}
                className="relative inline-flex h-7 w-12 items-center rounded-full bg-slate-200 dark:bg-indigo-600 transition-colors cursor-pointer focus:outline-none"
              >
                <span className="sr-only">Toggle theme</span>
                <span
                  className={`${
                    isDark ? 'translate-x-6 bg-white' : 'translate-x-1 bg-white'
                  } inline-block h-5 w-5 transform rounded-full shadow-md transition-transform duration-200`}
                />
              </button>
            </div>
          </div>

          {/* Focus Recovery Assistant Settings Card */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-theme-primary mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              <span>Focus Recovery Assistant</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-2.5">
                  Focus Reminder Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['silent', 'gentle', 'bell', 'voice'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onUpdateFocusReminderMode(mode)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-center capitalize transition-all cursor-pointer ${
                        focusReminderMode === mode
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/15'
                          : 'bg-theme-bg border-theme-border text-theme-secondary hover:text-theme-primary hover:border-indigo-500/30'
                      }`}
                    >
                      {mode === 'silent' && '🔇 Silent'}
                      {mode === 'gentle' && '🎵 Gentle Bell'}
                      {mode === 'bell' && '🔔 Loud Bell'}
                      {mode === 'voice' && '🗣 Voice'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-theme-muted mt-2.5 leading-relaxed">
                  Controls the sound cue triggered when returning from an away interruption. Voice reminders utilize standard local Speech Synthesis.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Modification Form Card */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-theme-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" />
              <span>Security Profile</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                    User Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-theme-bg border-theme-border text-theme-primary placeholder-theme-muted"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                    User Contact Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-theme-bg border-theme-border text-theme-primary placeholder-theme-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                    Job Role / Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                    <input
                      type="text"
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-theme-bg border-theme-border text-theme-primary placeholder-theme-muted"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                    Weekly Completion Goal (Tasks)
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value as any)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-theme-bg border-theme-border text-theme-primary placeholder-theme-muted"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-theme-border mt-4">
                <span className="text-xs text-theme-muted">Settings synchronized in-memory.</span>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {savedStatus ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Changes Saved</span>
                    </>
                  ) : (
                    <span>Save Profile Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Notifications Preferences */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-theme-primary mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-500" />
              <span>Deadline Alerts & Briefings</span>
            </h3>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushNotifs}
                  onChange={(e) => setPushNotifs(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                />
                <div>
                  <span className="text-sm font-semibold text-theme-primary">Push Deadline Reminders</span>
                  <p className="text-xs text-theme-muted mt-0.5">Push soundless desktop alerts 1 hour before a deadline threshold collapses.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                />
                <div>
                  <span className="text-sm font-semibold text-theme-primary">Weekly Email Performance Digests</span>
                  <p className="text-xs text-theme-muted mt-0.5">Receive a PDF summary mapping weekly velocity trends and pending roadmap targets.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aiDigest}
                  onChange={(e) => setAiDigest(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-500"
                />
                <div>
                  <span className="text-sm font-semibold text-theme-primary">AI Workspace Briefings</span>
                  <p className="text-xs text-theme-muted mt-0.5">Let the companion formulate a customized morning sprint plan inside the chatbot.</p>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right column (4 cols): User Profile Avatar Card & About Info & Activity logs */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Large user avatar display */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={profile.avatar}
                alt="Profile avatar"
                referrerPolicy="no-referrer"
                className="w-24 h-24 rounded-2xl object-cover border border-theme-border p-1.5 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 p-1 bg-indigo-500 text-white rounded-lg shadow-md">
                <Shield className="w-4 h-4" />
              </span>
            </div>

            <h3 className="font-extrabold text-lg text-theme-primary mt-4">{profile.name}</h3>
            <span className="text-xs font-mono font-semibold text-indigo-500 uppercase tracking-widest mt-1">{profile.role}</span>
            <p className="text-xs text-theme-muted mt-0.5 font-mono">{profile.email}</p>

            <button
              onClick={onLogout}
              className="mt-6 flex items-center justify-center gap-1.5 px-4 py-2 border border-rose-500/10 hover:bg-rose-500/10 text-rose-500 text-xs font-bold rounded-xl cursor-pointer transition-colors active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out Credentials</span>
            </button>
          </div>

          {/* Activity Timeline logs */}
          <div className="bg-theme-card border border-theme-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-theme-primary mb-4 flex items-center gap-2">
              <ActivityIcon className="w-4.5 h-4.5 text-indigo-500" />
              <span>Timeline Activity Logger</span>
            </h3>

            {activities.length === 0 ? (
              <p className="text-xs text-theme-muted">No action logs registered yet.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2.5 before:bottom-2.5 before:w-[1px] before:bg-theme-border">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-3 relative">
                    <span className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold z-10 ${getActivityColor(act.type)}`}>
                      {act.type[0].toUpperCase()}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-theme-primary leading-tight">
                        {act.content}
                      </p>
                      <span className="text-[9px] font-mono text-theme-muted mt-1 block">
                        {act.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* About Deadline Guardian AI */}
          <div className="bg-gradient-to-tr from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 rounded-2xl p-6 text-white shadow-lg shadow-indigo-950/20">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-300 mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              <span>Guardian Spec Core</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              **Deadline Guardian AI** is an advanced personal productivity system mapping priority vectors to defend against scheduled project delays.
            </p>
            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>Security Version</span>
              <span className="font-bold text-slate-300">v1.2.0-MVP</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
