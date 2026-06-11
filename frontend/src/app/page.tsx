"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import TaskFormModal from "@/components/TaskFormModal";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "react-hot-toast";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  LogOut, 
  CheckCircle, 
  Clock, 
  ListTodo, 
  Filter, 
  Search, 
  Calendar, 
  AlertCircle, 
  User as UserIcon,
  LayoutGrid
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  user_id: string;
  created_at: string;
  updated_at: string | null;
}

export default function Home() {
  const { user, token, loading, login, signup, logout, apiCall } = useAuth();
  const router = useRouter();
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Auth form state
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authData, setAuthData] = useState({ email: "", password: "" });
  const [authErrors, setAuthErrors] = useState<Record<string, string>>({});
  
  // Task filter/search state
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");
  
  // Task form state (create/edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiCall("http://localhost:8000/tasks?limit=100");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  }, [apiCall]);

  // Fetch tasks when user is logged in
  useEffect(() => {
    if (token && user) {
      fetchTasks();
    }
  }, [token, user, fetchTasks]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrors({});
    
    try {
      if (authMode === "login") {
        await login(authData.email, authData.password);
      } else {
        await signup(authData.email, authData.password);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Authentication failed.";
      setAuthErrors({ general: errorMsg });
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!token) return;
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;
    
    const previousTasks = [...tasks];
    
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "done" as const } : t));

    try {
      const res = await apiCall(`http://localhost:8000/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" })
      });
      if (res.ok) {
        toast.success("Task completed!");
        fetchTasks();
      } else {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      setTasks(previousTasks);
      toast.error("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!token || !confirm("Are you sure?")) return;
    try {
      const res = await apiCall(`http://localhost:8000/tasks/${taskId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast.success("Task deleted successfully");
      } else {
        toast.error("Failed to delete task");
      }
    } catch (err) {
      console.error("Failed to delete task", err);
      toast.error("Failed to delete task");
    }
  };

  const handleQuickStatusChange = async (task: Task, newStatus: Task["status"]) => {
    if (!token) return;
    try {
      const res = await apiCall(`http://localhost:8000/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to change task status", err);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Filter tasks based on search & priority
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const todoTasks = filteredTasks.filter(t => t.status === "todo");
  const inProgressTasks = filteredTasks.filter(t => t.status === "in_progress");
  const completedTasks = filteredTasks.filter(t => t.status === "done");

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-slate-400 font-medium">Initializing Taskly...</p>
        </div>
      </div>
    );
  }

  // Not Authenticated screen
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
        {/* Theme Toggle Top Right */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        {/* Decorative background gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/5 dark:bg-violet-600/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/5 dark:bg-cyan-500/10 blur-[120px] pointer-events-none"></div>
        
        <div className="w-full max-w-md space-y-8 z-10">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 dark:from-violet-400 dark:via-fuchsia-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Taskly
            </h1>
            <p className="mt-2 text-sm text-slate-655 dark:text-slate-400">
              Modern task management designed for engineering workflows.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl dark:shadow-2xl">
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
              <button
                onClick={() => { setAuthMode("login"); setAuthErrors({}); }}
                className={`w-1/2 pb-3 font-semibold text-sm transition-colors ${
                  authMode === "login" 
                    ? "text-violet-650 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-505" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode("register"); setAuthErrors({}); }}
                className={`w-1/2 pb-3 font-semibold text-sm transition-colors ${
                  authMode === "register" 
                    ? "text-violet-650 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-505" 
                    : "text-slate-400 hover:text-slate-605 dark:hover:text-slate-200"
                }`}
              >
                Sign Up
              </button>
            </div>

            {authErrors.general && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-650 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={authData.email}
                  onChange={e => setAuthData({ ...authData, email: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                    authErrors.email ? "border-red-500/50" : "border-slate-200 dark:border-slate-800"
                  } text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all`}
                  placeholder="name@example.com"
                />
                {authErrors.email && (
                  <p className="mt-1 text-xs text-red-505 dark:text-red-400">{authErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={authData.password}
                  onChange={e => setAuthData({ ...authData, password: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                    authErrors.password ? "border-red-500/50" : "border-slate-200 dark:border-slate-800"
                  } text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all`}
                  placeholder="••••••••"
                />
                {authErrors.password && (
                  <p className="mt-1 text-xs text-red-505 dark:text-red-400">{authErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 px-4 rounded-lg bg-violet-600 hover:bg-violet-505 text-slate-100 font-semibold text-sm transition-all shadow-lg shadow-violet-600/25 active:scale-[0.98]"
              >
                {authMode === "login" ? "Sign In" : "Sign Up"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated screen / Dashboard
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors duration-300">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/5 dark:bg-violet-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-cyan-600/5 dark:bg-cyan-500/5 blur-[120px] pointer-events-none"></div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-600/20">
              T
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Taskly
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            <button
              onClick={() => router.push("/tasks")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Full Tasks List</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <UserIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {user.email}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section & Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-855 dark:text-slate-100">
              Welcome back, {user.email.split("@")[0]}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage your engineering tasks and keep track of project milestones.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-650 hover:bg-violet-500 text-slate-100 font-semibold text-sm transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-xl p-4 transition-colors duration-300">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks by title or details..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-405 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500 text-sm transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
              <Filter className="h-3.5 w-3.5" />
              Priority:
            </span>
            <div className="flex bg-white dark:bg-slate-950 rounded-lg p-1 border border-slate-200 dark:border-slate-800">
              {(["all", "low", "medium", "high"] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-3 py-1 rounded-md text-xs font-medium uppercase tracking-wider transition-all ${
                    priorityFilter === p 
                      ? "bg-slate-100 dark:bg-slate-800 text-violet-600 dark:text-violet-405" 
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Board Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TO DO Column */}
          <div className="flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-400"></div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-slate-705 dark:text-slate-300">To Do</h3>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                {todoTasks.length}
              </span>
            </div>
            
            <div className="flex-1 space-y-4 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900/60 min-h-[400px]">
              {todoTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600">
                  <ListTodo className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs font-medium">No tasks in queue</p>
                </div>
              ) : (
                todoTasks.map(task => renderTaskCard(task))
              )}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400"></div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-slate-705 dark:text-slate-300">In Progress</h3>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-4 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900/60 min-h-[400px]">
              {inProgressTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600">
                  <Clock className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs font-medium">No active tasks</p>
                </div>
              ) : (
                inProgressTasks.map(task => renderTaskCard(task))
              )}
            </div>
          </div>

          {/* COMPLETED Column */}
          <div className="flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-505 dark:bg-emerald-400"></div>
                <h3 className="font-bold text-sm tracking-wide uppercase text-slate-705 dark:text-slate-300">Completed</h3>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                {completedTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-4 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-900/60 min-h-[400px]">
              {completedTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-600">
                  <CheckCircle className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs font-medium">No completed tasks</p>
                </div>
              ) : (
                completedTasks.map(task => renderTaskCard(task))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Task Create/Edit Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={fetchTasks}
        task={editingTask}
      />
    </div>
  );

  // Render Card Component
  function renderTaskCard(task: Task) {
    const priorityColors = {
      low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      medium: "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20",
      high: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
    };

    return (
      <div 
        key={task.id}
        className="group relative bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {task.status !== "done" && (
              <button 
                onClick={() => handleCompleteTask(task.id)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-405 transition-colors"
                title="Complete Task"
              >
                <CheckCircle className="h-3.5 w-3.5" />
              </button>
            )}
            <button 
              onClick={() => openEditModal(task)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Edit Task"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => handleDeleteTask(task.id)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-550 dark:hover:text-red-400 transition-colors"
              title="Delete Task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <h4 className="font-semibold text-slate-850 dark:text-slate-100 mb-1 line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {task.title}
        </h4>
        
        {task.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/50">
          {task.due_date ? (
            <div className="flex items-center gap-1 text-[11px] text-slate-550 dark:text-slate-400">
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 dark:text-slate-500">No due date</div>
          )}

          {/* Quick status cycle button */}
          <div className="flex gap-1.5">
            {task.status !== "todo" && (
              <button 
                onClick={() => handleQuickStatusChange(task, "todo")}
                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200"
              >
                To Do
              </button>
            )}
            {task.status !== "in_progress" && (
              <button 
                onClick={() => handleQuickStatusChange(task, "in_progress")}
                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Start
              </button>
            )}
            {task.status !== "done" && (
              <button 
                onClick={() => handleQuickStatusChange(task, "done")}
                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-450 hover:text-slate-850 dark:hover:text-slate-200"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
