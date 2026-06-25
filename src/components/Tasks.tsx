import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Filter, Plus, Calendar, Clock, Edit2, Trash2, 
  CheckCircle2, Circle, X, Check, Tag, Percent, AlertCircle
} from 'lucide-react';
import { Task, Priority, TaskStatus } from '../types';

interface TasksProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onEditTask: (id: string, updated: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onToggleTaskStatus: (id: string) => void;
  isDark: boolean;
  isAddModalOpenInitially?: boolean;
  onCloseAddModalInitially?: () => void;
}

export default function Tasks({
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskStatus,
  isDark,
  isAddModalOpenInitially = false,
  onCloseAddModalInitially
}: TasksProps) {
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Work');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<TaskStatus>('todo');

  // Handle opening modal for new task
  const handleOpenAddModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    
    // Default deadline: tomorrow at current hour
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setMinutes(0, 0, 0);
    // Format to yyyy-MM-ddThh:mm
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const hours = String(tomorrow.getHours()).padStart(2, '0');
    const minutes = String(tomorrow.getMinutes()).padStart(2, '0');
    setDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
    
    setCategory('Work');
    setProgress(0);
    setStatus('todo');
    setIsModalOpen(true);
  };

  // Handle opening modal for edit task
  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    
    // Format deadline from ISO to yyyy-MM-ddThh:mm
    const date = new Date(task.deadline);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setDeadline(`${year}-${month}-${day}T${hours}:${minutes}`);
    
    setCategory(task.category);
    setProgress(task.progress);
    setStatus(task.status);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    if (onCloseAddModalInitially) {
      onCloseAddModalInitially();
    }
  };

  // Sync state if prop updates
  if (isAddModalOpenInitially && !isModalOpen) {
    handleOpenAddModal();
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Convert local datetime to ISO string
    const isoDeadline = new Date(deadline).toISOString();

    if (editingTask) {
      onEditTask(editingTask.id, {
        title,
        description,
        priority,
        deadline: isoDeadline,
        category,
        progress,
        status,
      });
    } else {
      onAddTask({
        title,
        description,
        priority,
        deadline: isoDeadline,
        category,
        progress,
        status,
      });
    }
    handleCloseModal();
  };

  // Get distinct list of categories in current tasks
  const distinctCategories = Array.from(new Set(tasks.map(t => t.category)));

  // Filter Tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) || 
                          task.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'high': return 'text-rose-500 bg-rose-500/10 dark:bg-rose-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20';
      case 'low': return 'text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20';
    }
  };

  const getStatusColor = (s: TaskStatus) => {
    switch (s) {
      case 'completed': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 border-emerald-500/25';
      case 'in_progress': return 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/30 border-indigo-500/25';
      case 'todo': return 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-900/40 border-slate-700/25';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-theme-primary">Workspace Board</h1>
          <p className="text-sm text-theme-secondary mt-1">
            Build, edit, and organize your system tasks and priorities.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Control Bar: Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-theme-card border border-theme-border p-4 rounded-2xl shadow-sm">
        
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-theme-bg border-theme-border text-theme-primary placeholder-theme-muted"
          />
        </div>

        {/* Status Filter */}
        <div className="md:col-span-2.5 flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-theme-muted shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none transition-all bg-theme-bg border-theme-border text-theme-secondary"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="md:col-span-2.5">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none transition-all bg-theme-bg border-theme-border text-theme-secondary"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="md:col-span-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm border focus:outline-none transition-all bg-theme-bg border-theme-border text-theme-secondary"
          >
            <option value="all">All Categories</option>
            {distinctCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Tasks Display Grid */}
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-theme-card border border-theme-border rounded-2xl text-center">
          <AlertCircle className="w-10 h-10 text-theme-muted mb-2" />
          <p className="text-base font-semibold text-theme-primary">No matching tasks found</p>
          <p className="text-xs text-theme-muted mt-1 max-w-xs">Try adjusting your search keywords, clear active filter parameters, or create a brand new task item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const dateStr = new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const isCompleted = task.status === 'completed';

            return (
              <motion.div
                layout
                key={task.id}
                className="flex flex-col justify-between border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all relative overflow-hidden group bg-theme-card border-theme-border text-theme-primary"
              >
                {/* Visual Status Border Highlight */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-indigo-500/10 ${
                  task.status === 'completed' ? 'bg-emerald-500' : task.status === 'in_progress' ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
                }`} />

                {/* Card Top: Category & Priority */}
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-theme-muted font-bold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-theme-muted" />
                      {task.category}
                    </span>
                    
                    <span className={`text-[10px] font-extrabold font-mono px-2 py-0.5 rounded uppercase ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => onToggleTaskStatus(task.id)}
                      className="mt-1 shrink-0 cursor-pointer text-theme-muted hover:text-indigo-500 transition-colors"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div>
                      <h3 className={`font-bold font-sans text-sm md:text-base leading-snug line-clamp-2 ${
                        isCompleted ? 'line-through text-theme-muted' : 'text-theme-primary'
                      }`}>
                        {task.title}
                      </h3>
                      <p className="text-xs text-theme-secondary line-clamp-3 mt-1.5 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Progress, Deadline, Operations */}
                <div className="mt-6 pt-4 border-t border-theme-border space-y-4">
                  
                  {/* Progress slide indicator */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-theme-secondary mb-1">
                      <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Percent className="w-3 h-3 text-indigo-500" />
                        Completion
                      </span>
                      <span className="font-mono font-bold text-theme-primary">{task.progress}%</span>
                    </div>
                    {/* Interactive Slider for Progress */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={task.progress}
                      disabled={isCompleted}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onEditTask(task.id, { 
                          progress: val,
                          status: val === 100 ? 'completed' : val > 0 ? 'in_progress' : 'todo'
                        });
                      }}
                      className="w-full h-1 bg-theme-bg rounded-full appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  {/* Deadline & Control Buttons */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-theme-secondary font-medium">
                      <Clock className="w-4.5 h-4.5 text-theme-muted" />
                      <span className="font-sans line-clamp-1">{dateStr}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditModal(task)}
                        title="Edit Task"
                        className="p-1.5 rounded-lg border border-theme-border hover:text-indigo-500 hover:bg-theme-bg text-theme-secondary cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        title="Delete Task"
                        className="p-1.5 rounded-lg border border-theme-border hover:text-rose-500 hover:bg-theme-bg text-theme-secondary cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Task Creation & Editing Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden border shadow-2xl bg-theme-card border-theme-border text-theme-primary"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border">
                <h3 className="text-base font-bold font-sans">
                  {editingTask ? 'Modify Task Guard Parameter' : 'Establish New Task Guard'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-theme-bg rounded-lg text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                    Task Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Deliver Product Specifications"
                    className="w-full px-4.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-theme-bg border-theme-border text-theme-primary placeholder-theme-muted"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a breakdown of task components or deliverables..."
                    className="w-full px-4.5 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none bg-theme-bg border-theme-border text-theme-primary placeholder-theme-muted"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <input
                      type="text"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Engineering, Work, Docs"
                      className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-theme-bg border-theme-border text-theme-primary placeholder-theme-muted"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-all bg-theme-bg border-theme-border text-theme-secondary"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Deadline DateTime */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                      Deadline Target
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-theme-bg border-theme-border text-theme-primary"
                    />
                  </div>

                  {/* Status selection */}
                  <div>
                    <label className="block text-xs font-mono font-medium text-theme-secondary uppercase tracking-wider mb-1.5">
                      Operational Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => {
                        const val = e.target.value as TaskStatus;
                        setStatus(val);
                        if (val === 'completed') setProgress(100);
                        else if (val === 'todo') setProgress(0);
                      }}
                      className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-all bg-theme-bg border-theme-border text-theme-secondary"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Progress bar input */}
                {status !== 'completed' && status !== 'todo' && (
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-mono text-theme-secondary uppercase tracking-wider font-semibold">Progress Percentage</span>
                      <span className="font-mono font-bold text-indigo-500">{progress}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(parseInt(e.target.value))}
                        className="w-full h-1 bg-theme-bg rounded-full appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-theme-border mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4.5 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer active:scale-95 transition-all border-theme-border hover:bg-theme-bg text-theme-secondary hover:text-theme-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    {editingTask ? 'Apply Changes' : 'Activate Guard'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
