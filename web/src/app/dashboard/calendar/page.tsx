"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Sparkles, Clock, Download } from "lucide-react";
import { getTasks } from "@/app/actions/tasks";
import { generateSchedule } from "@/lib/ai/agent";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  estimatedMinutes: number | null;
  dueDate: string | null;
}

const HOURS = Array.from({ length: 10 }, (_, i) => i + 9); // 9AM to 6PM

const priorityColors: Record<string, string> = {
  urgent: "border-l-red-500 bg-red-500/5",
  high: "border-l-orange-500 bg-orange-500/5",
  medium: "border-l-blue-500 bg-blue-500/5",
  low: "border-l-green-500 bg-green-500/5",
};

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isPending, startTransition] = useTransition();

  const loadTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data as Task[]);
    } catch {}
  };

  useEffect(() => { loadTasks(); }, []);

  const scheduledTasks = tasks.filter(t => {
    if (!t.scheduledStart) return false;
    return t.scheduledStart.startsWith(selectedDate);
  });

  const getTaskAtHour = (hour: number) => {
    return scheduledTasks.filter(t => {
      if (!t.scheduledStart) return false;
      const startHour = parseInt(t.scheduledStart.split("T")[1]?.split(":")[0] || "0");
      return startHour === hour;
    });
  };

  const handleAutoSchedule = async () => {
    setIsScheduling(true);
    try {
      // Call server-side function through API route
      const response = await fetch("/api/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate }),
      });
      await loadTasks();
    } catch {}
    setIsScheduling(false);
  };

  const exportICS = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LifeSaver AI//EN\n`;

    scheduledTasks.forEach(task => {
      if (task.scheduledStart && task.scheduledEnd) {
        const dtStart = task.scheduledStart.replace(/[-:]/g, "").replace("T", "T") + "00";
        const dtEnd = task.scheduledEnd.replace(/[-:]/g, "").replace("T", "T") + "00";
        icsContent += `BEGIN:VEVENT\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nSUMMARY:${task.title}\nEND:VEVENT\n`;
      }
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-${selectedDate}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() - day + 1 + i); // Start from Monday
    return d.toISOString().split("T")[0];
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">AI-powered time blocking for your day</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAutoSchedule}
            variant="outline"
            size="sm"
            disabled={isScheduling}
            className="gap-2 rounded-full border-green-500/30 hover:bg-green-500/10 hover:text-green-600"
          >
            <Sparkles className="w-4 h-4" />
            {isScheduling ? "Scheduling..." : "Auto-Schedule Day"}
          </Button>
          <Button onClick={exportICS} variant="outline" size="sm" className="gap-2 rounded-full">
            <Download className="w-4 h-4" /> Export .ics
          </Button>
        </div>
      </div>

      {/* Week Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {weekDays.map(date => {
          const d = new Date(date + "T12:00:00");
          const isSelected = date === selectedDate;
          const isToday = date === new Date().toISOString().split("T")[0];
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl min-w-[60px] transition-all ${
                isSelected
                  ? "bg-gradient-to-b from-green-600 to-teal-600 text-white shadow-lg shadow-green-500/25"
                  : isToday
                  ? "bg-green-500/10 text-green-600 border border-green-500/20"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <span className="text-xs font-medium">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className="text-lg font-bold">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <Card className="border-border/30">
        <CardContent className="pt-6">
          <div className="space-y-0">
            {HOURS.map(hour => {
              const hourTasks = getTaskAtHour(hour);
              const timeStr = `${hour.toString().padStart(2, "0")}:00`;
              const isPast = new Date(`${selectedDate}T${timeStr}:00`) < new Date();

              return (
                <div key={hour} className="flex gap-4 min-h-[60px] group">
                  <div className={`w-14 text-xs font-medium shrink-0 pt-1 ${isPast ? 'text-muted-foreground/50' : 'text-muted-foreground'}`}>
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                  </div>
                  <div className="flex-1 border-t border-border/20 pt-2 pb-4">
                    {hourTasks.length > 0 ? (
                      hourTasks.map(task => (
                        <div
                          key={task.id}
                          className={`p-3 rounded-lg border-l-4 mb-1 ${priorityColors[task.priority] || 'border-l-green-500 bg-green-500/5'}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{task.title}</span>
                            <Badge variant="outline" className="text-[10px]">{task.priority}</Badge>
                          </div>
                          {task.scheduledStart && task.scheduledEnd && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.scheduledStart.split("T")[1]?.slice(0, 5)} — {task.scheduledEnd.split("T")[1]?.slice(0, 5)}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="h-full min-h-[28px] group-hover:bg-secondary/20 rounded-lg transition-colors" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

