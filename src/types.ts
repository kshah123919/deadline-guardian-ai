export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  deadline: string; // ISO date string
  category: string;
  progress: number; // 0 to 100
  status: TaskStatus;
  estimatedDuration?: string; // e.g. "2h", "4h", "45m"
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  suggestedAction?: {
    type: 'create_task';
    payload: Partial<Task>;
  };
}

export interface Activity {
  id: string;
  type: 'create' | 'complete' | 'edit' | 'delete' | 'ai_chat';
  content: string;
  timestamp: string; // Relative time (e.g., "5m ago")
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  role: string;
  weeklyGoal: number; // number of tasks to complete
  completedCount: number;
}
