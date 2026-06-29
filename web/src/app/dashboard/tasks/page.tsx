"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Trash2, CheckCircle2, Circle, Clock, Search, Filter } from "lucide-react";
import { createTask, getTasks, toggleTaskStatus, deleteTask, runAIPrioritization } from "@/app/actions/tasks";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  dueDate: string | null;
  estimatedMinutes: number | null;
  aiPriorityScore: number | null;
  aiSuggestion: string | null;
  completedAt: string | null;
  createdAt: string | null;
}

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/15 text-red-400",
  high: "bg-orange-500/15 text-orange-400",
  medium: "bg-blue-500/15 text-blue-400",
  low: "bg-green-500/15 text-green-400",
};

const categoryIcons: Record<string, string> = {
  work: "💼", personal: "🏠", health: "💪", learning: "📚", finance: "💰",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isAIPrioritizing, setIsAIPrioritizing] = useState(false);

  const loadTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data as Task[]);
    } catch {}
  };

  useEffect(() => { loadTasks(); }, []);

  const handleCreate = async (formData: FormData) => {
    const title = formData.get("title") as string;
    if (!title) return;

    startTransition(async () => {
      await createTask({
        title,
        description: (formData.get("description") as string) || undefined,
        priority: (formData.get("priority") as string) || undefined,
        dueDate: (formData.get("dueDate") as string) || undefined,
      });
      setShowForm(false);
      await loadTasks();
    });
  };

  const handleToggle = (taskId: string) => {
    startTransition(async () => {
      await toggleTaskStatus(taskId);
      await loadTasks();
    });
  };

  const handleDelete = (taskId: string) => {
    startTransition(async () => {
      await deleteTask(taskId);
      await loadTasks();
    });
  };

  const handleAIPrioritize = async () => {
    setIsAIPrioritizing(true);
    try {
      await runAIPrioritization();
      await loadTasks();
    } catch {}
    setIsAIPrioritizing(false);
  };

  const filteredTasks = tasks
    .filter(t => filter === "all" ? true : t.status === filter)
    .filter(t => search ? t.title.toLowerCase().includes(search.toLowerCase()) : true)
    .sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      if (a.aiPriorityScore && b.aiPriorityScore) return b.aiPriorityScore - a.aiPriorityScore;
      return 0;
    });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">{tasks.filter(t => t.status === 'pending').length} pending · {tasks.filter(t => t.status === 'completed').length} completed</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleAIPrioritize}
            variant="outline"
            size="sm"
            disabled={isAIPrioritizing}
            className="gap-2 rounded-full border-green-500/30 hover:bg-green-500/10 hover:text-green-600"
          >
            <Sparkles className="w-4 h-4" />
            {isAIPrioritizing ? "Analyzing..." : "AI Prioritize"}
          </Button>
          <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-2 rounded-full bg-gradient-to-r from-green-600 to-teal-600 text-white">
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-secondary/50 border border-border/50 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "pending", "completed"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filter === f ? 'bg-green-500/15 text-green-600' : 'text-muted-foreground hover:bg-secondary/50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* New Task Form */}
      {showForm && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <form action={handleCreate} className="space-y-3">
              <input name="title" placeholder="What needs to be done?" required className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50" autoFocus />
              <textarea name="description" placeholder="Add details (optional)" rows={2} className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none" />
              <div className="flex gap-3 flex-wrap">
                <select name="priority" className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none">
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input name="dueDate" type="date" className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                <div className="flex-1" />
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isPending} className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
                  {isPending ? "Creating..." : "Create Task"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
            <p className="font-medium">No tasks found</p>
            <p className="text-sm mt-1">Create your first task or use voice input!</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={`group flex items-start gap-3 p-4 rounded-xl border border-border/30 hover:bg-secondary/30 transition-all ${
                task.status === 'completed' ? 'opacity-60' : ''
              }`}
            >
              <button
                onClick={() => handleToggle(task.id)}
                className="mt-0.5 shrink-0"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground hover:text-green-600 transition-colors" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.category && <span className="mr-1">{categoryIcons[task.category] || '📌'}</span>}
                    {task.title}
                  </h3>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${priorityColors[task.priority] || ''}`}>
                    {task.priority}
                  </Badge>
                  {task.aiPriorityScore && (
                    <span className="text-[10px] text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                      AI: {Math.round(task.aiPriorityScore)}
                    </span>
                  )}
                </div>
                {task.description && <p className="text-xs text-muted-foreground mb-1">{task.description}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {task.dueDate && (
                    <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status !== 'completed' ? 'text-red-400' : ''}`}>
                      <Clock className="w-3 h-3" />
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {task.estimatedMinutes && <span>{task.estimatedMinutes}min</span>}
                  {task.aiSuggestion && (
                    <span className="text-green-600 italic truncate max-w-[200px]" title={task.aiSuggestion}>
                      💡 {task.aiSuggestion}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

