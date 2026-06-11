"use client";

import React, { useState, useEffect } from "react";
import { useAuth, API_URL } from "@/context/AuthContext";
import { Loader2, X, AlertCircle } from "lucide-react";

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

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task?: Task | null;
}

interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export default function TaskFormModal({ isOpen, onClose, onSuccess, task = null }: TaskFormModalProps) {
  const { apiCall } = useAuth();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"todo" | "in_progress" | "done">("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with open/close and task prop
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title || "");
        setDescription(task.description || "");
        setStatus(task.status || "todo");
        setPriority(task.priority || "medium");
        setDueDate(task.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : "");
      } else {
        setTitle("");
        setDescription("");
        setStatus("todo");
        setPriority("medium");
        setDueDate("");
      }
      setErrors({});
      setIsSaving(false);
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (errors.title) {
      // Clear inline error as user types
      if (val.trim().length >= 3) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.title;
          return next;
        });
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      newErrors.title = "Title is required.";
    } else if (trimmedTitle.length < 3) {
      newErrors.title = "Title must be at least 3 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSaving(true);
    setErrors({});

    const formattedPayload = {
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      due_date: dueDate ? new Date(dueDate).toISOString().slice(0, 10) : null,
    };

    const isEdit = !!task;
    const url = isEdit ? `${API_URL}/tasks/${task.id}` : `${API_URL}/tasks`;
    const method = isEdit ? "PATCH" : "POST";

    try {
      const res = await apiCall(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedPayload),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        if (res.status === 422 && data.detail) {
          // If FastAPI returns structured validation errors
          if (Array.isArray(data.detail)) {
            const validationErrors: Record<string, string> = {};
            data.detail.forEach((err: ValidationErrorDetail) => {
              const field = String(err.loc[err.loc.length - 1]);
              validationErrors[field] = err.msg;
            });
            setErrors(validationErrors);
          } else if (typeof data.detail === "object") {
            setErrors(data.detail);
          } else {
            setErrors({ general: String(data.detail) });
          }
        } else {
          const generalErr = typeof data.detail === "object" ? JSON.stringify(data.detail) : (data.detail || "An error occurred while saving the task.");
          setErrors({ general: generalErr });
        }
      }
    } catch (err) {
      console.error(err);
      setErrors({ general: "Failed to communicate with the server. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 relative transition-colors duration-300">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
          title="Close Modal"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-xl font-bold mb-5 bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
          {task ? "Edit Task" : "Create New Task"}
        </h3>

        {errors.general && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-650 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Task Title <span className="text-violet-500 dark:text-violet-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={isSaving}
              className={`w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                errors.title ? "border-red-500" : "border-slate-200 dark:border-slate-800 focus:border-violet-500"
              } text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none text-sm transition-all`}
              placeholder="e.g. Design Landing Page"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500 dark:text-red-400 font-medium">{errors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
              className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-violet-550 text-sm h-28 resize-none transition-all"
              placeholder="Provide context or instructions for this task..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
                disabled={isSaving}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-sm transition-all cursor-pointer"
              >
                <option value="low" className="bg-white dark:bg-slate-900">Low</option>
                <option value="medium" className="bg-white dark:bg-slate-900">Medium</option>
                <option value="high" className="bg-white dark:bg-slate-900">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task["status"])}
                disabled={isSaving}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-violet-500 text-sm transition-all cursor-pointer"
              >
                <option value="todo" className="bg-white dark:bg-slate-900">To Do</option>
                <option value="in_progress" className="bg-white dark:bg-slate-900">In Progress</option>
                <option value="done" className="bg-white dark:bg-slate-900">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-550 dark:text-slate-450 uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (errors.due_date) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.due_date;
                    return next;
                  });
                }
              }}
              disabled={isSaving}
              className={`w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                errors.due_date ? "border-red-500" : "border-slate-202 dark:border-slate-800 focus:border-violet-550"
              } text-slate-900 dark:text-slate-100 focus:outline-none text-sm transition-all`}
            />
            {errors.due_date && (
              <p className="mt-1 text-xs text-red-505 dark:text-red-400 font-medium">{errors.due_date}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/60 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 font-semibold text-sm transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="min-w-[100px] flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-slate-100 font-semibold text-sm transition-colors disabled:bg-violet-800"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
