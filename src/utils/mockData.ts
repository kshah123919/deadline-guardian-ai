import { Task, Activity, UserProfile, Message } from '../types';

// Helper to get relative dates
export const getRelativeDate = (offsetDays: number, hour: number = 12): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export const INITIAL_PROFILE: UserProfile = {
  name: 'Krish Shah',
  email: 'krishshah062021@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  role: 'Product Lead',
  weeklyGoal: 10,
  completedCount: 6,
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Finalize Q3 Product Roadmap',
    description: 'Review comments from engineering leads and lock down the priority milestones for Q3. Prepare presentation slides.',
    priority: 'high',
    deadline: getRelativeDate(0, 14), // Today at 2 PM
    category: 'Work',
    progress: 75,
    status: 'in_progress',
    estimatedDuration: '4h',
  },
  {
    id: 'task-2',
    title: 'UI Design Review & Assets Export',
    description: 'Walk through the high-fidelity mockups of the new design. Export SVG icon assets and check color accessibility contrast.',
    priority: 'high',
    deadline: getRelativeDate(0, 18), // Today at 6 PM
    category: 'Design',
    progress: 30,
    status: 'in_progress',
    estimatedDuration: '2h',
  },
  {
    id: 'task-3',
    title: 'Update Deadline Guardian AI System Spec',
    description: 'Incorporate new architecture plans and Gemini LLM prompt definitions into the official documentation.',
    priority: 'medium',
    deadline: getRelativeDate(1, 10), // Tomorrow at 10 AM
    category: 'Docs',
    progress: 0,
    status: 'todo',
    estimatedDuration: '1.5h',
  },
  {
    id: 'task-4',
    title: 'Weekly Team Sync Preparation',
    description: 'Draft the bullet points for our status update. Ensure all project boards are updated with the latest tasks.',
    priority: 'low',
    deadline: getRelativeDate(2, 9), // 2 days from now at 9 AM
    category: 'Work',
    progress: 100,
    status: 'completed',
    estimatedDuration: '1h',
  },
  {
    id: 'task-5',
    title: 'Analyze User Engagement Metrics',
    description: 'Download raw CSV data from the analytics platform, clean it up, and build a simple retention cohort table in Sheets.',
    priority: 'medium',
    deadline: getRelativeDate(4, 17), // 4 days from now
    category: 'Analytics',
    progress: 0,
    status: 'todo',
    estimatedDuration: '3h',
  },
  {
    id: 'task-6',
    title: 'Prepare System Deployment Script',
    description: 'Review Docker configurations, environment secret setups, and deploy test builds to staging containers.',
    priority: 'high',
    deadline: getRelativeDate(5, 11), // 5 days from now
    category: 'Engineering',
    progress: 10,
    status: 'in_progress',
    estimatedDuration: '5h',
  }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    type: 'complete',
    content: 'Completed "Weekly Team Sync Preparation"',
    timestamp: '2 hours ago',
  },
  {
    id: 'act-2',
    type: 'create',
    content: 'Created "Finalize Q3 Product Roadmap"',
    timestamp: '4 hours ago',
  },
  {
    id: 'act-3',
    type: 'ai_chat',
    content: 'Asked AI Companion to outline action items for roadmap creation',
    timestamp: 'Yesterday',
  },
  {
    id: 'act-4',
    type: 'edit',
    content: 'Updated deadline for "UI Design Review & Assets Export"',
    timestamp: 'Yesterday',
  }
];

export const SUGGESTED_PROMPTS = [
  'Help me break down my Q3 Product Roadmap task',
  'What are my high priority deadlines for today?',
  'Suggest a productivity schedule for a busy afternoon',
  'Draft a motivational reminder for my pending items',
];

export const INITIAL_CHAT_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    sender: 'ai',
    text: "Hello! I'm your Deadline Guardian AI assistant. I can help you break down complex tasks, write schedule plans, prioritize your deadlines, or create structured items in your list. Try clicking a suggestion below or write a prompt!",
    timestamp: new Date(Date.now() - 3600000 * 3), // 3 hours ago
  }
];

export const MOTIVATIONAL_QUOTES = [
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" }
];
