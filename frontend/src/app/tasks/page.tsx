"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  AlertCircle, 
  Loader2,
  FolderOpen,
  Edit3,
  Trash2,
  CheckCircle
} from "lucide-react";
import TaskFormModal from "@/components/TaskFormModal";
import ThemeToggle from "@/components/ThemeToggle";
import { toast } from "react-hot-toast";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  user_id?: string;
  created_at?: string;
  updated_at?: string | null;
}

export default function TasksPage() {
  const { user, token, loading: authLoading, apiCall, logout } = useAuth();
  const router = useRouter();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/");
    }
  }, [token, authLoading, router]);

  // Task listing states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter/Sort/Pagination query states
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"due_date" | "priority" | "created_at">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const limit = 6; // items per page

  // Task form state (create/edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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
        setTotalTasks(prev => prev - 1);
        toast.success("Task deleted successfully");
      } else {
        toast.error("Failed to delete task");
      }
    } catch (err) {
      console.error("Failed to delete task", err);
      toast.error("Failed to delete task");
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  // Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // reset to page 1 on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch paginated tasks from API
  const fetchTasks = useCallback(async () => {
    if (!token) return;
    setTasksLoading(true);
    setErrorMessage(null);

    // Build URL query string
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
    });

    if (statusFilter) {
      params.append("status", statusFilter);
    }
    if (searchQuery) {
      params.append("search", searchQuery);
    }

    try {
      const res = await apiCall(`http://localhost:8000/tasks?${params.toString()}`);
      
      if (res.ok) {
        const data = await res.json();
        setTasks(data.items || []);
        setTotalTasks(data.total || 0);
      } else {
        const errData = await res.json();
        const errMsg = typeof errData.detail === "object" ? JSON.stringify(errData.detail) : (errData.detail || "Failed to load tasks.");
        setErrorMessage(errMsg);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error: Unable to load tasks from server.");
    } finally {
      setTasksLoading(false);
    }
  }, [token, page, statusFilter, searchQuery, sortBy, sortOrder, apiCall]);

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token, fetchTasks]);

  // Handlers
  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const totalPages = Math.ceil(totalTasks / limit) || 1;

  if (authLoading || (!token && authLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-slate-400 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden pb-12 transition-colors duration-300">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/5 dark:bg-violet-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] rounded-full bg-cyan-600/5 dark:bg-cyan-500/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-505 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-600/20">
              T
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Taskly
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle />
            {user && (
              <span className="hidden sm:inline text-xs font-semibold text-slate-600 dark:text-slate-400">
                {user.email}
              </span>
            )}
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Title and Create button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-800 to-slate-500 dark:from-slate-100 dark:to-slate-450 bg-clip-text text-transparent">
              Tasks
            </h1>
            <p className="text-sm text-slate-605 dark:text-slate-400 mt-1">
              Filter, search, sort, and organize your development backlog.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-slate-100 font-semibold text-sm transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </button>
        </div>

        {/* Toolbar (Search, Filter, Sort) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-xl p-4 transition-colors duration-300">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-450 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-202 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-500 text-sm transition-all"
            />
          </div>

          {/* Status Dropdown */}
          <div className="lg:col-span-3 relative">
            <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
              <Filter className="h-4 w-4 text-slate-400 dark:text-slate-500 mr-2" />
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full bg-transparent text-slate-900 dark:text-slate-100 text-sm focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Statuses</option>
                <option value="todo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Todo</option>
                <option value="in_progress" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">In Progress</option>
                <option value="done" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Done</option>
              </select>
            </div>
          </div>

          {/* Sort Buttons */}
          <div className="lg:col-span-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider mr-2">Sort by:</span>
            <button
              onClick={() => handleSort("created_at")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                sortBy === "created_at"
                  ? "bg-violet-600/10 border-violet-500/30 text-violet-600 dark:text-violet-400"
                  : "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              Created Date
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleSort("due_date")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                sortBy === "due_date"
                  ? "bg-violet-600/10 border-violet-500/30 text-violet-605 dark:text-violet-400"
                  : "bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:text-slate-705 dark:hover:text-slate-200"
              }`}
            >
              Due Date
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <button
              onClick={() => handleSort("priority")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                sortBy === "priority"
                  ? "bg-violet-600/10 border-violet-500/30 text-violet-605 dark:text-violet-400"
                  : "bg-white dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-555 dark:text-slate-400 hover:text-slate-705 dark:hover:text-slate-200"
              }`}
            >
              Priority
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-650 dark:text-red-450">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {tasksLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Fetching tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 bg-slate-100 dark:bg-slate-905/10 border border-slate-200 dark:border-slate-900/60 rounded-2xl p-8 text-center transition-colors duration-300">
            <FolderOpen className="h-12 w-12 text-slate-400 dark:text-slate-700 mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No tasks yet!</h3>
            <p className="text-sm text-slate-550 dark:text-slate-500 mt-1 max-w-sm">
              Create your first task from the dashboard to start tracking your progress.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Create First Task
            </button>
          </div>
        ) : (
          /* Task List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map(task => {
              const statusColors = {
                todo: "bg-slate-100 text-slate-600 border-slate-250 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50",
                in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                done: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              };
              const priorityColors = {
                low: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                high: "bg-red-500/10 text-red-600 dark:text-red-405 border-red-500/20"
              };

              return (
                <div
                  key={task.id}
                  className="group relative bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${statusColors[task.status]}`}>
                          {task.status === "in_progress" ? "In Progress" : task.status}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.status !== "done" && (
                          <button 
                            onClick={() => handleCompleteTask(task.id)}
                            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            title="Complete Task"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => openEditModal(task)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Edit Task"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-850 dark:text-slate-100 mb-1 leading-snug line-clamp-1">
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-805/50 text-[11px] text-slate-500 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!tasksLoading && tasks.length > 0 && (
          <div className="flex items-center justify-between mt-12 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-900 rounded-xl p-4 transition-colors duration-300">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-40 disabled:hover:text-slate-400 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-semibold text-slate-705 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-55 hover:bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-40 disabled:hover:text-slate-450 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

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
}
