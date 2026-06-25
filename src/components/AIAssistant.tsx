import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Send, Bot, User, Trash2, ArrowRight, CornerDownLeft, 
  Plus, Check, Clock, Calendar, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { Message, Task } from '../types';
import { SUGGESTED_PROMPTS, INITIAL_CHAT_MESSAGES } from '../utils/mockData';

interface AIAssistantProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  onAddTaskDirectly: (task: Omit<Task, 'id'>) => void;
  isDark: boolean;
}

export default function AIAssistant({
  messages,
  onSendMessage,
  onClearHistory,
  onAddTaskDirectly,
  isDark
}: AIAssistantProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat logs
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input;
    setInput('');
    onSendMessage(userText);

    // Simulate AI response delay
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      generateAIResponse(userText);
    }, 1500);
  };

  const handlePromptClick = (prompt: string) => {
    if (isTyping) return;
    onSendMessage(prompt);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      generateAIResponse(prompt);
    }, 1500);
  };

  // Local rule-based NLP simulator to provide super premium responses
  const generateAIResponse = (prompt: string) => {
    const text = prompt.toLowerCase();
    let reply = '';
    let actionPayload: any = null;

    if (text.includes('roadmap') || text.includes('break down') || text.includes('breakdown')) {
      reply = "Here is a high-level breakdown for your **Q3 Product Roadmap** task. I have calculated the optimal deadline sequences to prevent team bottlenecks:\n\n" +
              "1. **Audit Pending Requests (Day 1)**: Sync with Support & Customer Success leads to review user feature requests.\n" +
              "2. **Capacity Assessment (Day 2)**: Benchmark developer velocities with Engineering Leads.\n" +
              "3. **Draft Milestones (Day 3)**: Formulate the core strategic deliverables & timelines.\n" +
              "4. **Stakeholder Alignment (Day 4)**: Circulate the roadmap for product & executive reviews.\n\n" +
              "I have drafted a milestone task called **Draft Roadmap Milestones** with high priority. Would you like to establish this guard on your board?";
      
      actionPayload = {
        title: 'Draft Roadmap Milestones',
        description: 'Formulate the core strategic deliverables & timelines for the Q3 Roadmap presentation.',
        priority: 'high',
        deadline: new Date(Date.now() + 3600000 * 24 * 3).toISOString(), // 3 days from now
        category: 'Work',
        progress: 0,
        status: 'todo',
      };
    } else if (text.includes('deadline') || text.includes('priority') || text.includes('high')) {
      reply = "Scanning your current active board, you have **2 high-priority milestones** scheduled for today:\n\n" +
              "• **Finalize Q3 Product Roadmap** (Due 2:00 PM)\n" +
              "• **UI Design Review & Assets Export** (Due 6:00 PM)\n\n" +
              "**AI Optimizer Tip:** Tackle the **Roadmap** first during your morning focus window, and schedule the design export right after lunch. I have drafted an organizing task: **Coordinate Q3 Board Review** to keep the workflow optimal.";
      
      actionPayload = {
        title: 'Coordinate Q3 Board Review',
        description: 'Verify engineering deliverables and review board status updates before the weekly sync.',
        priority: 'medium',
        deadline: new Date(Date.now() + 3600000 * 5).toISOString(), // 5 hours from now
        category: 'Work',
        progress: 0,
        status: 'todo',
      };
    } else if (text.includes('schedule') || text.includes('afternoon')) {
      reply = "Analyzing your active slots for today, here is a suggested afternoon focus sprint:\n\n" +
              "• **1:00 PM - 2:30 PM**: Pure Focus on *Finalize Q3 Product Roadmap*\n" +
              "• **2:30 PM - 3:00 PM**: Re-charge & administrative email clearing\n" +
              "• **3:00 PM - 5:00 PM**: Collaborative work on *UI Design Review & Assets Export*\n\n" +
              "Would you like me to create a calendar block: **Afternoon Focus Sprint** to protect this time slot?";
      
      actionPayload = {
        title: 'Afternoon Focus Sprint',
        description: 'Protected deep work session for roadmap formulation and layout asset export.',
        priority: 'high',
        deadline: new Date(Date.now() + 3600000 * 4).toISOString(), // 4 hours from now
        category: 'Design',
        progress: 10,
        status: 'in_progress',
      };
    } else {
      reply = "I understand! As your productivity guardian, I'll record that context. If you want me to plan a schedule, help you break down large deliverables, or draft actionable tasks, just let me know. \n\n" +
              "For example, you can ask me to: **\"Draft a task to review Q3 specifications by next Monday\"** and I will construct the parameter card for you instantly!";
    }

    const aiMessage: Message = {
      id: `ai-msg-${Date.now()}`,
      sender: 'ai',
      text: reply,
      timestamp: new Date(),
    };

    if (actionPayload) {
      aiMessage.suggestedAction = {
        type: 'create_task',
        payload: actionPayload,
      };
    }

    // Pass up to main messages log
    onSendMessage(aiMessage as any);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[800px] border border-theme-border rounded-2xl overflow-hidden bg-theme-card shadow-sm">
      
      {/* Companion Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-bg/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl text-white shadow-md shadow-indigo-500/10">
              <Bot className="w-5 h-5 stroke-[1.5]" />
            </div>
            {/* Glowing active indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-theme-primary">Guardian Copilot</h2>
            <p className="text-[10px] text-emerald-500 font-mono font-bold tracking-wider uppercase">Active and Protecting</p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          title="Clear Chat History"
          className="p-2 hover:bg-theme-bg rounded-xl text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Message History Scroller */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isAI = msg.sender === 'ai';
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex gap-4 max-w-[85%] ${isAI ? '' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar Icon */}
                <div className={`p-2 rounded-xl h-9 w-9 shrink-0 flex items-center justify-center border ${
                  isAI 
                    ? 'bg-indigo-50/50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400' 
                    : 'bg-theme-bg border-theme-border text-theme-secondary'
                }`}>
                  {isAI ? <Bot className="w-4.5 h-4.5 stroke-[1.5]" /> : <User className="w-4.5 h-4.5 stroke-[1.5]" />}
                </div>

                {/* Bubble bubble content */}
                <div className="space-y-2">
                  <div className={`p-4.5 rounded-2xl text-sm leading-relaxed ${
                    isAI 
                      ? 'bg-theme-bg text-theme-primary border border-theme-border shadow-sm'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  }`}>
                    {/* Render message with crude helper for markdown bold */}
                    <p className="whitespace-pre-line">
                      {msg.text.split('\n').map((line, lIdx) => (
                        <span key={lIdx} className="block mt-1 first:mt-0">
                          {line.split('**').map((chunk, cIdx) => (
                            cIdx % 2 === 1 ? <strong key={cIdx} className="font-extrabold text-indigo-500 dark:text-indigo-400">{chunk}</strong> : chunk
                          ))}
                        </span>
                      ))}
                    </p>
                  </div>

                  {/* Render Suggested Interactive Action Card inside chatbot bubbles! */}
                  {isAI && msg.suggestedAction && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 border rounded-xl flex flex-col justify-between gap-3 shadow-sm bg-theme-bg border-theme-border text-theme-primary"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-500 rounded-lg">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-500 uppercase">Guardian Action Proposal</span>
                          <h4 className="text-xs font-bold font-sans mt-0.5">{msg.suggestedAction.payload.title}</h4>
                          <p className="text-[11px] text-theme-secondary mt-1 line-clamp-2">{msg.suggestedAction.payload.description}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] bg-rose-500/15 text-rose-500 font-extrabold font-mono px-1.5 py-0.5 rounded uppercase">
                              {msg.suggestedAction.payload.priority}
                            </span>
                            <span className="text-[9px] bg-indigo-500/15 text-indigo-500 font-semibold px-1.5 py-0.5 rounded uppercase">
                              {msg.suggestedAction.payload.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (msg.suggestedAction) {
                            onAddTaskDirectly(msg.suggestedAction.payload as any);
                            // Set suggestions action to complete/null
                            msg.suggestedAction = undefined;
                          }
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Task to Workspace</span>
                      </button>
                    </motion.div>
                  )}

                  <span className="text-[9px] font-mono text-theme-secondary block px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="p-2 rounded-xl h-9 w-9 shrink-0 flex items-center justify-center border bg-indigo-50/50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400">
              <Bot className="w-4.5 h-4.5 stroke-[1.5]" />
            </div>
            <div className="flex flex-col space-y-1">
              <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5 bg-theme-bg border border-theme-border">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              </div>
              <span className="text-[9px] font-mono text-theme-secondary px-1">Guardian core processing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Pills Section */}
      <div className="px-6 pt-3 pb-2 border-t border-theme-border bg-theme-bg/30">
        <span className="text-[9px] font-mono text-theme-muted uppercase tracking-widest font-bold">Suggested Companion Queries</span>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              onClick={() => handlePromptClick(prompt)}
              key={idx}
              disabled={isTyping}
              className="px-3 py-1.5 border rounded-full text-xs font-medium cursor-pointer transition-colors active:scale-95 text-left truncate max-w-[280px] border-theme-border bg-theme-card hover:bg-theme-bg text-theme-secondary hover:text-theme-primary"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Text Prompt Input Container */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-theme-border bg-theme-bg/50 flex gap-3 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder="Type a productivity command or ask for schedule advice..."
            className="w-full pl-4.5 pr-12 py-3 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-theme-card border-theme-border text-theme-primary placeholder-theme-muted"
          />
          {/* Keyboard shortcut decoration */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 p-1 bg-theme-bg rounded-lg text-theme-muted text-[10px] font-mono select-none border border-theme-border">
            <span>⏎</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>

    </div>
  );
}
