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
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-base text-muted-foreground">AI-powered time blocking for your day</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleAutoSchedule}
            variant="outline"
            size="default"
            disabled={isScheduling}
            className="gap-2 rounded-full border-green-500/30 hover:bg-green-500/10 hover:text-green-600"
          >
            <Sparkles className="w-4 h-4" />
            {isScheduling ? "Scheduling..." : "Auto-Schedule Day"}
          </Button>
          <Button onClick={exportICS} variant="outline" size="default" className="gap-2 rounded-full">
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
              <span className="text-sm font-medium">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className="text-xl font-bold">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      {/* Premium Timeline UI */}
      <Card className="border-border/30 overflow-hidden shadow-xl shadow-green-500/5 bg-card/40 backdrop-blur-md">
        <div className="bg-gradient-to-r from-green-500/10 to-transparent border-b border-border/30 px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-xl flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-green-600" />
            Daily Schedule
          </h3>
          <span className="text-sm font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
        
        <CardContent className="p-0">
          <div className="flex flex-col divide-y divide-border/20">
            {HOURS.map(hour => {
              const hourTasks = getTaskAtHour(hour);
              const timeStr = `${hour.toString().padStart(2, "0")}:00`;
              const isPast = new Date(`${selectedDate}T${timeStr}:00`) < new Date();
              const isCurrentHour = new Date().getHours() === hour && selectedDate === new Date().toISOString().split("T")[0];

              return (
                <div key={hour} className={`flex relative group min-h-[90px] transition-colors ${isCurrentHour ? 'bg-green-500/5' : 'hover:bg-secondary/20'}`}>
                  {/* Current Time Indicator Line */}
                  {isCurrentHour && (
                    <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-red-400 z-10 pointer-events-none">
                      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
                    </div>
                  )}

                  {/* Time Column */}
                  <div className="w-20 sm:w-24 shrink-0 border-r border-border/20 py-3 pr-4 flex flex-col items-end">
                    <span className={`text-sm font-bold ${isCurrentHour ? 'text-green-600' : isPast ? 'text-muted-foreground/40' : 'text-muted-foreground'}`}>
                      {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                    </span>
                    <span className="text-xs text-muted-foreground/50 mt-1">00</span>
                  </div>

                  {/* Tasks Column */}
                  <div className="flex-1 p-3 relative">
                    {/* Dashed half-hour line */}
                    <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-border/30 pointer-events-none" />
                    
                    <div className="relative z-20 space-y-2">
                      {hourTasks.length > 0 ? (
                        hourTasks.map(task => (
                          <div
                            key={task.id}
                            className={`p-3 rounded-xl border flex flex-col gap-1 transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer ${
                              priorityColors[task.priority] || 'border-green-500/20 bg-green-500/10'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <span className="font-semibold text-base leading-tight text-foreground/90">{task.title}</span>
                              <Badge variant="outline" className="text-xs shrink-0 capitalize shadow-sm bg-background/50 backdrop-blur-sm">
                                {task.priority}
                              </Badge>
                            </div>
                            
                            {task.scheduledStart && task.scheduledEnd && (
                              <div className="flex items-center gap-3 mt-1.5 text-sm font-medium text-muted-foreground">
                                <span className="flex items-center gap-1.5 bg-background/50 px-2 py-0.5 rounded-md">
                                  <Clock className="w-3.5 h-3.5 text-green-500" />
                                  {task.scheduledStart.split("T")[1]?.slice(0, 5)}
                                  <span className="text-border mx-1">→</span>
                                  {task.scheduledEnd.split("T")[1]?.slice(0, 5)}
                                </span>
                                {task.estimatedMinutes && (
                                  <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-md">
                                    {task.estimatedMinutes}m
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="h-full w-full" />
                      )}
                    </div>
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




